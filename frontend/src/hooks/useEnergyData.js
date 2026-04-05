import { useState, useEffect, useCallback, useRef } from 'react'

// Static fallbacks — used when API is unreachable (dev mode, offline)
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE } from '../data/site_data'
import { ENR_SITES as STATIC_ENR_SITES } from '../data/enr_site_data'
import { ENR_PROJECTS_DATA as STATIC_ENR_PROJECTS } from '../data/enr_projects_data'
import { HFO_PROJECTS as STATIC_HFO_PROJECTS } from '../data/hfo_projects'

const STATIC_HFO_SITES = { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE }

// Module-level cache so all components share the same data
let _cache = { hfoSites: null, enrSites: null, hfoProjects: null, enrProjects: null }
let _fetchPromise = null

async function _fetchEndpoint(url) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

async function _fetchAll() {
  const [hfo, enr, hfoP, enrP] = await Promise.allSettled([
    _fetchEndpoint('/api/energy/hfo-sites'),
    _fetchEndpoint('/api/energy/enr-sites'),
    _fetchEndpoint('/api/energy/hfo-projects'),
    _fetchEndpoint('/api/energy/enr-projects'),
  ])

  return {
    hfoSites: hfo.status === 'fulfilled' ? hfo.value : null,
    enrSites: enr.status === 'fulfilled' ? enr.value : null,
    hfoProjects: hfoP.status === 'fulfilled' ? hfoP.value : null,
    enrProjects: enrP.status === 'fulfilled' ? enrP.value : null,
  }
}

/**
 * Hook to fetch all Energy data from the API.
 * Falls back to static imports if API is unreachable.
 * Data is cached at module level — shared across all components.
 */
export function useEnergyData() {
  const [data, setData] = useState(_cache)
  const [loading, setLoading] = useState(!_cache.hfoSites)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    // Already cached from a previous mount
    if (_cache.hfoSites) {
      setData(_cache)
      setLoading(false)
      return
    }

    // Deduplicate concurrent fetches
    if (!_fetchPromise) {
      _fetchPromise = _fetchAll().finally(() => { _fetchPromise = null })
    }

    _fetchPromise.then(result => {
      if (!mountedRef.current) return

      // Use API data where available, fall back to static
      const merged = {
        hfoSites: result.hfoSites || STATIC_HFO_SITES,
        enrSites: result.enrSites || { ENR_SITES: STATIC_ENR_SITES },
        hfoProjects: result.hfoProjects || { HFO_PROJECTS: STATIC_HFO_PROJECTS },
        enrProjects: result.enrProjects || { ENR_PROJECTS_DATA: STATIC_ENR_PROJECTS },
      }

      const hadApiError = !result.hfoSites && !result.enrSites
      if (hadApiError) {
        setError('API unreachable — using static data')
      }

      _cache = merged
      setData(merged)
      setLoading(false)
    }).catch(err => {
      if (!mountedRef.current) return
      // Full fallback to static data
      const fallback = {
        hfoSites: STATIC_HFO_SITES,
        enrSites: { ENR_SITES: STATIC_ENR_SITES },
        hfoProjects: { HFO_PROJECTS: STATIC_HFO_PROJECTS },
        enrProjects: { ENR_PROJECTS_DATA: STATIC_ENR_PROJECTS },
      }
      _cache = fallback
      setData(fallback)
      setError(err.message)
      setLoading(false)
    })
  }, [])

  const refetch = useCallback(() => {
    _cache = { hfoSites: null, enrSites: null, hfoProjects: null, enrProjects: null }
    _fetchPromise = null
    setLoading(true)
    setError(null)

    _fetchAll().then(result => {
      if (!mountedRef.current) return
      const merged = {
        hfoSites: result.hfoSites || STATIC_HFO_SITES,
        enrSites: result.enrSites || { ENR_SITES: STATIC_ENR_SITES },
        hfoProjects: result.hfoProjects || { HFO_PROJECTS: STATIC_HFO_PROJECTS },
        enrProjects: result.enrProjects || { ENR_PROJECTS_DATA: STATIC_ENR_PROJECTS },
      }
      _cache = merged
      setData(merged)
      setLoading(false)
    }).catch(err => {
      if (!mountedRef.current) return
      setError(err.message)
      setLoading(false)
    })
  }, [])

  return { ...data, loading, error, refetch }
}
