/* === Reporting JS === */

// ══ ENR REPORTING DATA (loaded from reporting_data.js) ══
// Expected global: window.REPORTING_ENR = { week, projects[], payments[], weeks{}, currentSheet }

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
  document.querySelector('.rpt-poles-grid').style.display = 'none';
  document.getElementById('rpt-global-summary').style.display = 'none';
  if (pole === 'enr') {
    var detail = document.getElementById('rpt-enr-detail');
    detail.style.display = 'block';
    populateWeekSelector();
    renderEnrDetail();
  } else if (pole === 'inv') {
    var detail = document.getElementById('rpt-inv-detail');
    detail.style.display = 'block';
    renderInvReportingKpis('externe');
    renderInvReportingTable('externe');
  }
}

function closeReportingPole() {
  document.getElementById('rpt-enr-detail').style.display = 'none';
  document.getElementById('rpt-inv-detail').style.display = 'none';
  document.querySelector('.rpt-poles-grid').style.display = '';
  document.getElementById('rpt-global-summary').style.display = '';
}

// ══ WEEK SELECTOR ══
function populateWeekSelector() {
  var sel = document.getElementById('rpt-enr-week-select');
  if (!sel) return;
  var data = window.REPORTING_ENR;
  if (!data) return;

  sel.innerHTML = '';

  // If multi-week data available
  if (data.weeks && Object.keys(data.weeks).length > 0) {
    var keys = Object.keys(data.weeks).sort(function(a, b) {
      var na = parseInt(a.replace('S', ''));
      var nb = parseInt(b.replace('S', ''));
      return nb - na; // Most recent first
    });
    keys.forEach(function(k) {
      var w = data.weeks[k];
      var opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k + ' — ' + (w.week || '');
      if (k === (data.currentSheet || '')) opt.selected = true;
      sel.appendChild(opt);
    });
  } else {
    // Single week fallback
    var opt = document.createElement('option');
    opt.value = '_current';
    opt.textContent = data.week || 'Semaine courante';
    sel.appendChild(opt);
  }
}

function switchEnrWeek(sheetKey) {
  var data = window.REPORTING_ENR;
  if (!data || !data.weeks || !data.weeks[sheetKey]) return;

  var weekData = data.weeks[sheetKey];
  data.projects = weekData.projects;
  data.week = weekData.week;
  data.currentSheet = sheetKey;
  renderEnrDetail();
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
    '<th>Projet</th><th>MWc</th><th>Phase</th>' +
    '<th>Avancement</th><th>Glissement</th><th>EPC</th>' +
    '<th>Blocages & Risques</th><th>Actions S</th><th>Commentaires DG</th><th>Reponse</th>' +
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
      '<td class="nowrap" style="text-align:right;">' + (p.puissance || 0) + '</td>' +
      '<td>' + phaseBadge + '</td>' +
      '<td><span style="font-weight:600;color:' + progColor + ';">' + (p.avancement || 0) + '%</span>' +
        '<div class="rpt-prog-bar"><div class="rpt-prog-fill" style="width:' + (p.avancement || 0) + '%;background:' + progColor + ';"></div></div></td>' +
      '<td style="color:' + glissColor + ';font-weight:600;">' + glissText + '</td>' +
      '<td class="nowrap">' + (p.epc || '') + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.blocages || '') + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.actions || '') + '</td>' +
      '<td style="min-width:200px;">' +
        '<div class="rpt-dg-comment" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#ffd6b8;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(243,112,86,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '>' + escapeHtml(p.commentaires_dg || '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveReportingDgField(\'' + p.id + '\', \'comment\', this)" ' +
            'style="background:linear-gradient(135deg,#f37056,#e04030);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-dg-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(255,180,130,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '<td style="min-width:200px;">' +
        '<div class="rpt-dg-reponse" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#b8d6ff;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(86,140,243,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '>' + escapeHtml(p.reponse || '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveReportingDgField(\'' + p.id + '\', \'reponse\', this)" ' +
            'style="background:linear-gradient(135deg,#5686d6,#3060b0);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-rep-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(130,170,255,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
function syncReportingToEnrProjects() {
  var data = window.REPORTING_ENR;
  if (!data || !data.projects || typeof enrProjects === 'undefined') return;

  data.projects.forEach(function(rp) {
    if (!rp.id) return;
    var ep = enrProjects.find(function(p) { return p.id === rp.id; });
    if (!ep) return;
    if (rp.avancement != null) ep.constProg = rp.avancement / 100;
    if (rp.glissement != null) ep.glissement = rp.glissement;
    if (rp.epc) ep.epciste = rp.epc;
    if (rp.responsable) ep.lead = rp.responsable;
  });
}

// ══ SAVE DG COMMENT OR REPONSE FROM REPORTING TABLE ══
function saveReportingDgField(projectId, fieldType, btnEl) {
  var isComment = fieldType === 'comment';
  var editDiv = document.querySelector(
    (isComment ? '.rpt-dg-comment' : '.rpt-dg-reponse') + '[data-pid="' + projectId + '"]'
  );
  var statusEl = document.querySelector(
    (isComment ? '.rpt-dg-status' : '.rpt-rep-status') + '[data-pid="' + projectId + '"]'
  );
  if (!editDiv) return;

  var value = editDiv.innerText.trim();
  btnEl.disabled = true;
  btnEl.textContent = '...';
  statusEl.textContent = '';

  var body = { projectId: projectId };
  if (isComment) body.comment = value;
  else body.reponse = value;

  fetch('/api/comment/enr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) {
    var ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error('API non disponible (mode statique)');
    }
    return res.json().then(function(d) { return { ok: res.ok, data: d }; });
  })
  .then(function(result) {
    btnEl.disabled = false;
    btnEl.textContent = 'Enregistrer';
    if (result.ok) {
      statusEl.style.color = '#4caf50';
      statusEl.textContent = 'OK (' + result.data.sheet + ')';
      var data = window.REPORTING_ENR;
      if (data && data.projects) {
        var p = data.projects.find(function(x) { return x.id === projectId; });
        if (p) {
          if (isComment) p.commentaires_dg = value;
          else p.reponse = value;
        }
      }
      setTimeout(function() { statusEl.textContent = ''; }, 3000);
    } else {
      statusEl.style.color = '#f37056';
      statusEl.textContent = result.data.error || 'Erreur';
    }
  })
  .catch(function(err) {
    btnEl.disabled = false;
    btnEl.textContent = 'Enregistrer';
    statusEl.style.color = '#f37056';
    statusEl.textContent = err.message || 'Erreur connexion';
  });
}

