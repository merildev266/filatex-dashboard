/* === Shared JS === */

// ══ STATE (must be at top for cross-file access) ══
var currentFilter = 'month', currentSite = null;
var selectedMonthIndex = new Date().getMonth();
var selectedQuarter = Math.floor(new Date().getMonth() / 3) + 1;
var selectedYear = new Date().getFullYear();
var MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var MONTH_SHORT = ['01','02','03','04','05','06','07','08','09','10','11','12'];

/* ── VIEWPORT SCALING — résolution de référence 1440px ── */
// ── VIEWPORT SCALING — résolution de référence 1440px ──
(function(){
  var REF = 1440;
  function scale() {
    if (!document.body) return;
    var isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Mobile : pas de scaling, layout responsive natif
      document.body.style.transform = '';
      document.body.style.width = '';
      document.body.style.height = '';
      return;
    }
    var ratio = Math.min(Math.max(window.innerWidth / REF, 0.55), 1);
    if (ratio === 1) {
      document.body.style.transform = '';
      document.body.style.width = REF + 'px';
      document.body.style.height = '';
      document.body.style.margin = '0 auto';
      document.body.style.position = '';
      document.body.style.left = '';
      document.documentElement.style.overflow = 'auto';
    } else {
      var offset = (window.innerWidth - REF * ratio) / 2;
      document.body.style.transform = 'scale(' + ratio + ')';
      document.body.style.transformOrigin = 'top left';
      document.body.style.width = REF + 'px';
      document.body.style.height = Math.ceil(window.innerHeight / ratio) + 'px';
      document.body.style.position = 'absolute';
      document.body.style.left = offset + 'px';
      document.body.style.margin = '';
      document.documentElement.style.overflow = 'hidden';
    }
  }
  if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', scale);
  } else {
    scale();
  }
  window.addEventListener('resize', scale);
})();

function checkLogin(){
  var pwd=document.getElementById('login-pwd').value;
  if(pwd==='1979'){
    document.getElementById('login-screen').classList.add('hidden');
    sessionStorage.setItem('dash_auth','1');
  } else {
    document.getElementById('login-error').textContent='Mot de passe incorrect';
    document.getElementById('login-pwd').value='';
  }
}
// Auto-login if already authenticated in this session
if(sessionStorage.getItem('dash_auth')==='1'){
  document.getElementById('login-screen').classList.add('hidden');
}

// ══ NAVIGATION ══
function scrollTop(el) { if(el) el.scrollTop = 0; }
function openPage(pole) {
  if (pole === 'energy') updateEnergyHfoCard();
  const el = document.getElementById('page-' + pole);
  if(el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; scrollTop(el); }
  updateNavActive(pole);
}

// ── Met à jour la card HFO de la page Énergie depuis les données live ──
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
function closePage(pageId) {
  const el = document.getElementById(pageId);
  if(el) { el.classList.remove('active'); document.body.style.overflow = ''; scrollTop(el); }
  updateNavActive('home');
}

function navTo(pole) {
  // Close all panels
  ['panel-project-detail','panel-diego-detail','panel-dev-project',
   'panel-enr-projets','panel-enr-production','panel-hfo-projets','panel-groupe-detail','detail-panel','capex-section-panel']
    .forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.style.transform = 'translateX(100%)'; }
    });
  // Close all inner pages
  document.querySelectorAll('.inner-page').forEach(function(ip) { ip.classList.remove('active'); });
  // Close all main pages
  document.querySelectorAll('.placeholder-page').forEach(function(p) { p.classList.remove('active'); });
  document.body.style.overflow = '';
  // Open target page
  openPage(pole);
}

function goHome() {
  ['panel-project-detail','panel-diego-detail','panel-dev-project',
   'panel-enr-projets','panel-enr-production','panel-hfo-projets','panel-groupe-detail','detail-panel','capex-section-panel']
    .forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.style.transform = 'translateX(100%)'; }
    });
  document.querySelectorAll('.inner-page').forEach(function(ip) { ip.classList.remove('active'); });
  document.querySelectorAll('.placeholder-page').forEach(function(p) { p.classList.remove('active'); });
  document.body.style.overflow = '';
  updateNavActive('home');
}

function updateNavActive(pole) {
  document.querySelectorAll('.bnav-item').forEach(function(b) { b.classList.remove('active'); });
  var active = document.querySelector('.bnav-item[data-pole="' + pole + '"]');
  if (active) active.classList.add('active');
}

function openInner(type) {
  if(type === 'hfo') { renderSites(); renderConsolidated(); }
  const el = document.getElementById('inner-' + type);
  if(el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; scrollTop(el); }
}
function closeInner(type) {
  const el = document.getElementById('inner-' + type);
  if(el) { el.classList.remove('active'); document.body.style.overflow = ''; scrollTop(el); }
}
/* ── Properties inner navigation ── */
function openPropsInner(type) {
  const el = document.getElementById('inner-props-' + type);
  if(el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; scrollTop(el); }
}
function closePropsInner(type) {
  const el = document.getElementById('inner-props-' + type);
  if(el) { el.classList.remove('active'); document.body.style.overflow = ''; scrollTop(el); }
}

// (state variables declared at top of file)

// ══ DOMContentLoaded ══
document.addEventListener('DOMContentLoaded', () => {
  // Initialize month dropdown with data month
  selectedMonthIndex = getDataMonth() - 1;
  populateMonthDropdowns();
  // Set month button labels to current month number
  document.querySelectorAll('.month-btn-wrap .tfilter').forEach(b => {
    b.textContent = MONTH_SHORT[selectedMonthIndex];
  });
  // Initialize ENR filter
  enrSelectedMonthIndex = getEnrDataMonth() - 1;
  populateEnrMonthDropdowns();
  document.querySelectorAll('.enr-month-btn-wrap .tfilter').forEach(b => {
    b.textContent = MONTH_SHORT[enrSelectedMonthIndex];
  });
  // Set filter label
  const lbl = document.getElementById('filter-label-text');
  if(lbl) lbl.textContent = MONTH_NAMES[selectedMonthIndex];
});
