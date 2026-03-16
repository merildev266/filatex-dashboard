/* === Reporting JS === */

// ══ ENR REPORTING DATA (loaded from reporting_data.js) ══
// Expected global: window.REPORTING_ENR = { week, projects[], payments[] }

function initReporting() {
  var data = window.REPORTING_ENR || null;
  renderReportingPoleKpis(data);
}

function renderReportingPoleKpis(data) {
  var el = document.getElementById('rpt-pole-enr-kpis');
  if (!el) return;
  if (!data || !data.projects) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">Aucune donnee</div>';
    return;
  }
  var ps = data.projects;
  var total = ps.length;
  var onTrack = ps.filter(function(p) { return p.glissement <= 0; }).length;
  var delayed = ps.filter(function(p) { return p.glissement > 0; }).length;
  var avgProg = Math.round(ps.reduce(function(s, p) { return s + (p.avancement || 0); }, 0) / total);

  el.innerHTML =
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#00ab63;">' + total + '</span><span class="kl">Projets</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#5aafaf;">' + onTrack + '</span><span class="kl">On track</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#E05C5C;">' + delayed + '</span><span class="kl">Retard</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#FDB823;">' + avgProg + '%</span><span class="kl">Avg</span></div>';
}

function openReportingPole(pole) {
  if (pole === 'enr') {
    document.querySelector('.rpt-poles-grid').style.display = 'none';
    document.getElementById('rpt-global-summary').style.display = 'none';
    var detail = document.getElementById('rpt-enr-detail');
    detail.style.display = 'block';
    renderEnrDetail();
  }
}

function closeReportingPole() {
  document.getElementById('rpt-enr-detail').style.display = 'none';
  document.querySelector('.rpt-poles-grid').style.display = '';
  document.getElementById('rpt-global-summary').style.display = '';
}

function renderEnrDetail() {
  var data = window.REPORTING_ENR;
  if (!data || !data.projects) return;
  var ps = data.projects;

  // Week label
  var weekEl = document.getElementById('rpt-enr-week');
  if (weekEl) weekEl.textContent = data.week || '—';

  // KPI bar
  var total = ps.length;
  var termine = ps.filter(function(p) { return p.phase === 'Termine'; }).length;
  var construction = ps.filter(function(p) { return p.phase === 'Construction'; }).length;
  var dev = ps.filter(function(p) { return p.phase === 'Developpement'; }).length;
  var planifie = ps.filter(function(p) { return p.phase === 'Planifie'; }).length;
  var delayed = ps.filter(function(p) { return p.glissement > 0; }).length;
  var totalMw = ps.reduce(function(s, p) { return s + (p.puissance || 0); }, 0);

  var kpiBar = document.getElementById('rpt-enr-kpi-bar');
  kpiBar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + total + '</div><div class="kl">Total Projets</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + totalMw.toFixed(1) + '</div><div class="kl">MWc Pipeline</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + termine + '</div><div class="kl">Termines</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + construction + '</div><div class="kl">Construction</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + (dev + planifie) + '</div><div class="kl">Dev / Planifie</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#E05C5C;">' + delayed + '</div><div class="kl">En retard</div></div>';

  // Table
  var wrap = document.getElementById('rpt-enr-table-wrap');
  var html = '<table class="rpt-table"><thead><tr>' +
    '<th>Projet</th><th>Resp.</th><th>Type</th><th>MWc</th><th>Phase</th>' +
    '<th>Avancement</th><th>Glissement</th><th>EPC</th>' +
    '<th>Blocages & Risques</th><th>Actions S</th><th>Commentaires DG</th>' +
    '</tr></thead><tbody>';

  // Sort: Construction first, then Dev, then Planifie, then Termine
  var phaseOrder = { 'Construction': 0, 'Developpement': 1, 'Planifie': 2, 'Termine': 3 };
  var sorted = ps.slice().sort(function(a, b) {
    var oa = phaseOrder[a.phase] != null ? phaseOrder[a.phase] : 9;
    var ob = phaseOrder[b.phase] != null ? phaseOrder[b.phase] : 9;
    if (oa !== ob) return oa - ob;
    return (b.avancement || 0) - (a.avancement || 0);
  });

  sorted.forEach(function(p) {
    var phaseBadge = getPhaseBadge(p.phase);
    var progColor = p.avancement >= 80 ? '#00ab63' : p.avancement >= 40 ? '#FDB823' : '#5aafaf';
    var glissColor = p.glissement > 30 ? '#E05C5C' : p.glissement > 0 ? '#FDB823' : '#00ab63';
    var glissText = p.glissement > 0 ? '+' + p.glissement + 'j' : p.glissement === 0 ? '0j' : p.glissement + 'j';

    html += '<tr>' +
      '<td class="nowrap" style="font-weight:600;">' + p.projet + '</td>' +
      '<td class="nowrap">' + (p.responsable || '') + '</td>' +
      '<td class="nowrap">' + (p.type || '') + '</td>' +
      '<td class="nowrap" style="text-align:right;">' + (p.puissance || 0) + '</td>' +
      '<td>' + phaseBadge + '</td>' +
      '<td><span style="font-weight:600;color:' + progColor + ';">' + (p.avancement || 0) + '%</span>' +
        '<div class="rpt-prog-bar"><div class="rpt-prog-fill" style="width:' + (p.avancement || 0) + '%;background:' + progColor + ';"></div></div></td>' +
      '<td style="color:' + glissColor + ';font-weight:600;">' + glissText + '</td>' +
      '<td class="nowrap">' + (p.epc || '') + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.blocages || '') + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.actions || '') + '</td>' +
      '<td style="font-size:11px;color:var(--text-dim);">' + (p.commentaires_dg || '') + '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function getPhaseBadge(phase) {
  switch (phase) {
    case 'Termine': return '<span class="rpt-badge rpt-badge-green">Termine</span>';
    case 'Construction': return '<span class="rpt-badge rpt-badge-orange">Construction</span>';
    case 'Developpement': return '<span class="rpt-badge rpt-badge-blue">Developpement</span>';
    case 'Planifie': return '<span class="rpt-badge rpt-badge-dim">Planifie</span>';
    default: return '<span class="rpt-badge rpt-badge-dim">' + (phase || '—') + '</span>';
  }
}

// ══ AUTO-UPDATE ENR PROJECTS IN ENERGY.JS ══
// After reporting data is loaded, update enrEnrich with latest weekly data
function syncReportingToEnrProjects() {
  var data = window.REPORTING_ENR;
  if (!data || !data.projects || typeof enrProjects === 'undefined') return;

  data.projects.forEach(function(rp) {
    if (!rp.id) return;
    // Find in enrProjects
    var ep = enrProjects.find(function(p) { return p.id === rp.id; });
    if (!ep) return;

    // Update fields from weekly reporting
    if (rp.avancement != null) ep.constProg = rp.avancement / 100;
    if (rp.glissement != null) ep.glissement = rp.glissement;
    if (rp.epc) ep.epciste = rp.epc;
    if (rp.responsable) ep.lead = rp.responsable;
  });
}

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  initReporting();
  // Sync after a tick to ensure energy.js has loaded
  setTimeout(syncReportingToEnrProjects, 100);
});