// ══ INVESTMENTS REPORTING ══

var _rptInvFilter = 'externe';

function renderInvReportingPoleCard() {
  if (typeof invProjects === 'undefined') return;
  var total = invProjects.length;
  var ext = invProjects.filter(function(p) { return p.type === 'externe'; }).length;
  var int = invProjects.filter(function(p) { return p.type === 'interne'; }).length;
  var withCapex = invProjects.filter(function(p) { return p.capex !== null; }).length;

  var subEl = document.getElementById('rpt-pole-inv-sub');
  if (subEl) subEl.textContent = total + ' projets';

  var el = document.getElementById('rpt-pole-inv-kpis');
  if (!el) return;
  el.innerHTML =
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#f37056;">' + total + '</span><span class="kl">Projets</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#5aafaf;">' + ext + '</span><span class="kl">Externe</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#FDB823;">' + int + '</span><span class="kl">Interne</span></div>';
}

function renderInvReportingKpis(filter) {
  if (typeof invProjects === 'undefined') return;
  var ps = filter === 'all' ? invProjects : invProjects.filter(function(p) { return p.type === filter; });
  var total = ps.length;
  var ext = ps.filter(function(p) { return p.type === 'externe'; }).length;
  var int = ps.filter(function(p) { return p.type === 'interne'; }).length;
  var enCours = ps.filter(function(p) { return p.status === 'En cours'; }).length;

  var bar = document.getElementById('rpt-inv-kpi-bar');
  bar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#f37056;">' + total + '</div><div class="kl">Total Projets</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + ext + '</div><div class="kl">Externe</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + int + '</div><div class="kl">Interne</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#4ecdc4;">' + enCours + '</div><div class="kl">En cours</div></div>';
}

