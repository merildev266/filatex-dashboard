/* === Energy JS === */

/* ── ENR Filter State ── */
var enrCurrentFilter = 'month';
var enrSelectedMonthIndex = null; // 0-based, null = current
var enrSelectedQuarter = Math.floor(new Date().getMonth() / 3) + 1;
var enrSelectedYear = new Date().getFullYear();

function getEnrDataMonth() {
  // Returns 1-based month of latest ENR data
  var sites = typeof ENR_SITES !== 'undefined' ? ENR_SITES : [];
  var maxMonth = 1;
  sites.forEach(function(s) {
    if (s.latestDate) {
      var m = parseInt(s.latestDate.split('-')[1]);
      if (m > maxMonth) maxMonth = m;
    }
  });
  return maxMonth;
}


function setEnrFilter(f, btn) {
  enrCurrentFilter = f;
  if (f === 'month') {
    enrSelectedMonthIndex = getEnrDataMonth() - 1;
    document.querySelectorAll('.enr-month-btn-wrap .tfilter').forEach(function(b) {
      b.textContent = MONTH_SHORT[enrSelectedMonthIndex];
    });
    document.querySelectorAll('.enr-quarter-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'Q'; });
    document.querySelectorAll('.enr-year-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'A'; });
    populateEnrMonthDropdowns();
  }
  syncEnrFilterActive();
  refreshEnrView();
}

function syncEnrFilterActive() {
  document.querySelectorAll('.enr-filter').forEach(function(b) {
    var mw = b.closest('.enr-month-btn-wrap');
    var qw = b.closest('.enr-quarter-btn-wrap');
    var yw = b.closest('.enr-year-btn-wrap');
    if (enrCurrentFilter === 'month') b.classList.toggle('active', !!mw);
    else if (enrCurrentFilter === 'quarter') b.classList.toggle('active', !!qw);
    else if (enrCurrentFilter === 'year') b.classList.toggle('active', !!yw);
    else b.classList.remove('active');
  });
}

function setEnrFilterQuarter(q, btn) {
  enrCurrentFilter = 'quarter';
  enrSelectedQuarter = q;
  document.querySelectorAll('.enr-quarter-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'Q' + q; });
  document.querySelectorAll('.enr-month-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'M'; });
  document.querySelectorAll('.enr-year-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'A'; });
  syncEnrFilterActive();
  populateEnrQuarterDropdowns();
  refreshEnrView();
}

function setEnrFilterYear(year, btn) {
  enrCurrentFilter = 'year';
  enrSelectedYear = year;
  document.querySelectorAll('.enr-year-btn-wrap .tfilter').forEach(function(b) { b.textContent = String(year); });
  document.querySelectorAll('.enr-month-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'M'; });
  document.querySelectorAll('.enr-quarter-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'Q'; });
  syncEnrFilterActive();
  populateEnrYearDropdowns();
  refreshEnrView();
}

/* ── ENR Month Dropdown ── */
var _enrMonthDDTimer = null;
var _enrMonthDDHovered = false;

function closeAllEnrMonthDropdowns() {
  if (_enrMonthDDTimer) { clearTimeout(_enrMonthDDTimer); _enrMonthDDTimer = null; }
  document.querySelectorAll('.enr-month-dropdown.open').forEach(function(dd) {
    dd.classList.remove('open');
    dd.onmouseenter = null;
    dd.onmouseleave = null;
  });
}

function _startEnrMonthAutoClose(dd) {
  if (_enrMonthDDTimer) clearTimeout(_enrMonthDDTimer);
  _enrMonthDDHovered = false;
  dd.onmouseenter = function() { _enrMonthDDHovered = true; if (_enrMonthDDTimer) clearTimeout(_enrMonthDDTimer); };
  dd.onmouseleave = function() { _enrMonthDDHovered = false; _startEnrMonthAutoClose(dd); };
  _enrMonthDDTimer = setTimeout(function() {
    if (!_enrMonthDDHovered) closeAllEnrMonthDropdowns();
  }, 2000);
}

function toggleEnrMonthDropdown(event, btn) {
  event.stopPropagation();
  closeAllEnrQuarterDropdowns();
  closeAllEnrYearDropdowns();
  var wrap = btn.closest('.enr-month-btn-wrap');
  var dd = wrap ? wrap.querySelector('.enr-month-dropdown') : null;
  if (enrCurrentFilter !== 'month') {
    closeAllEnrMonthDropdowns();
    setEnrFilter('month', btn);
    if (dd) { dd.classList.add('open'); _startEnrMonthAutoClose(dd); }
    return;
  }
  if (!dd) return;
  var wasOpen = dd.classList.contains('open');
  closeAllEnrMonthDropdowns();
  if (!wasOpen) { dd.classList.add('open'); _startEnrMonthAutoClose(dd); }
}

function populateEnrMonthDropdowns() {
  var maxMonth = getEnrDataMonth();
  var selIdx = enrSelectedMonthIndex !== null ? enrSelectedMonthIndex : (maxMonth - 1);
  document.querySelectorAll('.enr-month-dropdown').forEach(function(dd) {
    dd.innerHTML = '';
    for (var m = 0; m < maxMonth; m++) {
      var item = document.createElement('div');
      item.className = 'md-item' + (m === selIdx ? ' md-active' : '');
      item.textContent = MONTH_NAMES[m];
      item.dataset.month = m;
      item.onclick = (function(mi) { return function(e) { selectEnrMonth(mi, e); }; })(m);
      dd.appendChild(item);
    }
  });
}

function selectEnrMonth(monthIdx, event) {
  if (event) event.stopPropagation();
  closeAllEnrMonthDropdowns();
  enrSelectedMonthIndex = monthIdx;
  enrCurrentFilter = 'month';
  document.querySelectorAll('.enr-month-btn-wrap .tfilter').forEach(function(b) { b.textContent = MONTH_SHORT[monthIdx]; });
  document.querySelectorAll('.enr-quarter-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'Q'; });
  document.querySelectorAll('.enr-year-btn-wrap .tfilter').forEach(function(b) { b.textContent = 'A'; });
  populateEnrMonthDropdowns();
  syncEnrFilterActive();
  refreshEnrView();
}

/* ── ENR Quarter Dropdown ── */
function closeAllEnrQuarterDropdowns() {
  document.querySelectorAll('.enr-quarter-dropdown.open').forEach(function(dd) { dd.classList.remove('open'); dd.onmouseenter = null; dd.onmouseleave = null; });
}

function toggleEnrQuarterDropdown(event, btn) {
  event.stopPropagation();
  closeAllEnrMonthDropdowns();
  closeAllEnrYearDropdowns();
  var wrap = btn.closest('.enr-quarter-btn-wrap');
  var dd = wrap ? wrap.querySelector('.enr-quarter-dropdown') : null;
  if (enrCurrentFilter !== 'quarter') {
    closeAllEnrQuarterDropdowns();
    var curQ = Math.floor(new Date().getMonth() / 3) + 1;
    setEnrFilterQuarter(curQ, btn);
    populateEnrQuarterDropdowns();
    if (dd) { dd.classList.add('open'); _startEnrMonthAutoClose(dd); }
    return;
  }
  if (!dd) return;
  var wasOpen = dd.classList.contains('open');
  closeAllEnrQuarterDropdowns();
  if (!wasOpen) { populateEnrQuarterDropdowns(); dd.classList.add('open'); _startEnrMonthAutoClose(dd); }
}

function populateEnrQuarterDropdowns() {
  var maxMonth = getEnrDataMonth();
  var maxQ = Math.ceil(maxMonth / 3);
  document.querySelectorAll('.enr-quarter-dropdown').forEach(function(dd) {
    dd.innerHTML = '';
    for (var q = 1; q <= maxQ; q++) {
      var item = document.createElement('div');
      item.className = 'md-item' + (enrCurrentFilter === 'quarter' && q === enrSelectedQuarter ? ' md-active' : '');
      item.textContent = 'Q' + q;
      item.onclick = (function(qi) { return function(e) { selectEnrQuarter(qi, e); }; })(q);
      dd.appendChild(item);
    }
  });
}

function selectEnrQuarter(q, event) {
  if (event) event.stopPropagation();
  closeAllEnrQuarterDropdowns();
  setEnrFilterQuarter(q);
}

/* ── ENR Year Dropdown ── */
function closeAllEnrYearDropdowns() {
  document.querySelectorAll('.enr-year-dropdown.open').forEach(function(dd) { dd.classList.remove('open'); dd.onmouseenter = null; dd.onmouseleave = null; });
}

function toggleEnrYearDropdown(event, btn) {
  event.stopPropagation();
  closeAllEnrMonthDropdowns();
  closeAllEnrQuarterDropdowns();
  var wrap = btn.closest('.enr-year-btn-wrap');
  var dd = wrap ? wrap.querySelector('.enr-year-dropdown') : null;
  if (enrCurrentFilter !== 'year') {
    closeAllEnrYearDropdowns();
    var curY = new Date().getFullYear();
    setEnrFilterYear(curY, btn);
    populateEnrYearDropdowns();
    if (dd) { dd.classList.add('open'); _startEnrMonthAutoClose(dd); }
    return;
  }
  if (!dd) return;
  var wasOpen = dd.classList.contains('open');
  closeAllEnrYearDropdowns();
  if (!wasOpen) { populateEnrYearDropdowns(); dd.classList.add('open'); _startEnrMonthAutoClose(dd); }
}

function populateEnrYearDropdowns() {
  document.querySelectorAll('.enr-year-dropdown').forEach(function(dd) {
    dd.innerHTML = '';
    [2025, 2026].forEach(function(y) {
      var item = document.createElement('div');
      item.className = 'md-item' + (enrCurrentFilter === 'year' && y === enrSelectedYear ? ' md-active' : '');
      item.textContent = String(y);
      item.onclick = (function(yi) { return function(e) { selectEnrYear(yi, e); }; })(y);
      dd.appendChild(item);
    });
  });
}

function selectEnrYear(year, event) {
  if (event) event.stopPropagation();
  closeAllEnrYearDropdowns();
  setEnrFilterYear(year);
}

// Close ENR dropdowns on click outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.enr-month-btn-wrap')) closeAllEnrMonthDropdowns();
  if (!e.target.closest('.enr-quarter-btn-wrap')) closeAllEnrQuarterDropdowns();
  if (!e.target.closest('.enr-year-btn-wrap')) closeAllEnrYearDropdowns();
});

/* ── ENR Filtered Data Helpers ── */
function getEnrFilteredSiteData(site) {
  // Returns {prodKwh, deliveredKwh, consumedKwh, peakKw, avgDailyKwh, days, label} based on current ENR filter
  var result = {prodKwh:0, deliveredKwh:0, consumedKwh:0, peakKw:0, avgDailyKwh:0, days:0, label:''};
  if (enrCurrentFilter === 'month') {
    var mi = enrSelectedMonthIndex !== null ? enrSelectedMonthIndex : (getEnrDataMonth() - 1);
    var monthStr = new Date().getFullYear() + '-' + String(mi + 1).padStart(2,'0');
    for (var i = 0; i < site.monthly.length; i++) {
      if (site.monthly[i].month === monthStr) {
        var m = site.monthly[i];
        result.prodKwh = m.totalProdKwh;
        result.deliveredKwh = m.totalDeliveredKwh;
        result.consumedKwh = m.totalConsumedKwh;
        result.peakKw = m.maxPeakKw;
        result.avgDailyKwh = m.avgDailyProdKwh;
        result.days = m.daysWithData;
        result.label = MONTH_NAMES[mi] + ' ' + new Date().getFullYear();
        break;
      }
    }
    return result;
  }
  if (enrCurrentFilter === 'quarter') {
    var startMonth = (enrSelectedQuarter - 1) * 3 + 1;
    var endMonth = startMonth + 2;
    var year = new Date().getFullYear();
    var totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0;
    site.monthly.forEach(function(m) {
      var mNum = parseInt(m.month.split('-')[1]);
      if (mNum >= startMonth && mNum <= endMonth) {
        totalProd += m.totalProdKwh;
        totalDel += m.totalDeliveredKwh;
        totalCon += m.totalConsumedKwh;
        if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw;
        totalDays += m.daysWithData;
      }
    });
    result.prodKwh = totalProd;
    result.deliveredKwh = totalDel;
    result.consumedKwh = totalCon;
    result.peakKw = maxPeak;
    result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0;
    result.days = totalDays;
    result.label = 'Q' + enrSelectedQuarter + ' ' + year;
    return result;
  }
  // year
  var totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0;
  var year = enrSelectedYear;
  site.monthly.forEach(function(m) {
    var mYear = parseInt(m.month.split('-')[0]);
    if (mYear === year) {
      totalProd += m.totalProdKwh;
      totalDel += m.totalDeliveredKwh;
      totalCon += m.totalConsumedKwh;
      if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw;
      totalDays += m.daysWithData;
    }
  });
  result.prodKwh = totalProd;
  result.deliveredKwh = totalDel;
  result.consumedKwh = totalCon;
  result.peakKw = maxPeak;
  result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0;
  result.days = totalDays;
  result.label = String(year);
  return result;
}

function getEnrFilterLabel() {
  if (enrCurrentFilter === 'month') {
    var mi = enrSelectedMonthIndex !== null ? enrSelectedMonthIndex : (getEnrDataMonth() - 1);
    return MONTH_NAMES[mi] + ' ' + new Date().getFullYear();
  }
  if (enrCurrentFilter === 'quarter') {
    return 'Q' + enrSelectedQuarter + ' ' + new Date().getFullYear();
  }
  return String(enrSelectedYear);
}

function getEnrProdUnit() {
  return 'MWh';
}

function formatEnrProd(kwh) {
  return (kwh / 1000).toFixed(1);
}

function refreshEnrView() {
  // Re-render whichever ENR view is currently open
  var panel = document.getElementById('panel-enr-production');
  if (panel && (panel.style.transform === 'translateX(0)' || panel.style.transform === 'translateX(0px)')) {
    // Check if site detail is shown (title != 'Production EnR')
    var titleEl = panel.querySelector('.inner-title');
    if (titleEl && titleEl.textContent !== 'Production EnR') {
      // Find which site is shown
      var sites = typeof ENR_SITES !== 'undefined' ? ENR_SITES : [];
      for (var i = 0; i < sites.length; i++) {
        if (sites[i].name === titleEl.textContent) { openEnrSiteDetail(i); return; }
      }
    }
    openEnrProduction();
    return;
  }
  // Also update the inner-enr card KPIs
  updateEnrCards();
}

function updateEnrCards() {
  var sites = typeof ENR_SITES !== 'undefined' ? ENR_SITES : [];
  if (!sites.length) return;
  var totalProd = 0, totalCap = 0, totalAvgDaily = 0;
  sites.forEach(function(s) {
    var fd = getEnrFilteredSiteData(s);
    totalProd += fd.prodKwh;
    totalAvgDaily += fd.avgDailyKwh;
    totalCap += s.capacityMw;
  });
  var el;
  el = document.getElementById('enr-prod-total');
  if (el) {
    el.textContent = (totalAvgDaily / 1000).toFixed(1);
  }
  el = document.getElementById('enr-prod-cumul');
  if (el) el.textContent = (totalProd / 1000).toFixed(0);
}

function openEnrDetail(){ openEnrProduction(); }

/* ── Shared EnR helpers ── */
var _enrColors = ['#00ab63','#5aafaf','#4a8fe7'];
var _enrRgbs   = ['0,171,99','90,175,175','74,143,231'];
var _enrMonths  = ['','Janv','Fév','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

function openEnrProduction(){
  var sites = window._enrSites || (typeof ENR_SITES !== 'undefined' ? ENR_SITES : []);
  if (!sites.length) return;

  /* ── Filtered aggregates ── */
  var totalCapMw = 0, totalProdKwh = 0, totalAvgDaily = 0;
  var siteFiltered = [];
  sites.forEach(function(s){
    totalCapMw += s.capacityMw;
    var fd = getEnrFilteredSiteData(s);
    totalProdKwh += fd.prodKwh;
    totalAvgDaily += fd.avgDailyKwh;
    siteFiltered.push(fd);
  });
  var mixPct = document.getElementById('enr-prod-mix') ? document.getElementById('enr-prod-mix').textContent : '\u2014';
  var filterLabel = getEnrFilterLabel();
  var prodUnit = getEnrProdUnit();

  var html = '';

  /* ══════════ GLOBAL KPIs (3 cartes) ══════════ */
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:36px;">';
  // KPI 1: Production
  var kpi1Label = 'Production totale';
  var kpi1Value = (totalProdKwh/1000).toFixed(1);
  var kpi1Unit = 'MWh';
  html += '<div style="background:rgba(0,171,99,0.07);border:1px solid rgba(0,171,99,0.2);border-radius:18px;padding:24px 16px;text-align:center;">'
    + '<div style="font-size:8px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(0,171,99,0.55);margin-bottom:8px;">' + kpi1Label + '</div>'
    + '<div style="font-size:42px;font-weight:800;color:#00ab63;line-height:1;">' + kpi1Value
    + '<span style="font-size:16px;font-weight:400;color:rgba(0,171,99,0.5);margin-left:4px;">' + kpi1Unit + '</span></div>'
    + '<div style="font-size:10px;color:rgba(0,171,99,0.4);margin-top:6px;">' + filterLabel + ' \xB7 ' + sites.length + ' centrales</div></div>';
  // KPI 2: Moyenne journalière
  html += '<div style="background:rgba(0,171,99,0.04);border:1px solid rgba(0,171,99,0.12);border-radius:18px;padding:24px 16px;text-align:center;">'
    + '<div style="font-size:8px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(0,171,99,0.5);margin-bottom:8px;">Moy. journali\u00e8re</div>'
    + '<div style="font-size:42px;font-weight:800;color:#00ab63;line-height:1;">' + (totalAvgDaily/1000).toFixed(1)
    + '<span style="font-size:16px;font-weight:400;color:rgba(0,171,99,0.5);margin-left:4px;">MWh/j</span></div>'
    + '<div style="font-size:10px;color:rgba(0,171,99,0.4);margin-top:6px;">' + totalCapMw.toFixed(1) + ' MWc install\u00e9s</div></div>';
  // KPI 3: Mix EnR
  html += '<div style="background:rgba(0,171,99,0.04);border:1px solid rgba(0,171,99,0.12);border-radius:18px;padding:24px 16px;text-align:center;">'
    + '<div style="font-size:8px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(0,171,99,0.5);margin-bottom:8px;">Part EnR dans le mix</div>'
    + '<div style="font-size:42px;font-weight:800;color:#00ab63;line-height:1;">' + mixPct
    + '<span style="font-size:16px;font-weight:400;color:rgba(0,171,99,0.5);margin-left:2px;">%</span></div>'
    + '<div style="font-size:10px;color:rgba(0,171,99,0.4);margin-top:6px;">EnR / (EnR + HFO)</div></div>';
  html += '</div>';

  /* ══════════ 3 SITE CARDS — une ligne ══════════ */
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">';
  sites.forEach(function(s, si){
    var col = _enrColors[si % _enrColors.length];
    var rgb = _enrRgbs[si % _enrRgbs.length];
    var fd = siteFiltered[si];
    var pct = totalProdKwh > 0 ? (fd.prodKwh / totalProdKwh * 100).toFixed(0) : 0;

    html += '<div onclick="openEnrSiteDetail(' + si + ')" style="background:rgba(' + rgb + ',0.05);border:1px solid rgba(' + rgb + ',0.18);border-radius:20px;padding:24px 20px;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;"'
      + ' onmouseenter="this.style.background=\'rgba(' + rgb + ',0.1)\';this.style.borderColor=\'rgba(' + rgb + ',0.35)\';this.style.transform=\'translateY(-2px)\'"'
      + ' onmouseleave="this.style.background=\'rgba(' + rgb + ',0.05)\';this.style.borderColor=\'rgba(' + rgb + ',0.18)\';this.style.transform=\'translateY(0)\'">';

    /* Site name + badge % */
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'
      + '<div style="font-size:14px;font-weight:800;color:rgba(255,255,255,0.9);">\u2600\uFE0F ' + s.name + '</div>'
      + '<div style="background:rgba(' + rgb + ',0.15);border-radius:8px;padding:3px 10px;font-size:12px;font-weight:800;color:' + col + ';">' + pct + '%</div>'
      + '</div>';

    /* Main KPI — filtered */
    var mainVal = (fd.prodKwh/1000).toFixed(1);
    var mainUnit = 'MWh';
    var mainLabel = enrCurrentFilter === 'month' ? MONTH_NAMES[enrSelectedMonthIndex !== null ? enrSelectedMonthIndex : (getEnrDataMonth()-1)] : (enrCurrentFilter === 'quarter' ? 'Q' + enrSelectedQuarter : String(enrSelectedYear));
    html += '<div style="text-align:center;margin-bottom:16px;">'
      + '<div style="font-size:36px;font-weight:800;color:' + col + ';line-height:1;">' + mainVal
      + '<span style="font-size:14px;font-weight:400;color:rgba(' + rgb + ',0.5);margin-left:3px;">' + mainUnit + '</span></div>'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:4px;">' + mainLabel + '</div>'
      + '</div>';

    /* Sub KPIs — 2x2 grid */
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">';
    html += '<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:10px 6px;text-align:center;">'
      + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:3px;">Capacit\u00e9</div>'
      + '<div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.85);">' + s.capacityMw + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">MWc</span></div></div>';
    html += '<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:10px 6px;text-align:center;">'
      + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:3px;">Livr\u00e9</div>'
      + '<div style="font-size:16px;font-weight:800;color:' + col + ';">' + (fd.deliveredKwh/1000).toFixed(1) + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">' + mainUnit + '</span></div></div>';
    html += '<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:10px 6px;text-align:center;">'
      + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:3px;">Pic</div>'
      + '<div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);">' + fd.peakKw + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">kW</span></div></div>';
    html += '<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:10px 6px;text-align:center;">'
      + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:3px;">Jours</div>'
      + '<div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);">' + fd.days + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">j</span></div></div>';
    html += '</div>';

    /* CTA */
    html += '<div style="display:flex;align-items:center;gap:6px;color:rgba(' + rgb + ',0.7);font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">'
      + '<span>Voir le d\u00e9tail</span><span style="font-size:12px;">\u2192</span></div>';

    html += '<div style="position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(' + rgb + ',0.1),transparent 70%);pointer-events:none;"></div>';
    html += '</div>'; /* end site card */
  });
  html += '</div>';

  document.getElementById('enr-prod-detail-content').innerHTML = html;
  var panel = document.getElementById('panel-enr-production');
  panel.style.display = 'block';
  panel.style.transform = 'translateX(0)';
  panel.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  /* Reset title/subtitle/back button to overview state */
  var titleEl = panel.querySelector('.inner-title');
  if (titleEl) titleEl.textContent = 'Production EnR';
  var subtitleEl = panel.querySelector('.inner-subtitle');
  if (subtitleEl) subtitleEl.textContent = 'D\u00e9tail par site \xB7 Donn\u00e9es r\u00e9elles de production';
  var backBtn = panel.querySelector('.back-btn');
  if (backBtn) { backBtn.textContent = '\u2190 Energy'; backBtn.onclick = function(){ closeEnrProduction(); }; }
}

/* ══════════ SITE DETAIL (clic sur une carte site) ══════════ */
function openEnrSiteDetail(siteIndex){
  var sites = window._enrSites || (typeof ENR_SITES !== 'undefined' ? ENR_SITES : []);
  var s = sites[siteIndex];
  if (!s) return;
  var col = _enrColors[siteIndex % _enrColors.length];
  var rgb = _enrRgbs[siteIndex % _enrRgbs.length];
  var fd = getEnrFilteredSiteData(s);
  var filterLabel = getEnrFilterLabel();

  var html = '';

  /* ── Site nav strip (like HFO) ── */
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px;justify-content:center;">';
  sites.forEach(function(ns, ni){
    var active = ni === siteIndex;
    var nCol = _enrColors[ni % _enrColors.length];
    var nRgb = _enrRgbs[ni % _enrRgbs.length];
    html += '<button onclick="openEnrSiteDetail(' + ni + ')" style="background:' + (active ? nCol : 'rgba(' + nRgb + ',0.04)') + ';border:1px solid ' + (active ? nCol : 'rgba(' + nRgb + ',0.2)') + ';color:' + (active ? '#1e1d38' : 'rgba(' + nRgb + ',0.6)') + ';padding:6px 0;border-radius:20px;font-size:10px;font-weight:' + (active ? '700' : '600') + ';letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;font-family:inherit;transition:all 0.2s;min-width:130px;text-align:center;">' + ns.name + '</button>';
  });
  html += '</div>';

  /* ── Header ── */
  html += '<div style="margin-bottom:28px;">'
    + '<div style="font-size:18px;font-weight:800;color:rgba(255,255,255,0.95);">\u2600\uFE0F ' + s.entity + '</div>'
    + '<div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:4px;">\uD83D\uDCCD ' + s.loc + ' \xB7 ' + s.centrale + '</div>'
    + '</div>';

  /* ── KPIs (5 cartes) — filtered ── */
  var prodVal = (fd.prodKwh/1000).toFixed(1);
  var prodUnit = 'MWh';
  html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px;">';
  var kpis = [
    ['Capacit\u00e9', s.capacityMw, 'MWc'],
    ['Production', prodVal, prodUnit],
    ['Livr\u00e9', (fd.deliveredKwh/1000).toFixed(1), prodUnit],
    ['Pic', fd.peakKw, 'kW'],
    ['Jours', fd.days, '']
  ];
  kpis.forEach(function(k, ki){
    var kCol = ki < 3 ? col : 'rgba(255,255,255,0.85)';
    html += '<div style="background:rgba(' + rgb + ',0.06);border:1px solid rgba(' + rgb + ',0.12);border-radius:14px;padding:16px 10px;text-align:center;">'
      + '<div style="font-size:7px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">' + k[0] + '</div>'
      + '<div style="font-size:22px;font-weight:800;color:' + kCol + ';line-height:1;">' + k[1]
      + (k[2] ? '<span style="font-size:10px;font-weight:400;color:rgba(255,255,255,0.3);margin-left:3px;">' + k[2] + '</span>' : '')
      + '</div></div>';
  });
  html += '</div>';

  /* ── Period label ── */
  html += '<div style="font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:14px;">' + filterLabel + '</div>';

  if (enrCurrentFilter === 'month') {
    /* ── Monthly detail with sparkline ── */
    var mi = enrSelectedMonthIndex !== null ? enrSelectedMonthIndex : (getEnrDataMonth() - 1);
    var monthStr = new Date().getFullYear() + '-' + String(mi + 1).padStart(2,'0');
    var monthData = null;
    for (var i = 0; i < s.monthly.length; i++) {
      if (s.monthly[i].month === monthStr) { monthData = s.monthly[i]; break; }
    }
    if (monthData && monthData.dailyProd.length > 0) {
      var maxDayProd = Math.max.apply(null, monthData.dailyProd);
      html += '<div style="background:rgba(' + rgb + ',0.05);border:1px solid rgba(' + rgb + ',0.12);border-radius:16px;padding:18px 16px;margin-bottom:28px;">';
      html += '<div style="display:flex;align-items:flex-end;gap:1px;height:80px;margin-bottom:14px;">';
      monthData.dailyProd.forEach(function(dv, di){
        var bh = maxDayProd > 0 ? Math.max(Math.round(dv / maxDayProd * 80), 2) : 2;
        html += '<div title="J' + (di+1) + ': ' + (dv/1000).toFixed(1) + ' MWh" style="flex:1;height:' + bh + 'px;background:' + col + ';opacity:0.6;border-radius:2px 2px 0 0;cursor:default;"></div>';
      });
      html += '</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
      html += '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;">'
        + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Moy/j</div>'
        + '<div style="font-size:16px;font-weight:800;color:' + col + ';">' + (monthData.avgDailyProdKwh/1000).toFixed(1) + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">MWh</span></div></div>';
      html += '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;">'
        + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Disponibilit\u00e9</div>'
        + '<div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);">' + monthData.totalAvailHours.toFixed(0) + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">h</span></div></div>';
      html += '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;">'
        + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Irradiance moy.</div>'
        + '<div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);">' + (monthData.avgIrradiance || '\u2014') + '</div></div>';
      html += '</div>';
      if (monthData.totalUnschedInterrupt > 0) {
        html += '<div style="margin-top:8px;background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.15);border-radius:8px;padding:6px 10px;text-align:center;font-size:9px;color:#ff5050;font-weight:600;">'
          + '\u26A0 ' + monthData.totalUnschedInterrupt.toFixed(1) + 'h interruptions</div>';
      }
      html += '</div>';
    } else {
      html += '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:13px;">Pas de donn\u00e9es pour ce mois</div>';
    }
  } else {
    /* ── Year view: all monthly cards ── */
    html += '<div style="display:grid;grid-template-columns:repeat(' + Math.min(s.monthly.length, 3) + ',1fr);gap:14px;margin-bottom:28px;">';
    s.monthly.forEach(function(m){
      var monthNum = parseInt(m.month.split('-')[1]);
      var monthName = _enrMonths[monthNum] || m.month;
      var maxDayProd = Math.max.apply(null, m.dailyProd.length ? m.dailyProd : [0]);
      html += '<div style="background:rgba(' + rgb + ',0.05);border:1px solid rgba(' + rgb + ',0.12);border-radius:16px;padding:18px 16px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
        + '<div style="font-size:13px;font-weight:800;color:rgba(255,255,255,0.8);">' + monthName + '</div>'
        + '<div style="font-size:20px;font-weight:800;color:' + col + ';">' + (m.totalProdKwh/1000).toFixed(0) + ' <span style="font-size:10px;font-weight:400;color:rgba(255,255,255,0.3);">MWh</span></div>'
        + '</div>';
      html += '<div style="display:flex;align-items:flex-end;gap:1px;height:55px;margin-bottom:14px;">';
      m.dailyProd.forEach(function(dv){
        var bh = maxDayProd > 0 ? Math.max(Math.round(dv / maxDayProd * 55), 2) : 2;
        html += '<div style="flex:1;height:' + bh + 'px;background:' + col + ';opacity:0.5;border-radius:2px 2px 0 0;"></div>';
      });
      html += '</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
      html += '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;">'
        + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Moy/j</div>'
        + '<div style="font-size:16px;font-weight:800;color:' + col + ';">' + (m.avgDailyProdKwh/1000).toFixed(1) + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">MWh</span></div></div>';
      html += '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;">'
        + '<div style="font-size:7px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Pic</div>'
        + '<div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);">' + m.maxPeakKw + ' <span style="font-size:9px;color:rgba(255,255,255,0.3);">kW</span></div></div>';
      html += '</div>';
      if (m.totalUnschedInterrupt > 0) {
        html += '<div style="margin-top:8px;background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.15);border-radius:8px;padding:6px 10px;text-align:center;font-size:9px;color:#ff5050;font-weight:600;">'
          + '\u26A0 ' + m.totalUnschedInterrupt.toFixed(1) + 'h interruptions</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  /* Update panel content + subtitle + back button */
  document.getElementById('enr-prod-detail-content').innerHTML = html;
  var subtitleEl = document.querySelector('#panel-enr-production .inner-subtitle');
  if (subtitleEl) subtitleEl.innerHTML = s.entity + ' \xB7 ' + s.loc;
  var titleEl = document.querySelector('#panel-enr-production .inner-title');
  if (titleEl) titleEl.textContent = s.name;
  /* Back button → returns to Production EnR overview */
  var backBtn = document.querySelector('#panel-enr-production .back-btn');
  if (backBtn) { backBtn.textContent = '\u2190 Production EnR'; backBtn.onclick = function(){ openEnrProduction(); }; }
  document.getElementById('panel-enr-production').scrollTop = 0;
}

function closeEnrProduction(){
  var panel = document.getElementById('panel-enr-production');
  panel.style.transform = 'translateX(100%)';
  setTimeout(function(){ panel.style.display = ''; }, 450);
  document.body.style.overflow = '';
  /* Reset subtitle */
  var subtitleEl = panel.querySelector('.inner-subtitle');
  if (subtitleEl) subtitleEl.textContent = 'D\u00e9tail par site \xB7 Donn\u00e9es r\u00e9elles de production';
}
function openEnrProjets(){
  var p = document.getElementById('panel-enr-projets');
  p.style.display = '';
  p.style.transform = '';
  p.classList.add('active');
  p.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function closeEnrProjets(){
  document.getElementById('panel-enr-projets').classList.remove('active');
  document.body.style.overflow = '';
}

/* ── HFO Projets panel ── */
function openHfoProjets(){
  var hfp = (typeof HFO_PROJECTS !== 'undefined') ? HFO_PROJECTS : null;
  if (!hfp) return;
  var catLabels = {overhaul:'Overhaul',remise:'Remise en service',maintenance:'Maintenance',scada:'SCADA',installation:'Installation',autre:'Autre'};
  var statusLabels = {urgent:'Urgent',en_cours:'En cours',termine:'Terminé',indefini:'Indéfini'};
  var statusColors = {urgent:'#f37056',en_cours:'#FDB823',termine:'#00ab63',indefini:'rgba(138,146,171,0.5)'};

  /* Total CAPEX */
  var capex = (typeof capexData !== 'undefined' && capexData.hfo) ? capexData.hfo : null;
  var totalCapex = '—';
  if (capex && capex.projects) {
    var sum = 0;
    capex.projects.forEach(function(cp) {
      var m = (cp.etatTotal || '').replace(/[^0-9.,]/g, '').replace(',', '.');
      sum += parseFloat(m) || 0;
    });
    totalCapex = sum >= 1 ? sum.toFixed(1) + ' M$' : Math.round(sum * 1000) + ' k$';
  }

  var html = '';

  /* KPIs — 4 colonnes */
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:32px;">';
  var kpis = [
    ['Total projets', hfp.total, '', 'rgba(255,255,255,0.9)'],
    ['Overhauls', hfp.overhauls, 'moteurs', 'rgba(255,255,255,0.9)'],
    ['En cours', hfp.enCours, '', '#FDB823'],
    ['Total CAPEX', totalCapex, '', 'rgba(100,136,255,0.9)']
  ];
  kpis.forEach(function(k) {
    html += '<div style="background:rgba(138,146,171,0.06);border:1px solid rgba(138,146,171,0.12);border-radius:16px;padding:20px 14px;text-align:center;">'
      + '<div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(138,146,171,0.5);margin-bottom:8px;">' + k[0] + '</div>'
      + '<div style="font-size:32px;font-weight:800;color:' + k[3] + ';line-height:1;">' + k[1] + '</div>'
      + (k[2] ? '<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:4px;">' + k[2] + '</div>' : '')
      + '</div>';
  });
  html += '</div>';

  /* Cartes cliquables — 8 cartes */
  var allCards = [
    {key:'OVERHAUL', label:'Overhauls', total:hfp.overhauls, oh:null, enCours: hfp.projects.filter(function(p){return p.categorie==='overhaul' && p.status==='en_cours';}).length, isCategory:true},
    {key:'TAMATAVE', label:'Tamatave'},
    {key:'MAJUNGA', label:'Majunga'},
    {key:'DIEGO', label:'Diego'},
    {key:'TULEAR', label:'Tuléar'},
    {key:'ANTSIRABE', label:'Antsirabe'},
    {key:'VESTOP', label:'Vestop'},
    {key:'AUTRE', label:'Autre'}
  ];
  allCards.forEach(function(c) {
    if (!c.isCategory) {
      var bs = hfp.bySite[c.key] || {total:0, overhaul:0, enCours:0};
      c.total = bs.total; c.oh = bs.overhaul; c.enCours = bs.enCours;
    }
  });

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:16px;" id="hfp-cards-grid">';
  allCards.forEach(function(c) {
    var borderCol = 'rgba(138,146,171,0.15)';
    html += '<div class="hfp-card" data-key="' + c.key + '" onclick="filterHfpByCard(\'' + c.key + '\',\'' + (c.isCategory ? 'cat' : 'site') + '\')" style="background:rgba(138,146,171,0.05);border:1px solid ' + borderCol + ';border-radius:14px;padding:14px 10px;text-align:center;cursor:pointer;transition:all 0.2s;" '
      + 'onmouseenter="this.style.borderColor=\'rgba(138,146,171,0.5)\';this.style.background=\'rgba(138,146,171,0.1)\'" '
      + 'onmouseleave="if(!this.classList.contains(\'hfp-active\')){this.style.borderColor=\'' + borderCol + '\';this.style.background=\'rgba(138,146,171,0.05)\';}">'
      + '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:6px;">' + c.label + '</div>'
      + '<div style="font-size:26px;font-weight:800;color:rgba(255,255,255,0.9);line-height:1;">' + c.total + '</div>'
      + '<div style="font-size:8px;color:rgba(255,255,255,0.3);margin-top:4px;">'
      + (c.oh !== null ? c.oh + ' OH · ' : '') + c.enCours + ' en cours'
      + '</div></div>';
  });
  html += '</div>';

  /* Container pour la liste filtrée */
  html += '<div id="hfp-filtered-list"></div>';

  document.getElementById('hfo-proj-detail-content').innerHTML = html;
  var panel = document.getElementById('panel-hfo-projets');
  panel.style.display = '';
  panel.style.transform = 'translateX(0)';
  panel.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

/* Filtre la liste par carte cliquée */
function filterHfpByCard(key, type) {
  var hfp = HFO_PROJECTS;
  var catLabels = {overhaul:'Overhaul',remise:'Remise en service',maintenance:'Maintenance',scada:'SCADA',installation:'Installation',autre:'Autre'};
  var statusLabels = {urgent:'Urgent',en_cours:'En cours',termine:'Terminé',indefini:'Indéfini'};
  var statusColors = {urgent:'#f37056',en_cours:'#FDB823',termine:'#00ab63',indefini:'rgba(138,146,171,0.5)'};

  /* Highlight carte active */
  document.querySelectorAll('.hfp-card').forEach(function(c) {
    c.classList.remove('hfp-active');
    c.style.borderColor = 'rgba(138,146,171,0.15)';
    c.style.background = 'rgba(138,146,171,0.05)';
  });
  var activeCard = document.querySelector('.hfp-card[data-key="' + key + '"]');
  if (activeCard) {
    activeCard.classList.add('hfp-active');
    activeCard.style.borderColor = '#00ab63';
    activeCard.style.background = 'rgba(0,171,99,0.08)';
  }

  /* Filtrer les projets */
  var filtered;
  var title;
  if (type === 'cat') {
    filtered = hfp.projects.filter(function(p) { return p.categorie === 'overhaul'; });
    title = 'Overhauls — ' + filtered.length + ' projets';
  } else {
    filtered = hfp.projects.filter(function(p) { return p.site === key; });
    title = key.charAt(0) + key.slice(1).toLowerCase() + ' — ' + filtered.length + ' projets';
  }

  var html = '<div style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(0,171,99,0.6);margin:20px 0 12px;border-bottom:1px solid rgba(0,171,99,0.15);padding-bottom:8px;">'
    + title + '</div>';

  filtered.forEach(function(p) {
    var sCol = statusColors[p.status] || 'rgba(138,146,171,0.5)';
    var sLabel = statusLabels[p.status] || p.status;
    var cLabel = catLabels[p.categorie] || p.categorie;

    html += '<div style="background:rgba(138,146,171,0.04);border:1px solid rgba(138,146,171,0.1);border-radius:12px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;">';
    html += '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.projet + '</div>'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:3px;">'
      + cLabel + (p.moteur ? ' · ' + p.moteur : '') + (p.resp ? ' · ' + p.resp : '')
      + '</div></div>';
    html += '<div style="text-align:right;flex:0 0 auto;">'
      + '<div style="font-size:9px;font-weight:700;color:' + sCol + ';letter-spacing:0.1em;text-transform:uppercase;">' + sLabel + '</div>';
    if (p.dayToGo !== null && p.dayToGo > 0) {
      html += '<div style="font-size:14px;font-weight:800;color:rgba(255,255,255,0.7);margin-top:2px;">' + p.dayToGo + ' <span style="font-size:9px;font-weight:400;color:rgba(255,255,255,0.3);">jours</span></div>';
    }
    if (p.dlRevu) {
      html += '<div style="font-size:8px;color:rgba(255,255,255,0.25);margin-top:2px;">DL: ' + p.dlRevu.split('-')[2] + '/' + p.dlRevu.split('-')[1] + '/' + p.dlRevu.split('-')[0] + '</div>';
    }
    html += '</div></div>';
  });

  document.getElementById('hfp-filtered-list').innerHTML = html;
  /* Scroll to list */
  document.getElementById('hfp-filtered-list').scrollIntoView({behavior:'smooth', block:'start'});
}

function closeHfoProjets(){
  var panel = document.getElementById('panel-hfo-projets');
  panel.style.transform = 'translateX(100%)';
  setTimeout(function(){ panel.style.display = ''; }, 450);
  document.body.style.overflow = '';
}

/* ── ENR Projects Data & Panel ── */
(function(){

  /* ═══════════════════════════════════════════
     REAL DATA — Master Plan + Cost Control
     Source: 060326_Liste Dates Projets vs Budgets - Mch 26.xlsx
             060326_Cost Control - Mch 26.xlsx
     ═══════════════════════════════════════════ */

  const enrProjects = [
    { id:'moramanga-1', name:'Moramanga Phase 1', loc:'Moramanga', type:'solar', pvMw:15, bessMwh:null,
      capexM:11.124, tri:11.4, engPct:100, constStart:'2025-06-06', constEnd:'2026-05-15',
      engStart:'2023-11-21', engEnd:'2025-07-25', tendStart:null, tendEnd:null, tendDone:true,
      costDev:281720, costPv:10841987, comment:null, chef:null,
      qtr:[{q:'Q3-25',a:281720},{q:'Q1-26',a:7589391},{q:'Q2-26',a:3252596}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'nosy-be-1', name:'Nosy-Be Phase 1', loc:'Nosy-Be', type:'solar', pvMw:3, bessMwh:null,
      capexM:2.784, tri:4.19, engPct:100, constStart:'2024-10-10', constEnd:'2026-02-07',
      engStart:'2024-01-09', engEnd:'2025-09-30', tendStart:null, tendEnd:null, tendDone:true,
      costDev:83854, costPv:2700000, comment:null, chef:'Lindon',
      qtr:[{q:'Q3-25',a:1163854},{q:'Q4-25',a:810000},{q:'Q1-26',a:810000}],
      cc:{bac:3005209, forecast:2514494, ac:2067946, avReel:100, spi:1.0, cpi:1.45, perf:'En retard, sous budget',
          debPlan:'2024-10-10', debReel:'2024-10-10', codPlan:'2025-08-23', codReel:'2026-02-07', ecartJours:168} },
    { id:'bongatsara-1', name:'Bongatsara Phase 1', loc:'Bongatsara', type:'solar', pvMw:5, bessMwh:1.5,
      capexM:4.735, tri:11, engPct:80, constStart:'2025-12-22', constEnd:'2026-12-30',
      engStart:'2025-04-15', engEnd:'2026-03-15', tendStart:'2025-12-22', tendEnd:'2026-03-22', tendDone:false,
      costDev:80000, costPv:4655000, comment:null, chef:'Henintsoa',
      qtr:[{q:'Q4-25',a:80000},{q:'Q1-26',a:1862000},{q:'Q2-26',a:1862000},{q:'Q3-26',a:931000}],
      cc:{bac:5316367, forecast:4735000, ac:25733, avReel:26, spi:0.58, cpi:53.7, perf:'En retard mais sous budget'} },
    { id:'diego-wind-1', name:'Diego Wind Phase 1', loc:'Diego', type:'wind', pvMw:0.12, bessMwh:null,
      capexM:1.074, tri:12.9, engPct:90, constStart:'2025-02-23', constEnd:'2026-06-25',
      engStart:'2024-11-15', engEnd:'2026-03-30', tendStart:null, tendEnd:null, tendDone:true,
      costDev:90000, costPv:984167, comment:null, chef:'Toki',
      qtr:[{q:'Q3-25',a:680500},{q:'Q4-25',a:196833},{q:'Q1-26',a:196833}],
      cc:{bac:938041, forecast:1074167, ac:446723, avReel:57, spi:0.57, cpi:1.20, perf:'En retard mais sous budget'} },
    { id:'tamatave', name:'Lidera Tamatave', loc:'Tamatave', type:'solar', pvMw:20, bessMwh:9,
      capexM:17.196, tri:9, engPct:50, constStart:'2026-07-30', constEnd:'2027-03-24',
      engStart:'2024-01-03', engEnd:'2026-06-30', tendStart:'2026-05-30', tendEnd:'2026-07-15', tendDone:false,
      costDev:234000, costPv:16961645, comment:'Ph2 - Terrain dispo que pour 16MW + Litige terrain', chef:'Aymar',
      qtr:[{q:'Q3-25',a:117000},{q:'Q1-26',a:117000},{q:'Q2-26',a:6784658},{q:'Q3-26',a:3392329},{q:'Q4-26',a:3392329},{q:'Q1-27',a:3392329}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'diego-lidera', name:'Lidera Diego', loc:'Diego', type:'solar', pvMw:10, bessMwh:5,
      capexM:7.809, tri:4.2, engPct:75, constStart:'2026-06-15', constEnd:'2027-01-16',
      engStart:'2024-01-03', engEnd:'2026-03-15', tendStart:'2026-03-25', tendEnd:'2026-05-10', tendDone:false,
      costDev:179000, costPv:7630000, comment:null, chef:'Aymar',
      qtr:[{q:'Q3-25',a:89500},{q:'Q1-26',a:89500},{q:'Q2-26',a:3815000},{q:'Q3-26',a:2289000},{q:'Q4-26',a:1526000}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'mahajanga', name:'Lidera Mahajanga', loc:'Mahajanga', type:'solar', pvMw:12, bessMwh:5,
      capexM:10.636, tri:8.6, engPct:90, constStart:'2026-06-15', constEnd:'2027-03-21',
      engStart:'2024-01-03', engEnd:'2026-03-15', tendStart:'2026-04-01', tendEnd:'2026-05-10', tendDone:false,
      costDev:211000, costPv:10424691, comment:null, chef:'Aymar',
      qtr:[{q:'Q3-25',a:105500},{q:'Q1-26',a:105500},{q:'Q2-26',a:5212346},{q:'Q3-26',a:3127407},{q:'Q1-27',a:2084938}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'oursun-1', name:'Oursun ZFI Phase 1', loc:'ZFI Antsirabe', type:'solar', pvMw:3.2, bessMwh:1,
      capexM:5.961, tri:11.8, engPct:85, constStart:'2026-05-30', constEnd:'2027-01-30',
      engStart:'2021-01-10', engEnd:'2026-03-20', tendStart:'2026-04-01', tendEnd:'2026-05-15', tendDone:false,
      costDev:79000, costPv:5882194, comment:null, chef:'Henintsoa',
      qtr:[{q:'Q4-25',a:79000},{q:'Q1-26',a:2352878},{q:'Q2-26',a:1176439},{q:'Q3-26',a:1176439},{q:'Q4-26',a:1176439}],
      cc:{bac:5782787, forecast:5961194, ac:0, avReel:10, spi:0.48, cpi:null, perf:'En retard mais sous budget'} },
    { id:'moramanga-2', name:'Moramanga Phase 2', loc:'Moramanga', type:'solar', pvMw:25, bessMwh:null,
      capexM:22.891, tri:11, engPct:35, constStart:'2026-06-30', constEnd:'2027-05-30',
      engStart:'2025-11-02', engEnd:'2026-06-15', tendStart:'2026-04-15', tendEnd:'2026-06-15', tendDone:false,
      costDev:300000, costPv:22590550, comment:null, chef:null,
      qtr:[{q:'Q1-26',a:150000},{q:'Q2-26',a:11445275},{q:'Q3-26',a:6777165},{q:'Q1-27',a:4518110}],
      cc:{bac:10036607, forecast:7802433, ac:3001045, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'fihaonana-1', name:'Vestop Fihaonana Phase 1', loc:'Fihaonana', type:'solar', pvMw:4, bessMwh:null,
      capexM:3.634, tri:11.9, engPct:50, constStart:'2026-05-04', constEnd:'2026-12-15',
      engStart:'2025-03-18', engEnd:'2026-03-30', tendStart:'2026-04-05', tendEnd:'2026-04-30', tendDone:false,
      costDev:200000, costPv:3433950, comment:null, chef:'Toki',
      qtr:[{q:'Q3-25',a:200000},{q:'Q2-26',a:1716975},{q:'Q3-26',a:1030185},{q:'Q4-26',a:686790}],
      cc:{bac:4333731, forecast:3633950, ac:3484, avReel:24, spi:0.59, cpi:298.5, perf:'En retard mais sous budget'} },
    { id:'nosy-be-2', name:'Nosy-Be Phase 2', loc:'Nosy-Be', type:'solar', pvMw:2, bessMwh:5,
      capexM:3.765, tri:4.2, engPct:90, constStart:'2026-06-02', constEnd:'2026-11-30',
      engStart:'2024-07-15', engEnd:'2026-03-20', tendStart:'2026-04-15', tendEnd:'2026-05-30', tendDone:false,
      costDev:34153, costPv:3730560, comment:null, chef:null,
      qtr:[{q:'Q4-25',a:34153},{q:'Q1-26',a:1119168},{q:'Q2-26',a:1119168},{q:'Q3-26',a:1119168},{q:'Q4-26',a:373056}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'tulear-3', name:'Tuléar Phase 3', loc:'Tuléar', type:'solar', pvMw:3.1, bessMwh:2.5,
      capexM:3.611, tri:11, engPct:100, constStart:'2026-04-28', constEnd:'2027-01-23',
      engStart:'2024-01-09', engEnd:'2025-11-30', tendStart:'2025-12-05', tendEnd:null, tendDone:false,
      costDev:103000, costPv:3508250, comment:null, chef:'Toki',
      qtr:[{q:'Q4-25',a:61800},{q:'Q1-26',a:41200},{q:'Q2-26',a:1754125},{q:'Q4-26',a:1754125}],
      cc:{bac:1458564, forecast:1219368, ac:1193232, avReel:95, spi:0.95, cpi:1.16, perf:'En retard mais sous budget'} },
    { id:'oursun-2', name:'Oursun ZFI Phase 2', loc:'ZFI Antsirabe', type:'solar', pvMw:7.8, bessMwh:2,
      capexM:7.865, tri:12, engPct:85, constStart:'2027-01-25', constEnd:'2027-11-20',
      engStart:'2021-01-10', engEnd:'2026-09-30', tendStart:'2026-10-01', tendEnd:'2026-12-15', tendDone:false,
      costDev:60000, costPv:7804580, comment:null, chef:null,
      qtr:[{q:'Q1-26',a:42000},{q:'Q2-26',a:18000},{q:'Q3-26',a:2341374},{q:'Q1-27',a:2341374},{q:'Q3-27',a:2341374},{q:'Q4-27',a:780458}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'bongatsara-2', name:'Bongatsara Phase 2', loc:'Ambohimalaza', type:'solar', pvMw:5, bessMwh:1.5,
      capexM:4.775, tri:6.7, engPct:null, constStart:'2026-10-10', constEnd:'2027-08-12',
      engStart:'2026-02-15', engEnd:'2026-08-15', tendStart:'2026-08-15', tendEnd:'2026-10-05', tendDone:false,
      costDev:120000, costPv:4655000, comment:'Terrain en litige + 30% coûts sup. GC v/s Phase 1', chef:null,
      qtr:[{q:'Q1-26',a:120000},{q:'Q2-26',a:2327500},{q:'Q4-26',a:1396500},{q:'Q2-27',a:931000}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'diego-wind-2', name:'Diego Wind Phase 2', loc:'Diego', type:'wind', pvMw:4.88, bessMwh:null,
      capexM:7.141, tri:12.9, engPct:null, constStart:'2026-10-20', constEnd:'2027-09-15',
      engStart:'2026-02-01', engEnd:'2026-09-30', tendStart:'2026-08-30', tendEnd:'2026-09-30', tendDone:false,
      costDev:250000, costPv:6890560, comment:null, chef:null,
      qtr:[{q:'Q1-26',a:125000},{q:'Q2-26',a:125000},{q:'Q3-26',a:2756224},{q:'Q1-27',a:2756224},{q:'Q3-27',a:1378112}],
      cc:{bac:24500, forecast:24500, ac:0, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'fihaonana-2', name:'Vestop Fihaonana Phase 2', loc:'Fihaonana', type:'solar', pvMw:15, bessMwh:7.5,
      capexM:15.539, tri:11.9, engPct:null, constStart:'2026-10-15', constEnd:'2027-06-15',
      engStart:'2026-03-01', engEnd:'2026-06-15', tendStart:'2026-07-15', tendEnd:'2026-08-15', tendDone:false,
      costDev:230000, costPv:15308654, comment:null, chef:null,
      qtr:[{q:'Q1-26',a:138000},{q:'Q2-26',a:7746327},{q:'Q4-26',a:4592596},{q:'Q1-27',a:3061731}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'marais-masay', name:'Floating Solar Marais Masay', loc:'Tana', type:'floating', pvMw:10, bessMwh:2.5,
      capexM:12.985, tri:null, engPct:null, constStart:'2026-11-04', constEnd:'2027-11-10',
      engStart:'2026-02-02', engEnd:'2026-07-30', tendStart:'2026-08-10', tendEnd:'2026-10-25', tendDone:false,
      costDev:190000, costPv:12795253, comment:null, chef:null,
      qtr:[{q:'Q1-26',a:57000},{q:'Q2-26',a:76000},{q:'Q3-26',a:57000},{q:'Q1-27',a:6397627},{q:'Q3-27',a:3838576},{q:'Q4-27',a:2559051}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'small-sites', name:'Small Sites', loc:'Ihosy, Sakaraha, Maintirano, Ranohira', type:'solar', pvMw:2.18, bessMwh:null,
      capexM:2.3, tri:3, engPct:null, constStart:'2026-12-05', constEnd:'2027-07-20',
      engStart:'2026-03-22', engEnd:'2026-08-15', tendStart:'2026-10-10', tendEnd:'2026-11-20', tendDone:false,
      costDev:300000, costPv:2000000, comment:'Terrains indisponibles - Discussions JIRAMA', chef:null,
      qtr:[{q:'Q1-26',a:150000},{q:'Q2-26',a:150000},{q:'Q3-26',a:600000},{q:'Q1-27',a:600000},{q:'Q2-27',a:600000},{q:'Q3-27',a:200000}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'ambohidratrimo', name:'Ambohidratrimo', loc:'Ambohijanaka', type:'solar', pvMw:10, bessMwh:2.5,
      capexM:10.415, tri:11, engPct:null, constStart:'2026-10-01', constEnd:'2027-10-07',
      engStart:'2026-03-10', engEnd:'2026-08-30', tendStart:'2026-09-05', tendEnd:'2026-09-30', tendDone:false,
      costDev:210000, costPv:10205140, comment:"En cours d'analyse terrain", chef:null,
      qtr:[{q:'Q1-26',a:126000},{q:'Q2-26',a:84000},{q:'Q4-26',a:5102570},{q:'Q2-27',a:5102570}],
      cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null} },
    { id:'tulear-2', name:'Tuléar Phase 2', loc:'Tuléar', type:'solar', pvMw:3.9, bessMwh:null,
      capexM:1.356, tri:null, engPct:100, constStart:'2024-10-21', constEnd:'2025-07-23',
      engStart:'2024-01-09', engEnd:'2025-08-15', tendStart:null, tendEnd:null, tendDone:false,
      costDev:18250, costPv:1337451, comment:null, chef:'Toki',
      qtr:[{q:'Q3-25',a:1088211},{q:'Q4-25',a:267490}],
      cc:{bac:1458564, forecast:1219368, ac:1193232, avReel:95, spi:0.95, cpi:1.16, perf:'En retard mais sous budget'} },
  ];

  /* ═══ ENRICHMENT — DASHBOARD_ENR 03/03/26 + STATUS ETUDE_ENR 09/03/26 ═══ */
  const enrEnrich = {
    'tulear-2':      { constProg:0.98, glissement:61,  puissance:1000,  prodJour:5389,  lead:'Toki',      epciste:'MADAGREEN', pvMw:1,
      stages:[
        {name:'Engineering',tasks:[{name:'Études préliminaires',pct:100,status:'done'},{name:'Design détaillé',pct:100,status:'done'}]},
        {name:'Construction',tasks:[{name:'Procurement',pct:100,status:'done'},{name:'Travaux site',pct:100,status:'done'},{name:'Commissioning',pct:90,status:'delayed',delayWeeks:9}]}
      ],
      delays:{'Commissioning':{weeks:9,cause:'Ajustements techniques lors de la mise en service — recalibrage onduleurs',resolution:'Quasi finalisé — 98% avancement, COD prévu sous 2 semaines'}}
    },
    'nosy-be-1':     { constProg:0.97, glissement:168, puissance:3000,  prodJour:13890, lead:'Lindon',    epciste:'SQVISION',
      stages:[
        {name:'Études & Faisabilité',tasks:[{name:'Étude de faisabilité',pct:100,status:'done'},{name:'Acquisition foncière',pct:100,status:'done'},{name:'Permis environnemental',pct:100,status:'done'}]},
        {name:'Engineering',tasks:[{name:'Design détaillé',pct:100,status:'done'},{name:'Validation technique',pct:100,status:'done'}]},
        {name:'Construction',tasks:[{name:'Procurement',pct:100,status:'done'},{name:'Livraison modules',pct:100,status:'delayed',delayWeeks:12},{name:'Montage & câblage',pct:100,status:'done'},{name:'Commissioning',pct:100,status:'delayed',delayWeeks:12}]}
      ],
      delays:{
        'Livraison modules':{weeks:12,cause:'Retard fournisseur SQVISION — congestion portuaire Tamatave + dédouanement lent',resolution:'Livraison effectuée avec 3 mois de retard, rattrapage partiel en accélérant le montage'},
        'Commissioning':{weeks:12,cause:'Report en cascade suite retard livraison modules',resolution:'COD atteint le 07/02/2026 (+168j vs plan initial)'}
      }
    },
    'diego-wind-1':  { constProg:0.63, glissement:208, puissance:120,   prodJour:666,   lead:'Toki',      epciste:'AELOS/OTI',
      stages:[
        {name:'Études & Faisabilité',tasks:[{name:'Étude de vent',pct:100,status:'done'},{name:'Acquisition foncière',pct:100,status:'done'}]},
        {name:'Engineering',tasks:[{name:'Design aérogénérateur',pct:90,status:'progress'},{name:'Études géotechniques',pct:100,status:'done'}]},
        {name:'Construction',tasks:[{name:'Fondations & génie civil',pct:100,status:'done'},{name:'Travaux site',pct:63,status:'delayed',delayWeeks:30},{name:'Installation éoliennes',pct:40,status:'delayed',delayWeeks:20},{name:'Commissioning',pct:0,status:'pending'}]}
      ],
      delays:{
        'Travaux site':{weeks:30,cause:'Conditions météo défavorables (saison cyclonique) + accès site difficile en période de pluie',resolution:'En cours — mobilisation équipes supplémentaires, planning révisé'},
        'Installation éoliennes':{weeks:20,cause:'Retard livraison nacelles AELOS + attente conditions vent favorables pour levage',resolution:'En cours — créneau levage planifié avril 2026'}
      }
    },
    'moramanga-1':   { constProg:0.67, glissement:135, puissance:15400, prodJour:80882, lead:'Lindon',    epciste:'BLUESKY',
      stages:[
        {name:'Études & Faisabilité',tasks:[{name:'Étude de faisabilité',pct:100,status:'done'},{name:'Permis environnemental',pct:100,status:'done'}]},
        {name:'Engineering',tasks:[{name:'Design détaillé',pct:100,status:'done'},{name:'Validation réseau JIRAMA',pct:100,status:'done'}]},
        {name:'Tendering',tasks:[{name:'Appel d\'offres EPC',pct:100,status:'done'},{name:'Attribution BLUESKY',pct:100,status:'done'}]},
        {name:'Construction',tasks:[{name:'Procurement',pct:100,status:'done'},{name:'Travaux site',pct:67,status:'delayed',delayWeeks:19},{name:'Montage panneaux',pct:55,status:'delayed',delayWeeks:15},{name:'Commissioning',pct:0,status:'pending'}]}
      ],
      delays:{
        'Travaux site':{weeks:19,cause:'Retard dédouanement équipements + problèmes logistiques route Moramanga',resolution:'En cours — suivi renforcé avec transitaire, convoi exceptionnel prévu'},
        'Montage panneaux':{weeks:15,cause:'Report en cascade suite retard livraison — main d\'œuvre en attente',resolution:'Montage accéléré dès réception, 2 équipes mobilisées'}
      }
    },
    'bongatsara-1':  { constProg:0.24, glissement:0,   puissance:5000,  prodJour:24836, lead:'Lindon',    epciste:'TBC' },
    'fihaonana-1':   { constProg:0,    glissement:0,   puissance:4000,  prodJour:20570, lead:'Toki',      epciste:'TBC' },
    'oursun-1':      { constProg:0,    glissement:0,   puissance:3200,  prodJour:12099, lead:'Henintsoa', epciste:'TBC' },
    'nosy-be-2':     { constProg:0,    glissement:0,   puissance:2000,  prodJour:9260,  lead:'Lindon',    epciste:'TBC' },
    'tulear-3':      { constProg:0,    glissement:0,   lead:'Toki',      epciste:'TBC' },
    'small-sites':   { constProg:0,    glissement:0,   lead:'Aymar',     epciste:'TBC' },
    'oursun-2':      { constProg:0,    glissement:0,   puissance:7800,  prodJour:29490, lead:'Henintsoa', epciste:'TBC' },
    'mahajanga':     { constProg:0,    glissement:0,   puissance:10750, prodJour:51247, lead:'Aymar',     epciste:'TBC', pvMw:10.75 },
    'diego-lidera':  { constProg:0,    glissement:0,   puissance:7600,  prodJour:35730, lead:'Aymar',     epciste:'TBC', pvMw:7.6 },
    'tamatave':      { constProg:0,    glissement:0,   puissance:16000, prodJour:70619, lead:'Aymar',     epciste:'TBC', pvMw:16 },
    'moramanga-2':   { constProg:0,    glissement:0,   lead:'Lindon',    epciste:'TBC' },
    'bongatsara-2':  { constProg:0,    glissement:0,   lead:'Lindon',    epciste:'TBC' },
    'diego-wind-2':  { constProg:0,    glissement:0,   lead:'Toki',      epciste:'TBC' },
    'fihaonana-2':   { constProg:0,    glissement:0,   lead:'Toki',      epciste:'TBC' },
    'ambohidratrimo':{ constProg:0,    glissement:0,   lead:'Toki',      epciste:'TBC' },
    'marais-masay':  { constProg:0,    glissement:0,   lead:'Aymar',     epciste:'TBC' },
  };
  enrProjects.forEach(p => { const e = enrEnrich[p.id]; if (e) Object.assign(p, e); });

  /* New project — Lidera Phase3 Toamasina (from DATABASE sheet) */
  enrProjects.push({
    id:'lidera-toamasina-3', name:'Lidera Toamasina Phase 3', loc:'Tamatave', type:'solar', pvMw:2, bessMwh:null,
    capexM:2.060, tri:null, engPct:0, constStart:'2026-09-24', constEnd:'2027-09-24',
    engStart:'2026-03-23', engEnd:'2026-09-24', tendStart:null, tendEnd:null, tendDone:false,
    costDev:60000, costPv:2000000, comment:null, chef:'Aymar',
    qtr:[], cc:{bac:null, forecast:null, ac:null, avReel:null, spi:null, cpi:null, perf:null},
    constProg:0, glissement:0, lead:'Aymar', epciste:'TBC'
  });

  /* ── Phase logic ── */
  const today = new Date();
  function getPhase(p) {
    const cs = new Date(p.constStart), ce = new Date(p.constEnd);
    /* Si avReel existe dans le Cost Control, on l'utilise en priorité */
    const avReel = p.cc && p.cc.avReel !== null ? p.cc.avReel : null;
    if (avReel !== null) {
      /* Terminé seulement si avancement réel = 100% */
      if (avReel === 100) return 'termine';
      /* En construction si le chantier a commencé */
      if (cs <= today) return 'construction';
    } else {
      /* Sans CC : on se base sur les dates + engPct */
      if (ce < today && p.engPct === 100) return 'termine';
      if (cs <= today) return 'construction';
    }
    if (p.engPct !== null && p.engPct > 0) return 'developpement';
    return 'planifie';
  }

  /* ── Helpers ── */
  function fmtM(v) { return v >= 1 ? v.toFixed(1) + 'M$' : Math.round(v * 1000).toLocaleString('fr-FR') + 'k$'; }
  function fmtK(v) { if (!v) return '—'; return v >= 1e6 ? (v/1e6).toFixed(2)+'M$' : Math.round(v/1000)+'k$'; }
  function fmtDate(d) { if(!d) return '—'; const dt=new Date(d); return dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'2-digit'}); }
  function fmtPct(v) { return v !== null && v !== undefined ? Math.round(v*100)/100 : '—'; }
  function typeIcon(t) { return t==='wind'?'💨':t==='floating'?'🌊':'☀️'; }

  const phaseLabels = { termine:'Terminé', construction:'En construction', developpement:'Développement', planifie:'Planifié' };
  const phaseColors = { termine:'#00ab63', construction:'#FDB823', developpement:'#5aafaf', planifie:'rgba(255,255,255,0.35)' };
  const phaseBgs    = { termine:'0,171,99', construction:'253,184,35', developpement:'90,175,175', planifie:'255,255,255' };

  /* ── Project card HTML ── */
  function projCardHtml(p) {
    const phase = getPhase(p);
    const color = phaseColors[phase];
    const rgb = phaseBgs[phase];
    const engPct = p.engPct !== null ? p.engPct : 0;
    const hasCc = p.cc && p.cc.avReel !== null;
    const avReel = hasCc ? (typeof p.cc.avReel === 'number' ? p.cc.avReel : null) : null;
    const perfLabel = p.cc && p.cc.perf ? p.cc.perf : null;
    const perfColor = perfLabel && perfLabel.includes('temps') ? '#00ab63' : perfLabel ? '#f37056' : 'rgba(255,255,255,0.3)';

    return `<div class="enrp-proj-card" style="border-color:rgba(${rgb},0.18);cursor:pointer;" onclick="openProjectDetail('${p.id}')">
      <div class="enrp-proj-name">
        <span style="font-size:14px;">${typeIcon(p.type)}</span>
        <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.88);flex:1;">${p.name}</span>
        <span style="font-size:9px;font-weight:700;color:${color};background:rgba(${rgb},0.12);border-radius:6px;padding:3px 8px;">${phaseLabels[phase]}</span>
        ${p.glissement > 0 ? '<span style="font-size:9px;font-weight:700;color:#ff5050;background:rgba(255,80,80,0.12);border-radius:6px;padding:3px 8px;">\u26A0 '+p.glissement+'j retard</span>' : ''}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="font-size:10px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.05);border-radius:5px;padding:2px 8px;">${p.pvMw} MWc${p.bessMwh ? ' + '+p.bessMwh+' MWh' : ''}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);border-radius:5px;padding:2px 8px;">📍 ${p.loc}</span>
        ${p.lead ? '<span style="font-size:10px;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);border-radius:5px;padding:2px 8px;">\uD83D\uDC64 '+p.lead+'</span>' : ''}
        ${p.epciste && p.epciste !== 'TBC' ? '<span style="font-size:10px;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);border-radius:5px;padding:2px 8px;">\uD83C\uDFD7 '+p.epciste+'</span>' : ''}
      </div>
      <div class="enrp-kpi-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="enrp-kpi">
          <div class="enrp-kpi-label">CAPEX Total</div>
          <div class="enrp-kpi-reel" style="color:${color};font-size:16px;">${fmtM(p.capexM)}</div>
          <div class="enrp-kpi-sub">Dév. ${fmtK(p.costDev)} · PV ${fmtK(p.costPv)}</div>
        </div>
        <div class="enrp-kpi">
          <div class="enrp-kpi-label">Engineering</div>
          <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin:6px 0 4px;">
            <div style="height:100%;width:${engPct}%;background:${color};border-radius:3px;transition:width .6s;"></div>
          </div>
          <div style="font-size:16px;font-weight:800;color:${color};">${p.engPct !== null ? engPct+'%' : '—'}</div>
          <div class="enrp-kpi-sub">${fmtDate(p.engStart)} → ${fmtDate(p.engEnd)}</div>
        </div>
        <div class="enrp-kpi">
          <div class="enrp-kpi-label">TRI</div>
          <div class="enrp-kpi-reel" style="color:${p.tri && p.tri >= 10 ? '#00ab63' : p.tri ? '#f37056' : 'rgba(255,255,255,0.3)'};font-size:16px;">${p.tri ? p.tri+'%' : '—'}</div>
          <div class="enrp-kpi-sub">${p.tri && p.tri >= 10 ? 'Rentable' : p.tri ? 'Faible' : 'À déterminer'}</div>
        </div>
        <div class="enrp-kpi">
          <div class="enrp-kpi-label">Construction</div>
          ${p.constProg > 0 ? '<div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin:6px 0 4px;"><div style="height:100%;width:'+Math.round(p.constProg*100)+'%;background:'+(p.glissement>0?'#ff5050':color)+';border-radius:3px;"></div></div><div style="font-size:16px;font-weight:800;color:'+(p.glissement>0?'#ff5050':color)+';">'+Math.round(p.constProg*100)+'%</div>' : ''}
          <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.8;">
            <div>Début: <span style="color:${color};">${fmtDate(p.constStart)}</span></div>
            <div>COD: <span style="color:${p.glissement > 0 ? '#ff5050' : color};">${fmtDate(p.constEnd)}</span></div>
          </div>
          ${p.glissement > 0 ? '<div style="font-size:9px;color:#ff5050;margin-top:4px;font-weight:600;">\u26A0 '+p.glissement+'j de retard</div>' : ''}
        </div>
        <div class="enrp-kpi">
          <div class="enrp-kpi-label">Avancement réel</div>
          ${avReel !== null ? `
            <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin:6px 0 4px;">
              <div style="height:100%;width:${avReel}%;background:${color};border-radius:3px;"></div>
            </div>
            <div style="font-size:16px;font-weight:800;color:${color};">${avReel}%</div>
          ` : `<div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:6px;">—</div>`}
          <div class="enrp-kpi-sub">${p.cc && p.cc.spi !== null ? 'SPI: '+fmtPct(p.cc.spi) : 'Détails à venir'}</div>
        </div>
        <div class="enrp-kpi">
          <div class="enrp-kpi-label">Performance</div>
          <div style="font-size:10px;font-weight:600;color:${perfColor};margin-top:6px;line-height:1.4;">
            ${perfLabel || '—'}
          </div>
          ${p.cc && p.cc.cpi !== null && p.cc.cpi < 50 ? `<div class="enrp-kpi-sub">CPI: ${fmtPct(p.cc.cpi)}</div>` : ''}
        </div>
      </div>
      ${p.comment ? `<div style="margin-top:8px;padding:6px 10px;background:rgba(243,112,86,0.06);border:1px solid rgba(243,112,86,0.15);border-radius:8px;font-size:9px;color:rgba(255,180,130,0.7);">⚠ ${p.comment}</div>` : ''}
    </div>`;
  }

  /* ── Classify ── */
  const grouped = { termine:[], construction:[], developpement:[], planifie:[] };
  enrProjects.forEach(p => { grouped[getPhase(p)].push(p); });

  // Totals
  const totalMw = enrProjects.reduce((s,p) => s + (p.pvMw||0), 0);
  const totalCapex = enrProjects.reduce((s,p) => s + (p.capexM||0), 0);
  const totalBess = enrProjects.reduce((s,p) => s + (p.bessMwh||0), 0);

  document.getElementById('enrp-term-count').textContent  = grouped.termine.length;
  document.getElementById('enrp-const-count').textContent  = grouped.construction.length;
  document.getElementById('enrp-dev-count').textContent    = grouped.developpement.length;
  document.getElementById('enrp-plan-count').textContent   = grouped.planifie.length;

  /* ── Phase filter state ── */
  let activePhaseFilter = null; // null = show all

  const filterBtnStyles = {
    termine:      { bg:'rgba(0,171,99,', border:'rgba(0,171,99,' },
    construction: { bg:'rgba(253,184,35,',  border:'rgba(253,184,35,' },
    developpement:{ bg:'rgba(90,175,175,', border:'rgba(90,175,175,' },
    planifie:     { bg:'rgba(255,255,255,', border:'rgba(255,255,255,' }
  };
  const filterIds = {
    termine:'enrp-filter-termine', construction:'enrp-filter-construction',
    developpement:'enrp-filter-developpement', planifie:'enrp-filter-planifie'
  };

  function updateFilterButtons() {
    Object.keys(filterIds).forEach(phase => {
      const btn = document.getElementById(filterIds[phase]);
      if (!btn) return;
      const s = filterBtnStyles[phase];
      const isActive = activePhaseFilter === phase;
      const isNone = activePhaseFilter === null;
      if (isActive) {
        btn.style.background = s.bg + '0.2)';
        btn.style.borderColor = s.border + '0.6)';
        btn.style.transform = 'scale(1.03)';
        btn.style.boxShadow = '0 0 16px ' + s.bg + '0.2)';
        btn.style.opacity = '1';
      } else if (isNone) {
        btn.style.background = phase === 'planifie' ? 'rgba(255,255,255,0.03)' : s.bg + '0.06)';
        btn.style.borderColor = phase === 'planifie' ? 'rgba(255,255,255,0.08)' : s.border + '0.15)';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
        btn.style.opacity = '1';
      } else {
        btn.style.background = phase === 'planifie' ? 'rgba(255,255,255,0.02)' : s.bg + '0.03)';
        btn.style.borderColor = phase === 'planifie' ? 'rgba(255,255,255,0.05)' : s.border + '0.08)';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
        btn.style.opacity = '0.4';
      }
    });
  }

  function renderEnrProjects() {
    // Determine which phases to show
    const showPhases = activePhaseFilter ? [activePhaseFilter] : ['termine','construction','developpement','planifie'];

    // Filtered projects for summary bar
    const filtered = activePhaseFilter ? grouped[activePhaseFilter] : enrProjects;
    const fMw = filtered.reduce((s,p) => s + (p.pvMw||0), 0);
    const fCapex = filtered.reduce((s,p) => s + (p.capexM||0), 0);
    const fBess = filtered.reduce((s,p) => s + (p.bessMwh||0), 0);

    // Glissement alert + summary KPIs
    const projsWithDelay = filtered.filter(p => p.glissement && p.glissement > 0);
    const avgDelay = projsWithDelay.length > 0 ? Math.round(projsWithDelay.reduce((s,p) => s + p.glissement, 0) / projsWithDelay.length) : 0;
    const maxDelay = projsWithDelay.length > 0 ? Math.max(...projsWithDelay.map(p => p.glissement)) : 0;
    const fProd = filtered.reduce((s,p) => s + (p.prodJour||0), 0);

    let html = '';
    if (projsWithDelay.length > 0) {
      html += '<div style="background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.25);border-radius:14px;padding:16px 24px;margin-bottom:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'
        + '<div style="font-size:24px;">\u26A0\uFE0F</div>'
        + '<div style="flex:1;min-width:200px;">'
        + '<div style="font-size:11px;font-weight:700;color:#ff5050;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">Alerte Glissement</div>'
        + '<div style="font-size:10px;color:rgba(255,255,255,0.5);">' + projsWithDelay.length + ' projet' + (projsWithDelay.length>1?'s':'') + ' en retard \xB7 Retard moyen: ' + avgDelay + ' jours \xB7 Max: ' + maxDelay + ' jours</div>'
        + '</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
        + projsWithDelay.map(p => '<span style="font-size:9px;color:#ff5050;background:rgba(255,80,80,0.12);border-radius:6px;padding:3px 8px;white-space:nowrap;">'+p.name+' '+p.glissement+'j</span>').join('')
        + '</div></div>';
    }

    html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Total Projets</div>
        <div style="font-size:28px;font-weight:800;color:#00ab63;">${filtered.length}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Capacité totale</div>
        <div style="font-size:28px;font-weight:800;color:#00ab63;">${fMw.toFixed(1)}<span style="font-size:12px;font-weight:400;color:rgba(0,171,99,0.6);margin-left:4px;">MWc</span></div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">CAPEX Total</div>
        <div style="font-size:28px;font-weight:800;color:#FDB823;">${fCapex.toFixed(1)}<span style="font-size:12px;font-weight:400;color:rgba(253,184,35,0.6);margin-left:4px;">M$</span></div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Production est.</div>
        <div style="font-size:28px;font-weight:800;color:#5aafaf;">${fProd > 0 ? Math.round(fProd/1000) : '\u2014'}<span style="font-size:12px;font-weight:400;color:rgba(90,175,175,0.6);margin-left:4px;">MWh/j</span></div>
      </div>
    </div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Stockage BESS</div>
        <div style="font-size:28px;font-weight:800;color:#5aafaf;">${fBess}<span style="font-size:12px;font-weight:400;color:rgba(90,175,175,0.6);margin-left:4px;">MWh</span></div>
      </div>
      <div style="background:rgba(253,184,35,0.03);border:1px solid rgba(253,184,35,0.12);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(253,184,35,0.5);margin-bottom:4px;">En Construction</div>
        <div style="font-size:28px;font-weight:800;color:#FDB823;">${grouped.construction.length}</div>
      </div>
      <div style="background:rgba(90,175,175,0.03);border:1px solid rgba(90,175,175,0.12);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(90,175,175,0.5);margin-bottom:4px;">En D\xe9veloppement</div>
        <div style="font-size:28px;font-weight:800;color:#5aafaf;">${grouped.developpement.length}</div>
      </div>
      <div style="background:rgba(${projsWithDelay.length>0?'255,80,80':'255,255,255'},0.03);border:1px solid rgba(${projsWithDelay.length>0?'255,80,80':'255,255,255'},0.12);border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${projsWithDelay.length>0?'rgba(255,80,80,0.7)':'rgba(255,255,255,0.3)'};margin-bottom:4px;">Glissement moy.</div>
        <div style="font-size:28px;font-weight:800;color:${projsWithDelay.length>0?'#ff5050':'rgba(255,255,255,0.4)'};">${avgDelay>0?avgDelay:'\u2014'}<span style="font-size:12px;font-weight:400;color:${projsWithDelay.length>0?'rgba(255,80,80,0.6)':'rgba(255,255,255,0.3)'};margin-left:4px;">jours</span></div>
      </div>
    </div>`;

    // Render each visible group
    showPhases.forEach(phase => {
      const list = grouped[phase];
      if (!list.length) return;
      const color = phaseColors[phase];
      const rgb = phaseBgs[phase];
      html += `<div style="margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:0 4px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:${color};">${phaseLabels[phase]}</div>
          <span style="font-size:11px;font-weight:800;color:${color};background:rgba(${rgb},0.12);border-radius:6px;padding:2px 10px;">${list.length}</span>
          <div style="height:1px;flex:1;background:rgba(${rgb},0.15);"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          ${list.map(p => projCardHtml(p)).join('')}
        </div>
      </div>`;
    });

    document.getElementById('enrp-pairs-list').innerHTML = html;
  }

  /* ── Toggle filter (global function for onclick) ── */
  window.toggleEnrFilter = function(phase) {
    if (activePhaseFilter === phase) {
      activePhaseFilter = null; // re-click = cancel filter
    } else {
      activePhaseFilter = phase;
    }
    updateFilterButtons();
    renderEnrProjects();
  };

  /* ── Initial render ── */
  updateFilterButtons();
  renderEnrProjects();

  /* ── Update summary card on EnR main page ── */
  const el = (id) => document.getElementById(id);
  if (el('enr-card-total')) el('enr-card-total').textContent = enrProjects.length;
  if (el('enr-card-mw'))    el('enr-card-mw').textContent    = 'projets \xB7 ' + totalMw.toFixed(1) + ' MWc \xB7 ' + totalCapex.toFixed(1) + ' M$';
  if (el('enr-card-terme')) el('enr-card-terme').textContent = grouped.termine.length;
  if (el('enr-card-const')) el('enr-card-const').textContent = grouped.construction.length;
  if (el('enr-card-dev'))   el('enr-card-dev').textContent   = grouped.developpement.length;
  if (el('enr-card-plan'))  el('enr-card-plan').textContent  = grouped.planifie.length;

  /* ── Energy page · EnR Projets card ── */
  if (el('e-enr-proj-total')) el('e-enr-proj-total').textContent = enrProjects.length;
  if (el('e-enr-proj-mw'))    el('e-enr-proj-mw').textContent    = totalMw.toFixed(1);
  if (el('e-enr-proj-terme')) el('e-enr-proj-terme').textContent = grouped.termine.length;
  if (el('e-enr-proj-const')) el('e-enr-proj-const').textContent = grouped.construction.length;
  if (el('e-enr-proj-dev'))   el('e-enr-proj-dev').textContent   = grouped.developpement.length;
  if (el('e-enr-proj-plan'))  el('e-enr-proj-plan').textContent  = grouped.planifie.length;
  if (el('e-enr-proj-capex')) el('e-enr-proj-capex').textContent = totalCapex.toFixed(1);

  /* ── Production EnR — données réelles depuis enr_site_data.js ── */
  var enrSites = (typeof ENR_SITES !== 'undefined') ? ENR_SITES : [];
  var totalEnrAvgKwh = 0, totalEnrProdKwh = 0, totalEnrCapMw = 0;
  enrSites.forEach(function(s) { totalEnrAvgKwh += s.avgDailyKwh; totalEnrProdKwh += s.totalProdKwh; totalEnrCapMw += s.capacityMw; });
  var enrMwhJ = totalEnrAvgKwh / 1000;

  if (el('enr-prod-total'))  el('enr-prod-total').textContent  = enrMwhJ.toFixed(1);
  if (el('enr-prod-cap'))    el('enr-prod-cap').textContent    = totalEnrCapMw.toFixed(1);
  if (el('enr-prod-cumul'))  el('enr-prod-cumul').textContent  = Math.round(totalEnrProdKwh / 1000);

  /* Per-site mini cards (inner-enr page) */
  var siteColors = ['#00ab63','#5aafaf','#4a8fe7'];
  var sitesEl = el('enr-prod-sites');
  if (sitesEl && enrSites.length) {
    var sh = '';
    enrSites.forEach(function(s, i) {
      var col = siteColors[i % siteColors.length];
      sh += '<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:10px 8px;text-align:center;">'
        + '<div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.25);margin-bottom:4px;">\u2600\uFE0F ' + s.name + '</div>'
        + '<div style="font-size:16px;font-weight:800;color:' + col + ';">' + (s.avgDailyKwh/1000).toFixed(1) + '</div>'
        + '<div style="font-size:8px;color:rgba(255,255,255,0.2);">MWh/j \xB7 ' + s.capacityMw + ' MWc</div>'
        + '</div>';
    });
    sitesEl.innerHTML = sh;
  }

  /* ── Energy page EnR card — production KPIs ── */
  var totalEnrCapKwc = totalEnrCapMw * 1000;
  var ratioKwhKwc = totalEnrCapKwc > 0 ? (totalEnrAvgKwh / totalEnrCapKwc).toFixed(2) : '\u2014';
  if (el('e-enr-mwhj'))        el('e-enr-mwhj').textContent = enrMwhJ.toFixed(1);
  if (el('e-enr-cap'))          el('e-enr-cap').textContent = totalEnrCapMw.toFixed(1);
  if (el('e-enr-ratio'))        el('e-enr-ratio').textContent = ratioKwhKwc;
  if (el('e-enr-cumul'))        el('e-enr-cumul').textContent = Math.round(totalEnrProdKwh / 1000).toLocaleString();
  if (el('e-enr-sites-count'))  el('e-enr-sites-count').textContent = enrSites.length;

  /* Per-site row on Energy card */
  var sitesRowEl = el('e-enr-sites-row');
  if (sitesRowEl && enrSites.length) {
    var rh = '';
    enrSites.forEach(function(s, i) {
      var col = siteColors[i % siteColors.length];
      var pct = totalEnrAvgKwh > 0 ? Math.round(s.avgDailyKwh / totalEnrAvgKwh * 100) : 0;
      rh += '<div style="text-align:center;flex:1;">'
        + '<div class="e-big" style="color:' + col + ';"><span>' + (s.avgDailyKwh/1000).toFixed(1) + '</span> <span class="e-big-unit" style="color:rgba(255,255,255,0.3);">MWh/j</span></div>'
        + '<div class="e-sub">\u2600\uFE0F ' + s.name + ' \xB7 ' + pct + '%</div>'
        + '</div>';
      if (i < enrSites.length - 1) rh += '<div style="width:1px;height:35px;background:rgba(0,171,99,0.15);"></div>';
    });
    sitesRowEl.innerHTML = rh;
  }

  /* Mix EnR calculé après chargement site_data.js (voir updateEnrMix) */
  window._enrMwhJ = enrMwhJ;
  window._enrSites = enrSites;

  /* ── Expose to global scope for project detail panel ── */
  window._enrProjects = enrProjects;
  window._getPhase = getPhase;
  window._phaseLabels = phaseLabels;
  window._phaseColors = phaseColors;
  window._phaseBgs = phaseBgs;
  window.fmtM = fmtM;
  window.fmtK = fmtK;
  window.fmtDate = fmtDate;
  window.fmtPct = fmtPct;
  window.typeIcon = typeIcon;

  /* ── HFO Projects card on Energy page ── */
  var hfp = (typeof HFO_PROJECTS !== 'undefined') ? HFO_PROJECTS : null;
  if (hfp) {
    if (el('e-hfo-proj-total'))   el('e-hfo-proj-total').textContent = hfp.total;
    if (el('e-hfo-proj-oh'))      el('e-hfo-proj-oh').textContent = hfp.overhauls;
    if (el('e-hfo-proj-urgent'))  el('e-hfo-proj-urgent').textContent = hfp.urgents;
    if (el('e-hfo-proj-encours')) el('e-hfo-proj-encours').textContent = hfp.enCours;
    var indef = hfp.total - hfp.urgents - hfp.enCours - hfp.termines;
    if (el('e-hfo-proj-indef'))   el('e-hfo-proj-indef').textContent = indef;

    var sRow = el('e-hfo-proj-sites-row');
    if (sRow) {
      var mainSites = ['TAMATAVE','MAJUNGA','DIEGO','TULEAR','ANTSIRABE'];
      var rh = '';
      mainSites.forEach(function(s, i) {
        var bs = hfp.bySite[s];
        if (!bs) return;
        rh += '<div style="text-align:center;flex:1;">'
          + '<div class="e-big">' + bs.total + '</div>'
          + '<div class="e-sub">' + s.charAt(0) + s.slice(1).toLowerCase() + '</div>'
          + '</div>';
        if (i < mainSites.length - 1) rh += '<div style="width:1px;height:25px;background:rgba(138,146,171,0.15);"></div>';
      });
      sRow.innerHTML = rh;
    }
  }

})();


/* ── Mix EnR/HFO (après chargement site_data.js) ── */
/* ── Mix EnR/HFO (après chargement site_data.js) ── */
(function() {
  var enrMwhJ = window._enrMwhJ || 0;
  var totalHfoKwh = 0;
  [TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE].forEach(function(site) {
    if (!site || !site.groupes) return;
    site.groupes.forEach(function(g) { totalHfoKwh += (g.energieProd || 0); });
  });
  var hfoMwhJ = totalHfoKwh / 1000;
  var mixPct = (hfoMwhJ + enrMwhJ) > 0 ? Math.round(enrMwhJ / (hfoMwhJ + enrMwhJ) * 100) : 0;
  var elMix = document.getElementById('enr-prod-mix');
  if (elMix) elMix.textContent = mixPct;
  var elMixCard = document.getElementById('e-enr-mix');
  if (elMixCard) elMixCard.textContent = mixPct + '%';
})();

function updateEnergyHfoCard() {
  const moisFR = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const filter = currentFilter || 'month';
  let filterLabel;
  if (filter === 'month') {
    filterLabel = MONTH_NAMES[selectedMonthIndex];
  } else if (filter === 'quarter') {
    filterLabel = 'Q' + selectedQuarter;
  } else {
    filterLabel = String(selectedYear);
  }

  // ── Agréger uniquement les sites actifs (pas construction/reconstruction) ──
  let totalMW = 0, totalContrat = 0, totalArret = 0, totalMoteurs = 0;
  let totalProd = 0, totalProdObj = 0;
  let arretMW = 0;
  let sfocWeighted = 0, slocWeighted = 0;

  siteOrder.forEach(id => {
    const s = siteData[id];
    if (!s || !s.groupes || !s.kpi) return;
    if (s.status === 'construction' || s.status === 'reconstruction') return;
    const k = _getKpiForSite(id);
    if (!k) return;

    totalMW      += s.mw || 0;
    totalContrat += s.contrat || 0;
    totalMoteurs += s.groupes.length;

    s.groupes.forEach(g => {
      if (g.statut !== 'ok') { totalArret++; arretMW += g.mw || 0; }
    });

    totalProd    += k.prod || 0;
    totalProdObj += k.prodObj || 0;
    if (k.sfoc && k.prod) sfocWeighted += k.sfoc * k.prod;
    if (k.sloc && k.prod) slocWeighted += k.sloc * k.prod;
  });

  // ── KPI 1 — Puissance dispo vs Contrat ──
  const pct = totalContrat > 0 ? ((totalMW / totalContrat) * 100) : 0;
  const pctOk = pct >= 100;
  const pctCol = pctOk ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)';
  const pctColDim = pctOk ? 'rgba(0,171,99,0.5)' : 'rgba(243,112,86,0.5)';
  const pctArrow = pctOk ? '↑ contrat' : '↓ contrat';

  const el = id => document.getElementById(id);
  el('e-hfo-mw-dispo').textContent    = totalMW.toFixed(1);
  el('e-hfo-mw-contrat').textContent  = totalContrat % 1 === 0 ? totalContrat.toFixed(0) : totalContrat.toFixed(1);
  el('e-hfo-pct-contrat').textContent = pct.toFixed(1) + '%';
  el('e-hfo-pct-contrat').style.color = pctCol;
  el('e-hfo-pct-arrow').textContent   = pctArrow;
  el('e-hfo-pct-arrow').style.color   = pctColDim;

  // ── KPI 2 — Moteurs à l'arrêt ──
  const arretCol = totalArret === 0 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)';
  const lostPerDay = Math.round(arretMW * 24); // MWh/j estimé
  const now = new Date();
  const dayOfMonth = now.getDate();
  const monthIdx = now.getMonth();
  const daysElapsed = filter === 'month' ? dayOfMonth : filter === 'quarter' ? dayOfMonth + ((selectedQuarter - 1) * 91) : dayOfMonth + monthIdx * 30;
  const lostToDate = lostPerDay * daysElapsed;

  el('e-hfo-arret-count').textContent = totalArret;
  el('e-hfo-arret-count').style.color = arretCol;
  el('e-hfo-arret-total').textContent = totalMoteurs;
  el('e-hfo-arret-mwh-date').textContent = totalArret > 0 ? '−' + lostToDate.toLocaleString() : '0';
  el('e-hfo-arret-period').textContent   = filter === 'year' ? selectedYear : filter === 'quarter' ? 'Q' + selectedQuarter : moisFR[monthIdx];

  // ── KPI 3 — Production vs Prévisionnelle ──
  const prodDelta = totalProdObj > 0 ? (((totalProd / totalProdObj) - 1) * 100) : null;
  const prodOk = prodDelta !== null && prodDelta >= 0;
  const prodCol = prodDelta === null ? 'rgba(255,255,255,0.3)' : prodOk ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)';
  const prodColDim = prodDelta === null ? 'rgba(255,255,255,0.2)' : prodOk ? 'rgba(0,171,99,0.5)' : 'rgba(243,112,86,0.5)';
  const prodSign = prodDelta !== null && prodDelta > 0 ? '+' : '';
  const prodArrow = prodDelta === null ? '—' : prodOk ? '↑ prévu' : '↓ prévu';

  el('e-hfo-prod-reel').textContent   = Math.round(totalProd).toLocaleString();
  el('e-hfo-prod-prev').textContent   = Math.round(totalProdObj).toLocaleString();
  el('e-hfo-prod-pct').textContent    = prodDelta !== null ? prodSign + prodDelta.toFixed(0) + '%' : '—';
  el('e-hfo-prod-pct').style.color    = prodCol;
  el('e-hfo-prod-arrow').textContent  = prodArrow;
  el('e-hfo-prod-arrow').style.color  = prodColDim;
  el('e-hfo-prod-filter').textContent = filterLabel;

  // ── KPI 4 — SFOC + SLOC pondérés par production ──
  const avgSfoc = totalProd > 0 ? (sfocWeighted / totalProd) : 0;
  const avgSloc = totalProd > 0 ? (slocWeighted / totalProd) : 0;
  el('e-hfo-sfoc-avg').textContent = avgSfoc > 0 ? avgSfoc.toFixed(1) : '—';
  el('e-hfo-sloc-avg').textContent = avgSloc > 0 ? avgSloc.toFixed(1) : '—';
}

function openDetail(id) {
  currentSite = id;
  const panel = document.getElementById('detail-panel');
  const s = siteData[id];
  // Toujours style HFO (fond vert foncé + cartes transparentes)
  panel.style.background = '';
  panel.style.display = '';
  panel.style.transform = '';
  panel.classList.add('hfo-style');
  panel.classList.add('active');
  document.body.style.overflow = 'hidden';
  scrollTop(panel);
  syncHfoFilterActive();
  renderDetail(id);
}
function closeDetail() {
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('active');
  panel.classList.remove('hfo-style');
  document.body.style.overflow = '';
  currentSite = null;
}

// ══ SITE DATA ══
var siteData = {
  tamatave: {
    name:'Tamatave', status:'ko', mw:0, contrat:24,
    groupes:[
      {id:'DG1',  model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:77394, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:160, consoHFO:0, consoLFO:0,
       oilTopUp:0, oilConso:0.0, oilSumpLevel:0.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG2',  model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:89308, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:15, oilConso:0.0, oilSumpLevel:14.3, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG3',  model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:90240, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:20, oilConso:4.0, oilSumpLevel:15.2, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG4',  model:'12V32 LN', mw:1.85, statut:'ko', condition:'Maintenance', jourArret:5,
       h:83734, hToday:0, hStandby:0, arretForce:0, arretPlanifie:24,
       maxLoad:0, energieProd:0, consLVMV:100, consoHFO:0, consoLFO:0,
       oilTopUp:0, oilConso:0.0, oilSumpLevel:12.1, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Maintenance préventive planifiée',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG5',  model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:0, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:0, oilConso:0.0, oilSumpLevel:0.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — diagnostic en cours',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG6',  model:'9L20',     mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:80837, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:25, oilConso:18.0, oilSumpLevel:14.1, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG7',  model:'18V32 STD',mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:90316, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:120, oilConso:120.0, oilSumpLevel:12.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG8',  model:'18V32 STD',mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:62295, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:0, oilConso:0.0, oilSumpLevel:12.7, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG9',  model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:52297, hToday:0, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:100, oilConso:86.2, oilSumpLevel:17.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — pièces commandées',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG10', model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:53727, hToday:0, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:95, oilConso:95.0, oilSumpLevel:16.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — pièces commandées',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG11', model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:30462, hToday:0, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:11404, consoHFO:0, consoLFO:0,
       oilTopUp:90, oilConso:85.4, oilSumpLevel:16.7, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — diagnostic en cours',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG12', model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:45461, hToday:0, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:95, oilConso:90.4, oilSumpLevel:12.7, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG13', model:'12V32 LN', mw:1.85, statut:'ko', condition:'Breakdown', jourArret:5,
       h:50147, hToday:0, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:75, oilConso:75.0, oilSumpLevel:15.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — en attente pièces',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    ],
    kpi: {
      '24h': {prod:0, prodObj:19.2, dispo:0, heures:0, sfoc:null, sloc:null},
      month: {prod:0, prodObj:430,  dispo:0, heures:0, sfoc:null, sloc:null},
      year:  {prod:0, prodObj:5160, dispo:0, heures:0, sfoc:null, sloc:null},
    },
    prev2025: {
      '24h': {prod:16.8, dispo:95.1, sfoc:202, sloc:0.84},
      month: {prod:398,  dispo:94.5, sfoc:203, sloc:0.85},
      year:  {prod:4620, dispo:94.1, sfoc:205, sloc:0.86},
    }
  },
  tulear: {
    name:'Tuléar', status:'warn', mw:15, contrat:15,
    groupes:[
      {id:'DG1', model:'12V32 LN', mw:3.75, statut:'ok', condition:'Running', jourArret:0,
       h:52840, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3200, energieProd:67840, consLVMV:2180, consoHFO:14820, consoLFO:0,
       oilTopUp:80, oilConso:78.4, oilSumpLevel:13.5, lubeOilPressure:4.3, fuelOilTemp:88,
       sfoc:218, sloc:1.08, maint:'Vidange huile — J+12',
       hourlyLoad:[2275,2548,2641,2822,2872,2882,2736,2774,2608,2746,2714,2851,2950,3040,3183,3202,2978,2943,2715,2751,2578,2490,2446,2478]},
      {id:'DG2', model:'12V32 LN', mw:3.75, statut:'ok', condition:'Running', jourArret:0,
       h:48620, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3100, energieProd:65200, consLVMV:2050, consoHFO:14310, consoLFO:0,
       oilTopUp:70, oilConso:71.0, oilSumpLevel:13.8, lubeOilPressure:4.4, fuelOilTemp:91,
       sfoc:219, sloc:1.09, maint:'Inspection — J+8',
       hourlyLoad:[2291,2406,2508,2714,2713,2900,2794,2633,2476,2658,2726,2863,2868,3007,2970,3122,2992,2789,2733,2641,2571,2442,2378,2289]},
      {id:'DG3', model:'12V32 LN', mw:3.75, statut:'ok', condition:'Running', jourArret:0,
       h:51230, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3050, energieProd:63900, consLVMV:1980, consoHFO:14050, consoLFO:0,
       oilTopUp:65, oilConso:67.5, oilSumpLevel:14.1, lubeOilPressure:4.2, fuelOilTemp:89,
       sfoc:220, sloc:1.10, maint:'À définir',
       hourlyLoad:[2259,2387,2529,2700,2695,2713,2690,2659,2470,2590,2579,2756,2830,2813,3024,3010,2811,2683,2640,2623,2574,2439,2417,2336]},
      {id:'DG4', model:'12V32 LN', mw:3.75, statut:'ok', condition:'Running', jourArret:0,
       h:44180, hToday:20, hStandby:4, arretForce:0, arretPlanifie:0,
       maxLoad:2900, energieProd:52640, consLVMV:1820, consoHFO:11560, consoLFO:0,
       oilTopUp:55, oilConso:58.2, oilSumpLevel:13.2, lubeOilPressure:4.1, fuelOilTemp:86,
       sfoc:219, sloc:1.07, maint:'À définir',
       hourlyLoad:[2144,2267,2323,2545,2607,2561,2584,2482,2352,2438,2439,2535,2705,2693,2730,2977,2783,2616,2451,2401,2420,2278,2229,2201]},
    ],
    kpi: {
      '24h': {prod:7.8,  prodObj:12.0, dispo:87.3, heures:8,    sfoc:217, sloc:1.08},
      month: {prod:187,  prodObj:280,  dispo:87.3, heures:629,  sfoc:218, sloc:1.09},
      year:  {prod:2240, prodObj:3360, dispo:86.5, heures:7560, sfoc:220, sloc:1.10},
    },
    prev2025: {
      '24h': {prod:11.8, dispo:96.5, sfoc:213, sloc:0.92},
      month: {prod:271,  dispo:95.8, sfoc:214, sloc:0.93},
      year:  {prod:3240, dispo:95.2, sfoc:215, sloc:0.93},
    }
  },
  diego: {
    name:'Diego', status:'warn', mw:9.6, contrat:12,
    groupes:[
      {id:'DG1',  model:'9L20', mw:1.2, statut:'ko', condition:'Breakdown', jourArret:3,
       h:38420, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:0, oilConso:0.0, oilSumpLevel:0.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — diagnostic en cours',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG2',  model:'9L20', mw:1.2, statut:'ko', condition:'Breakdown', jourArret:3,
       h:41280, hToday:0, hStandby:0, arretForce:24, arretPlanifie:0,
       maxLoad:0, energieProd:0, consLVMV:0, consoHFO:0, consoLFO:0,
       oilTopUp:0, oilConso:0.0, oilSumpLevel:0.0, lubeOilPressure:0, fuelOilTemp:0,
       sfoc:null, sloc:null, maint:'Breakdown — pièces commandées',
       hourlyLoad:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
      {id:'DG3',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:35680, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:980, energieProd:21120, consLVMV:680, consoHFO:4640, consoLFO:0,
       oilTopUp:12, oilConso:11.8, oilSumpLevel:11.4, lubeOilPressure:4.2, fuelOilTemp:87,
       sfoc:261, sloc:0.82, maint:'À définir',
       hourlyLoad:[711,761,790,830,863,883,879,835,797,846,838,863,876,951,932,971,939,868,836,843,787,804,776,737]},
      {id:'DG4',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:32140, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:1050, energieProd:22680, consLVMV:720, consoHFO:4980, consoLFO:0,
       oilTopUp:10, oilConso:10.5, oilSumpLevel:11.8, lubeOilPressure:4.3, fuelOilTemp:88,
       sfoc:261, sloc:0.82, maint:'Vidange — J+21',
       hourlyLoad:[754,834,862,904,928,979,902,869,846,882,925,919,990,995,1015,1054,981,955,910,861,876,821,836,810]},
      {id:'DG5',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:29850, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:1020, energieProd:21960, consLVMV:700, consoHFO:4820, consoLFO:0,
       oilTopUp:11, oilConso:11.2, oilSumpLevel:11.6, lubeOilPressure:4.2, fuelOilTemp:86,
       sfoc:262, sloc:0.82, maint:'À définir',
       hourlyLoad:[719,773,840,900,905,938,882,859,860,842,889,908,933,966,993,1023,947,910,887,834,839,800,774,790]},
      {id:'DG6',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:27620, hToday:22, hStandby:2, arretForce:0, arretPlanifie:0,
       maxLoad:1010, energieProd:20240, consLVMV:650, consoHFO:4440, consoLFO:0,
       oilTopUp:9, oilConso:9.8, oilSumpLevel:11.2, lubeOilPressure:4.1, fuelOilTemp:85,
       sfoc:261, sloc:0.82, maint:'À définir',
       hourlyLoad:[748,802,819,876,877,918,889,859,814,832,869,928,915,937,1003,1026,953,923,884,845,821,820,808,753]},
      {id:'DG7',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:33410, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:1030, energieProd:22200, consLVMV:710, consoHFO:4870, consoLFO:0,
       oilTopUp:13, oilConso:12.6, oilSumpLevel:12.0, lubeOilPressure:4.3, fuelOilTemp:88,
       sfoc:262, sloc:0.82, maint:'À définir',
       hourlyLoad:[722,806,868,897,899,950,932,861,847,872,884,948,923,977,1012,1009,990,912,870,877,828,810,779,778]},
      {id:'DG8',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:31050, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:1040, energieProd:22440, consLVMV:715, consoHFO:4920, consoLFO:0,
       oilTopUp:11, oilConso:11.5, oilSumpLevel:11.5, lubeOilPressure:4.2, fuelOilTemp:87,
       sfoc:261, sloc:0.82, maint:'À définir',
       hourlyLoad:[745,798,863,913,913,961,911,875,827,897,884,946,948,978,1016,1067,998,958,888,885,869,832,834,779]},
      {id:'DG9',  model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:28740, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:1000, energieProd:21600, consLVMV:690, consoHFO:4740, consoLFO:0,
       oilTopUp:10, oilConso:10.2, oilSumpLevel:11.3, lubeOilPressure:4.1, fuelOilTemp:86,
       sfoc:262, sloc:0.82, maint:'Inspection — J+15',
       hourlyLoad:[726,799,844,841,889,905,858,854,806,849,862,881,907,964,956,993,955,904,856,858,838,799,771,767]},
      {id:'DG10', model:'9L20', mw:1.2, statut:'ok', condition:'Running', jourArret:0,
       h:30180, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:1060, energieProd:22680, consLVMV:720, consoHFO:4980, consoLFO:0,
       oilTopUp:12, oilConso:12.1, oilSumpLevel:11.8, lubeOilPressure:4.3, fuelOilTemp:88,
       sfoc:261, sloc:0.82, maint:'À définir',
       hourlyLoad:[756,814,844,886,956,990,913,883,848,915,922,936,993,995,1005,1051,1012,959,896,885,888,832,836,805]},
    ],
    kpi: {
      '24h': {prod:7.6,  prodObj:9.2,  dispo:80.0, heures:7,    sfoc:261, sloc:0.82},
      month: {prod:182,  prodObj:220,  dispo:80.0, heures:562,  sfoc:262, sloc:0.82},
      year:  {prod:2112, prodObj:2640, dispo:80.0, heures:6720, sfoc:263, sloc:0.83},
    },
    prev2025: {
      '24h': {prod:9.0,  dispo:96.2, sfoc:204, sloc:0.83},
      month: {prod:218,  dispo:96.0, sfoc:205, sloc:0.84},
      year:  {prod:2580, dispo:95.5, sfoc:206, sloc:0.85},
    }
  },
  majunga: {
    name:'Majunga', status:'ok', mw:20, contrat:20,
    groupes:[
      {id:'MDG1', model:'12V32 LN', mw:4, statut:'ok', condition:'Running', jourArret:0,
       h:62504, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3780, energieProd:84120, consLVMV:2630, consoHFO:16240, consoLFO:0,
       oilTopUp:39, oilConso:37.8, oilSumpLevel:15.0, lubeOilPressure:4.5, fuelOilTemp:91,
       sfoc:193, sloc:0.79, maint:'RAS',
       hourlyLoad:[2750,2980,3100,3210,3280,3490,3270,3260,3110,3090,3190,3320,3580,3670,3760,3840,3580,3400,3300,3070,3160,3040,2990,2850]},
      {id:'MDG2', model:'12V32 LN', mw:4, statut:'ok', condition:'Running', jourArret:0,
       h:58340, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3800, energieProd:84480, consLVMV:2640, consoHFO:16310, consoLFO:0,
       oilTopUp:40, oilConso:38.6, oilSumpLevel:14.8, lubeOilPressure:4.5, fuelOilTemp:92,
       sfoc:193, sloc:0.79, maint:'RAS',
       hourlyLoad:[2738,3013,3131,3240,3296,3524,3306,3287,3132,3112,3214,3342,3598,3696,3787,3870,3602,3421,3324,3097,3185,3065,3003,2873]},
      {id:'MDG3', model:'12V32 LN', mw:4, statut:'ok', condition:'Running', jourArret:0,
       h:55820, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3900, energieProd:86640, consLVMV:2710, consoHFO:16720, consoLFO:0,
       oilTopUp:38, oilConso:37.2, oilSumpLevel:15.1, lubeOilPressure:4.5, fuelOilTemp:91,
       sfoc:193, sloc:0.79, maint:'RAS',
       hourlyLoad:[2740,3020,3135,3270,3490,3581,3379,3411,3176,3293,3417,3520,3522,3736,3672,3937,3581,3541,3311,3351,3143,3128,3075,2982]},
      {id:'MDG4', model:'12V32 LN', mw:4, statut:'ok', condition:'Running', jourArret:0,
       h:60140, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3750, energieProd:83400, consLVMV:2605, consoHFO:16090, consoLFO:0,
       oilTopUp:42, oilConso:40.1, oilSumpLevel:14.5, lubeOilPressure:4.4, fuelOilTemp:90,
       sfoc:193, sloc:0.79, maint:'Vidange — J+18',
       hourlyLoad:[2760,2907,3007,3131,3392,3380,3234,3246,3019,3191,3308,3437,3484,3491,3595,3814,3461,3332,3339,3085,3056,3032,2865,2827]},
      {id:'MDG5', model:'12V32 LN', mw:4, statut:'ok', condition:'Running', jourArret:0,
       h:57210, hToday:24, hStandby:0, arretForce:0, arretPlanifie:0,
       maxLoad:3850, energieProd:85560, consLVMV:2674, consoHFO:16500, consoLFO:0,
       oilTopUp:36, oilConso:35.8, oilSumpLevel:14.9, lubeOilPressure:4.5, fuelOilTemp:92,
       sfoc:193, sloc:0.79, maint:'RAS',
       hourlyLoad:[2849,2956,3203,3326,3380,3586,3358,3365,3140,3211,3380,3483,3514,3629,3671,3863,3684,3525,3311,3271,3104,3166,3011,2899]},
    ],
    kpi: {
      '24h': {prod:17.2, prodObj:16.0, dispo:98.4, heures:17,   sfoc:193, sloc:0.79},
      month: {prod:395,  prodObj:370,  dispo:98.4, heures:715,  sfoc:193, sloc:0.79},
      year:  {prod:4620, prodObj:4440, dispo:98.1, heures:8556, sfoc:193, sloc:0.79},
    },
    prev2025: {
      '24h': {prod:14.2, dispo:94.8, sfoc:200, sloc:0.87},
      month: {prod:342,  dispo:94.5, sfoc:201, sloc:0.88},
      year:  {prod:4010, dispo:94.0, sfoc:202, sloc:0.88},
    }
  },
  antsirabe: {
    name: 'Antsirabe', status: 'reconstruction', mw: 0, contrat: 0,
    notice: '🔧 Site en réparation suite à un incendie',
    groupes: [], kpi: {}, prev2025: {}, blackouts: [], dailyTrend: [], latestDate: ''
  },
  fihaonana: {
    name: 'Fihaonana', status: 'construction', mw: 0, contrat: 0,
    notice: '🏗️ Nouvelle centrale en construction',
    groupes: [], kpi: {}, prev2025: {}, blackouts: [], dailyTrend: [], latestDate: ''
  },
};
var siteOrder = ['tamatave','tulear','diego','majunga','antsirabe','fihaonana'];

// ══ LIVE DATA LOADER ══
function mergeLiveData(target, source) {
  target.name = source.name;
  target.status = source.status;
  target.mw = source.mw;
  target.contrat = source.contrat;
  target.groupes = source.groupes;
  target.kpi = source.kpi;
  if (source.prev2025) target.prev2025 = source.prev2025;
  target.blackouts = source.blackouts || [];
  target.dailyTrend = source.dailyTrend || [];
  target.latestDate = source.latestDate || '';
  if (source.latestMonth) target.latestMonth = source.latestMonth;
}
if (typeof TAMATAVE_LIVE !== 'undefined') mergeLiveData(siteData.tamatave, TAMATAVE_LIVE);
if (typeof DIEGO_LIVE !== 'undefined') mergeLiveData(siteData.diego, DIEGO_LIVE);
if (typeof MAJUNGA_LIVE !== 'undefined') mergeLiveData(siteData.majunga, MAJUNGA_LIVE);
if (typeof TULEAR_LIVE !== 'undefined') mergeLiveData(siteData.tulear, TULEAR_LIVE);

// ══ HELPERS ══
// ══ HELPERS ══
function delta(a,b){const d=a-b,p=((d/Math.abs(b))*100).toFixed(1),s=d>0?'+':'',c=d>0?'delta-up':d<0?'delta-down':'delta-flat';return `<span class="kpi-delta ${c}">${s}${p}%</span>`;}
function deltaInvRaw(a,b,u){const d=parseFloat((a-b).toFixed(1)),s=d>0?'+':'',c=d>0?'delta-inv-up':d<0?'delta-inv-down':'delta-inv-flat';return `<span class="${c}">${s}${d} ${u}</span>`;}
function sfocClass(v){return v<=205?'inv-good':v<=215?'inv-warn':'inv-bad';}
function sfocPct(v){return Math.min(100,Math.max(0,((v-180)/50)*100));}
function slocClass(v){return v<=0.75?'inv-good':v<=0.90?'inv-warn':'inv-bad';}
function slocPct(v){return Math.min(100,Math.max(0,((v-0.4)/0.8)*100));}

// ══ MONTH PICKER HELPERS ══
// ══ MONTH PICKER HELPERS ══
function getDataMonth() {
  // Get the latest data month (1-based) from any active site
  for (const id of siteOrder) {
    const s = siteData[id];
    if (s && s.latestMonth) return s.latestMonth;
  }
  return new Date().getMonth() + 1;
}

function getMonthKpiKey() {
  const dm = getDataMonth(); // 1-based
  return (selectedMonthIndex + 1) === dm ? 'month' : 'month_' + (selectedMonthIndex + 1);
}

function isCurrentMonth(monthIdx) {
  return (monthIdx + 1) === getDataMonth();
}




// Compute how many consecutive days a generator has been stopped (0 hours)
function getDaysStopped(g) {
  if (g.statut === 'ok') return 0;
  const dataMonth = getDataMonth() - 1;
  const maxDay = getMaxDayForMonth(dataMonth);
  const dh = g.dailyHours || [];
  // Count consecutive 0-hour days from latest data day backwards
  let count = 0;
  for (let i = maxDay - 1; i >= 0; i--) {
    if ((dh[i] || 0) === 0) count++; else break;
  }
  // If ALL days in current month are 0, extend to previous months
  if (count === maxDay) {
    const mh = g.monthlyHours || [];
    for (let m = dataMonth - 1; m >= 0; m--) {
      if ((mh[m] || 0) === 0) count += getDaysInMonth(m); else break;
    }
  }
  return count;
}


function closeAllMonthDropdowns() {
  _clearDropdownTimer();
  document.querySelectorAll('.month-dropdown.open').forEach(dd => {
    dd.classList.remove('open');
    dd.onmouseenter = null;
    dd.onmouseleave = null;
  });
}

let _monthDropdownTimer = null;
let _monthDropdownHovered = false;

function _startDropdownAutoClose(dd) {
  _clearDropdownTimer();
  _monthDropdownHovered = false;
  dd.onmouseenter = function() { _monthDropdownHovered = true; _clearDropdownTimer(); };
  dd.onmouseleave = function() { _monthDropdownHovered = false; _startDropdownAutoClose(dd); };
  _monthDropdownTimer = setTimeout(function() {
    if (!_monthDropdownHovered) closeAllMonthDropdowns();
  }, 2000);
}

function _clearDropdownTimer() {
  if (_monthDropdownTimer) { clearTimeout(_monthDropdownTimer); _monthDropdownTimer = null; }
}

function toggleMonthDropdown(event, btn) {
  event.stopPropagation();
  closeAllQuarterDropdowns();
  closeAllYearDropdowns();
  const wrap = btn.closest('.month-btn-wrap');
  const dd = wrap ? wrap.querySelector('.month-dropdown') : null;
  // First click: activate month filter + open dropdown 2s
  if (currentFilter !== 'month') {
    closeAllMonthDropdowns();
    const isGd = btn.classList.contains('gd-tfilter');
    if (isGd) { setGdFilter('month', btn); } else { setFilter('month', btn); }
    if (dd) { dd.classList.add('open'); _startDropdownAutoClose(dd); }
    return;
  }
  // Already on month filter: toggle dropdown
  if (!dd) return;
  const wasOpen = dd.classList.contains('open');
  closeAllMonthDropdowns();
  if (!wasOpen) {
    dd.classList.add('open');
    _startDropdownAutoClose(dd);
  }
}

// ══ QUARTER DROPDOWN ══
function closeAllQuarterDropdowns() {
  document.querySelectorAll('.quarter-dropdown.open').forEach(dd => { dd.classList.remove('open'); dd.onmouseenter = null; dd.onmouseleave = null; });
}

function toggleQuarterDropdown(event, btn) {
  event.stopPropagation();
  closeAllMonthDropdowns();
  closeAllYearDropdowns();
  const wrap = btn.closest('.quarter-btn-wrap');
  const dd = wrap ? wrap.querySelector('.quarter-dropdown') : null;
  if (currentFilter !== 'quarter') {
    closeAllQuarterDropdowns();
    const isGd = btn.classList.contains('gd-tfilter');
    const curQ = Math.floor(new Date().getMonth() / 3) + 1;
    if (isGd) { setGdFilterQuarter(curQ, btn); } else { setFilterQuarter(curQ, btn); }
    populateQuarterDropdowns();
    if (dd) { dd.classList.add('open'); _startDropdownAutoClose(dd); }
    return;
  }
  if (!dd) return;
  const wasOpen = dd.classList.contains('open');
  closeAllQuarterDropdowns();
  if (!wasOpen) { populateQuarterDropdowns(); dd.classList.add('open'); _startDropdownAutoClose(dd); }
}

function populateQuarterDropdowns() {
  const maxMonth = getDataMonth();
  const maxQ = Math.ceil(maxMonth / 3);
  document.querySelectorAll('.quarter-dropdown:not(.enr-quarter-dropdown)').forEach(dd => {
    dd.innerHTML = '';
    for (let q = 1; q <= maxQ; q++) {
      const item = document.createElement('div');
      item.className = 'md-item' + (currentFilter === 'quarter' && q === selectedQuarter ? ' md-active' : '');
      item.textContent = 'Q' + q;
      item.onclick = (function(qi) { return function(e) { selectQuarter(qi, e); }; })(q);
      dd.appendChild(item);
    }
  });
}

function selectQuarter(q, event) {
  if (event) event.stopPropagation();
  closeAllQuarterDropdowns();
  setFilterQuarter(q);
}

// ══ YEAR DROPDOWN ══
function closeAllYearDropdowns() {
  document.querySelectorAll('.year-dropdown.open').forEach(dd => { dd.classList.remove('open'); dd.onmouseenter = null; dd.onmouseleave = null; });
}

function toggleYearDropdown(event, btn) {
  event.stopPropagation();
  closeAllMonthDropdowns();
  closeAllQuarterDropdowns();
  const wrap = btn.closest('.year-btn-wrap');
  const dd = wrap ? wrap.querySelector('.year-dropdown') : null;
  if (currentFilter !== 'year') {
    closeAllYearDropdowns();
    const isGd = btn.classList.contains('gd-tfilter');
    const curY = new Date().getFullYear();
    if (isGd) { setGdFilterYear(curY, btn); } else { setFilterYear(curY, btn); }
    populateYearDropdowns();
    if (dd) { dd.classList.add('open'); _startDropdownAutoClose(dd); }
    return;
  }
  if (!dd) return;
  const wasOpen = dd.classList.contains('open');
  closeAllYearDropdowns();
  if (!wasOpen) { populateYearDropdowns(); dd.classList.add('open'); _startDropdownAutoClose(dd); }
}

function populateYearDropdowns() {
  document.querySelectorAll('.year-dropdown:not(.enr-year-dropdown)').forEach(dd => {
    dd.innerHTML = '';
    [2025, 2026].forEach(y => {
      const item = document.createElement('div');
      item.className = 'md-item' + (currentFilter === 'year' && y === selectedYear ? ' md-active' : '');
      item.textContent = String(y);
      item.onclick = (function(yi) { return function(e) { selectYear(yi, e); }; })(y);
      dd.appendChild(item);
    });
  });
}

function selectYear(year, event) {
  if (event) event.stopPropagation();
  closeAllYearDropdowns();
  setFilterYear(year);
}

// Close dropdowns on click outside or scroll
document.addEventListener('click', function(e) {
  if (!e.target.closest('.month-btn-wrap')) closeAllMonthDropdowns();
  if (!e.target.closest('.quarter-btn-wrap')) closeAllQuarterDropdowns();
  if (!e.target.closest('.year-btn-wrap')) closeAllYearDropdowns();
});
document.addEventListener('scroll', function() { closeAllMonthDropdowns(); closeAllQuarterDropdowns(); closeAllYearDropdowns(); }, true);

function getDaysInMonth(monthIdx, year) {
  // monthIdx is 0-based
  return new Date(year || new Date().getFullYear(), monthIdx + 1, 0).getDate();
}

function getMaxDayForMonth(monthIdx) {
  const dataMonth = getDataMonth() - 1;
  if (monthIdx === dataMonth) {
    let maxDay = 1;
    siteOrder.forEach(id => {
      const s = siteData[id];
      if (s && s.latestDate && s.status !== 'construction' && s.status !== 'reconstruction') {
        const day = parseInt(s.latestDate.split('-')[2]);
        if (day > maxDay) maxDay = day;
      }
    });
    return maxDay;
  }
  return getDaysInMonth(monthIdx);
}

function populateMonthDropdowns() {
  const maxMonth = getDataMonth(); // 1-based, e.g. 3 for March
  document.querySelectorAll('.month-dropdown').forEach(dd => {
    dd.innerHTML = '';
    for (let m = 0; m < maxMonth; m++) {
      const item = document.createElement('div');
      item.className = 'md-item' + (m === selectedMonthIndex ? ' md-active' : '');
      item.textContent = MONTH_NAMES[m];
      item.dataset.month = m;
      item.onclick = function(e) { selectMonth(m, e); };
      dd.appendChild(item);
    }
  });
}

function selectMonth(monthIdx, event) {
  if (event) event.stopPropagation();
  closeAllMonthDropdowns();
  selectedMonthIndex = monthIdx;
  currentFilter = 'month';

  // Update all month button labels
  document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(btn => {
    btn.textContent = MONTH_SHORT[monthIdx];
  });
  // Reset Q and A
  document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q'; });
  document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'A'; });

  // Sync active state
  syncHfoFilterActive();

  // Update dropdown active states
  document.querySelectorAll('.month-dropdown .md-item').forEach(item => {
    item.classList.toggle('md-active', parseInt(item.dataset.month) === monthIdx);
  });

  // Update filter label
  const lbl = document.getElementById('filter-label-text');
  if (lbl) lbl.textContent = MONTH_NAMES[monthIdx];

  // Re-render visible view first, defer background updates
  if (currentSite) renderDetail(currentSite);
  else if (currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  else { renderSites(); renderConsolidated(); }
  requestAnimationFrame(() => { renderSites(); renderConsolidated(); updateEnergyHfoCard(); });
}

// ══ FILTER ══
// ══ FILTER ══
function syncHfoFilterActive() {
  document.querySelectorAll('.time-filter .tfilter:not(.enr-filter)').forEach(function(b) {
    var mw = b.closest('.month-btn-wrap');
    var qw = b.closest('.quarter-btn-wrap');
    var yw = b.closest('.year-btn-wrap');
    if (currentFilter === 'month') b.classList.toggle('active', !!mw);
    else if (currentFilter === 'quarter') b.classList.toggle('active', !!qw);
    else if (currentFilter === 'year') b.classList.toggle('active', !!yw);
    else b.classList.remove('active');
  });
}

function setFilter(f, btn) {
  currentFilter = f;
  // When clicking month button directly, reset to current month
  if (f === 'month') {
    selectedMonthIndex = getDataMonth() - 1;
    document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(b => {
      b.textContent = MONTH_SHORT[selectedMonthIndex];
    });
    // Reset Q and A buttons
    document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q'; });
    document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'A'; });
    populateMonthDropdowns();
  }
  syncHfoFilterActive();
  const lbl = document.getElementById('filter-label-text');
  if(lbl) {
    if (f === 'month') lbl.textContent = MONTH_NAMES[selectedMonthIndex];
    else if (f === 'quarter') lbl.textContent = 'Q' + selectedQuarter;
    else if (f === 'year') lbl.textContent = String(selectedYear);
  }
  // Render visible view first, defer background updates
  if(currentSite) renderDetail(currentSite);
  else if(currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  else { renderSites(); renderConsolidated(); }
  requestAnimationFrame(() => { renderSites(); renderConsolidated(); updateEnergyHfoCard(); });
}

function setFilterQuarter(q, btn) {
  currentFilter = 'quarter';
  selectedQuarter = q;
  // Update Q button labels
  document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q' + q; });
  // Reset M and A buttons
  document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'M'; });
  document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'A'; });
  syncHfoFilterActive();
  populateQuarterDropdowns();
  const lbl = document.getElementById('filter-label-text');
  if (lbl) lbl.textContent = 'Q' + q;
  if(currentSite) renderDetail(currentSite);
  else if(currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  else { renderSites(); renderConsolidated(); }
  requestAnimationFrame(() => { renderSites(); renderConsolidated(); updateEnergyHfoCard(); });
}

function setFilterYear(year, btn) {
  currentFilter = 'year';
  selectedYear = year;
  // Update A button labels
  document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = String(year); });
  // Reset M and Q buttons
  document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'M'; });
  document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q'; });
  syncHfoFilterActive();
  populateYearDropdowns();
  const lbl = document.getElementById('filter-label-text');
  if (lbl) lbl.textContent = String(year);
  if(currentSite) renderDetail(currentSite);
  else if(currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  else { renderSites(); renderConsolidated(); }
  requestAnimationFrame(() => { renderSites(); renderConsolidated(); updateEnergyHfoCard(); });
}

// ══ QUARTER KPI COMPUTATION ══
function getQuarterKpi(siteId, quarter) {
  const s = siteData[siteId];
  if (!s || !s.kpi) return {prod:0, prodObj:0, dispo:0, sfoc:0, sloc:0, heures:0};
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const dm = getDataMonth(); // 1-based current data month
  let totalProd = 0, totalProdObj = 0, totalHeures = 0;
  let dispoSum = 0, sfocWeighted = 0, slocWeighted = 0, dispoCount = 0;
  for (let m = startMonth; m <= endMonth; m++) {
    let mk;
    if (m === dm) mk = s.kpi['month'];
    else mk = s.kpi['month_' + m];
    if (!mk) continue;
    totalProd += mk.prod || 0;
    totalProdObj += mk.prodObj || 0;
    totalHeures += mk.heures || 0;
    if (mk.dispo > 0) { dispoSum += mk.dispo; dispoCount++; }
    sfocWeighted += (mk.sfoc || 0) * (mk.prod || 0);
    slocWeighted += (mk.sloc || 0) * (mk.prod || 0);
  }
  return {
    prod: totalProd,
    prodObj: totalProdObj,
    heures: totalHeures,
    dispo: dispoCount > 0 ? dispoSum / dispoCount : 0,
    sfoc: totalProd > 0 ? sfocWeighted / totalProd : 0,
    sloc: totalProd > 0 ? slocWeighted / totalProd : 0
  };
}

// ══ KPI HELPER ══
function _getKpiForSite(siteId) {
  const s = siteData[siteId];
  if (!s || !s.kpi) return {};
  if (currentFilter === 'month') {
    const kpiKey = getMonthKpiKey();
    return s.kpi[kpiKey] || s.kpi['month'] || {};
  }
  if (currentFilter === 'quarter') {
    return getQuarterKpi(siteId, selectedQuarter);
  }
  if (currentFilter === 'year') {
    return s.kpi['year'] || {};
  }
  return {};
}

// ══ RENDER SITES ══
function renderSites() {
  const el = document.getElementById('sites-grid-hfo');
  if(!el) return;
  // ── Total production across active sites for % share ──
  let _totalProdAll = 0;
  siteOrder.forEach(sid => {
    const _s = siteData[sid];
    if (_s.status === 'construction' || _s.status === 'reconstruction') return;
    const _k = _getKpiForSite(sid);
    _totalProdAll += (_k && _k.prod) || 0;
  });

  el.innerHTML = siteOrder.map(id => {
    const s = siteData[id];

    // ── Construction / Reconstruction ──
    if(s.status === 'construction' || s.status === 'reconstruction') {
      const isRecon = s.status === 'reconstruction';
      const dotStyle = isRecon ? 'class="status-dot status-ko"' : 'class="status-dot" style="background:rgba(255,255,255,0.15)"';
      const badge = isRecon ? 'En réparation' : 'En construction';
      const date  = isRecon ? 'Mise en service Avril 2026' : 'Mise en service 2027';
      return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;height:26px;">
          <span ${dotStyle}></span>
          <span style="font-size:12px;font-weight:700;color:var(--text);letter-spacing:0.12em;text-transform:uppercase;">${s.name}</span>
        </div>
        <div class="site-card construction" style="min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
          <span class="site-construction-badge">${badge}</span>
          <div style="font-size:10px;color:var(--text-dim);text-align:center;">${date}</div>
          <div style="font-size:11px;color:var(--text-muted);font-weight:600;">${parseFloat(s.mw).toFixed(1)} MW</div>
        </div>
      </div>`;
    }

    const k     = _getKpiForSite(id);
    const fmt   = v => Math.round(+v).toLocaleString();

    // ── Detect full arrêt (toutes unités KO) ──
    const allKO = s.groupes.length > 0 && s.groupes.every(g => g.statut === 'ko');

    // KPI 1 — Puissance dispo vs Contrat
    const puissPct   = s.contrat > 0 ? Math.round((s.mw / s.contrat)*100) : 0;
    const puissColor = puissPct >= 95 ? 'var(--energy)' : puissPct >= 80 ? 'var(--orange)' : 'var(--red)';

    // ── Part de production du site (% du total) ──
    const prodShare = _totalProdAll > 0 ? ((k.prod || 0) / _totalProdAll * 100) : 0;

    // KPI 2 — Production vs Prévisionnel (en %)
    const prodReal = k.prod || 0;
    const prodPrev = k.prodObj || 0;
    const prodPct  = prodPrev > 0 ? ((prodReal / prodPrev) * 100) : null;
    const prodDeltaPct = prodPct !== null ? (prodPct - 100) : null;
    const prodColor = prodDeltaPct === null ? 'var(--text-muted)' : prodDeltaPct >= 0 ? 'var(--energy)' : 'var(--red)';
    const prodSign  = prodDeltaPct !== null && prodDeltaPct > 0 ? '+' : '';
    const prodPctStr = prodDeltaPct !== null ? prodSign + prodDeltaPct.toFixed(1) + '%' : '—';

    // KPI 3 — Moteurs à l'arrêt
    const arretCount   = s.groupes.filter(g => g.statut !== 'ok').length;
    const totalMoteurs = s.groupes.length;
    const arretColor   = arretCount === 0 ? 'var(--energy)' : arretCount <= 2 ? 'var(--orange)' : 'var(--red)';

    // SFOC — seuil 250 : < 250 vert, > 250 rouge
    const sfocVal   = k.sfoc !== null && k.sfoc > 0 ? k.sfoc : null;
    const sfocColor = sfocVal === null ? 'var(--text-dim)' : sfocVal <= 250 ? 'var(--energy)' : 'var(--red)';
    const sfocAbove = sfocVal !== null ? (sfocVal > 250 ? '+' + (sfocVal - 250) : '') : '';
    const sfocBelow = sfocVal !== null ? (sfocVal <= 250 ? '−' + (250 - sfocVal) : '') : '';
    const sfocDiff  = sfocVal !== null ? (sfocVal <= 250 ? '−' + (250 - sfocVal).toFixed(1) + ' vs limite' : '+' + (sfocVal - 250).toFixed(1) + ' vs limite') : '';

    // SLOC — seuil 1.00 : < 1 vert, > 1 rouge
    const slocVal   = k.sloc !== null && k.sloc > 0 ? k.sloc : null;
    const slocColor = slocVal === null ? 'var(--text-dim)' : slocVal <= 1.0 ? 'var(--energy)' : 'var(--red)';
    const slocDiff  = slocVal !== null ? (slocVal <= 1.0 ? '−' + (1.0 - slocVal).toFixed(1) + ' vs limite' : '+' + (slocVal - 1.0).toFixed(1) + ' vs limite') : '';

    // ── Néon du site basé sur les 5 KPIs ──
    // 1. Puissance dispo = 100% du contrat
    // 2. Production réelle >= prévisionnel
    // 3. Moteurs à l'arrêt = 0
    // 4. SFOC < 250
    // 5. SLOC < 1
    const _kpiOk = [];
    if (s.contrat > 0) _kpiOk.push(puissPct >= 100);
    if (prodPct !== null) _kpiOk.push(prodDeltaPct >= 0);
    _kpiOk.push(arretCount === 0);
    if (sfocVal !== null) _kpiOk.push(sfocVal <= 250);
    if (slocVal !== null) _kpiOk.push(slocVal <= 1.0);
    const _greenN = _kpiOk.filter(Boolean).length;
    const _totalN = _kpiOk.length;
    // Tout vert → vert, ≥ moitié OK → orange, < moitié OK → rouge
    let dotC, st;
    if (_totalN === 0 || _greenN === _totalN) {
      dotC = 'status-ok';
      st = {color:'#00ab63', rgb:'116,184,89'};
    } else if (_greenN >= _totalN / 2) {
      dotC = 'status-warn';
      st = {color:'#FDB823', rgb:'245,166,35'};
    } else {
      dotC = 'status-ko';
      st = {color:'#e05c5c', rgb:'224,92,92'};
    }

    // ── Couleurs bordures selon état ──
    const borderCol = allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)';
    const labelCol  = allKO ? 'rgba(224,92,92,0.6)'  : 'rgba(138,146,171,0.65)';
    const bgKpi     = allKO ? 'rgba(224,92,92,0.08)' : 'rgba(138,146,171,0.1)';

    return `
    <div style="display:flex;flex-direction:column;gap:8px;">

      <!-- Nom de ville au-dessus -->
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;height:26px;">
        <span class="status-dot ${dotC}"></span>
        <span style="font-size:12px;font-weight:700;color:var(--text);letter-spacing:0.12em;text-transform:uppercase;">${s.name}</span>
        <span style="font-size:10px;font-weight:700;color:var(--orange);opacity:0.85;">${prodShare.toFixed(1)}%</span>
      </div>

      <div class="site-card" onclick="openDetail('${id}')" style="--card-status-color:${st.color};--card-status-rgb:${st.rgb};">

        <!-- KPI 1 · Puissance dispo / Contrat -->
        <div style="padding-bottom:10px;border-bottom:1px solid ${borderCol};margin-bottom:10px;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${labelCol};text-align:center;margin-bottom:8px;">Puissance dispo / Contrat</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
            <div style="text-align:center;flex:1;">
              <div style="font-size:20px;font-weight:800;color:${puissColor};letter-spacing:-0.5px;line-height:1;">${parseFloat(s.mw).toFixed(1)}<span style="font-size:9px;font-weight:400;color:var(--text-muted);margin-left:2px;">MW</span></div>
              <div style="font-size:8px;color:var(--text-dim);margin-top:2px;">Dispo</div>
            </div>
            <div style="text-align:center;flex:0 0 38px;">
              <div style="font-size:13px;font-weight:800;color:${puissColor};">${puissPct}%</div>
            </div>
            <div style="text-align:center;flex:1;">
              <div style="font-size:20px;font-weight:800;color:rgba(255,255,255,0.3);letter-spacing:-0.5px;line-height:1;">${parseFloat(s.contrat).toFixed(1)}<span style="font-size:9px;font-weight:400;color:var(--text-muted);margin-left:2px;">MW</span></div>
              <div style="font-size:8px;color:var(--text-dim);margin-top:2px;">Contrat</div>
            </div>
          </div>
        </div>

        <!-- KPI 2 · Production vs Prévisionnel -->
        <div style="padding-bottom:10px;border-bottom:1px solid ${borderCol};margin-bottom:10px;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${labelCol};text-align:center;margin-bottom:8px;">Production vs Prévisionnel</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
            <div style="text-align:center;flex:1;">
              <div style="font-size:13px;font-weight:700;color:${allKO ? 'var(--red)' : 'var(--text)'};line-height:1;">${fmt(prodReal)}<span style="font-size:8px;font-weight:400;color:var(--text-muted);margin-left:2px;">MWh</span></div>
              <div style="font-size:8px;color:var(--text-dim);margin-top:2px;">Réel</div>
            </div>
            <div style="text-align:center;flex:0 0 44px;">
              <div style="font-size:14px;font-weight:800;color:${prodColor};">${prodPctStr}</div>
            </div>
            <div style="text-align:center;flex:1;">
              <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.35);line-height:1;">${prodPrev > 0 ? fmt(prodPrev) : '—'}<span style="font-size:8px;font-weight:400;color:var(--text-muted);margin-left:2px;">${prodPrev > 0 ? 'MWh' : ''}</span></div>
              <div style="font-size:8px;color:var(--text-dim);margin-top:2px;">Prévu</div>
            </div>
          </div>
        </div>

        <!-- KPI 3 · Moteurs à l'arrêt -->
        <div style="padding-bottom:10px;border-bottom:1px solid ${borderCol};margin-bottom:10px;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${labelCol};text-align:center;margin-bottom:8px;">Moteurs à l'arrêt</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
            <div style="font-size:28px;font-weight:800;color:${arretColor};line-height:1;letter-spacing:-1px;">${arretCount}</div>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.4;">/ ${totalMoteurs}<br>moteurs</div>
          </div>
        </div>

        <!-- Footer SFOC + SLOC avec seuils -->
        <div style="display:flex;gap:6px;">
          <div style="flex:1;background:${bgKpi};border-radius:8px;padding:7px 4px 5px;text-align:center;min-height:72px;display:flex;flex-direction:column;justify-content:center;">
            <div style="font-size:7px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${labelCol};margin-bottom:3px;">SFOC</div>
            <div style="font-size:13px;font-weight:800;color:${sfocColor};line-height:1;">${sfocVal !== null ? sfocVal.toFixed(1) : '—'}</div>
            <div style="font-size:7px;color:var(--text-dim);margin-top:1px;">g/kWh</div>
            <div style="font-size:7px;font-weight:600;color:${sfocColor};margin-top:3px;opacity:0.8;min-height:10px;">${sfocVal !== null ? sfocDiff : ''}</div>
            <div style="font-size:7px;color:rgba(255,255,255,0.2);margin-top:2px;">limite 250</div>
          </div>
          <div style="flex:1;background:${bgKpi};border-radius:8px;padding:7px 4px 5px;text-align:center;min-height:72px;display:flex;flex-direction:column;justify-content:center;">
            <div style="font-size:7px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${labelCol};margin-bottom:3px;">SLOC</div>
            <div style="font-size:13px;font-weight:800;color:${slocColor};line-height:1;">${slocVal !== null ? slocVal.toFixed(1) : '—'}</div>
            <div style="font-size:7px;color:var(--text-dim);margin-top:1px;">g/kWh</div>
            <div style="font-size:7px;font-weight:600;color:${slocColor};margin-top:3px;opacity:0.8;min-height:10px;">${slocVal !== null ? slocDiff : ''}</div>
            <div style="font-size:7px;color:rgba(255,255,255,0.2);margin-top:2px;">limite 1.00</div>
          </div>
        </div>

      </div>
    </div>`;
  }).join('');
}

// ══ RENDER CONSOLIDATED ══
function renderConsolidated() {
  const el = document.getElementById('kpi-consolidated-grid');
  if(!el) return;
  const active = siteOrder.filter(id => siteData[id].status !== 'construction' && siteData[id].status !== 'reconstruction');
  const kpis  = active.map(id => _getKpiForSite(id));
  const prevFilterKey = currentFilter === 'quarter' ? 'year' : (currentFilter === 'year' ? 'year' : currentFilter);
  const prevs = active.map(id => (siteData[id].prev2025 || {})[prevFilterKey] || {prod:0,dispo:0,sfoc:0,sloc:0});
  const tProd = kpis.reduce((s,k)=>s+k.prod,0), pProd = prevs.reduce((s,k)=>s+k.prod,0);
  const aDispo = kpis.reduce((s,k)=>s+k.dispo,0)/kpis.length, pDispo = prevs.reduce((s,k)=>s+k.dispo,0)/prevs.length;
  // Weighted average SFOC/SLOC by production (correct: sum(sfoc_i*prod_i)/sum(prod_i))
  const aSfoc  = tProd > 0 ? kpis.reduce((s,k)=>s+(k.sfoc||0)*(k.prod||0),0)/tProd : 0;
  const pSfoc  = pProd > 0 ? prevs.reduce((s,k)=>s+(k.sfoc||0)*(k.prod||0),0)/pProd : 0;
  const aSloc  = tProd > 0 ? kpis.reduce((s,k)=>s+(k.sloc||0)*(k.prod||0),0)/tProd : 0;
  const pSloc  = pProd > 0 ? prevs.reduce((s,k)=>s+(k.sloc||0)*(k.prod||0),0)/pProd : 0;
  const tMw = parseFloat(active.reduce((s,id)=>s+siteData[id].mw,0).toFixed(1));
  const dc = aDispo>=95?'var(--energy)':aDispo>=85?'var(--orange)':'var(--red)';
  el.innerHTML = [
    {lbl:'Production totale',  val:tProd.toFixed(1), unit:'MWh'},
    {lbl:'Puissance installée',val:tMw.toFixed(1), unit:'MW'},
    {lbl:'SFOC moyen',         val:aSfoc.toFixed(1), unit:'g/kWh'},
    {lbl:'SLOC moyen',         val:aSloc.toFixed(1), unit:'g/kWh'},
  ].map(k=>`<div class="s1-card"><div class="s1-card-label">${k.lbl}</div><div class="s1-card-value">${k.val}</div><div class="s1-card-unit-line">${k.unit}</div></div>`).join('');
}

// ══ RENDER BLACKOUTS (inside site detail) ══
const _moNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function _fmtBoTime(t) {
  if (!t) return '';
  const m = t.match(/(\d{1,2}):(\d{2})/);
  return m ? m[1].padStart(2,'0') + ':' + m[2] : t;
}
function _calcBoDur(e) {
  // 1) If duration field is a valid time (HH:MM:SS or HH:MM), use it
  if (e.duration) {
    const dm = e.duration.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (dm) {
      const h = parseInt(dm[1]), m = parseInt(dm[2]);
      if (h > 0) return h + 'h' + (m > 0 ? String(m).padStart(2,'0') : '');
      return m + 'min';
    }
  }
  // 2) Calculate from start/end
  if (e.start && e.end) {
    const sm = e.start.match(/(\d{1,2}):(\d{2})/);
    const em = e.end.match(/(\d{1,2}):(\d{2})/);
    if (sm && em) {
      let startMin = parseInt(sm[1]) * 60 + parseInt(sm[2]);
      let endMin   = parseInt(em[1]) * 60 + parseInt(em[2]);
      let diff = endMin - startMin;
      if (diff <= 0) diff += 1440; // overnight → add 24h
      const h = Math.floor(diff / 60), m = diff % 60;
      if (h > 0) return h + 'h' + (m > 0 ? String(m).padStart(2,'0') : '');
      return m + 'min';
    }
  }
  return '—';
}
function _calcBoDurMinutes(e) {
  if (e.duration) {
    const dm = e.duration.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (dm) return parseInt(dm[1]) * 60 + parseInt(dm[2]);
  }
  if (e.start && e.end) {
    const sm = e.start.match(/(\d{1,2}):(\d{2})/);
    const em = e.end.match(/(\d{1,2}):(\d{2})/);
    if (sm && em) {
      let diff = (parseInt(em[1])*60+parseInt(em[2])) - (parseInt(sm[1])*60+parseInt(sm[2]));
      if (diff <= 0) diff += 1440;
      return diff;
    }
  }
  return 0;
}
function _fmtDurFromMin(min) {
  if (min <= 0) return '—';
  const h = Math.floor(min/60), m = Math.round(min%60);
  if (h > 0) return h + 'h' + (m > 0 ? String(m).padStart(2,'0') : '');
  return m + 'min';
}

function renderBlackouts(siteId) {
  const el = document.getElementById('detail-blackout-list');
  const cardEl = document.getElementById('detail-blackout-card');
  if (!el) return;
  const s = siteData[siteId];
  if (!s) { el.innerHTML = ''; if(cardEl) cardEl.innerHTML = ''; return; }

  const now = new Date();
  const dataYear = selectedYear || now.getFullYear();

  const bos = (s.blackouts || []).filter(b => {
    if (!b.date) return false;
    const parts = b.date.split('-');
    const y = parseInt(parts[0]), m = parseInt(parts[1]);
    if (y !== dataYear) return false;
    if (currentFilter === 'month' && m !== selectedMonthIndex + 1) return false;
    if (currentFilter === 'quarter') {
      const qStart = (selectedQuarter - 1) * 3 + 1;
      if (m < qStart || m > qStart + 2) return false;
    }
    return true;
  });

  // Calculate KPIs
  const count = bos.length;
  let totalMin = 0;
  bos.forEach(b => { totalMin += _calcBoDurMinutes(b); });
  const avgMin = count > 0 ? totalMin / count : 0;
  const avgDur = _fmtDurFromMin(Math.round(avgMin));
  const totalDur = _fmtDurFromMin(totalMin);

  // Render summary card
  if (cardEl) {
    cardEl.innerHTML = `<div class="s1-card" style="cursor:pointer;padding:14px 24px;max-width:360px;width:100%;transition:border-color 0.2s;" onclick="toggleBlackoutList()" onmouseenter="this.style.borderColor='var(--orange)'" onmouseleave="this.style.borderColor=''">
      <div style="display:flex;justify-content:center;gap:24px;">
        <div style="text-align:center;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:var(--text-dim);margin-bottom:4px;">Nombre</div>
          <div style="font-size:22px;font-weight:700;color:${count>0?'var(--orange)':'var(--text)'};">${count}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:var(--text-dim);margin-bottom:4px;">Durée moy.</div>
          <div style="font-size:22px;font-weight:700;color:var(--text);">${avgDur}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:var(--text-dim);margin-bottom:4px;">Durée totale</div>
          <div style="font-size:22px;font-weight:700;color:var(--text);">${totalDur}</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:8px;font-size:8px;color:var(--text-dim);">Cliquez pour voir le détail ▾</div>
    </div>`;
  }

  // Hide list by default
  el.style.display = 'none';

  // Group by month
  const byMonth = {};
  bos.forEach(b => {
    const m = parseInt(b.date.split('-')[1]);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(b);
  });
  const months = Object.keys(byMonth).map(Number).sort((a,b) => b - a);

  let rows = '';
  if (bos.length === 0) {
    rows = '<tr class="bo-empty-row"><td colspan="6">Aucun blackout sur cette période</td></tr>';
  } else {
    months.forEach(m => {
      const events = byMonth[m].sort((a,b) => b.date.localeCompare(a.date));
      rows += `<tr class="bo-month-row"><td colspan="6">${_moNames[m-1]} ${dataYear} — ${events.length} blackout${events.length>1?'s':''}</td></tr>`;
      events.forEach(e => {
        const day = e.date.split('-')[2];
        const t0 = _fmtBoTime(e.start), t1 = _fmtBoTime(e.end);
        const timeStr = t0 && t1 ? t0 + ' → ' + t1 : (t0 || t1 || '—');
        const dur = _calcBoDur(e);
        const desc = e.description || '—';
        const cause = e.cause || '—';
        const source = e.source || '';
        rows += `<tr>
          <td style="font-weight:700;color:var(--text);">${day}/${String(m).padStart(2,'0')}</td>
          <td style="color:var(--orange);font-weight:600;">${timeStr}</td>
          <td>${dur}</td>
          <td>${desc}</td>
          <td>${cause}</td>
          <td>${source}</td>
        </tr>`;
      });
    });
  }

  el.innerHTML = `<div class="table-wrap">
    <table class="groups-table">
      <thead><tr>
        <th>Date</th>
        <th>Heure</th>
        <th>Durée</th>
        <th>Description</th>
        <th>Cause</th>
        <th>Source</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function toggleBlackoutList() {
  const el = document.getElementById('detail-blackout-list');
  if (!el) return;
  if (el.style.display === 'none') {
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

// ══ RENDER DETAIL ══
function renderDetail(id) {
  const s = siteData[id];
  if(!s) return;

  // Site name + nav (only rebuild if site changed to avoid layout thrash)
  document.getElementById('detail-site-name').textContent = s.name;
  const nav = document.getElementById('site-nav-strip');
  if (!nav.dataset.site || nav.dataset.site !== id) {
    nav.dataset.site = id;
    nav.innerHTML = siteOrder.map(i =>
      `<button class="site-nav-btn${i===id?' active':''}" onclick="openDetail('${i}')">${siteData[i].name}</button>`
    ).join('');
  }

  // ── BANNER pour sites hors-service ──
  const banner = document.getElementById('detail-banner');
  if(s.status === 'reconstruction' || s.status === 'construction') {
    const col = s.status === 'reconstruction' ? '#f37056' : '#00ab63';
    banner.style.display = 'flex';
    banner.style.background = `${col}18`;
    banner.style.border = `1px solid ${col}40`;
    banner.innerHTML = `<span style="font-size:20px;">${s.notice || ''}</span>
      <span style="font-size:13px;color:var(--text-muted);margin-top:6px;">Les données opérationnelles seront disponibles dès la remise en service.</span>`;
    // Hide ALL data sections
    ['detail-s1-top','detail-s1-conso','detail-s2-label','detail-gen-cards','detail-s3-label','detail-blackout-card','detail-blackout-list'].forEach(x => {
      const e = document.getElementById(x); if(e) e.style.display='none';
    });
    document.querySelectorAll('.detail-section-label').forEach(e => e.style.display='none');
    return;
  } else {
    banner.style.display = 'none';
    ['detail-s1-top','detail-s2-label','detail-gen-cards','detail-s3-label','detail-blackout-card'].forEach(x => {
      const e = document.getElementById(x); if(e) e.style.display = x === 'detail-gen-cards' ? 'flex' : (x === 'detail-blackout-card' ? 'flex' : '');
    });
    document.querySelectorAll('.detail-section-label').forEach(e => e.style.display='');
  }

  const f = currentFilter;
  const k = _getKpiForSite(id);
  const prevKey = f === 'quarter' ? 'year' : (f === 'year' ? 'year' : f);
  const p = (s.prev2025 || {})[prevKey] || {};

  // ── SECTION 1 — DONNÉES GÉNÉRALES ──
  document.getElementById('d-contrat').textContent = s.contrat;
  document.getElementById('d-prod').textContent = k.prod != null ? parseFloat(k.prod).toFixed(1) : '—';
  document.getElementById('d-sfoc').textContent = k.sfoc != null ? parseFloat(k.sfoc).toFixed(1) : '—';
  document.getElementById('d-sloc').textContent = k.sloc != null ? parseFloat(k.sloc).toFixed(1) : '—';

  // ── SECTION 2 — GÉNÉRATEURS (cartes compactes) ──
  document.getElementById('detail-gen-cards').innerHTML = s.groupes.map(g => {
    const isContra = g.contradictory === true;
    const sc = isContra ? 'status-check' : g.statut==='ok'?'status-ok':g.statut==='warn'?'status-warn':'status-ko';
    const dotColor = isContra ? '#7b5fbf' : g.statut==='ok'?'var(--energy)':g.statut==='warn'?'#f0a030':'var(--red)';
    let sl;
    if(isContra) { sl = 'À vérifier'; }
    else { sl = g.statut==='ok'?'En marche':g.statut==='warn'?'Maintenance':'Arrêt'; }
    const _daysStopped = getDaysStopped(g);
    const _daysLabel = (_daysStopped > 0 && !isContra) ? ' · ' + _daysStopped + 'j' : '';
    // SFOC selon filtre
    let gSfocVal = '—';
    const HFO_D = 0.96;
    const _isCurMonth = isCurrentMonth(selectedMonthIndex);
    {
      let pKwh, hfoL;
      if(f === 'month' && _isCurMonth) {
        pKwh = (g.dailyProd||[]).reduce((a,b)=>a+b,0);
        hfoL = (g.dailyHFO||[]).reduce((a,b)=>a+b,0);
      } else if(f === 'month') {
        pKwh = (g.monthlyProd||[])[selectedMonthIndex]||0;
        hfoL = (g.monthlyHFO||[])[selectedMonthIndex]||0;
      } else if(f === 'quarter') {
        const startM = (selectedQuarter - 1) * 3; pKwh = 0; hfoL = 0;
        for (let mi = startM; mi < startM + 3; mi++) {
          pKwh += (g.monthlyProd||[])[mi]||0;
          hfoL += (g.monthlyHFO||[])[mi]||0;
        }
      } else {
        pKwh = (g.monthlyProd||[]).reduce((a,b)=>a+b,0);
        hfoL = (g.monthlyHFO||[]).reduce((a,b)=>a+b,0);
      }
      if(pKwh > 0 && hfoL > 0) gSfocVal = (Math.round((hfoL*HFO_D)/pKwh*1000*10)/10).toFixed(0);
    }
    const gSfocNum = parseFloat(gSfocVal)||0;
    const sfocColor = gSfocNum > 0 ? (gSfocNum<=250?'var(--energy)':'var(--red)') : 'var(--text-dim)';
    // SLOC
    const gSlocVal = g.sloc != null ? parseFloat(g.sloc).toFixed(2) : '—';
    const borderColor = isContra ? 'rgba(160,90,255,0.3)' : (g.statut==='ok'?'rgba(0,171,99,0.2)':g.statut==='warn'?'rgba(240,160,48,0.2)':'rgba(243,112,86,0.2)');
    const mw = parseFloat(g.mw).toFixed(1);
    return `<div style="cursor:pointer;display:flex;flex-direction:column;width:calc((100% - 32px)/5);" onclick="openGroupeDetail('${id}','${g.id}')">
      <div style="text-align:center;font-size:11px;font-weight:700;color:${isContra?'#7b5fbf':'var(--text)'};margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:4px;"><span class="status-dot ${sc}" style="width:6px;height:6px;flex-shrink:0;"></span>${g.id}</div>
      <div class="s1-card" style="flex:1;padding:10px 6px;transition:border-color 0.2s;border-color:${borderColor};cursor:pointer;" onmouseenter="this.style.borderColor='${dotColor}'" onmouseleave="this.style.borderColor='${borderColor}'">
        <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:var(--text-dim);margin-bottom:4px;">Puissance</div>
        <div style="font-size:16px;font-weight:700;color:var(--text);line-height:1;">${mw}<span style="font-size:9px;color:var(--text-muted);font-weight:400;"> MW</span></div>
        <div style="font-size:8px;font-weight:700;color:${dotColor};margin-top:6px;">${sl}${_daysLabel}</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:6px;">
          <div style="text-align:center;">
            <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-dim);">SFOC</div>
            <div style="font-size:12px;font-weight:700;color:${sfocColor};">${gSfocVal}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-dim);">SLOC</div>
            <div style="font-size:12px;font-weight:700;color:var(--text);">${gSlocVal}</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // ── SECTION 3 — BLACKOUTS ──
  renderBlackouts(id);
}


// ══ GROUPE DETAIL ══

// ══ GROUPE DETAIL ══
var currentGroupe = null;

function setGdFilter(f, btn) {
  currentFilter = f;
  if (f === 'month') {
    selectedMonthIndex = getDataMonth() - 1;
    document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(b => {
      b.textContent = MONTH_SHORT[selectedMonthIndex];
    });
    document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q'; });
    document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'A'; });
    populateMonthDropdowns();
  }
  syncHfoFilterActive();
  const lbl = document.getElementById('filter-label-text');
  if(lbl) {
    if (f === 'month') lbl.textContent = MONTH_NAMES[selectedMonthIndex];
    else if (f === 'quarter') lbl.textContent = 'Q' + selectedQuarter;
    else if (f === 'year') lbl.textContent = String(selectedYear);
  }
  if(currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  renderSites(); renderConsolidated();
  if(currentSite) renderDetail(currentSite);
}

function setGdFilterQuarter(q, btn) {
  currentFilter = 'quarter';
  selectedQuarter = q;
  document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q' + q; });
  document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'M'; });
  document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'A'; });
  syncHfoFilterActive();
  populateQuarterDropdowns();
  const lbl = document.getElementById('filter-label-text');
  if (lbl) lbl.textContent = 'Q' + q;
  if(currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  renderSites(); renderConsolidated();
  if(currentSite) renderDetail(currentSite);
}

function setGdFilterYear(year, btn) {
  currentFilter = 'year';
  selectedYear = year;
  document.querySelectorAll('.year-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = String(year); });
  document.querySelectorAll('.month-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'M'; });
  document.querySelectorAll('.quarter-btn-wrap .tfilter:not(.enr-filter)').forEach(b => { b.textContent = 'Q'; });
  syncHfoFilterActive();
  populateYearDropdowns();
  const lbl = document.getElementById('filter-label-text');
  if (lbl) lbl.textContent = String(year);
  if(currentGroupe) renderGroupeDetail(currentGroupe.siteId, currentGroupe.grpId);
  renderSites(); renderConsolidated();
  if(currentSite) renderDetail(currentSite);
}

function openGroupeDetail(siteId, grpId) {
  currentGroupe = { siteId, grpId };
  const s = siteData[siteId];
  const backBtn = document.getElementById('gd-back-btn');
  if(backBtn) backBtn.textContent = s.name;
  syncHfoFilterActive();
  renderGroupeDetail(siteId, grpId);
  const panel = document.getElementById('panel-groupe-detail');
  panel.scrollTop = 0;
  panel.classList.add('open');
}

function closeGroupeDetail() {
  document.getElementById('panel-groupe-detail').classList.remove('open');
  currentGroupe = null;
}

function renderGroupeDetail(siteId, grpId) {
  const s = siteData[siteId];
  const g = s.groupes.find(x => x.id === grpId);
  if(!g) return;

  // ── Header ──
  document.getElementById('gd-title').textContent = g.id;
  document.getElementById('gd-subtitle').textContent = (g.model || '') + ' · ' + s.name + ' · ' + g.mw + ' MW';

  // ── Nav générateurs du site ──
  const genNav = document.getElementById('gen-nav-strip');
  if(genNav) {
    genNav.innerHTML = s.groupes.map(gr => {
      const dotClass = gr.contradictory ? 'check' : gr.statut === 'ok' ? 'ok' : gr.statut === 'warn' ? 'warn' : 'ko';
      const isActive = gr.id === grpId;
      return `<button class="gen-nav-btn${isActive?' active':''}" onclick="openGroupeDetail('${siteId}','${gr.id}')">` +
        `<span class="gen-nav-dot ${dotClass}"></span>${gr.id}</button>`;
    }).join('');
  }

  const isContra = g.contradictory === true;
  const statMap = {
    ok:    {label:'En marche',    bg:'rgba(0,171,99,0.12)',  color:'#00ab63', dot:'status-ok'},
    warn:  {label:'Maintenance',  bg:'rgba(245,166,35,0.12)',  color:'#FDB823', dot:'status-warn'},
    ko:    {label:'Hors service', bg:'rgba(224,92,92,0.12)',   color:'#e05c5c', dot:'status-ko'},
    check: {label:'À vérifier — Données contradictoires', bg:'rgba(160,90,255,0.12)', color:'#7b5fbf', dot:'status-check'}
  };
  const st = isContra ? statMap.check : (statMap[g.statut] || statMap.ko);
  document.getElementById('gd-status-wrap').innerHTML =
    '<span class="gd-status-badge" style="background:' + st.bg + ';color:' + st.color + ';border:1px solid ' + st.color + '44;">' +
    '<span class="status-dot ' + st.dot + '" style="width:8px;height:8px;min-width:8px;"></span>' + st.label + '</span>';

  const isKO = g.statut === 'ko' && !isContra;
  const isCheck = isContra;
  const bc   = isCheck ? 'rgba(160,90,255,0.15)' : isKO ? 'rgba(224,92,92,0.15)' : 'rgba(138,146,171,0.18)';
  const lc   = isCheck ? 'rgba(160,90,255,0.65)' : isKO ? 'rgba(224,92,92,0.65)' : 'rgba(138,146,171,0.65)';
  const bg   = isCheck ? 'rgba(160,90,255,0.06)' : isKO ? 'rgba(224,92,92,0.06)' : 'rgba(138,146,171,0.06)';

  let html = '';
  const f = currentFilter;

  // ── Arrêt banner (si KO) ──
  if(isKO) {
    const condLabel = g.condition === 'Maintenance' ? 'Maintenance planifiée' : 'Panne / Breakdown';
    html += '<div class="gd-arret-banner">' +
      '<div class="gd-arret-days">' + (g.jourArret || '—') + '<span style="font-size:20px;font-weight:400;margin-left:4px;color:rgba(224,92,92,0.6);">j</span></div>' +
      '<div>' +
        '<div class="gd-arret-label">Arrêt en cours</div>' +
        '<div class="gd-arret-condition">' + condLabel + '</div>' +
        '<div class="gd-arret-reason">' + g.maint + '</div>' +
      '</div>' +
      '<div style="margin-left:auto;text-align:right;">' +
        '<div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(224,92,92,0.5);margin-bottom:4px;">Arrêt forcé</div>' +
        '<div style="font-size:22px;font-weight:800;color:#e05c5c;">' + parseFloat(g.arretForce || 0).toFixed(1) + '<span style="font-size:11px;font-weight:400;color:rgba(224,92,92,0.5);margin-left:3px;">h</span></div>' +
        '<div style="font-size:8px;color:rgba(255,255,255,0.25);margin-top:6px;">Arrêt planifié : ' + parseFloat(g.arretPlanifie || 0).toFixed(1) + ' h</div>' +
      '</div>' +
    '</div>';
  }

  // ── Section 1 — Heures & Exploitation (filter-aware) ──
  html += '<div class="gd-section">Heures de marche & Exploitation</div>';
  let s1_hVal, s1_hUnit, s1_hSub, s1_hColor, s1_sbVal, s1_sbSub, s1_afVal, s1_afSub, s1_apVal, s1_apSub, s1_hLabel;
  if (f === 'month') {
    const _cm = isCurrentMonth(selectedMonthIndex);
    const mLabel = _cm ? 'ce mois' : MONTH_SHORT[selectedMonthIndex];
    s1_hLabel = 'Marche ' + mLabel;
    let totalH, totalSb, totalAf, totalAp, jours;
    if (_cm) {
      const dh = g.dailyHours || []; totalH = dh.reduce((a,b) => a+b, 0);
      const ds = g.dailyStandby || []; totalSb = ds.reduce((a,b) => a+b, 0);
      const daf = g.dailyArretForce || []; totalAf = daf.reduce((a,b) => a+b, 0);
      const dap = g.dailyArretPlanifie || []; totalAp = dap.reduce((a,b) => a+b, 0);
      jours = dh.filter(v => v > 0).length;
    } else {
      const mi = selectedMonthIndex;
      totalH = (g.monthlyHours||[])[mi]||0;
      totalSb = (g.monthlyStandby||[])[mi]||0;
      totalAf = (g.monthlyArretForce||[])[mi]||0;
      totalAp = (g.monthlyArretPlanifie||[])[mi]||0;
      jours = totalH > 0 ? Math.round(totalH / 24) : 0;
    }
    s1_hVal = totalH.toFixed(1); s1_hUnit = 'h';
    s1_sbSub = jours + ' jours en marche · Standby : ' + totalSb.toFixed(1) + ' h';
    s1_hColor = jours > 20 ? 'var(--energy)' : jours > 0 ? 'var(--orange)' : 'var(--red)';
    s1_afVal = totalAf.toFixed(1); s1_afSub = 'Total arrêts forcés ' + mLabel;
    s1_apVal = totalAp.toFixed(1); s1_apSub = 'Maintenance préventive ' + mLabel;
  } else if (f === 'quarter') {
    s1_hLabel = 'Marche Q' + selectedQuarter;
    const startM = (selectedQuarter - 1) * 3;
    const mh = g.monthlyHours || [];
    let totalH = 0, totalAf = 0, totalAp = 0;
    for (let mi = startM; mi < startM + 3 && mi < mh.length; mi++) {
      totalH += mh[mi] || 0;
      totalAf += (g.monthlyArretForce||[])[mi] || 0;
      totalAp += (g.monthlyArretPlanifie||[])[mi] || 0;
    }
    const jours = totalH > 0 ? Math.round(totalH / 24) : 0;
    s1_hVal = totalH.toFixed(1); s1_hUnit = 'h';
    s1_sbSub = jours + ' jours en marche';
    s1_hColor = jours > 60 ? 'var(--energy)' : jours > 0 ? 'var(--orange)' : 'var(--red)';
    s1_afVal = totalAf.toFixed(1); s1_afSub = 'Total arrêts forcés Q' + selectedQuarter;
    s1_apVal = totalAp.toFixed(1); s1_apSub = 'Maintenance préventive Q' + selectedQuarter;
  } else {
    s1_hLabel = 'Marche ' + selectedYear;
    const mh = g.monthlyHours || []; const totalH = mh.reduce((a,b) => a+b, 0);
    const moisActifs = mh.filter(v => v > 0).length;
    s1_hVal = totalH.toFixed(1); s1_hUnit = 'h';
    s1_sbSub = moisActifs + ' mois en marche sur 12';
    s1_hColor = moisActifs > 6 ? 'var(--energy)' : moisActifs > 0 ? 'var(--orange)' : 'var(--red)';
    s1_afVal = parseFloat(g.arretForce).toFixed(1); s1_afSub = 'Non planifié (dernières 24h)';
    s1_apVal = parseFloat(g.arretPlanifie).toFixed(1); s1_apSub = 'Maintenance préventive (dernières 24h)';
  }
  const kpiRow1 = [
    { label:'Heures cumulées', value: g.h > 0 ? parseFloat(g.h).toFixed(1) : '0', unit:'h', sub:'Total depuis mise en service', color:null },
    { label: s1_hLabel, value: s1_hVal, unit: s1_hUnit, sub: s1_sbSub, color: s1_hColor },
    { label:'Arrêt forcé',      value: s1_afVal,    unit:'h', sub: s1_afSub, color: parseFloat(s1_afVal) > 0 ? 'var(--red)' : null },
    { label:'Arrêt planifié',   value: s1_apVal, unit:'h', sub: s1_apSub, color: parseFloat(s1_apVal) > 0 ? 'var(--orange)' : null },
  ];
  html += '<div class="gd-kpi-grid">' + kpiRow1.map(c =>
    '<div class="gd-kpi-card" style="background:' + bg + ';border-color:' + bc + ';">' +
    '<div class="gd-kpi-label" style="color:' + lc + ';">' + c.label + '</div>' +
    '<div class="gd-kpi-value" style="' + (c.color ? 'color:' + c.color + ';' : '') + (String(c.value).length > 5 ? 'font-size:20px;' : '') + '">' +
      c.value + (c.unit ? '<span class="gd-kpi-unit">' + c.unit + '</span>' : '') +
    '</div>' +
    '<div class="gd-kpi-sub">' + c.sub + '</div>' +
    '</div>'
  ).join('') + '</div>';

  // ── Section 2 — Production & Énergie ──
  html += '<div class="gd-section">Production & Énergie</div>';

  // Chart card — filter-aware (24h: hourly kW, month: daily kWh, year: monthly kWh)
  let chartData, chartLabels, chartTitle, chartUnit;

  if (f === 'month') {
    const _cm2 = isCurrentMonth(selectedMonthIndex);
    if (_cm2) {
      const raw = g.dailyProd || Array(31).fill(0);
      let lastDay = raw.length;
      while (lastDay > 0 && raw[lastDay - 1] === 0) lastDay--;
      if (lastDay === 0) lastDay = new Date().getDate();
      chartData = raw.slice(0, Math.max(lastDay, 1));
      chartLabels = chartData.map((_, i) => String(i + 1));
    } else {
      // Past month: use monthly total as single summary bar
      const monthTotal = (g.monthlyProd||[])[selectedMonthIndex]||0;
      chartData = [monthTotal];
      chartLabels = [MONTH_NAMES[selectedMonthIndex]];
    }
    const mName = _cm2 ? 'Ce mois' : MONTH_NAMES[selectedMonthIndex];
    chartTitle = 'Production journalière — ' + mName;
    chartUnit = 'kWh';
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3;
    const qMonths = (g.monthlyProd || Array(12).fill(0)).slice(startM, startM + 3);
    chartData = qMonths;
    chartLabels = [MONTH_NAMES[startM], MONTH_NAMES[startM+1], MONTH_NAMES[startM+2]];
    chartTitle = 'Production mensuelle — Q' + selectedQuarter;
    chartUnit = 'kWh';
  } else { // year
    chartData = g.monthlyProd || Array(12).fill(0);
    chartLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    chartTitle = 'Production mensuelle — ' + selectedYear;
    chartUnit = 'kWh';
  }

  const barCount = chartData.length;
  const maxChartVal = Math.max(...chartData, 1);
  const totalChartVal = chartData.reduce((a, b) => a + b, 0);

  // SVG bar chart
  const W = 960, H = 120, PAD_L = 48, PAD_R = 10, PAD_T = 10, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const barGap = Math.floor(chartW / barCount);
  const barW = Math.max(2, barGap - (barCount > 24 ? 1 : 2));

  let bars = '', labels = '', gridLines = '';

  // Grid lines at 25%, 50%, 75%, 100%
  [0.25, 0.5, 0.75, 1.0].forEach(pct => {
    const y = PAD_T + chartH * (1 - pct);
    const v = Math.round(maxChartVal * pct);
    gridLines += '<line x1="' + PAD_L + '" y1="' + y + '" x2="' + (W - PAD_R) + '" y2="' + y + '" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>';
    const lbl = v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(1) + 'k' : v;
    gridLines += '<text x="' + (PAD_L - 4) + '" y="' + (y + 4) + '" text-anchor="end" font-size="8" fill="rgba(255,255,255,0.2)">' + lbl + '</text>';
  });

  // Label frequency based on bar count
  const labelFreq = barCount <= 12 ? 1 : barCount <= 24 ? 4 : 5;

  chartData.forEach((val, i) => {
    const x = PAD_L + i * barGap;
    const barH = val > 0 ? Math.max(2, (val / maxChartVal) * chartH) : 0;
    const y = PAD_T + chartH - barH;
    const barColor = val === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(174,193,205,0.75)';
    bars += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + Math.max(barH, 0) + '" rx="2" fill="' + barColor + '"/>';
    if (val > 0) bars += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="2" rx="1" fill="rgba(174,193,205,0.9)"/>';
    if (i % labelFreq === 0) {
      labels += '<text x="' + (x + barW/2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.3)">' + chartLabels[i] + '</text>';
    }
  });

  const svgChart = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">' +
    gridLines + bars + labels + '</svg>';

  // Format summary values
  const prodColor = isKO ? 'var(--red)' : 'var(--energy)';
  const peakVal = Math.max(...chartData);
  const peakFmt = peakVal >= 1000 ? (peakVal/1000).toFixed(1) + ' MWh' : peakVal.toFixed(1) + ' ' + chartUnit;
  const totalFmt = totalChartVal >= 1000 ? (totalChartVal/1000).toFixed(1) + ' MWh' : totalChartVal.toFixed(1) + ' ' + chartUnit;
  const peakLabel = 'Pic';

  html += '<div class="gd-chart-card">' +
    '<div class="gd-chart-title">' +
      '<span>' + chartTitle + '</span>' +
      '<span class="gd-chart-peak">' + peakLabel + ' : <strong style="color:' + prodColor + ';">' + peakFmt + '</strong> · Total : <strong style="color:' + prodColor + ';">' + totalFmt + '</strong></span>' +
    '</div>' +
    svgChart +
    '</div>';

  // Production KPIs — fully filter-aware
  let prodVal, prodUnit, prodSub, hVal, hUnit, hSub, hColor;
  let loadVal, loadUnit, loadSub, lvmvVal, lvmvUnit, lvmvSub;
  if (f === 'month') {
    const _cm3 = isCurrentMonth(selectedMonthIndex);
    const _mLbl = _cm3 ? 'ce mois' : MONTH_SHORT[selectedMonthIndex];
    let mProd, jours;
    if (_cm3) {
      const dp = g.dailyProd || []; mProd = dp.reduce((a,b) => a + b, 0);
      jours = dp.filter(v => v > 0).length;
    } else {
      mProd = (g.monthlyProd||[])[selectedMonthIndex]||0;
      jours = mProd > 0 ? Math.ceil((g.monthlyHours||[])[selectedMonthIndex] / 24) || 0 : 0;
    }
    prodVal = mProd > 1000 ? (mProd/1000).toFixed(1) : mProd.toFixed(1);
    prodUnit = mProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production ' + _mLbl;
    hVal = jours; hUnit = 'jours'; hSub = 'Jours de production';
    hColor = jours > 20 ? 'var(--energy)' : jours > 0 ? 'var(--orange)' : 'var(--red)';
    let mxLoad;
    if (_cm3) { const dml = g.dailyMaxLoad || []; mxLoad = Math.max(...dml, 0); }
    else { mxLoad = (g.monthlyMaxLoad||[])[selectedMonthIndex]||0; }
    loadVal = mxLoad.toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge ' + _mLbl;
    let mLvmv;
    if (_cm3) { const dlv = g.dailyConsLVMV || []; mLvmv = dlv.reduce((a,b) => a+b, 0); }
    else { mLvmv = (g.monthlyConsLVMV||[])[selectedMonthIndex]||0; }
    lvmvVal = mLvmv > 0 ? mLvmv.toFixed(1) : '—'; lvmvUnit = mLvmv > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires ' + _mLbl;
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3;
    let qProd = 0, qJours = 0, qMaxLoad = 0, qLvmv = 0;
    for (let mi = startM; mi < startM + 3; mi++) {
      qProd += (g.monthlyProd||[])[mi]||0;
      qJours += ((g.monthlyHours||[])[mi]||0) > 0 ? Math.ceil((g.monthlyHours||[])[mi] / 24) : 0;
      const ml = (g.monthlyMaxLoad||[])[mi]||0; if (ml > qMaxLoad) qMaxLoad = ml;
      qLvmv += (g.monthlyConsLVMV||[])[mi]||0;
    }
    const qLbl = 'Q' + selectedQuarter;
    prodVal = qProd > 1000 ? (qProd/1000).toFixed(1) : qProd.toFixed(1);
    prodUnit = qProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production ' + qLbl;
    hVal = qJours; hUnit = 'jours'; hSub = 'Jours de production';
    hColor = qJours > 60 ? 'var(--energy)' : qJours > 0 ? 'var(--orange)' : 'var(--red)';
    loadVal = qMaxLoad.toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge ' + qLbl;
    lvmvVal = qLvmv > 0 ? qLvmv.toFixed(1) : '—'; lvmvUnit = qLvmv > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires ' + qLbl;
  } else {
    const mp = g.monthlyProd || []; const yProd = mp.reduce((a,b) => a + b, 0);
    const mois = mp.filter(v => v > 0).length;
    prodVal = yProd > 1000 ? (yProd/1000).toFixed(1) : yProd.toFixed(1);
    prodUnit = yProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production ' + selectedYear;
    hVal = mois; hUnit = 'mois'; hSub = 'Mois de production sur 12';
    hColor = mois > 6 ? 'var(--energy)' : mois > 0 ? 'var(--orange)' : 'var(--red)';
    const yml = g.monthlyMaxLoad || []; const mxLoad = Math.max(...yml, 0);
    loadVal = mxLoad.toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge ' + selectedYear;
    const ylv = g.monthlyConsLVMV || []; const yLvmv = ylv.reduce((a,b) => a+b, 0);
    lvmvVal = yLvmv > 0 ? yLvmv.toFixed(1) : '—'; lvmvUnit = yLvmv > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires ' + selectedYear;
  }
  const prodRow = [
    { label:'Énergie produite',  value: prodVal, unit: prodUnit, sub: prodSub, color: isKO ? 'var(--red)' : null },
    { label:'Charge max',        value: loadVal, unit: loadUnit, sub: loadSub, color: isKO ? 'var(--red)' : null },
    { label:'Conso LV/MV',       value: lvmvVal, unit: lvmvUnit, sub: lvmvSub, color: null },
    { label:'Heures de marche',  value: hVal, unit: hUnit, sub: hSub, color: hColor },
  ];
  html += '<div class="gd-kpi-grid">' + prodRow.map(c =>
    '<div class="gd-kpi-card" style="background:' + bg + ';border-color:' + bc + ';">' +
    '<div class="gd-kpi-label" style="color:' + lc + ';">' + c.label + '</div>' +
    '<div class="gd-kpi-value" style="' + (c.color ? 'color:' + c.color + ';' : '') + (String(c.value).length > 5 ? 'font-size:20px;' : '') + '">' +
      c.value + (c.unit ? '<span class="gd-kpi-unit">' + c.unit + '</span>' : '') +
    '</div>' +
    '<div class="gd-kpi-sub">' + c.sub + '</div>' +
    '</div>'
  ).join('') + '</div>';

  // ── Section 3 — Combustible (filter-aware) ──
  html += '<div class="gd-section">Combustible</div>';
  html += '<div class="gd-metrics-grid">';
  let fHFO, fLFO, fuelPeriod;
  if (f === 'month') {
    const _cm4 = isCurrentMonth(selectedMonthIndex);
    if (_cm4) {
      const dhfo = g.dailyHFO || []; fHFO = dhfo.reduce((a,b) => a+b, 0);
      const dlfo = g.dailyLFO || []; fLFO = dlfo.reduce((a,b) => a+b, 0);
    } else {
      fHFO = (g.monthlyHFO||[])[selectedMonthIndex]||0;
      fLFO = (g.monthlyLFO||[])[selectedMonthIndex]||0;
    }
    fuelPeriod = _cm4 ? 'ce mois' : MONTH_SHORT[selectedMonthIndex];
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3; fHFO = 0; fLFO = 0;
    for (let mi = startM; mi < startM + 3; mi++) {
      fHFO += (g.monthlyHFO||[])[mi]||0;
      fLFO += (g.monthlyLFO||[])[mi]||0;
    }
    fuelPeriod = 'Q' + selectedQuarter;
  } else {
    const mhfo = g.monthlyHFO || []; fHFO = mhfo.reduce((a,b) => a+b, 0);
    const mlfo = g.monthlyLFO || []; fLFO = mlfo.reduce((a,b) => a+b, 0);
    fuelPeriod = String(selectedYear);
  }
  const fuelMetrics = [
    { label:'Conso HFO',   icon:'🛢️', value: fHFO > 0 ? parseFloat(fHFO).toFixed(1) : '—', unit: fHFO > 0 ? 'L' : '', sub:'Heavy Fuel Oil · ' + fuelPeriod },
    { label:'Conso LFO',   icon:'⛽',  value: fLFO > 0 ? parseFloat(fLFO).toFixed(1) : '0',  unit: 'L', sub:'Light Fuel Oil · ' + fuelPeriod },
    { label:'Temp. Fuel',  icon:'🌡️',  value: g.fuelOilTemp > 0 ? parseFloat(g.fuelOilTemp).toFixed(1) : '—', unit: g.fuelOilTemp > 0 ? '°C' : '', sub:'Température fuel oil',
      color: g.fuelOilTemp > 100 ? 'var(--red)' : g.fuelOilTemp > 90 ? 'var(--orange)' : (g.fuelOilTemp > 0 ? 'var(--energy)' : null) },
  ];
  fuelMetrics.forEach(m =>
    html += '<div class="gd-metric-card" style="background:' + bg + ';border-color:' + bc + ';">' +
      '<div class="gd-metric-top"><div class="gd-metric-label" style="color:' + lc + ';">' + m.label + '</div><div class="gd-metric-icon">' + m.icon + '</div></div>' +
      '<div class="gd-metric-value" style="' + (m.color ? 'color:' + m.color + ';' : '') + '">' + m.value + (m.unit ? '<span class="gd-metric-unit">' + m.unit + '</span>' : '') + '</div>' +
      '<div class="gd-metric-sub">' + m.sub + '</div>' +
    '</div>'
  );
  html += '</div>';

  // ── Section 4 — Huile (filter-aware for conso & topup) ──
  html += '<div class="gd-section">Huile moteur</div>';
  html += '<div class="gd-metrics-grid" style="grid-template-columns:repeat(4,1fr);">';
  let fOilC, fOilT, oilPeriod;
  if (f === 'month') {
    const _cm5 = isCurrentMonth(selectedMonthIndex);
    if (_cm5) {
      const doc = g.dailyOilConso || []; fOilC = doc.reduce((a,b) => a+b, 0);
      const dot = g.dailyOilTopUp || []; fOilT = dot.reduce((a,b) => a+b, 0);
    } else {
      fOilC = (g.monthlyOilConso||[])[selectedMonthIndex]||0;
      fOilT = (g.monthlyOilTopUp||[])[selectedMonthIndex]||0;
    }
    oilPeriod = _cm5 ? 'ce mois' : MONTH_SHORT[selectedMonthIndex];
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3; fOilC = 0; fOilT = 0;
    for (let mi = startM; mi < startM + 3; mi++) {
      fOilC += (g.monthlyOilConso||[])[mi]||0;
      fOilT += (g.monthlyOilTopUp||[])[mi]||0;
    }
    oilPeriod = 'Q' + selectedQuarter;
  } else {
    const moc = g.monthlyOilConso || []; fOilC = moc.reduce((a,b) => a+b, 0);
    const mot = g.monthlyOilTopUp || []; fOilT = mot.reduce((a,b) => a+b, 0);
    oilPeriod = String(selectedYear);
  }
  const oilMetrics = [
    { label:'Consommation huile', icon:'🛢️', value: fOilC > 0 ? fOilC.toFixed(1) : '—', unit: fOilC > 0 ? 'L' : '', sub:'Conso · ' + oilPeriod },
    { label:'Appoint huile',      icon:'➕',  value: fOilT > 0 ? parseFloat(fOilT).toFixed(1) : '0', unit:'L', sub:'Top-up · ' + oilPeriod,
      color: fOilT > 50 ? 'var(--orange)' : null },
    { label:'Niveau carter',      icon:'📊',  value: g.oilSumpLevel > 0 ? g.oilSumpLevel.toFixed(1) : '—', unit: g.oilSumpLevel > 0 ? 'cm' : '', sub:'Oil sump level',
      color: g.oilSumpLevel > 0 && g.oilSumpLevel < 10 ? 'var(--red)' : g.oilSumpLevel > 0 && g.oilSumpLevel < 12 ? 'var(--orange)' : null },
    { label:'Pression huile',     icon:'⚡',  value: g.lubeOilPressure > 0 ? g.lubeOilPressure.toFixed(1) : '—', unit: g.lubeOilPressure > 0 ? 'bar' : '', sub:'Lube oil pressure',
      color: g.lubeOilPressure > 0 && g.lubeOilPressure < 3.5 ? 'var(--red)' : g.lubeOilPressure > 0 && g.lubeOilPressure < 4.0 ? 'var(--orange)' : (g.lubeOilPressure > 0 ? 'var(--energy)' : null) },
  ];
  oilMetrics.forEach(m =>
    html += '<div class="gd-metric-card" style="background:' + bg + ';border-color:' + bc + ';grid-column:auto;">' +
      '<div class="gd-metric-top"><div class="gd-metric-label" style="color:' + lc + ';">' + m.label + '</div><div class="gd-metric-icon">' + m.icon + '</div></div>' +
      '<div class="gd-metric-value" style="' + (m.color ? 'color:' + m.color + ';' : '') + '">' + m.value + (m.unit ? '<span class="gd-metric-unit">' + m.unit + '</span>' : '') + '</div>' +
      '<div class="gd-metric-sub">' + m.sub + '</div>' +
    '</div>'
  );
  // 4th card → 2 cols for oil row (set metrics grid to 4 cols via inline)
  html += '</div>';

  // ── Section 5 — SFOC + SLOC (filter-aware) ──
  html += '<div class="gd-section">Consommations spécifiques</div>';

  // Recalculate SFOC/SLOC from aggregated data based on filter
  const HFO_DENSITY = 0.96, OIL_DENSITY = 0.90;
  let calcSfoc = null, calcSloc = null;
  if (f === 'month') {
    const _cm6 = isCurrentMonth(selectedMonthIndex);
    let mProdKwh, mHfoL, mOilL;
    if (_cm6) {
      mProdKwh = (g.dailyProd || []).reduce((a,b) => a+b, 0);
      mHfoL = (g.dailyHFO || []).reduce((a,b) => a+b, 0);
      mOilL = (g.dailyOilConso || []).reduce((a,b) => a+b, 0);
    } else {
      mProdKwh = (g.monthlyProd||[])[selectedMonthIndex]||0;
      mHfoL = (g.monthlyHFO||[])[selectedMonthIndex]||0;
      mOilL = (g.monthlyOilConso||[])[selectedMonthIndex]||0;
    }
    if (mProdKwh > 0 && mHfoL > 0) calcSfoc = Math.round((mHfoL * HFO_DENSITY) / mProdKwh * 1000 * 10) / 10;
    if (mProdKwh > 0 && mOilL > 0) calcSloc = Math.round((mOilL * OIL_DENSITY) / mProdKwh * 1000 * 100) / 100;
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3;
    let qProd = 0, qHfo = 0, qOil = 0;
    for (let mi = startM; mi < startM + 3; mi++) {
      qProd += (g.monthlyProd||[])[mi]||0;
      qHfo += (g.monthlyHFO||[])[mi]||0;
      qOil += (g.monthlyOilConso||[])[mi]||0;
    }
    if (qProd > 0 && qHfo > 0) calcSfoc = Math.round((qHfo * HFO_DENSITY) / qProd * 1000 * 10) / 10;
    if (qProd > 0 && qOil > 0) calcSloc = Math.round((qOil * OIL_DENSITY) / qProd * 1000 * 100) / 100;
  } else {
    const yProdKwh = (g.monthlyProd || []).reduce((a,b) => a+b, 0);
    const yHfoL = (g.monthlyHFO || []).reduce((a,b) => a+b, 0);
    const yOilL = (g.monthlyOilConso || []).reduce((a,b) => a+b, 0);
    if (yProdKwh > 0 && yHfoL > 0) calcSfoc = Math.round((yHfoL * HFO_DENSITY) / yProdKwh * 1000 * 10) / 10;
    if (yProdKwh > 0 && yOilL > 0) calcSloc = Math.round((yOilL * OIL_DENSITY) / yProdKwh * 1000 * 100) / 100;
  }

  const sfocVal   = calcSfoc;
  const sfocColor = sfocVal === null ? 'var(--text-dim)' : sfocVal <= 250 ? 'var(--energy)' : 'var(--red)';
  const sfocPct   = sfocVal !== null ? Math.min(100, Math.max(0, ((sfocVal - 150) / 200) * 100)) : 0;
  const sfocLimPct= ((250 - 150) / 200) * 100;
  const sfocDiff  = sfocVal !== null ? (sfocVal <= 250 ? '−' + (250 - sfocVal).toFixed(1) + ' g/kWh sous la limite' : '+' + (sfocVal - 250).toFixed(1) + ' g/kWh au-dessus de la limite') : 'Pas de données — moteur à l\'arrêt';

  const slocVal   = calcSloc;
  const slocColor = slocVal === null ? 'var(--text-dim)' : slocVal <= 1.0 ? 'var(--energy)' : 'var(--red)';
  const slocPct   = slocVal !== null ? Math.min(100, Math.max(0, (slocVal / 2.0) * 100)) : 0;
  const slocLimPct= (1.0 / 2.0) * 100;
  const slocDiff  = slocVal !== null ? (slocVal <= 1.0 ? '−' + (1.0 - slocVal).toFixed(1) + ' g/kWh sous la limite' : '+' + (slocVal - 1.0).toFixed(1) + ' g/kWh au-dessus de la limite') : 'Pas de données — moteur à l\'arrêt';

  const gaugeDefs = [
    { name:'SFOC', desc:'Specific Fuel Oil Consumption', norm:'Limite : 250 g/kWh',
      val: sfocVal !== null ? sfocVal.toFixed(1) : '—', unit:'g/kWh', color:sfocColor,
      pct:sfocPct, limPct:sfocLimPct, lo:'150', hi:'350', limLabel:'250', diff:sfocDiff },
    { name:'SLOC', desc:'Specific Lube Oil Consumption', norm:'Limite : 1.00 g/kWh',
      val: slocVal !== null ? slocVal.toFixed(1) : '—', unit:'g/kWh', color:slocColor,
      pct:slocPct, limPct:slocLimPct, lo:'0', hi:'2.0', limLabel:'1.0', diff:slocDiff }
  ];

  html += '<div class="gd-gauge-row">' + gaugeDefs.map(gd =>
    '<div class="gd-gauge-card">' +
    '<div class="gd-gauge-header"><div><div class="gd-gauge-name">' + gd.name + '</div><div class="gd-gauge-desc">' + gd.desc + '</div></div>' +
    '<div><div class="gd-gauge-val" style="color:' + gd.color + ';">' + gd.val + '<span class="gd-gauge-unit">' + gd.unit + '</span></div></div></div>' +
    '<div class="gd-gauge-bar-wrap"><div class="gd-gauge-bar-bg">' +
      '<div class="gd-gauge-bar-fill" style="width:' + gd.pct + '%;background:' + gd.color + ';"></div>' +
      '<div class="gd-gauge-bar-limit" style="left:' + gd.limPct + '%;"></div>' +
    '</div>' +
    '<div class="gd-gauge-limits"><span>' + gd.lo + '</span><span style="color:rgba(255,255,255,0.4);font-weight:600;">' + gd.limLabel + '</span><span>' + gd.hi + '</span></div></div>' +
    '<div class="gd-gauge-delta" style="color:' + gd.color + ';">' + gd.diff + '</div>' +
    '<div class="gd-gauge-norm" style="color:rgba(255,255,255,0.25);">' + gd.norm + '</div>' +
    '</div>'
  ).join('') + '</div>';

  // ── Section 6 — Maintenance ──
  html += '<div class="gd-section">Maintenance</div>';
  const maintIcon = isKO ? '🔴' : g.maint === 'RAS' ? '✅' : '🔧';
  html += '<div class="gd-maint-card" style="background:' + bg + ';border-color:' + bc + ';">' +
    '<div class="gd-maint-icon">' + maintIcon + '</div>' +
    '<div><div class="gd-maint-label" style="color:' + lc + ';">Prochaine intervention</div>' +
    '<div class="gd-maint-value">' + g.maint + '</div></div>' +
    '</div>';

  document.getElementById('gd-body').innerHTML = html;
}

// ══ ENR DOMContentLoaded initialization ══
document.addEventListener('DOMContentLoaded', function() {
  enrSelectedMonthIndex = getEnrDataMonth() - 1;
  populateEnrMonthDropdowns();
  document.querySelectorAll('.enr-month-btn-wrap .tfilter').forEach(function(b) {
    b.textContent = MONTH_SHORT[enrSelectedMonthIndex];
  });
});


