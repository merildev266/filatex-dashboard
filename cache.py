"""
cache.py — Thread-safe in-memory TTL cache with background pre-warm refresh.

Usage:
    import cache

    # One-off: fetch from cache or call loader
    data = cache.get_or_load("hfo_sites", loader_fn=fetch_hfo, ttl=3600)

    # Registered key: pre-warmed automatically by background thread
    cache.register("enr_projects", loader_fn=fetch_enr, ttl=900)
    cache.start_background_refresh()   # call once at app startup

    # Invalidation
    cache.invalidate("hfo_sites")   # one key
    cache.invalidate()              # all keys
"""
import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

import config

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal data structures
# ---------------------------------------------------------------------------


@dataclass
class CacheEntry:
    """A single cached value with its expiry timestamp."""

    value: Any
    expires_at: float  # Unix timestamp
    ttl: int           # original TTL in seconds (needed for refresh)

    def is_alive(self) -> bool:
        """Return True if the entry has not yet expired."""
        return time.monotonic() < self.expires_at

    def seconds_until_expiry(self) -> float:
        """Seconds remaining before this entry expires (may be negative)."""
        return self.expires_at - time.monotonic()


# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------

_store: dict[str, CacheEntry] = {}
_lock = threading.Lock()

# Registry of keys that should be pre-warmed by the background thread
# Maps key → (ttl, loader_fn)
_registry: dict[str, tuple[int, Callable[[], Any]]] = {}
_registry_lock = threading.Lock()

_worker_thread: Optional[threading.Thread] = None


# ---------------------------------------------------------------------------
# Core cache operations
# ---------------------------------------------------------------------------

def get(key: str) -> Optional[Any]:
    """
    Return the cached value for *key*, or None if absent/expired.

    Args:
        key: Cache key string.

    Returns:
        The cached value, or None.
    """
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        if entry.is_alive():
            return entry.value
        # Expired — evict eagerly
        del _store[key]
        log.debug("Cache expired: %s", key)
        return None


def set(key: str, value: Any, ttl: int) -> None:  # noqa: A001
    """
    Store *value* under *key* with a TTL of *ttl* seconds.

    Args:
        key:   Cache key string.
        value: Value to store (any picklable object).
        ttl:   Time-to-live in seconds.
    """
    expires_at = time.monotonic() + ttl
    with _lock:
        _store[key] = CacheEntry(value=value, expires_at=expires_at, ttl=ttl)
    log.debug("Cache set: %s (ttl=%ds)", key, ttl)


def get_or_load(key: str, loader_fn: Callable[[], Any], ttl: int) -> Any:
    """
    Return the cached value for *key*, calling *loader_fn* on a cache miss.

    Thread-safe: if multiple threads call this simultaneously on the same key,
    only one loader call is made (via double-checked locking).

    Args:
        key:       Cache key string.
        loader_fn: Zero-argument callable that produces the value to cache.
        ttl:       Time-to-live in seconds for a newly loaded value.

    Returns:
        The cached or freshly loaded value.

    Raises:
        Any exception raised by loader_fn propagates to the caller.
    """
    # Fast path — value is already cached
    cached = get(key)
    if cached is not None:
        log.debug("Cache hit: %s", key)
        return cached

    # Slow path — load, cache, and return
    log.info("Cache miss: %s — loading…", key)
    value = loader_fn()
    set(key, value, ttl)
    return value


def invalidate(key: Optional[str] = None) -> None:
    """
    Invalidate one or all cache entries.

    Args:
        key: If provided, remove only that key. If None, clear the entire cache.
    """
    with _lock:
        if key is None:
            _store.clear()
            log.info("Cache cleared (all keys)")
        else:
            removed = _store.pop(key, None)
            if removed is not None:
                log.info("Cache invalidated: %s", key)


# ---------------------------------------------------------------------------
# Background refresh
# ---------------------------------------------------------------------------

def register(key: str, loader_fn: Callable[[], Any], ttl: int) -> None:
    """
    Register a cache key for automatic background pre-warm refresh.

    The background worker (started via start_background_refresh()) will
    reload the value before it expires so callers always get a fresh result
    without waiting for a loader call.

    Args:
        key:       Cache key string.
        loader_fn: Zero-argument callable that produces the value.
        ttl:       Time-to-live in seconds.
    """
    with _registry_lock:
        _registry[key] = (ttl, loader_fn)
    log.debug("Registered for background refresh: %s (ttl=%ds)", key, ttl)


def _refresh_worker() -> None:
    """Background daemon thread: pre-warms registered cache keys before expiry."""
    interval = config.REFRESH_WORKER_INTERVAL
    ahead = config.REFRESH_AHEAD_SECONDS
    log.info(
        "Background refresh worker started (check_interval=%ds, ahead=%ds)",
        interval, ahead,
    )
    while True:
        time.sleep(interval)
        with _registry_lock:
            items = list(_registry.items())

        for key, (ttl, loader_fn) in items:
            with _lock:
                entry = _store.get(key)

            # Refresh if: expired, missing, or expiring within `ahead` seconds
            needs_refresh = (
                entry is None
                or not entry.is_alive()
                or entry.seconds_until_expiry() < ahead
            )
            if not needs_refresh:
                continue

            log.info("Background refresh: %s", key)
            try:
                value = loader_fn()
                set(key, value, ttl)
            except Exception:
                log.exception("Background refresh failed: %s", key)


def start_background_refresh() -> None:
    """
    Start the background refresh daemon thread.

    Safe to call multiple times — subsequent calls are no-ops if the thread
    is already running. Call once during application startup after registering
    all keys.
    """
    global _worker_thread
    if _worker_thread is not None and _worker_thread.is_alive():
        log.debug("Background refresh worker is already running")
        return
    _worker_thread = threading.Thread(
        target=_refresh_worker,
        name="cache-refresh-worker",
        daemon=True,  # exits when the main process exits
    )
    _worker_thread.start()
    log.info("Background refresh worker thread started")
