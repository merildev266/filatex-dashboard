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
  var ls = document.getElementById('login-screen');
  if(ls) ls.classList.add('hidden');
}

// ══ NAVIGATION ══
function scrollTop(el) { if(el) el.scrollTop = 0; }
function openPage(pole) {
  if (pole === 'energy') updateEnergyHfoCard();
  const el = document.getElementById('page-' + pole);
  if(el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; scrollTop(el); }
  updateNavActive(pole);
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
});