function renderInvReportingTable(filter) {
  if (typeof invProjects === 'undefined') return;
  var ps = filter === 'all' ? invProjects : invProjects.filter(function(p) { return p.type === filter; });

  var html = '<table class="rpt-table"><thead><tr>' +
    '<th>Projet</th><th>Type</th><th>Avancement</th>' +
    '<th>Point de blocage</th><th>Actions Prevues</th><th>Actions Realisees</th>' +
    '<th>Mise a jour</th>' +
    '</tr></thead><tbody>';

  var sorted = ps.slice().sort(function(a, b) {
    return a.nom.localeCompare(b.nom);
  });

  sorted.forEach(function(p) {
    var typeBadge = p.type === 'externe'
      ? '<span class="rpt-badge rpt-badge-blue">Externe</span>'
      : '<span class="rpt-badge rpt-badge-orange">Interne</span>';

    var editStyle = 'width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
      'border-radius:6px;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
      'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;';

    html += '<tr>' +
      '<td class="nowrap" style="font-weight:600;">' + escapeHtml(p.nom) + '</td>' +
      '<td>' + typeBadge + '</td>' +
      '<td style="min-width:140px;">' +
        '<div class="rpt-inv-field" data-pid="' + p.id + '" data-field="avancement" contenteditable="true" ' +
          'style="' + editStyle + 'color:#4ecdc4;" ' +
          'onfocus="this.style.borderColor=\'rgba(78,205,196,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
      '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-inv-field" data-pid="' + p.id + '" data-field="blocage" contenteditable="true" ' +
          'style="' + editStyle + 'color:#ff8a80;" ' +
          'onfocus="this.style.borderColor=\'rgba(255,80,80,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
      '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-inv-field" data-pid="' + p.id + '" data-field="actions_prevues" contenteditable="true" ' +
          'style="' + editStyle + 'color:#ffd6b8;" ' +
          'onfocus="this.style.borderColor=\'rgba(243,112,86,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
      '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-inv-field" data-pid="' + p.id + '" data-field="actions_realisees" contenteditable="true" ' +
          'style="' + editStyle + 'color:#b8d6ff;" ' +
          'onfocus="this.style.borderColor=\'rgba(86,140,243,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
      '</td>' +
      '<td class="nowrap" style="color:rgba(255,255,255,0.5);">S' + p.week + '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('rpt-inv-table-wrap').innerHTML = html;
}

function switchInvTab(tab) {
  _rptInvFilter = tab;
  document.querySelectorAll('.rpt-inv-tab').forEach(function(btn) {
    var isActive = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', isActive);
    btn.style.background = isActive ? 'rgba(243,112,86,0.15)' : 'rgba(255,255,255,0.04)';
    btn.style.color = isActive ? '#f37056' : '';
    btn.style.borderColor = isActive ? 'rgba(243,112,86,0.3)' : 'rgba(255,255,255,0.1)';
  });
  renderInvReportingKpis(tab);
  renderInvReportingTable(tab);
}

function saveInvDgField(projectId, fieldType, btnEl) {
  var isComment = fieldType === 'comment';
  var editDiv = document.querySelector(
    (isComment ? '.rpt-dg-comment' : '.rpt-inv-reponse') + '[data-pid="' + projectId + '"]'
  );
  var statusEl = document.querySelector(
    (isComment ? '.rpt-inv-status' : '.rpt-inv-rep-status') + '[data-pid="' + projectId + '"]'
  );
  if (!editDiv) return;

  var value = editDiv.innerText.trim();
  btnEl.disabled = true;
  btnEl.textContent = '...';
  statusEl.textContent = '';

  var body = { projectId: projectId };
  if (isComment) body.comment = value;
  else body.reponse = value;

  fetch('/api/comment/inv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) {
    var ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error('API non disponible (mode statique)');
    }
    return res.json().then(function(d) { return { ok: res.ok, data: d }; });
  })
  .then(function(result) {
    btnEl.disabled = false;
    btnEl.textContent = 'Enregistrer';
    if (result.ok) {
      statusEl.style.color = '#4caf50';
      statusEl.textContent = 'OK';
      setTimeout(function() { statusEl.textContent = ''; }, 3000);
    } else {
      statusEl.style.color = '#f37056';
      statusEl.textContent = result.data.error || 'Erreur';
    }
  })
  .catch(function(err) {
    btnEl.disabled = false;
    btnEl.textContent = 'Enregistrer';
    statusEl.style.color = '#f37056';
    statusEl.textContent = err.message || 'Erreur connexion';
  });
}

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  initReporting();
  renderInvReportingPoleCard();
  setTimeout(syncReportingToEnrProjects, 100);
});
