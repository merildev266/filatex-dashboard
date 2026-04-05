"""
cache.py — Thread-safe in-memory TTL cache with background pre-warm refresh.

Simplified from feature_amine — no external config dependency.

Usage:
    import cache
    data = cache.get_or_load("hfo_sites", ttl=900, loader_fn=fetch_hfo)
    cache.register("hfo_sites", fetch_hfo, ttl=900)
    cache.start_background_refresh()
    cache.invalidate("hfo_sites")   # one key
    cache.invalidate()              # all keys
"""
import logging
import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Optional

log = logging.getLogger(__name__)

# Defaults (seconds)
REFRESH_AHEAD_SECONDS = 120
REFRESH_WORKER_INTERVAL = 60


@dataclass
class CacheEntry:
    value: Any
    expires_at: float
    ttl: int

    def is_alive(self) -> bool:
        return time.monotonic() < self.expires_at

    def seconds_until_expiry(self) -> float:
        return self.expires_at - time.monotonic()


_store: dict[str, CacheEntry] = {}
_lock = threading.Lock()
_registry: dict[str, tuple[int, Callable[[], Any]]] = {}
_registry_lock = threading.Lock()
_worker_thread: Optional[threading.Thread] = None


def get(key: str) -> Optional[Any]:
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        if entry.is_alive():
            return entry.value
        return None


def get_stale(key: str) -> Optional[Any]:
    with _lock:
        entry = _store.get(key)
        return entry.value if entry else None


def set(key: str, value: Any, ttl: int) -> None:  # noqa: A001
    with _lock:
        _store[key] = CacheEntry(value=value, expires_at=time.monotonic() + ttl, ttl=ttl)
    log.debug("Cache set: %s (ttl=%ds)", key, ttl)


def get_or_load(key: str, ttl: int, loader_fn: Callable[[], Any]) -> Any:
    cached = get(key)
    if cached is not None:
        return cached
    log.info("Cache miss: %s — loading…", key)
    value = loader_fn()
    set(key, value, ttl)
    return value


def invalidate(key: Optional[str] = None) -> None:
    with _lock:
        if key is None:
            _store.clear()
            log.info("Cache cleared (all keys)")
        else:
            _store.pop(key, None)
            log.info("Cache invalidated: %s", key)


def register(key: str, loader_fn: Callable[[], Any], ttl: int) -> None:
    with _registry_lock:
        _registry[key] = (ttl, loader_fn)


def _do_refresh_pass() -> None:
    with _registry_lock:
        items = list(_registry.items())
    for key, (ttl, loader_fn) in items:
        with _lock:
            entry = _store.get(key)
        needs_refresh = (
            entry is None
            or not entry.is_alive()
            or entry.seconds_until_expiry() < REFRESH_AHEAD_SECONDS
        )
        if not needs_refresh:
            continue
        log.info("Background refresh: %s", key)
        try:
            value = loader_fn()
            set(key, value, ttl)
        except Exception:
            log.exception("Background refresh failed: %s", key)


def _refresh_worker() -> None:
    log.info("Background refresh worker started")
    _do_refresh_pass()
    while True:
        time.sleep(REFRESH_WORKER_INTERVAL)
        _do_refresh_pass()


def start_background_refresh() -> None:
    global _worker_thread
    if _worker_thread is not None and _worker_thread.is_alive():
        return
    _worker_thread = threading.Thread(
        target=_refresh_worker, name="cache-refresh-worker", daemon=True
    )
    _worker_thread.start()
