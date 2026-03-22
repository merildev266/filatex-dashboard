/**
 * data_loader.js
 * Fetches all dashboard data from the Flask API and assigns window globals.
 * Section scripts (energy.js, reporting.js, capex.js, etc.) are unchanged —
 * they read the same window.* variables as before.
 *
 * Configurable: set window.__API_BASE before this script loads to use a
 * different origin (e.g. "http://localhost:5000"). Defaults to same-origin.
 */

(function () {
  var BASE = (window.__API_BASE || '').replace(/\/$/, '');

  var _API_ENDPOINTS = [
    { url: BASE + '/api/hfo-sites', assign: function (d) {
        window.TAMATAVE_LIVE = d.TAMATAVE_LIVE;
        window.DIEGO_LIVE    = d.DIEGO_LIVE;
        window.MAJUNGA_LIVE  = d.MAJUNGA_LIVE;
        window.TULEAR_LIVE   = d.TULEAR_LIVE;
        window.ANTSIRABE_LIVE = d.ANTSIRABE_LIVE;
        // legacy alias used by energy.js via siteData
        if (d.siteData) window.siteData = d.siteData;
    }},
    { url: BASE + '/api/enr-sites',     assign: function (d) { window.ENR_SITES         = d.ENR_SITES; }},
    { url: BASE + '/api/hfo-projects',  assign: function (d) { window.HFO_PROJECTS       = d.HFO_PROJECTS; }},
    { url: BASE + '/api/enr-projects',  assign: function (d) { window.ENR_PROJECTS_DATA  = d.ENR_PROJECTS_DATA; }},
    { url: BASE + '/api/enr-reporting', assign: function (d) { window.REPORTING_ENR      = d.REPORTING_ENR; }},
    { url: BASE + '/api/capex',         assign: function (d) { window.capexData          = d.capexData; }},
  ];

  /**
   * Fetch with 1 retry on failure (2 s delay before retry).
   */
  function _fetch(url) {
    return fetch(url, { signal: AbortSignal.timeout(20000) })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
        return r.json();
      })
      .catch(function (err) {
        console.warn('[data_loader] First attempt failed for ' + url + ':', err.message, '— retrying in 2 s');
        return new Promise(function (resolve) { setTimeout(resolve, 2000); })
          .then(function () {
            return fetch(url, { signal: AbortSignal.timeout(20000) });
          })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
            return r.json();
          });
      });
  }

  window._dataLoaded = false;

  window._dataLoadPromise = Promise.allSettled(
    _API_ENDPOINTS.map(function (ep) {
      return _fetch(ep.url).then(ep.assign);
    })
  ).then(function (results) {
    var errors = results
      .filter(function (r) { return r.status === 'rejected'; })
      .map(function (r) { return r.reason; });

    if (errors.length) {
      console.error('[data_loader] ' + errors.length + ' endpoint(s) failed:', errors);
    }

    window._dataLoaded = true;
    document.dispatchEvent(new CustomEvent('data:ready', { detail: { errors: errors } }));
  });
})();
