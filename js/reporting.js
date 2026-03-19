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

  var backBtn = document.getElementById('rpt-back-btn');
  var title = document.getElementById('rpt-sticky-title');
  var filters = document.getElementById('rpt-sticky-filters');

  if (pole === 'enr') {
    var detail = document.getElementById('rpt-enr-detail');
    detail.style.display = 'block';
    backBtn.textContent = 'Retour';
    backBtn.onclick = function() { closeReportingPole(); };
    backBtn.style.borderColor = 'rgba(0,171,99,0.3)';
    backBtn.style.color = '#00ab63';
    title.textContent = 'Reporting EnR';
    title.style.color = '#00ab63';
    // Inject week selector into sticky bar
    filters.innerHTML =
      '<select id="rpt-enr-week-select" onchange="switchEnrWeek(this.value)" ' +
        'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);' +
        'border-radius:8px;color:#00ab63;font-size:12px;font-weight:600;padding:5px 12px;' +
        'cursor:pointer;outline:none;font-family:Arial,sans-serif;">' +
      '</select>';
    populateWeekSelector();
    renderEnrDetail();
  } else if (pole === 'hfo') {
    var detail = document.getElementById('rpt-hfo-detail');
    detail.style.display = 'block';
    backBtn.textContent = 'Retour';
    backBtn.onclick = function() { closeReportingPole(); };
    backBtn.style.borderColor = 'rgba(0,171,99,0.3)';
    backBtn.style.color = '#00ab63';
    title.textContent = 'Reporting HFO';
    title.style.color = '#00ab63';
    filters.innerHTML = '';
    // Show the sub-cards, hide sub-details
    document.getElementById('rpt-hfo-cards').style.display = '';
    document.getElementById('rpt-hfo-overhauls-detail').style.display = 'none';
    document.getElementById('rpt-hfo-projets-detail').style.display = 'none';
  } else if (pole === 'lfo') {
    var detail = document.getElementById('rpt-lfo-detail');
    detail.style.display = 'block';
    backBtn.textContent = 'Retour';
    backBtn.onclick = function() { closeReportingPole(); };
    backBtn.style.borderColor = 'rgba(0,171,99,0.3)';
    backBtn.style.color = '#00ab63';
    title.textContent = 'Reporting LFO';
    title.style.color = '#00ab63';
    // Inject filter tabs for motor states
    filters.innerHTML =
      '<button class="rpt-lfo-tab active" onclick="switchLfoTab(\'all\')" data-tab="all" ' +
        'style="background:rgba(0,171,99,0.15);color:#00ab63;border:1px solid rgba(0,171,99,0.3);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Tous</button>' +
      '<button class="rpt-lfo-tab" onclick="switchLfoTab(\'au_f23\')" data-tab="au_f23" ' +
        'style="background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Au F23</button>' +
      '<button class="rpt-lfo-tab" onclick="switchLfoTab(\'installes\')" data-tab="installes" ' +
        'style="background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Installes</button>' +
      '<button class="rpt-lfo-tab" onclick="switchLfoTab(\'a_rapatrier\')" data-tab="a_rapatrier" ' +
        'style="background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">A rapatrier</button>' +
      '<button class="rpt-lfo-tab" onclick="switchLfoTab(\'a_definir\')" data-tab="a_definir" ' +
        'style="background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">A definir</button>';
    renderLfoReportingKpis('all');
    renderLfoReportingTable('all');
  } else if (pole === 'inv') {
    var detail = document.getElementById('rpt-inv-detail');
    detail.style.display = 'block';
    backBtn.textContent = 'Retour';
    backBtn.onclick = function() { closeReportingPole(); };
    backBtn.style.borderColor = 'rgba(243,112,86,0.3)';
    backBtn.style.color = '#f37056';
    title.textContent = 'Reporting Investments';
    title.style.color = '#f37056';
    // Inject week selector + tabs into sticky bar
    filters.innerHTML =
      '<select id="rpt-inv-week-select" onchange="switchInvWeek(this.value)" ' +
        'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);' +
        'border-radius:8px;color:#f37056;font-size:12px;font-weight:600;padding:5px 12px;' +
        'cursor:pointer;outline:none;font-family:Arial,sans-serif;">' +
      '</select>' +
      '<button class="rpt-inv-tab active" onclick="switchInvTab(\'externe\')" data-tab="externe" ' +
        'style="background:rgba(243,112,86,0.15);color:#f37056;border:1px solid rgba(243,112,86,0.3);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Externe</button>' +
      '<button class="rpt-inv-tab" onclick="switchInvTab(\'interne\')" data-tab="interne" ' +
        'style="background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);' +
        'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Interne</button>';
    populateInvWeekSelector();
    renderInvReportingKpis('externe');
    renderInvReportingTable('externe');
  } else if (pole === 'props') {
    var detail = document.getElementById('rpt-props-detail');
    detail.style.display = 'block';
    backBtn.textContent = 'Retour';
    backBtn.onclick = function() { closeReportingPole(); };
    backBtn.style.borderColor = 'rgba(253,184,35,0.3)';
    backBtn.style.color = '#FDB823';
    title.textContent = 'Reporting Properties';
    title.style.color = '#FDB823';
    filters.innerHTML = '';
    // Show the sub-cards, hide sub-details
    document.getElementById('rpt-props-cards').style.display = '';
    ['sav', 'tvx', 'dev', 'com'].forEach(function(s) {
      document.getElementById('rpt-props-' + s + '-detail').style.display = 'none';
    });
  }
}

function closeReportingPole() {
  document.getElementById('rpt-enr-detail').style.display = 'none';
  document.getElementById('rpt-inv-detail').style.display = 'none';
  document.getElementById('rpt-hfo-detail').style.display = 'none';
  document.getElementById('rpt-lfo-detail').style.display = 'none';
  document.getElementById('rpt-props-detail').style.display = 'none';
  document.querySelector('.rpt-poles-grid').style.display = '';
  document.getElementById('rpt-global-summary').style.display = '';

  // Restore sticky bar
  var backBtn = document.getElementById('rpt-back-btn');
  var title = document.getElementById('rpt-sticky-title');
  var filters = document.getElementById('rpt-sticky-filters');
  backBtn.textContent = 'Accueil';
  backBtn.onclick = function() { closePage('page-reporting'); };
  backBtn.style.borderColor = 'rgba(90,175,175,0.3)';
  backBtn.style.color = '#5aafaf';
  title.textContent = 'Reporting Hebdomadaire';
  title.style.color = '#5aafaf';
  filters.innerHTML = '';
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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
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

// Reporting data from Weekly_Investments_Avancement.xlsx
// Auto-generated - weeks with data: S07, S08, S09, S10, S11
var invReportingWeeks = {
  'S07': {
    week: 'Semaine 7  |  09/02/2026 - 13/02/2026',
    projects: {
      'Inv_E_OASIS': {
        avancement: '-Projet INLHE: 625k décaissé sur 845k, reste 220k dont 75k payé en janvier, 70k février, 75k mars\n-Acquisition OWP: SHA en cours de rédaction chez LEGIS, deadline 10/02, Board meeting 16/02 avec validation BP, projets suivants et timeline décaissement, signature SHA si terminé',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_ORGA EARTH': {
        avancement: '-Cloture Maurice: \n   -Signature des actes de cession de la filiale malgache: signée depot des actes février 2026\n   -Signature des appels de fonds en cours pour paiement des dettes maurice, à payer avant fin février pour cloturer dans les délais\n-OE Mada: \n  -URGENT: 23M AR à payer sur l\'échéance de décembre avant fin février\n  -Droits de communication 21/22/23 à effectuer\n  -EF 2025 à terminer\n  -Docs à envoyer à MCB pour l\'analyse restructuration des dettes',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_HAKANTO HOUSE': {
        avancement: '-Admin: Tous les contrats (partenariat, pacte d\'associés, prêts) sont rédigés et passent en revue DAC et signature\n\nHakanto Company: Signature chez Joel puis dépôt des statuts\nHCDM: statuts signés, acte de cession signé, PV AGE en cours de signature (reste HY et YO en physique)\n\n-Opérationnel: Hotel ouvert, communication commencée, doc de suivi KPI à remplir chaque mois par Bodo \n\n-Financier: CAPEX à décaisser pour le groupe electrogene et autres dépenses, BFR de 3 mois à décaisser selon modalités prêt (avant fin février)',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_MLF': {
        avancement: 'CSI prévu pour le 11/02 avec comme objectif:\n-Validation du TRI et terme du bail que l\'on proposera à MLF\n-Validation du mix du loyer (CA, RN, fixe)\n-Validation du projet\n\n-Proposition de loyer finale envoyée à MLF pour validation la semaine du 02/02',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_ENERGIESTRO': {
        avancement: '-Subvention BPI 2030 accepté pour 300k euros, une levée intermédiaire de 300k euros auprès des actionnaires aura lieu (Condition de la subvention)\n-R&D: VOSS toujours à 80%, avec les futurs changements, le prochain devrait etre a 100% (avril)',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_HOTEL TAMATAVE': {
        avancement: 'Dépôt du dossier à la banque toujours en suspens. Le prêt sera fait sur Filatex Ventures, les documents juridiques et autres ont été envoyé à l\'équipe DAC.',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_SUNFARMING': {
        avancement: 'LOI envoyée le 30/01, pas de retour depuis de la part de l\'actionnaire allemand',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_AFRIDOCTOR': {
        avancement: 'RAS. CA tout les ans pour avoir un rapport de leur part. Contact: Younseo younseo.rhee@afridoctor.com pour avoir des news périodiquement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_ARTEMIS': {
        avancement: 'RAS. Attente valorisation de sortie',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_BGFI': {
        avancement: 'RAS. Aucun retour de leur part. Un call doit être organisé pour rediscuter de notre offre faite en novembre. La main n\'est pas chez Ventures',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_OUI CODING': {
        avancement: 'RAS. 1 CA par an pour suivi investissement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_E_SEED STAR': {
        avancement: 'Investissement validé en CSI, attente factoring pour structurer l\'investissement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_CAFE MARY': {
        avancement: 'RAS. Revenu stable, pas de profit, potentiellement changer la gestion',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_GHU': {
        avancement: 'Paiement des dettes sur le fonds de commerce toujours en attente (399M + 184k euros), pression à mettre sur Yannick',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_HAYA': {
        avancement: 'Commande STAR en cours',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_MAISON DES COTONNIERS': {
        avancement: 'RAS, vérifier si loyers à jour',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_SHOW ROOM': {
        avancement: 'Filatex a des dettes envers SHOWROOM sur certaines commandes, RAS sur le business qui fonctionne mais problème de trésorerie a cause de ce retard de paiement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_SPORT-SENS LASER-SENS': {
        avancement: 'RAS. Loyers fixes payés jusqu\'à décembre, loyers variables seront à jour dès la semaine prochaine',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
      'Inv_I_TAXI BROUSSE PIZZA': {
        avancement: '-Admin: Document manquant: diplôme d\'une personne dans la gestion du snack, dépôt à l\'edbm une fois recu\n-Opé: Matériel en cours de réception actuellement à Tamatave, aménagement à faire ensuite du van',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S07'
      },
    }
  },
  'S08': {
    week: 'Semaine 8  |  16/02/2026 - 20/02/2026',
    projects: {
      'Inv_E_OASIS': {
        avancement: '-SHA revu par LEGIS, envoyé à Olivier\n-Décaissement urgent INLHE (75k en retard de 45j, 70k en retard de 15j)',
        blocage: 'Décaissement urgent INLHE ( en retard de 45j, 70k en retard de 15j)',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_ORGA EARTH': {
        avancement: '-Acte de cession: Juridique, voir avec Elianja régulierement\n-Appel de fonds signés: à envoyer à BR et IMARA pour paiement\n-23M AR à payer urgent avant fin fevrier OE MADA (échéance dette 12/25)\n-Droits de communication: en cours Fenohasina\n-EF 2025 + MCB Imtiaz 16/02\n-Recrutement CDP Fort Dauphin - Mehz / RH - qui paye?',
        blocage: '-Dettes mada à payer 23M, comment?',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_HAKANTO HOUSE': {
        avancement: '-Admin: validé par DAC, passe en signature DG (a confirmer avec Elianja)\n-HC et HCDM: statuts et autres docs signés, sont chez juridique pour dépôt\n-Financier: CAPEX à décaisser pour le groupe electrogene et autres dépenses, BFR de 3 mois à décaisser selon modalités prêt (avant fin février)',
        blocage: '-Financier: CAPEX à décaisser pour le groupe electrogene et autres dépenses, BFR de 3 mois à décaisser selon modalités prêt (avant fin février)',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_MLF': {
        avancement: 'CSI prévu avec comme objectif:\n-Validation du TRI et terme du bail que l\'on proposera à MLF\n-Validation du mix du loyer (CA, RN, fixe)\n-Validation du projet',
        blocage: 'DATE CSI A VALIDER : URGENT',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_ENERGIESTRO': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_HOTEL TAMATAVE': {
        avancement: '-Blocage sur le capital de Ventures qui est a 1M AR d\'apres la DAC\n-Bilan prévi Ventures; EF 2024 -2025 + 7 ans (semaine 16/02)\n-Signature contrat de bail Yannick',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_SUNFARMING': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_AFRIDOCTOR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_ARTEMIS': {
        avancement: 'RAS. Attente valorisation de sortie',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_BGFI': {
        avancement: 'RAS. Aucun retour de leur part. Un call doit être organisé pour rediscuter de notre offre faite en novembre. La main n\'est pas chez Ventures',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_OUI CODING': {
        avancement: 'RAS. 1 CA par an pour suivi investissement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_E_SEED STAR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_CAFE MARY': {
        avancement: 'RAS. Revenu stable, pas de profit, potentiellement changer la gestion',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_GHU': {
        avancement: 'Paiement des dettes sur le fonds de commerce toujours en attente (399M + 184k euros), pression à mettre sur Yannick',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_HAYA': {
        avancement: '-Commande STAR en cours\n-Carte fiscale EXSO - TVA problematique a régler',
        blocage: '-Révisions des comptes suivant les directives DACC',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_MAISON DES COTONNIERS': {
        avancement: 'RAS, vérifier si loyers à jour',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_SHOW ROOM': {
        avancement: 'Filatex a des dettes envers SHOWROOM sur certaines commandes, RAS sur le business qui fonctionne mais problème de trésorerie a cause de ce retard de paiement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_SPORT-SENS LASER-SENS': {
        avancement: 'RAS. Loyers fixes payés jusqu\'à décembre, loyers variables seront à jour dès la semaine prochaine',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
      'Inv_I_TAXI BROUSSE PIZZA': {
        avancement: '-Admin: Document manquant: diplôme d\'une personne dans la gestion du snack, dépôt à l\'edbm une fois recu\n-Opé: Matériel en cours de réception actuellement à Tamatave, aménagement à faire ensuite du van',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S08'
      },
    }
  },
  'S09': {
    week: 'Semaine 9  |  23/02/2026 - 27/02/2026',
    projects: {
      'Inv_E_OASIS': {
        avancement: '-SHA revu par LEGIS, envoyé à Olivier\n-Décaissement urgent INLHE (75k en retard de 45j, 70k en retard de 15j)',
        blocage: 'Décaissement urgent INLHE ( en retard de 45j, 70k en retard de 15j)',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_ORGA EARTH': {
        avancement: '-Acte de cession: Encours d\'enregistrement au niveau du Notaire + en attente de signature par Bertrand; mail fait\n-Appel de fonds signés: à envoyer à BR et IMARA pour paiement\n-23M AR à payer urgent: En cours de paiement par Ventures (demande de remboursement de la part de Bertrand faite)\n-Droits de communication:Les documents ont été reçu et liste en cours de production\n-EF 2025 pas encore terminé + MCB Fenohasina 23/02 - \n-Recrutement CDP Fort Dauphin - Mehz / RH - qui paye?',
        blocage: '-Dettes mada à payer 23M, comment? \nFehnohasina à contrôler',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_HAKANTO HOUSE': {
        avancement: '-Admin:contrat de partenariat et le pacte d\'associé sont en cours de finalisation suite aux observations émises par l\'équipe ventures.\n-HC et HCDM: statuts et autres docs signés, sont chez juridique pour dépôt - HC : documents de constitution déposé au niveau de l\'EDBM.\n-Financier: CAPEX à décaisser pour le groupe electrogene et autres dépenses, BFR de 3 mois à décaisser selon modalités prêt (avant fin février) en attente du nouveau montant',
        blocage: '-Financier: CAPEX à décaisser pour le groupe electrogene et autres dépenses, BFR de 3 mois à décaisser selon modalités prêt (avant fin février)\n-> en attente du nouveau montant',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_MLF': {
        avancement: 'CSI prévu avec comme objectif:\n-Validation du TRI et terme du bail que l\'on proposera à MLF\n-Validation du mix du loyer (CA, RN, fixe)\n-Validation du projet\n- En attente RDV Ministre de l\'eduation',
        blocage: 'CSI 23.02',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'Update suite CSI :'
      },
      'Inv_E_ENERGIESTRO': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_HOTEL TAMATAVE': {
        avancement: '- Finalisation du BP suivant les états financiers de 2024 et 2025\n- A valider par la DAC\n- Signature contrat de bail Yannick',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_SUNFARMING': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_AFRIDOCTOR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_ARTEMIS': {
        avancement: 'RAS. Attente valorisation de sortie',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_BGFI': {
        avancement: '- Envoyer un mail (Alishann ou Fenohasina) pour relancer si il sont toujours intéresser pour que l\'on passe à 10% du capital.',
        blocage: 'Besoin de réponse assez vite.',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_OUI CODING': {
        avancement: 'RAS. 1 CA par an pour suivi investissement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_E_SEED STAR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_CAFE MARY': {
        avancement: 'En attente du COPIL pour prendre la décision sur le potentiel changement de gestion',
        blocage: 'En cours',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_GHU': {
        avancement: 'Point de blocage : Pression à mettre sur Yannick pour le paiement des dettes (399M + 184k €).',
        blocage: 'Mettre la pression sur Yannick.',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_HAYA': {
        avancement: '-Commande STAR e: Livraison effectué et facture envoyé\n-Carte fiscale EXSO :\n       - Etats financiers en cours de révision à la demande de la DAC\n       - Proposition de paiement des amendes et droits suite redressements fiscales en attente de retour de EXSO\n- Demande de caisse fonds de roulement - Montant 1 à 2M MGA - OrangeMoney',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_MAISON DES COTONNIERS': {
        avancement: 'RAS, vérifier si loyers à jour',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_SHOW ROOM': {
        avancement: '•Dette a payer : Environ 600 millions MGA\n• loyer fixer a revoir a la hausse apres reglement de la dette',
        blocage: 'Dette a regler au plus vite',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_SPORT-SENS LASER-SENS': {
        avancement: 'Locataire : demande de delais pour paiement du loyer\n-Raison : concentration de plusieurs charges sur cette période, avec un mois particulièrement plus contraignant, notamment pour l’activité de Laser.',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
      'Inv_I_TAXI BROUSSE PIZZA': {
        avancement: '-Admin: Document manquant : Copie certifié du statut en cours avec Juridique. Date prévu pour dépot des document : Mercredi 25/02/26\n-Opé: Demande de paiement de la seconde tranche envoyer à équipe compta (Clara) - Réception dès finalisation apiement.\n-DL provisoir : Fin Mars',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S09'
      },
    }
  },
  'S10': {
    week: 'Semaine 10  |  02/03/2026 - 06/03/2026',
    projects: {
      'Inv_E_OASIS': {
        avancement: '-SHA revu par LEGIS, envoyé à Olivier\n-Décaissement urgent INLHE (75k en retard de 45j, 70k en retard de 15j)',
        blocage: 'Décaissement urgent INLHE ( en retard de 45j, 70k en retard de 15j)',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_ORGA EARTH': {
        avancement: '-Acte de cession: Encours d\'enregistrement au niveau du Notaire\n-Appel de fonds signés: à envoyer à BR et IMARA pour paiement\n-23M AR à payer urgent avant fin fevrier OE MADA (échéance dette 12/25) payer par DG et Bertrand\n-Droits de communication:Les documents ont été reçu et liste en cours de production\n-EF 2025 pas encore terminé + MCB Fenohasina 23/02 - \n-Recrutement CDP Fort Dauphin - Mehz / RH - qui paye?',
        blocage: 'Dette recouverte par Filatex Ventures',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_HAKANTO HOUSE': {
        avancement: '-Admin:contrat de partenariat et le pacte d\'associé sont en cours de finalisation suite aux observations émises par l\'équipe ventures.\n-HC et HCDM: statuts et autres docs signés, sont chez juridique pour dépôt - HC : documents de constitution déposé au niveau de l\'EDBM.\n-Financier: Calcul du BFR fait, à envoyer à HY aujourd\'hui. Calcul des FAP Février fait et transmis à Vololomanitra pour appel aux actionnaires. Leasing (véhicule et groupe) : contrat en attente de la part de Bodo, Réunion prévu ce mercredi à Hakanto avec Mme Bodo, Maeva (Dir Com) et Alishann.',
        blocage: '-Financier: CAPEX à décaisser pour le groupe electrogene et autres dépenses, BFR de 3 mois à décaisser selon modalités prêt (avant fin février)\n-> Fait, en attente de confirmation par Bodo',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_MLF': {
        avancement: 'CSI prévu avec comme objectif:\n-Validation du TRI et terme du bail que l\'on proposera à MLF\n-Validation du mix du loyer (CA, RN, fixe)\n-Validation du projet\n- En attente RDV Ministre de l\'eduation',
        blocage: 'CSI 23.03',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_ENERGIESTRO': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_HOTEL TAMATAVE': {
        avancement: '- Finalisation du BP suivant les états financiers de 2024 et 2025\n- A valider par la DAC\n- Signature contrat de bail Yannick',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_SUNFARMING': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_AFRIDOCTOR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_ARTEMIS': {
        avancement: 'RAS. Attente valorisation de sortie',
        blocage: '* Demander à Mehzabine la situation pour l\'Exit',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_BGFI': {
        avancement: '- Envoyer un mail (Alishann ou Fenohasina) pour relancer si il sont toujours intéresser pour que l\'on passe à 10% du capital.',
        blocage: 'Mail envoyé à Vololomanitra pour le passage de 2% à 10%',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_OUI CODING': {
        avancement: 'RAS. 1 CA par an pour suivi investissement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_E_SEED STAR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_CAFE MARY': {
        avancement: 'En attente du COPIL pour prendre la décision sur le potentiel changement de gestion',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_GHU': {
        avancement: 'Point de blocage : Pression à mettre sur Yannick pour le paiement des dettes (399M + 184k €).',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_HAYA': {
        avancement: '-Commande STAR e: Livraison effectué et facture envoyé\n-Carte fiscale EXSO :\n       - Etats financiers en cours de révision à la demande de la DAC\n       - Proposition de paiement des amendes et droits suite redressements fiscales en attente de retour de EXSO\n- Demande de caisse fonds de roulement - Montant 1 à 2M MGA - OrangeMoney',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_MAISON DES COTONNIERS': {
        avancement: 'RAS, vérifier si loyers à jour',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_SHOW ROOM': {
        avancement: 'Sur 200M MGA, il ne reste plus que 50M sur la partie immobilier (TCM).\n130M de reçu.',
        blocage: '* Aller voir Irphane pour avoir les soldes restants',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_SPORT-SENS LASER-SENS': {
        avancement: 'LS : Envoyer pour signature l\'ordre de virement pour payer les arriérés de factures de YAS.\nSAV contacté suivant les problèmes de surpresseur,\nDélai de paiement du loyer fixe accordé pour le 9 Mars (à contrôler).\nSS : Sitma est passé pour faire le constat, Mayan fait un état des lieux lundi.',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
      'Inv_I_TAXI BROUSSE PIZZA': {
        avancement: '-Admin: Document manquant : Copie certifié du statut en cours avec Juridique. Date prévu pour dépot des document : Mercredi 25/02/26\n-Opé: Demande de paiement de la seconde tranche envoyer à équipe compta (Clara) - Réception dès finalisation apiement.\n-DL provisoir : Fin Mars',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S10'
      },
    }
  },
  'S11': {
    week: 'Semaine 11  |  09/03/2026 - 13/03/2026',
    projects: {
      'Inv_E_OASIS': {
        avancement: '-SHA revu par LEGIS, envoyé à Olivier\n-Décaissement urgent INLHE (75k en retard de 45j, 70k en retard de 15j)\n- Ventures souhaite changer le commitment sans pour autant etre dillué - En discussion avec OASIS.',
        blocage: 'Décaissement urgent INLHE ( en retard de 45j, 70k en retard de 15j)',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_ORGA EARTH': {
        avancement: '- Acte de cession : signer par Bertrand Reverdy pour cloturer MCB Maurice\n- Les 40% des 23 Millions reçu de la part de BR \n- 2 050 000 MGA note de l\'expert, encours de paiement par Ventures. \n- Appel de fonds signés : à envoyer à BR et IMARA pour paiement\n- Etats Financier pour déclaration Droit de communication - Document reçu et liste en cours de production. \n- Recrutement CDP Fort Dauphin - Mehz / RH - à voir. [Process de recrutement à lancer]',
        blocage: '- Déclaration Droit de communication : les éléments comptables n\'ont pas toute été transmis.',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_HAKANTO HOUSE': {
        avancement: '- Admin : contrat de partenariat et le pacte d\'associé sont en cours de finalisation suite aux observations émises par l\'équipe ventures.\n- HC et HCDM : statuts et autres docs signés, sont chez juridique pour dépôt - HC : documents de constitution déposé au niveau de l\'EDBM.(En cours de validation par DJUR et puis DAC)\n-Financier : Yatrick a validé les montants du BFR et des CAPEX, il a déjà fait un virement de 25 Millions MGA.\nMail envoyer à DG, en attente de validation des chiffres de son coté.\nMontant de leasing (Véhicule et groupe) en attente de la part de Vololomanitra\n- Communication : Réunion faite à Hakanto entre Alishann, Maeva (Comm) et Bodo pour mettre en place une stratégie de comm et le recrutement d\'un Community Manager en CDI. \n- CA : 18 Mars 2026',
        blocage: 'Administratif : Signature en attente\n•	Concernant le prêt d’actionnaires, nous attendons une validation de votre part du BFR et du montant CAPEX, le draft est prêt. \n•	Contrat de partenariat conclu entre HCDM et Hakanto Company : En cours de validation au DJUR, et ensuite DAC\n•	Conventions de prêt conclues entre HCDM // HY // YO // JA : Projets d’actes rédigés, attente transmission des montants définitifs. \n•	Pacte d’associés Hakanto Company : En cours de traitement au niveau juridique.',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_MLF': {
        avancement: '- BP à refaire pour transmettre à PROPARCO à La demande de Patrick Collard\n- Transmettre le calendrier de construction et de financement\n-Validation du mix du loyer (CA, RN, fixe)\n-Validation du projet\n- En attente RDV Ministre de l\'eduation',
        blocage: 'Pas de rendez vous avec le Ministère de l\'éducation suite à la dissolution du gouvernement - A prévoir dès que la situation est stable.',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_ENERGIESTRO': {
        avancement: 'RAS\nCall prévu pour suivi mensuel programmer le 12/03/2025',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_HOTEL TAMATAVE': {
        avancement: '- Finalisation du BP suivant les états financiers de 2024 et 2025\n- A valider par la DAC\n- Signature contrat de bail Yannick',
        blocage: 'Nouvelle structure de Capital à prévoir pour avoir un BP solide (Capital actuel de Ventures Mada 1M MGA qui ne suffit pas pour emprunter les 7 milliards)',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_SUNFARMING': {
        avancement: 'RAS - Faire dle suivi de la LOI',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_AFRIDOCTOR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_ARTEMIS': {
        avancement: 'RAS. Attente valorisation de sortie (En attente de nouvelle).',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_BGFI': {
        avancement: '- Envoyer un mail (Alishann ou Fenohasina) pour relancer si il sont toujours intéresser pour que l\'on passe à 10% du capital.',
        blocage: 'Mail avec Méril en copie a envoyé à Vololomanitra pour le passage de 2% à 10%',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_OUI CODING': {
        avancement: 'RAS. 1 CA par an pour suivi investissement',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_E_SEED STAR': {
        avancement: 'RAS',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_CAFE MARY': {
        avancement: 'En attente du COPIL pour prendre la décision sur le potentiel changement de gestion',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_GHU': {
        avancement: 'Point de blocage : Pression à mettre sur Yannick pour le paiement des dettes (399M + 184k €).\nEn attente des audits de DAC\nAudit des Taux d\'occupation déjà fait par la DAC\nDemander les accès de Booking.com pour avoir les taux de remplissage (taux d\'activité) de l\'Hotel (Mot de passe et identifiant).',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_HAYA': {
        avancement: '- Nouvelle commande de la STAR\n- Carte Fiscale : En attente de validation des états financier de la part de DAC. \n- Paiement amendes : Attente de la validation de l\'administration fiscale. \n- Demande de caisse fonds de roulement - Montant 1 à 2M MGA - OrangeMoney',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_MAISON DES COTONNIERS': {
        avancement: 'RAS, vérifier si loyers à jour',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_SHOW ROOM': {
        avancement: 'Sur les créances de Showroom envers le Groupe, ils sont en attente de paiement de la part de TCM [relance effectué]',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_SPORT-SENS LASER-SENS': {
        avancement: 'Loyer Fixe et Variable reçu (vérification part variable en cours)\nProblème interne : Soucis avec Fara (LS) et coach (SS) - Solution en cours d\'étude. \nOSTIE : Facture reçu pour 4ème trimestre (débauche des employés fait en Octobre 2025) - réclamation en cours.',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
      'Inv_I_TAXI BROUSSE PIZZA': {
        avancement: '- Admin : Dossier pour autorisation déposer au niveau de l\'EDBM et du Ministère du Tourisme. \n- Opé : Matériels reçu ce 12 Mars à transférer par Maika au niveau des ateliers du prestataire\n- DL provisoir : Fin Avril',
        blocage: '',
        actions_prevues: '',
        actions_realisees: '',
        maj: 'S11'
      },
    }
  },
};

var invReportingCurrentWeek = 'S11';

// Get reporting data for current selected week
function getInvReportingData() {
  var week = invReportingCurrentWeek;
  if (invReportingWeeks[week] && invReportingWeeks[week].projects) {
    return invReportingWeeks[week].projects;
  }
  return {};
}

function populateInvWeekSelector() {
  var sel = document.getElementById('rpt-inv-week-select');
  if (!sel) return;
  sel.innerHTML = '';

  var keys = Object.keys(invReportingWeeks).sort(function(a, b) {
    var na = parseInt(a.replace('S', ''));
    var nb = parseInt(b.replace('S', ''));
    return nb - na; // Most recent first
  });

  keys.forEach(function(k) {
    var w = invReportingWeeks[k];
    var opt = document.createElement('option');
    opt.value = k;
    opt.textContent = w.week || k;
    if (k === invReportingCurrentWeek) opt.selected = true;
    sel.appendChild(opt);
  });

  // Update week label
  var weekEl = document.getElementById('rpt-inv-week');
  if (weekEl && invReportingWeeks[invReportingCurrentWeek]) {
    weekEl.textContent = invReportingWeeks[invReportingCurrentWeek].week || '';
  }
}

function switchInvWeek(weekKey) {
  if (!invReportingWeeks[weekKey]) return;
  invReportingCurrentWeek = weekKey;

  // Update week label
  var weekEl = document.getElementById('rpt-inv-week');
  if (weekEl) weekEl.textContent = invReportingWeeks[weekKey].week || '';

  // Re-render with current filter
  renderInvReportingKpis(_rptInvFilter);
  renderInvReportingTable(_rptInvFilter);
}

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
    '<th>Projet</th><th>Avancement</th>' +
    '<th>Point de blocage</th><th>Actions Prevues</th><th>Actions Realisees</th>' +
    '<th>Commentaires DG</th><th>Reponse</th>' +
    '</tr></thead><tbody>';

  var sorted = ps.slice().sort(function(a, b) {
    return a.nom.localeCompare(b.nom);
  });

  sorted.forEach(function(p) {
    var rd = getInvReportingData()[p.id] || {};
    var avancement = rd.avancement || '';
    var blocage = rd.blocage || '';
    var actionsPrev = rd.actions_prevues || '';
    var actionsReal = rd.actions_realisees || '';

    html += '<tr>' +
      '<td class="nowrap" style="font-weight:600;">' + escapeHtml(p.nom) + '</td>' +
      '<td style="font-size:11px;color:#4ecdc4;">' + escapeHtml(avancement) + '</td>' +
      '<td style="font-size:11px;color:#ff8a80;">' + escapeHtml(blocage) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(actionsPrev) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(actionsReal) + '</td>' +
      '<td style="min-width:200px;">' +
        '<div class="rpt-dg-comment" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#ffd6b8;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(243,112,86,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '>' + escapeHtml(rd.commentaires_dg || '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveInvDgField(\'' + p.id + '\', \'comment\', this)" ' +
            'style="background:linear-gradient(135deg,#f37056,#e04030);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-inv-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(255,180,130,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '<td style="min-width:200px;">' +
        '<div class="rpt-inv-reponse" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#b8d6ff;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(86,140,243,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '>' + escapeHtml(rd.reponse || '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveInvDgField(\'' + p.id + '\', \'reponse\', this)" ' +
            'style="background:linear-gradient(135deg,#5686d6,#3060b0);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-inv-rep-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(130,170,255,0.5);"></span>' +
        '</div>' +
      '</td>' +
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

// ══════════════════════════════════════════════
// ══ HFO REPORTING ══
// ══════════════════════════════════════════════

var _currentHfoSub = null;
var _rptHfoOverhaulSite = 'all';
var _rptHfoProjetSite = 'all';

var hfoProjects = [
  // === OVERHAULS (moteur assigned) ===
  { id:'hfo_1', site:'TAMATAVE', projet:'Remise en service ADG8', moteur:'ADG8', dl_initial:'2025-07-11', dl_revu:'2026-04-26', date_exec:'', ecart:289, dtg:66, commentaire:'Travaux de Kyros fiasco\nAlternateur achet\u00e9 par PDG : arriv\u00e9e 11/03/26\nTravaux \u00e0 faire par GPCE \u2013 Attente planning\nTravaux GC par HCM - devis et planning', action:'Situation par rapport au planning \u00e0 voir', resp:'Marcel', type:'overhaul' },
  { id:'hfo_2', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG3', dl_initial:'2026-09-26', dl_revu:'2026-10-18', date_exec:'', ecart:22, dtg:241, commentaire:'ADG3 Planifi\u00e9 \u2013 Pi\u00e8ce dispo 8%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_3', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG6', dl_initial:'2025-10-31', dl_revu:'2026-09-20', date_exec:'', ecart:324, dtg:213, commentaire:'ADG6 Planifi\u00e9 - Pi\u00e8ce dispo 0%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_4', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG7', dl_initial:'2025-12-31', dl_revu:'2026-07-26', date_exec:'', ecart:207, dtg:157, commentaire:'ADG7 Planifi\u00e9 - Pi\u00e8ce dispo 8%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_5', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG9', dl_initial:'2025-07-31', dl_revu:'2026-05-31', date_exec:'', ecart:304, dtg:101, commentaire:'ADG9 Planifi\u00e9 - Pi\u00e8ce dispo 8%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_6', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG10', dl_initial:'2025-09-30', dl_revu:'2026-08-23', date_exec:'', ecart:327, dtg:185, commentaire:'ADG10 Planifi\u00e9 - Pi\u00e8ce dispo 0%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_7', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG11', dl_initial:'2025-10-31', dl_revu:'2026-06-28', date_exec:'', ecart:240, dtg:129, commentaire:'ADG11 Planifi\u00e9 - Pi\u00e8ce dispo 8%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_8', site:'TAMATAVE', projet:'Overhaul 2026', moteur:'ADG12', dl_initial:'2025-11-30', dl_revu:'2026-05-03', date_exec:'', ecart:154, dtg:73, commentaire:'ADG12 Planifi\u00e9 - Pi\u00e8ce dispo 8%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_18', site:'MAJUNGA', projet:'Overhaul 2026', moteur:'MDG1', dl_initial:'2025-10-31', dl_revu:'2026-07-05', date_exec:'', ecart:247, dtg:136, commentaire:'MDG1 Planifi\u00e9 - Pi\u00e8ce 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_19', site:'MAJUNGA', projet:'Overhaul 2026', moteur:'MDG2', dl_initial:'2025-09-30', dl_revu:'2026-03-04', date_exec:'', ecart:155, dtg:13, commentaire:'MDG2 Planifi\u00e9 - Pi\u00e8ce Re\u00e7ues et mise \u00e0 disposition pour DDG9', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_20', site:'MAJUNGA', projet:'Overhaul 2026', moteur:'MDG3', dl_initial:'2025-08-31', dl_revu:'2026-06-07', date_exec:'', ecart:280, dtg:108, commentaire:'MDG3 Planifi\u00e9 - Pi\u00e8ce Re\u00e7ues 84%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_21', site:'MAJUNGA', projet:'Overhaul 2026', moteur:'MDG4', dl_initial:'2025-11-30', dl_revu:'2026-08-30', date_exec:'', ecart:273, dtg:192, commentaire:'MDG4 Planifi\u00e9 - Pi\u00e8ce 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_22', site:'MAJUNGA', projet:'Overhaul 2026', moteur:'MDG5', dl_initial:'2025-12-31', dl_revu:'2026-07-02', date_exec:'', ecart:183, dtg:133, commentaire:'MDG5 Planifi\u00e9 - Pi\u00e8ce 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_31', site:'DIEGO', projet:'Overhaul 2026', moteur:'DDG1', dl_initial:'', dl_revu:'2026-05-06', date_exec:'', ecart:0, dtg:76, commentaire:'DDG1 pi\u00e8ce dispo 0%', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_32', site:'DIEGO', projet:'Overhaul 2026', moteur:'DDG2', dl_initial:'2025-12-31', dl_revu:'2026-05-23', date_exec:'', ecart:143, dtg:93, commentaire:'DDG2 Pi\u00e8ce 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_33', site:'DIEGO', projet:'Overhaul 2026', moteur:'DDG5', dl_initial:'2025-11-30', dl_revu:'2026-08-05', date_exec:'', ecart:248, dtg:167, commentaire:'DDG5 Pi\u00e8ce 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_34', site:'DIEGO', projet:'Overhaul 2026', moteur:'DDG9', dl_initial:'2025-07-23', dl_revu:'2026-07-11', date_exec:'', ecart:353, dtg:142, commentaire:'DDG9 Partial en cours - Pi\u00e8ce en attente\nUtilisation pi\u00e8ce de MDG2\nComplete en D\u00e9cembre et remplacement Crankshaft ; Pi\u00e8ce 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_37', site:'DIEGO', projet:'Remplacement moteur DDG8', moteur:'DDG8', dl_initial:'2026-03-31', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Arriv\u00e9e bloc moteur et vilebrequin 20/02/26 \u00e0 Di\u00e9go', action:'Travaux par GPCE', resp:'Marcel', type:'overhaul' },
  { id:'hfo_40', site:'TULEAR', projet:'Overhaul 2026', moteur:'UDG2', dl_initial:'', dl_revu:'2026-10-25', date_exec:'', ecart:0, dtg:248, commentaire:'UDG2 Pi\u00e8ces 0% dispo', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  { id:'hfo_48', site:'ANTSIRABE', projet:'Overhaul 2026', moteur:'BDG1', dl_initial:'2025-01-31', dl_revu:'2026-09-27', date_exec:'', ecart:604, dtg:220, commentaire:'DL suivant planning de remise en service de la centrale GPCE', action:'En attente offres fournisseurs / Prix / DL livraison\nTri des pi\u00e8ces dispo au F23', resp:'Marcel / Gaston / Erick', type:'overhaul' },
  // === PROJET ANNEXE ===
  { id:'hfo_10', site:'TAMATAVE', projet:'Maintenance des auxiliaires', moteur:'', dl_initial:'2025-09-30', dl_revu:'2026-03-31', date_exec:'', ecart:182, dtg:40, commentaire:'Compresseur achat\u00e9 par PDG\nExpression de besoin d\'autre pi\u00e8ce en 25Jul25\nPaiement Oct25 280k$ et Nov25 250k$\nConfection listes besoins et commande en cours', action:'Compilation des besoins', resp:'Christian', type:'projet' },
  { id:'hfo_11', site:'TAMATAVE', projet:'Calorifusage des moteurs (exhaust)', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Attente paiement \u2192 attente contrat', action:'Situation contrat/offre \u00e0 voir', resp:'Marcel', type:'projet' },
  { id:'hfo_12', site:'TAMATAVE', projet:'SCADA avec GPCE', moteur:'', dl_initial:'2025-07-31', dl_revu:'2026-03-31', date_exec:'', ecart:243, dtg:40, commentaire:'Glissement d\u00fb au paiement', action:'Croisement des listes de besoin GPCE avec dispo F23', resp:'Gaston / Erick', type:'projet' },
  { id:'hfo_13', site:'TAMATAVE', projet:'Installation tank huile', moteur:'', dl_initial:'2026-07-31', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'R\u00e9union faite \u2192 \u00e0 suivre avec Motul', action:'Visite sur site Tamatave', resp:'Christian', type:'projet' },
  { id:'hfo_14', site:'TAMATAVE', projet:'Cl\u00f4ture tomb\u00e9e : garanti 10ans par HCM', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_15', site:'TAMATAVE', projet:'R\u00e9habilitation villa expat', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_16', site:'TAMATAVE', projet:'R\u00e9habilitation gu\u00e9rite et rallongement toiture sous-d\u00e9canteur', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_17', site:'TAMATAVE', projet:'Cooling tower ADG8', moteur:'', dl_initial:'2025-06-30', dl_revu:'2026-03-31', date_exec:'', ecart:274, dtg:40, commentaire:'Attente retour cotation GPCE', action:'', resp:'Omar', type:'projet' },
  { id:'hfo_23', site:'MAJUNGA', projet:'Maintenance des auxiliaires', moteur:'', dl_initial:'2025-09-30', dl_revu:'2026-03-31', date_exec:'', ecart:182, dtg:40, commentaire:'Compresseur achat\u00e9 par PDG\nExpression de besoin d\'autre pi\u00e8ce\nPaiement Oct25 280k$ et Nov25 250k$\nConfection listes besoins et commande en cours', action:'Compilation des besoins', resp:'Christian', type:'projet' },
  { id:'hfo_24', site:'MAJUNGA', projet:'SCADA', moteur:'', dl_initial:'2026-07-31', dl_revu:'2026-03-31', date_exec:'', ecart:-122, dtg:40, commentaire:'Glissement d\u00fb au paiement', action:'Croisement des listes de besoin GPCE avec dispo F23', resp:'Gaston / Erick', type:'projet' },
  { id:'hfo_25', site:'MAJUNGA', projet:'Installation climatiseur control room', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_26', site:'MAJUNGA', projet:'Avancement actions post d\u00e9versement', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_27', site:'MAJUNGA', projet:'R\u00e9habilitation toiture : effondrement toit Enelec 2', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_28', site:'MAJUNGA', projet:'Pompe transfert sludge caniveau (collaboration Jirama)', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_29', site:'MAJUNGA', projet:'D\u00e9canteur : probl\u00e8me avec APMF ; devis SITMA', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_30', site:'MAJUNGA', projet:'Upgradation', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'S\u00e9paration Cooling tower \u00e0 voir avec SGX', action:'Situation Soavato', resp:'Ange / Olivier', type:'projet' },
  { id:'hfo_35', site:'DIEGO', projet:'Abris Cummins', moteur:'', dl_initial:'', dl_revu:'', date_exec:'2026-02-12', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_36', site:'DIEGO', projet:'Installation 18 extraction d\'air', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_38', site:'TULEAR', projet:'Cooling Tower UDG4', moteur:'', dl_initial:'2025-08-31', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Construction en cours (Sur site 26/09/25, attente mat\u00e9riel de connexion)', action:'Attente retour cotation GPCE', resp:'Omar', type:'projet' },
  { id:'hfo_39', site:'TULEAR', projet:'Climatisation control room', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_41', site:'ANTSIRABE', projet:'Remise en service centrale apr\u00e8s incendie', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Planning GPCE', action:'Relance GPCE', resp:'Omar', type:'projet' },
  { id:'hfo_42', site:'ANTSIRABE', projet:'Maintenance des auxiliaires', moteur:'', dl_initial:'2025-09-30', dl_revu:'2026-03-31', date_exec:'', ecart:182, dtg:40, commentaire:'Compresseur achat\u00e9 par PDG\nExpression de besoin\nPaiement Oct25 280k$ et Nov25 250k$\nConfection listes besoins et commande en cours', action:'Compilation des besoins', resp:'Christian', type:'projet' },
  { id:'hfo_43', site:'ANTSIRABE', projet:'SCADA', moteur:'', dl_initial:'2025-07-31', dl_revu:'2026-03-31', date_exec:'', ecart:243, dtg:40, commentaire:'Glissement d\u00fb au paiement', action:'Croisement des listes de besoin GPCE avec dispo F23', resp:'Gaston / Erick', type:'projet' },
  { id:'hfo_44', site:'ANTSIRABE', projet:'Construction de route', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_45', site:'ANTSIRABE', projet:'R\u00e9haussement cl\u00f4ture mitoyen', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_46', site:'ANTSIRABE', projet:'Carrelage all\u00e9e centrale et peinture sol epoxy', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_47', site:'ANTSIRABE', projet:'Peinture sol epoxy et gardes corps mezzanine', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'SGX', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_49', site:'VESTOP', projet:'Majunga : installation du Man', moteur:'', dl_initial:'2025-12-31', dl_revu:'2026-07-31', date_exec:'', ecart:212, dtg:162, commentaire:'Equipe GPCE d\u00e9j\u00e0 sur site : attente planning\nGC par HCM \u00e0 d\u00e9finir', action:'', resp:'Marcel', type:'projet' },
  { id:'hfo_50', site:'VESTOP', projet:'Fihaonana : installation de 2 moteurs 6R32', moteur:'', dl_initial:'2026-04-30', dl_revu:'2026-12-25', date_exec:'', ecart:239, dtg:309, commentaire:'Contrat sign\u00e9 avec GPCE\nTravaux GC en cours par HCM', action:'4 containers arriv\u00e9s ; probl\u00e8me logistique \u00e0 Tamatave', resp:'Marcel', type:'projet' },
  { id:'hfo_51', site:'AUTRE', projet:'D\u00e9signation et impl\u00e9mentation des protections sites', moteur:'', dl_initial:'2026-04-01', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Pour \u00e9viter les black-out r\u00e9p\u00e9titifs et prot\u00e9ger nos installations', action:'En cours\nSites : Tulear, Antsirabe, Tamatave et Di\u00e9go \u2192 planning missions', resp:'Omar', type:'projet' },
  { id:'hfo_52', site:'AUTRE', projet:'Analyses Fuel, eau et huile en local', moteur:'', dl_initial:'2026-12-01', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Ma\u00eetrise qualit\u00e9 fluides, analyses internes et externes n\u00e9cessaires', action:'', resp:'Omar', type:'projet' },
  { id:'hfo_53', site:'AUTRE', projet:'Achat syst\u00e8me brouillard huile (OMD) - 116 439$ pour 16 moteurs', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Pour \u00e9viter destructions paliers vilebrequins (246 603$ et longues indisponibilit\u00e9s)', action:'Mise \u00e0 jour cotation puis valider', resp:'Omar / Marcel', type:'projet' },
  { id:'hfo_54', site:'AUTRE', projet:'Filtre automatique huile \u00e0 bougies', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Nettoyage auto sans arr\u00eat machine\nGain 352 811$ annuel\nEl\u00e9ments remplac\u00e9s apr\u00e8s 24000h', action:'Attente cotation puis valider', resp:'Omar / Marcel', type:'projet' },
  { id:'hfo_55', site:'AUTRE', projet:'Unit\u00e9s de traitement eaux', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Arr\u00eat de 15h par moteur pour d\u00e9tartrer', action:'Cotation re\u00e7ue \u2192 P2P', resp:'Omar / Marcel', type:'projet' },
  { id:'hfo_56', site:'AUTRE', projet:'SFOC', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Achever le projet d\u00e9bitm\u00e8tres sur tous les sites', action:'Demande de cotation', resp:'Omar / Marcel', type:'projet' },
  { id:'hfo_57', site:'AUTRE', projet:'Maintenance \u00e9lectrique L4 alternateurs et transfos', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Le L4 d\'un alternateur est l\'\u00e9quivalent de Overhaul d\'un moteur', action:'Demande de cotation', resp:'Omar / Marcel', type:'projet' },
  { id:'hfo_58', site:'AUTRE', projet:'Gestion des Stocks', moteur:'', dl_initial:'', dl_revu:'', date_exec:'', ecart:0, dtg:0, commentaire:'Codification et gestion par si\u00e8ge des stocks. Inventaire mensuel et annuel', action:'', resp:'Gaston / Hussen', type:'projet' }
];

var hfoSites = ['TAMATAVE','MAJUNGA','DIEGO','TULEAR','ANTSIRABE','VESTOP','AUTRE'];

function openHfoSub(sub) {
  _currentHfoSub = sub;
  document.getElementById('rpt-hfo-cards').style.display = 'none';

  var backBtn = document.getElementById('rpt-back-btn');
  var title = document.getElementById('rpt-sticky-title');
  var filters = document.getElementById('rpt-sticky-filters');

  backBtn.textContent = 'Retour';
  backBtn.onclick = function() { closeHfoSub(); };

  if (sub === 'overhauls') {
    title.textContent = 'HFO - Overhauls';
    document.getElementById('rpt-hfo-overhauls-detail').style.display = 'block';
    filters.innerHTML = buildHfoSiteFilterHtml('overhauls');
    _rptHfoOverhaulSite = 'all';
    renderHfoOverhaulsTable('all');
  } else if (sub === 'projets') {
    title.textContent = 'HFO - Projet annexe';
    document.getElementById('rpt-hfo-projets-detail').style.display = 'block';
    filters.innerHTML = buildHfoSiteFilterHtml('projets');
    _rptHfoProjetSite = 'all';
    renderHfoProjetsTable('all');
  }
}

function closeHfoSub() {
  _currentHfoSub = null;
  document.getElementById('rpt-hfo-overhauls-detail').style.display = 'none';
  document.getElementById('rpt-hfo-projets-detail').style.display = 'none';
  document.getElementById('rpt-hfo-cards').style.display = '';

  var backBtn = document.getElementById('rpt-back-btn');
  var title = document.getElementById('rpt-sticky-title');
  var filters = document.getElementById('rpt-sticky-filters');
  backBtn.textContent = 'Retour';
  backBtn.onclick = function() { closeReportingPole(); };
  title.textContent = 'Reporting HFO';
  title.style.color = '#00ab63';
  filters.innerHTML = '';
}

function renderHfoPoleCard() {
  var total = hfoProjects.length;
  var overhauls = hfoProjects.filter(function(p) { return p.type === 'overhaul'; }).length;
  var projets = hfoProjects.filter(function(p) { return p.type === 'projet'; }).length;
  var sites = {};
  hfoProjects.forEach(function(p) { sites[p.site] = true; });

  var subEl = document.getElementById('rpt-pole-hfo-sub');
  if (subEl) subEl.textContent = total + ' projets';

  var el = document.getElementById('rpt-pole-hfo-kpis');
  if (!el) return;
  el.innerHTML =
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#00ab63;">' + total + '</span><span class="kl">Projets</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#5aafaf;">' + overhauls + '</span><span class="kl">Overhauls</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#E05C5C;">' + projets + '</span><span class="kl">Annexes</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#FDB823;">' + Object.keys(sites).length + '</span><span class="kl">Sites</span></div>';
}

function renderHfoOverhaulsTable(siteFilter) {
  var ms = hfoProjects.filter(function(p) { return p.type === 'overhaul'; });
  if (siteFilter && siteFilter !== 'all') ms = ms.filter(function(p) { return p.site === siteFilter; });

  // KPIs
  var total = ms.length;
  var urgent = ms.filter(function(p) { return p.dtg > 0 && p.dtg <= 60; }).length;
  var enRetard = ms.filter(function(p) { return p.ecart > 200; }).length;
  var sites = {};
  ms.forEach(function(p) { sites[p.site] = true; });

  var bar = document.getElementById('rpt-hfo-overhauls-kpi-bar');
  bar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + total + '</div><div class="kl">Overhauls</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#E05C5C;">' + urgent + '</div><div class="kl">&lt; 60 jours</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + enRetard + '</div><div class="kl">Ecart &gt; 200j</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + Object.keys(sites).length + '</div><div class="kl">Sites</div></div>';

  // Table
  var html = '<table class="rpt-table"><thead><tr>' +
    '<th>Site</th><th>Moteur</th><th>Projet</th><th>DL initial</th><th>DL revu</th>' +
    '<th>Ecart (j)</th><th>Day to go</th><th>Commentaire</th><th>Action</th><th>Resp</th>' +
    '<th>Commentaires DG</th><th>R\u00e9ponse</th>' +
    '</tr></thead><tbody>';

  var sorted = ms.slice().sort(function(a, b) { return (a.dtg || 9999) - (b.dtg || 9999); });

  sorted.forEach(function(p) {
    var ecartColor = p.ecart > 200 ? '#E05C5C' : p.ecart > 100 ? '#FDB823' : '#5aafaf';
    var dtgColor = p.dtg <= 60 ? '#E05C5C' : p.dtg <= 120 ? '#FDB823' : '#4ecdc4';

    html += '<tr>' +
      '<td class="nowrap" style="font-weight:600;">' + escapeHtml(p.site) + '</td>' +
      '<td class="nowrap" style="font-weight:600;color:#5aafaf;">' + escapeHtml(p.moteur) + '</td>' +
      '<td style="font-size:11px;">' + escapeHtml(p.projet) + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + (p.dl_initial || '\u2014') + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + (p.dl_revu || '\u2014') + '</td>' +
      '<td style="text-align:right;font-weight:600;color:' + ecartColor + ';">' + (p.ecart || '\u2014') + '</td>' +
      '<td style="text-align:right;font-weight:600;color:' + dtgColor + ';">' + (p.dtg || '\u2014') + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(p.commentaire) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(p.action) + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + escapeHtml(p.resp) + '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-dg-comment" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#ffd6b8;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(0,171,99,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveHfoDgField(\'' + p.id + '\', \'comment\', this)" ' +
            'style="background:linear-gradient(135deg,#00ab63,#008050);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-hfo-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(0,171,99,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-hfo-reponse" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#b8d6ff;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(86,140,243,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveHfoDgField(\'' + p.id + '\', \'reponse\', this)" ' +
            'style="background:linear-gradient(135deg,#5686d6,#3060b0);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-hfo-rep-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(130,170,255,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('rpt-hfo-overhauls-table-wrap').innerHTML = html;
}

function renderHfoProjetsTable(siteFilter) {
  var ms = hfoProjects.filter(function(p) { return p.type === 'projet'; });
  if (siteFilter && siteFilter !== 'all') ms = ms.filter(function(p) { return p.site === siteFilter; });

  // KPIs
  var total = ms.length;
  var sites = {};
  ms.forEach(function(p) { sites[p.site] = true; });
  var withDl = ms.filter(function(p) { return p.dl_initial || p.dl_revu; }).length;
  var sgx = ms.filter(function(p) { return p.commentaire === 'SGX'; }).length;

  var bar = document.getElementById('rpt-hfo-projets-kpi-bar');
  bar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + total + '</div><div class="kl">Projets</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + Object.keys(sites).length + '</div><div class="kl">Sites</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + withDl + '</div><div class="kl">Avec deadline</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:var(--text-muted);">' + sgx + '</div><div class="kl">SGX</div></div>';

  // Table
  var html = '<table class="rpt-table"><thead><tr>' +
    '<th>Site</th><th>Projet</th><th>DL initial</th><th>DL revu</th>' +
    '<th>Ecart (j)</th><th>Day to go</th><th>Commentaire</th><th>Action</th><th>Resp</th>' +
    '<th>Commentaires DG</th><th>R\u00e9ponse</th>' +
    '</tr></thead><tbody>';

  ms.forEach(function(p) {
    var ecartColor = p.ecart > 200 ? '#E05C5C' : p.ecart > 100 ? '#FDB823' : '#5aafaf';
    var dtgColor = p.dtg > 0 && p.dtg <= 60 ? '#E05C5C' : p.dtg > 60 && p.dtg <= 120 ? '#FDB823' : '#4ecdc4';

    html += '<tr>' +
      '<td class="nowrap" style="font-weight:600;">' + escapeHtml(p.site) + '</td>' +
      '<td style="font-size:11px;font-weight:600;">' + escapeHtml(p.projet) + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + (p.dl_initial || '\u2014') + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + (p.dl_revu || '\u2014') + '</td>' +
      '<td style="text-align:right;font-weight:600;color:' + ecartColor + ';">' + (p.ecart || '\u2014') + '</td>' +
      '<td style="text-align:right;font-weight:600;color:' + dtgColor + ';">' + (p.dtg || '\u2014') + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(p.commentaire) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(p.action) + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + escapeHtml(p.resp) + '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-dg-comment" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#ffd6b8;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(0,171,99,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveHfoDgField(\'' + p.id + '\', \'comment\', this)" ' +
            'style="background:linear-gradient(135deg,#00ab63,#008050);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-hfo-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(0,171,99,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-hfo-reponse" data-pid="' + p.id + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#b8d6ff;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(86,140,243,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveHfoDgField(\'' + p.id + '\', \'reponse\', this)" ' +
            'style="background:linear-gradient(135deg,#5686d6,#3060b0);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-hfo-rep-status" data-pid="' + p.id + '" style="font-size:9px;color:rgba(130,170,255,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('rpt-hfo-projets-table-wrap').innerHTML = html;
}

function switchHfoSiteFilter(sub, site) {
  if (sub === 'overhauls') {
    _rptHfoOverhaulSite = site;
    renderHfoOverhaulsTable(site);
  } else {
    _rptHfoProjetSite = site;
    renderHfoProjetsTable(site);
  }
  document.querySelectorAll('.rpt-hfo-site-tab').forEach(function(btn) {
    var isActive = btn.getAttribute('data-tab') === site;
    btn.classList.toggle('active', isActive);
    btn.style.background = isActive ? 'rgba(0,171,99,0.15)' : 'rgba(255,255,255,0.04)';
    btn.style.color = isActive ? '#00ab63' : '';
    btn.style.borderColor = isActive ? 'rgba(0,171,99,0.3)' : 'rgba(255,255,255,0.1)';
  });
}

function buildHfoSiteFilterHtml(sub) {
  var relevantSites = [];
  var type = sub === 'overhauls' ? 'overhaul' : 'projet';
  hfoSites.forEach(function(s) {
    if (hfoProjects.some(function(p) { return p.type === type && p.site === s; })) {
      relevantSites.push(s);
    }
  });

  var html = '<button class="rpt-hfo-site-tab active" onclick="switchHfoSiteFilter(\'' + sub + '\', \'all\')" data-tab="all" ' +
    'style="background:rgba(0,171,99,0.15);color:#00ab63;border:1px solid rgba(0,171,99,0.3);' +
    'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Tous</button>';

  relevantSites.forEach(function(s) {
    html += '<button class="rpt-hfo-site-tab" onclick="switchHfoSiteFilter(\'' + sub + '\', \'' + s + '\')" data-tab="' + s + '" ' +
      'style="background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);' +
      'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">' + s + '</button>';
  });
  return html;
}

function saveHfoDgField(projectId, fieldType, btnEl) {
  var isComment = fieldType === 'comment';
  var editDiv = document.querySelector(
    (isComment ? '.rpt-dg-comment' : '.rpt-hfo-reponse') + '[data-pid="' + projectId + '"]'
  );
  var statusEl = document.querySelector(
    (isComment ? '.rpt-hfo-status' : '.rpt-hfo-rep-status') + '[data-pid="' + projectId + '"]'
  );
  if (!editDiv) return;

  var value = editDiv.innerText.trim();
  btnEl.disabled = true;
  btnEl.textContent = '...';
  statusEl.textContent = '';

  var body = { projectId: projectId };
  if (isComment) body.comment = value;
  else body.reponse = value;

  fetch('/api/comment/hfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) {
    var ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('API non disponible (mode statique)');
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
      statusEl.style.color = '#E05C5C';
      statusEl.textContent = result.data.error || 'Erreur';
    }
  })
  .catch(function(err) {
    btnEl.disabled = false;
    btnEl.textContent = 'Enregistrer';
    statusEl.style.color = '#E05C5C';
    statusEl.textContent = err.message || 'Erreur connexion';
  });
}

// ══════════════════════════════════════════════
// ══ LFO REPORTING ══
// ══════════════════════════════════════════════

var _rptLfoFilter = 'all';

var lfoMoteurs = [
  // --- AU F23 ---
  { n: 1, serie: '97831', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'A definir', section: 'au_f23', transfert: 'A definir', reparation: '', situation: '' },
  { n: 2, serie: '18W2920764', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'Canibalis\u00e9', section: 'au_f23', transfert: 'Canibalis\u00e9', reparation: '', situation: '' },
  { n: 3, serie: '18W2920729', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'IHOSY', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 04/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 30/04/26', situation: 'A envoyer et installer \u00e0 Ihosy\nDL : 15/06/26' },
  { n: 4, serie: '18W2920737', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'IHOSY', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 07/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 30/04/26', situation: 'A envoyer et installer \u00e0 Ihosy\nDL : 15/06/26' },
  { n: 5, serie: '18W2920759', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'IHOSY', section: 'au_f23', transfert: 'Transport de F23 \u00e0 Enermad DL 16/03/26', reparation: '', situation: 'A envoyer et installer \u00e0 Ihosy\nDL : 15/06/26' },
  { n: 6, serie: '18W2920730', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'MAINTIRANO', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 07/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 31/05/26', situation: 'A envoyer et installer \u00e0 Maintirano\nDL : 31/07/26' },
  { n: 7, serie: '18W2920741', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'MAINTIRANO', section: 'au_f23', transfert: 'Transport de F23 \u00e0 Enermad DL 16/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 31/05/26', situation: 'A envoyer et installer \u00e0 Maintirano\nDL : 31/07/26' },
  { n: 8, serie: '18W2920745', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'SAKARAHA', section: 'au_f23', transfert: 'Transport de F23 \u00e0 Enermad DL 16/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 05/07/26', situation: 'A envoyer et installer \u00e0 Sakaraha\nDL : 31/08/26' },
  { n: 9, serie: '18W2920749', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'SAKARAHA', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 04/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 05/07/26', situation: 'A envoyer et installer \u00e0 Sakaraha\nDL : 31/08/26' },
  { n: 10, serie: '18W2920738', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'VENTE', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 04/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 11, serie: '18W2920742', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'VENTE', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 07/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 12, serie: '18W2920739', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'VENTE', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 04/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 13, serie: '18W2920743', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'VENTE', section: 'au_f23', transfert: 'Transport\u00e9 de F23 \u00e0 Enermad le 07/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 14, serie: '18W2920731', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'Canibalis\u00e9', section: 'au_f23', transfert: 'Canibalis\u00e9', reparation: '', situation: '' },
  // --- INSTALLES SUR SITES ---
  { n: 15, serie: '41285749 / 18W2920763', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'ANTSIRABE', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Antsirabe', reparation: 'Fait', situation: 'Install\u00e9 \u00e0 Antsirabe - Mise en service et en production' },
  { n: 16, serie: '41281933 / 18W2920759', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'ANTSIRABE', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Antsirabe', reparation: 'Fait', situation: 'Install\u00e9 \u00e0 Antsirabe - Mise en service et en production' },
  { n: 17, serie: '41285750 / 18W2920757', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'ANTSIRABE', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Antsirabe', reparation: 'Fait', situation: 'Install\u00e9 \u00e0 Antsirabe - En panne : Exciter winding failure' },
  { n: 18, serie: '41281942 / 18W2920753', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'ANTSIRABE', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Antsirabe', reparation: 'Fait', situation: 'Install\u00e9 \u00e0 Antsirabe - R\u00e9paration transfo par Fanelec\nDL connexion : 31/04/26' },
  { n: 19, serie: '18W2920760', type: 'KTA 38G1', puissance: 540, depart: 'MAJUNGA', affectation: 'DIEGO', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Di\u00e9go', reparation: 'Fait', situation: 'Install\u00e9 \u00e0 Di\u00e9go - Mise en service et en production' },
  { n: 20, serie: '18W2920761', type: 'KTA 38G1', puissance: 540, depart: 'MAJUNGA', affectation: 'DIEGO', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Di\u00e9go', reparation: 'Fait', situation: 'Install\u00e9 \u00e0 Di\u00e9go - Mise en service et en production' },
  { n: 21, serie: '18W2920755', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'DIEGO', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Di\u00e9go', reparation: 'R\u00e9par\u00e9 par Enermad', situation: 'Connexion \u00e0 faire par Enermad\nDL connexion : 09/03/26' },
  { n: 22, serie: '18W2920763', type: 'KTA 38G1', puissance: 540, depart: 'FILATEX F23', affectation: 'DIEGO', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Di\u00e9go', reparation: 'R\u00e9par\u00e9 par Enermad', situation: 'Connexion \u00e0 faire par Enermad\nDL connexion : 09/03/26' },
  { n: 23, serie: '18W2920756', type: 'KTA 38G1', puissance: 540, depart: 'PORT BERGE', affectation: 'DIEGO', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Di\u00e9go', reparation: 'R\u00e9par\u00e9 par Enermad', situation: 'Connexion \u00e0 faire par Enermad\nDL connexion : 09/03/26' },
  { n: 24, serie: '18W2920766', type: 'KTA 38G1', puissance: 540, depart: 'PORT BERGE', affectation: 'DIEGO', section: 'installes', transfert: 'Envoy\u00e9 \u00e0 Di\u00e9go', reparation: 'Poulie \u00e0 r\u00e9cup\u00e9rer au F23', situation: 'DL connexion : 23/03/26' },
  { n: 25, serie: '18W2920751', type: 'KTA 38G1', puissance: 540, depart: 'IHOSY', affectation: 'IHOSY', section: 'installes', transfert: 'D\u00e9j\u00e0 sur site', reparation: 'A r\u00e9parer par Enermad\nDL : 30/04/26', situation: 'Installer \u00e0 Ihosy\nDL : 15/06/26' },
  { n: 26, serie: '18W2920754', type: 'KTA 38G1', puissance: 540, depart: 'MAINTIRANO', affectation: 'MAINTIRANO', section: 'installes', transfert: 'D\u00e9j\u00e0 sur site', reparation: 'A r\u00e9parer par Enermad\nDL : 31/05/26', situation: 'Installer \u00e0 Maintirano\nDL : 31/07/26' },
  // --- A RAPATRIER ---
  { n: 27, serie: '41281932', type: 'KTA38-G1', puissance: 500, depart: 'MAMPIKONY', affectation: 'MAINTIRANO', section: 'a_rapatrier', transfert: 'Attente paiement acompte (Miarantsoana) DL 31/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 31/05/26', situation: 'A envoyer et installer \u00e0 Maintirano\nDL : 31/07/26' },
  { n: 28, serie: 'L24394', type: 'NTA 855', puissance: 200, depart: 'PORT BERGE', affectation: 'SAKARAHA', section: 'a_rapatrier', transfert: 'Attente paiement acompte (Miarantsoana) DL 31/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 05/07/26', situation: 'A envoyer et installer \u00e0 Sakaraha\nDL : 31/08/26' },
  { n: 29, serie: '41282355', type: 'NTA855-G4', puissance: 351, depart: 'MAMPIKONY', affectation: 'SAKARAHA', section: 'a_rapatrier', transfert: 'Attente paiement acompte (Miarantsoana) DL 31/03/26', reparation: 'A r\u00e9parer par Enermad\nDL : 05/07/26', situation: 'A envoyer et installer \u00e0 Sakaraha\nDL : 31/08/26' },
  { n: 30, serie: '18W2920750', type: 'NTA 855', puissance: 200, depart: 'AMPARAFAVOLA', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement fait 19/12/25', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 31, serie: '18W2920748', type: 'NTA 855', puissance: 200, depart: 'ANDILAMENA / AMPARAFAVOLA', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement fait 19/12/25', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 32, serie: '18W2920744', type: 'NTA 855', puissance: 200, depart: 'BRIKAVILLE', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement fait 23/12/25', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 33, serie: '18W2920735', type: 'NTA 855', puissance: 200, depart: 'MAHABO', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement fait 07/02/26', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 34, serie: '18W2920746', type: 'NTA 855', puissance: 200, depart: 'MANJA', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement en cours - retard routes d\u00e9t\u00e9rior\u00e9es\nDL : 31/05', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 35, serie: '18W2920734', type: 'NTA 855', puissance: 200, depart: 'MOROMBE', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement fait 07/02/26', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 36, serie: 'L24374', type: 'NTA 855', puissance: 200, depart: 'PORT BERGE', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement \u00e0 faire', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  { n: 37, serie: '18W2920740', type: 'NTA 855', puissance: 200, depart: 'TANAMBE', affectation: 'VENTE', section: 'a_rapatrier', transfert: 'Rapatriement fait 19/12/25', reparation: 'A r\u00e9parer par Enermad\nDL : 15/07/26', situation: 'Pour vente' },
  // --- A DEFINIR ---
  { n: 38, serie: '18W2920733', type: 'NTA 855', puissance: 200, depart: 'VANGAINDRANO', affectation: 'A d\u00e9finir', section: 'a_definir', transfert: 'Investigation \u00e0 faire', reparation: '', situation: 'Investigation \u00e0 Vangaindrano \u00e0 faire' },
  { n: 39, serie: '18W2920732', type: 'NTA 855', puissance: 200, depart: 'VOHEMAR', affectation: 'A d\u00e9finir', section: 'a_definir', transfert: 'Investigation \u00e0 faire', reparation: '', situation: 'Investigation \u00e0 Vohemar \u00e0 faire' },
  { n: 40, serie: '18W2920736', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'A d\u00e9finir', section: 'a_definir', transfert: 'Investigation \u00e0 faire : n\'est pas \u00e0 F23', reparation: '', situation: 'Investigation chez Roberto \u00e0 faire' }
];

var lfoSectionLabels = {
  'au_f23': 'Au F23',
  'installes': 'Install\u00e9s sur sites',
  'a_rapatrier': 'A rapatrier',
  'a_definir': 'A d\u00e9finir'
};

function renderLfoPoleCard() {
  var total = lfoMoteurs.length;
  var installes = lfoMoteurs.filter(function(m) { return m.section === 'installes'; }).length;
  var auF23 = lfoMoteurs.filter(function(m) { return m.section === 'au_f23'; }).length;
  var aRapatrier = lfoMoteurs.filter(function(m) { return m.section === 'a_rapatrier'; }).length;

  var subEl = document.getElementById('rpt-pole-lfo-sub');
  if (subEl) subEl.textContent = total + ' moteurs';

  var el = document.getElementById('rpt-pole-lfo-kpis');
  if (!el) return;
  el.innerHTML =
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#00ab63;">' + total + '</span><span class="kl">Moteurs</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#5aafaf;">' + installes + '</span><span class="kl">Install\u00e9s</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#E05C5C;">' + auF23 + '</span><span class="kl">Au F23</span></div>' +
    '<div class="rpt-pole-kpi"><span class="kv" style="color:#FDB823;">' + aRapatrier + '</span><span class="kl">A rapatrier</span></div>';
}

function renderLfoReportingKpis(filter) {
  var ms = filter === 'all' ? lfoMoteurs : lfoMoteurs.filter(function(m) { return m.section === filter; });
  var total = ms.length;
  var totalKw = ms.reduce(function(s, m) { return s + (m.puissance || 0); }, 0);
  var enProd = ms.filter(function(m) { return m.situation.indexOf('en production') >= 0; }).length;
  var pourVente = ms.filter(function(m) { return m.affectation === 'VENTE'; }).length;
  var enReparation = ms.filter(function(m) { return m.reparation && m.reparation.indexOf('r\u00e9parer') >= 0; }).length;

  var sites = {};
  ms.forEach(function(m) {
    var aff = m.affectation;
    if (aff && aff !== 'VENTE' && aff !== 'Canibalis\u00e9' && aff !== 'A d\u00e9finir' && aff !== 'A definir') sites[aff] = true;
  });
  var nbSites = Object.keys(sites).length;

  var bar = document.getElementById('rpt-lfo-kpi-bar');
  bar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + total + '</div><div class="kl">Moteurs</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + (totalKw / 1000).toFixed(1) + ' MW</div><div class="kl">Puissance totale</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#4ecdc4;">' + enProd + '</div><div class="kl">En production</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + enReparation + '</div><div class="kl">En r\u00e9paration</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#E05C5C;">' + pourVente + '</div><div class="kl">Pour vente</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#b8d6ff;">' + nbSites + '</div><div class="kl">Sites</div></div>';
}

function renderLfoReportingTable(filter) {
  var ms = filter === 'all' ? lfoMoteurs : lfoMoteurs.filter(function(m) { return m.section === filter; });

  var html = '<table class="rpt-table"><thead><tr>' +
    '<th>N\u00b0</th><th>Num S\u00e9rie</th><th>Type</th><th>kW</th>' +
    '<th>Site d\u00e9part</th><th>Affectation</th>';
  if (filter === 'all') html += '<th>Section</th>';
  html += '<th>Transfert / Rapatriement</th><th>R\u00e9paration</th><th>Situation finale</th>' +
    '<th>Commentaires DG</th><th>R\u00e9ponse</th>' +
    '</tr></thead><tbody>';

  ms.forEach(function(m) {
    var sitColor = '';
    if (m.situation.indexOf('en production') >= 0) sitColor = 'color:#4ecdc4;';
    else if (m.situation.indexOf('Pour vente') >= 0) sitColor = 'color:#FDB823;';
    else if (m.situation.indexOf('Investigation') >= 0) sitColor = 'color:#E05C5C;';

    var sectionBadge = '';
    if (filter === 'all') {
      var secColor = m.section === 'installes' ? '#4ecdc4' : m.section === 'au_f23' ? '#FDB823' : m.section === 'a_rapatrier' ? '#E05C5C' : '#b8d6ff';
      sectionBadge = '<td><span style="background:' + secColor + '22;color:' + secColor + ';padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;">' + (lfoSectionLabels[m.section] || m.section) + '</span></td>';
    }

    html += '<tr>' +
      '<td style="font-weight:600;color:#5aafaf;">' + m.n + '</td>' +
      '<td style="font-size:10px;font-family:monospace;white-space:pre-line;">' + escapeHtml(m.serie).replace(/ \/ /g, '<br>') + '</td>' +
      '<td class="nowrap" style="font-size:11px;">' + escapeHtml(m.type) + '</td>' +
      '<td style="text-align:right;font-weight:600;">' + m.puissance + '</td>' +
      '<td style="font-size:11px;white-space:pre-line;">' + escapeHtml(m.depart).replace(/ \/ /g, '<br>') + '</td>' +
      '<td class="nowrap" style="font-size:11px;font-weight:600;">' + escapeHtml(m.affectation) + '</td>' +
      sectionBadge +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(m.transfert) + '</td>' +
      '<td style="font-size:11px;color:#FDB823;">' + escapeHtml(m.reparation) + '</td>' +
      '<td style="font-size:11px;' + sitColor + '">' + escapeHtml(m.situation) + '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-dg-comment" data-pid="lfo_' + m.n + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#ffd6b8;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(0,171,99,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveLfoDgField(\'lfo_' + m.n + '\', \'comment\', this)" ' +
            'style="background:linear-gradient(135deg,#00ab63,#008050);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-lfo-status" data-pid="lfo_' + m.n + '" style="font-size:9px;color:rgba(0,171,99,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '<td style="min-width:180px;">' +
        '<div class="rpt-lfo-reponse" data-pid="lfo_' + m.n + '" contenteditable="true" ' +
          'style="width:100%;min-height:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);' +
          'border-radius:6px;color:#b8d6ff;font-size:11px;font-family:Arial,sans-serif;padding:6px 8px;' +
          'outline:none;line-height:1.4;transition:border-color 0.2s;white-space:pre-wrap;word-break:break-word;overflow:hidden;" ' +
          'onfocus="this.style.borderColor=\'rgba(86,140,243,0.5)\'" ' +
          'onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'"' +
        '></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
          '<button onclick="saveLfoDgField(\'lfo_' + m.n + '\', \'reponse\', this)" ' +
            'style="background:linear-gradient(135deg,#5686d6,#3060b0);color:#fff;border:none;border-radius:5px;' +
            'padding:4px 12px;font-size:9px;font-weight:700;cursor:pointer;">Enregistrer</button>' +
          '<span class="rpt-lfo-rep-status" data-pid="lfo_' + m.n + '" style="font-size:9px;color:rgba(130,170,255,0.5);"></span>' +
        '</div>' +
      '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('rpt-lfo-table-wrap').innerHTML = html;
}

function switchLfoTab(tab) {
  _rptLfoFilter = tab;
  document.querySelectorAll('.rpt-lfo-tab').forEach(function(btn) {
    var isActive = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', isActive);
    btn.style.background = isActive ? 'rgba(0,171,99,0.15)' : 'rgba(255,255,255,0.04)';
    btn.style.color = isActive ? '#00ab63' : '';
    btn.style.borderColor = isActive ? 'rgba(0,171,99,0.3)' : 'rgba(255,255,255,0.1)';
  });
  renderLfoReportingKpis(tab);
  renderLfoReportingTable(tab);
}

function saveLfoDgField(moteurId, fieldType, btnEl) {
  var isComment = fieldType === 'comment';
  var editDiv = document.querySelector(
    (isComment ? '.rpt-dg-comment' : '.rpt-lfo-reponse') + '[data-pid="' + moteurId + '"]'
  );
  var statusEl = document.querySelector(
    (isComment ? '.rpt-lfo-status' : '.rpt-lfo-rep-status') + '[data-pid="' + moteurId + '"]'
  );
  if (!editDiv) return;

  var value = editDiv.innerText.trim();
  btnEl.disabled = true;
  btnEl.textContent = '...';
  statusEl.textContent = '';

  var body = { projectId: moteurId };
  if (isComment) body.comment = value;
  else body.reponse = value;

  fetch('/api/comment/lfo', {
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
      statusEl.style.color = '#00ab63';
      statusEl.textContent = result.data.error || 'Erreur';
    }
  })
  .catch(function(err) {
    btnEl.disabled = false;
    btnEl.textContent = 'Enregistrer';
    statusEl.style.color = '#E05C5C';
    statusEl.textContent = err.message || 'Erreur connexion';
  });
}

// ══════════════════════════════════════════════════════════════
// ══ PROPERTIES REPORTING (SAV / TVX / DEV) ══
// ══════════════════════════════════════════════════════════════

var _currentPropsSub = null;
var _rptPropsSiteFilter = 'all';
var _propsDelayFilter = false;

function propsGroupByProject(rows) {
  var projects = [];
  var map = {};
  rows.forEach(function(r) {
    if (!map[r.site]) {
      map[r.site] = { name: r.site, etapes: [] };
      projects.push(map[r.site]);
    }
    map[r.site].etapes.push(r);
  });
  return projects;
}

function propsTimingBadge(v) {
  if (!v) return '<span style="color:var(--text-dim);">\u2014</span>';
  if (v === 'On Time') return '<span style="color:#00ab63;font-weight:700;font-size:10px;">\u25CF On Time</span>';
  if (v.indexOf('<30') >= 0) return '<span style="color:#F5A623;font-weight:700;font-size:10px;">\u25CF Delay &lt;30j</span>';
  if (v.indexOf('>=30') >= 0) return '<span style="color:#E05C5C;font-weight:700;font-size:10px;">\u25CF Delay \u226530j</span>';
  return '<span style="color:var(--text-muted);font-size:10px;">' + escapeHtml(v) + '</span>';
}

function propsBudgetBadge(v) {
  if (!v) return '<span style="color:var(--text-dim);">\u2014</span>';
  if (v === 'No overrun') return '<span style="color:#00ab63;font-weight:700;font-size:10px;">\u25CF OK</span>';
  if (v.indexOf('Overrun') >= 0) return '<span style="color:#E05C5C;font-weight:700;font-size:10px;">\u25CF ' + escapeHtml(v) + '</span>';
  return '<span style="color:var(--text-muted);font-size:10px;">' + escapeHtml(v) + '</span>';
}

function propsCpsBadge(v) {
  if (!v) return '<span style="color:var(--text-dim);">\u2014</span>';
  if (v === 'All CPs met') return '<span style="color:#00ab63;font-size:10px;">\u2713 All CPs met</span>';
  if (v.indexOf('Management') >= 0) return '<span style="color:#F5A623;font-size:10px;">\u26A0 Mgmt decision</span>';
  return '<span style="color:var(--text-muted);font-size:10px;">' + escapeHtml(v) + '</span>';
}

function buildPropsSiteFilterHtml(sub) {
  var sites = {};
  if (sub === 'dev' && typeof propsData_dev_full !== 'undefined') {
    propsData_dev_full.forEach(function(p) { sites[p.name] = true; });
  } else {
    var dataMap = { sav: propsData_sav, tvx: propsData_tvx, dev: propsData_dev };
    var rows = dataMap[sub] || [];
    rows.forEach(function(r) { sites[r.site] = true; });
  }
  var siteList = Object.keys(sites).sort();

  var html = '<button id="rpt-props-all-btn" onclick="switchPropsSiteFilter(\'' + sub + '\',\'all\')" ' +
    'style="background:rgba(253,184,35,0.15);color:#FDB823;border:1px solid rgba(253,184,35,0.3);' +
    'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">Tous</button>' +
    '<select id="rpt-props-site-select" onchange="switchPropsSiteFilter(\'' + sub + '\',this.value)" ' +
    'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);' +
    'border-radius:8px;color:#FDB823;font-size:11px;font-weight:600;padding:5px 12px;' +
    'cursor:pointer;outline:none;font-family:Arial,sans-serif;">' +
    '<option value="all">Filtrer par site...</option>';

  siteList.forEach(function(s) {
    html += '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
  });
  html += '</select>';
  return html;
}

function togglePropsDelayFilter() {
  _propsDelayFilter = !_propsDelayFilter;
  renderPropsTable(_currentPropsSub, _rptPropsSiteFilter);
}

function switchPropsSiteFilter(sub, site) {
  _rptPropsSiteFilter = site;
  _propsDelayFilter = false;
  var allBtn = document.getElementById('rpt-props-all-btn');
  var sel = document.getElementById('rpt-props-site-select');
  if (site === 'all') {
    if (allBtn) { allBtn.style.background = 'rgba(253,184,35,0.15)'; allBtn.style.color = '#FDB823'; allBtn.style.borderColor = 'rgba(253,184,35,0.3)'; }
    if (sel) sel.value = 'all';
  } else {
    if (allBtn) { allBtn.style.background = 'rgba(255,255,255,0.04)'; allBtn.style.color = 'var(--text-muted)'; allBtn.style.borderColor = 'rgba(255,255,255,0.1)'; }
    if (sel) sel.value = site;
  }
  renderPropsTable(sub, site);
}

function openPropsDirectSubWithDelay(sub) {
  // Open sub-detail with delay filter pre-activated
  openPropsDirectSub(sub);
  _propsDelayFilter = true;
  renderPropsTable(sub, 'all');
}

function openPropsDirectSub(sub) {
  // Direct from reporting home to props sub-detail (no intermediate sub-cards)
  document.querySelector('.rpt-poles-grid').style.display = 'none';
  document.getElementById('rpt-global-summary').style.display = 'none';
  var detail = document.getElementById('rpt-props-detail');
  detail.style.display = 'block';
  document.getElementById('rpt-props-cards').style.display = 'none';
  openPropsSub(sub, true);
}

function openPropsSub(sub, fromDirect) {
  _currentPropsSub = sub;
  document.getElementById('rpt-props-cards').style.display = 'none';

  var backBtn = document.getElementById('rpt-back-btn');
  var title = document.getElementById('rpt-sticky-title');
  var filters = document.getElementById('rpt-sticky-filters');

  backBtn.textContent = 'Retour';
  backBtn.onclick = function() { closePropsSub(); };

  var titles = { sav: 'Properties - SAV', tvx: 'Properties - Travaux', dev: 'Properties - D\u00e9veloppement', com: 'Properties - Commercial' };
  title.textContent = titles[sub] || 'Properties';
  title.style.color = '#FDB823';
  backBtn.style.borderColor = 'rgba(253,184,35,0.3)';
  backBtn.style.color = '#FDB823';

  document.getElementById('rpt-props-' + sub + '-detail').style.display = 'block';

  if (sub === 'com') {
    filters.innerHTML = buildComFilterHtml();
    _comSectionFilter = 'all';
    renderComTable('all');
  } else {
    filters.innerHTML = buildPropsSiteFilterHtml(sub);
    _rptPropsSiteFilter = 'all';
    _propsDelayFilter = false;
    renderPropsTable(sub, 'all');
  }
}

function closePropsSub() {
  _currentPropsSub = null;
  ['sav', 'tvx', 'dev', 'com'].forEach(function(s) {
    document.getElementById('rpt-props-' + s + '-detail').style.display = 'none';
  });
  document.getElementById('rpt-props-detail').style.display = 'none';
  // Go back to reporting home directly
  closeReportingPole();
}

function renderPropsTable(sub, siteFilter) {
  // DEV uses card view
  if (sub === 'dev' && typeof propsData_dev_full !== 'undefined') {
    renderPropsCards(sub, siteFilter);
    return;
  }

  var dataMap = { sav: propsData_sav, tvx: propsData_tvx, dev: propsData_dev };
  var rows = dataMap[sub] || [];
  if (siteFilter && siteFilter !== 'all') {
    rows = rows.filter(function(r) { return r.site === siteFilter; });
  }

  var allRows = rows;
  if (_propsDelayFilter) {
    rows = rows.filter(function(r) { return r.timing_var && r.timing_var.indexOf('Delay') >= 0; });
  }

  var projects = propsGroupByProject(rows);
  var kpiRows = allRows || rows;
  var kpiProjects = propsGroupByProject(kpiRows);

  var bar = document.getElementById('rpt-props-' + sub + '-kpi-bar');
  var delayActive = _propsDelayFilter ? 'background:rgba(224,92,92,0.15);border:1px solid rgba(224,92,92,0.4);border-radius:10px;cursor:pointer;' : 'cursor:pointer;';
  bar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + kpiProjects.length + '</div><div class="kl">Projets</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + kpiRows.length + '</div><div class="kl">\u00c9tapes</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + kpiRows.filter(function(r) { return r.timing_var === 'On Time'; }).length + '</div><div class="kl">On Time</div></div>' +
    '<div class="rpt-kpi-item" onclick="togglePropsDelayFilter()" style="' + delayActive + '"><div class="kv" style="color:#E05C5C;">' + kpiRows.filter(function(r) { return r.timing_var && r.timing_var.indexOf('Delay') >= 0; }).length + '</div><div class="kl">En retard \u25BC</div></div>';

  var html = '<table class="rpt-table"><thead><tr>' +
    '<th style="min-width:60px;">Resp.</th>' +
    '<th style="min-width:200px;">\u00c9tape / Objet</th>' +
    '<th style="min-width:80px;">Timing</th>' +
    '<th style="min-width:70px;">Budget</th>' +
    '<th style="min-width:90px;">Status CPS</th>' +
    '<th style="min-width:200px;">Dernier commentaire</th>' +
    '<th style="min-width:90px;">Semaine</th>' +
    '</tr></thead><tbody>';

  projects.forEach(function(proj) {
    var delayedP = proj.etapes.filter(function(e) { return e.timing_var && e.timing_var.indexOf('Delay') >= 0; }).length;
    var statusIcon = delayedP > 0 ? '<span style="color:#E05C5C;">\u25CF</span>' : '<span style="color:#00ab63;">\u25CF</span>';
    html += '<tr style="background:rgba(253,184,35,0.08);cursor:pointer;" onclick="this.classList.toggle(\'rpt-proj-collapsed\');var s=this.nextElementSibling;while(s&&!s.classList.contains(\'rpt-proj-header\')){s.style.display=s.style.display===\'none\'?\'\':\'none\';s=s.nextElementSibling;}"' +
      ' class="rpt-proj-header">' +
      '<td colspan="7" style="font-weight:700;color:#FDB823;font-size:12px;padding:10px 12px;">' +
      '<span style="margin-right:6px;">\u25BE</span>' + statusIcon + ' ' + escapeHtml(proj.name) +
      ' <span style="color:var(--text-muted);font-weight:400;font-size:11px;">(' + proj.etapes.length + ' \u00e9tapes' +
      (delayedP > 0 ? ' \u2022 <span style="color:#E05C5C;">' + delayedP + ' en retard</span>' : '') +
      ')</span></td></tr>';
    proj.etapes.forEach(function(et) {
      html += '<tr>' +
        '<td class="nowrap" style="font-size:11px;">' + escapeHtml(et.resp) + '</td>' +
        '<td style="font-size:11px;color:var(--text-main);">' + escapeHtml(et.etape) + '</td>' +
        '<td style="text-align:center;">' + propsTimingBadge(et.timing_var) + '</td>' +
        '<td style="text-align:center;">' + propsBudgetBadge(et.budget_var) + '</td>' +
        '<td style="text-align:center;">' + propsCpsBadge(et.status_cps) + '</td>' +
        '<td style="font-size:10px;color:var(--text-muted);max-width:300px;white-space:pre-wrap;word-break:break-word;">' + escapeHtml(et.latest_comment) + '</td>' +
        '<td class="nowrap" style="font-size:10px;color:var(--text-dim);">' + escapeHtml(et.latest_week) + '</td>' +
        '</tr>';
    });
  });

  html += '</tbody></table>';
  document.getElementById('rpt-props-' + sub + '-table-wrap').innerHTML = html;
}

// ══ CARD VIEW for Properties (with full history) ══
function renderPropsCards(sub, siteFilter) {
  var fullData = propsData_dev_full; // for now only DEV
  var projects = fullData;

  if (siteFilter && siteFilter !== 'all') {
    projects = projects.filter(function(p) { return p.name === siteFilter; });
  }

  // Count for KPIs
  var allEtapes = [];
  fullData.forEach(function(p) { p.etapes.forEach(function(e) { allEtapes.push(e); }); });
  var filteredEtapes = [];
  projects.forEach(function(p) { p.etapes.forEach(function(e) { filteredEtapes.push(e); }); });

  if (_propsDelayFilter) {
    projects = projects.map(function(p) {
      return { name: p.name, etapes: p.etapes.filter(function(e) { return e.timing_var && e.timing_var.indexOf('Delay') >= 0; }) };
    }).filter(function(p) { return p.etapes.length > 0; });
  }

  var bar = document.getElementById('rpt-props-' + sub + '-kpi-bar');
  var onTimeCount = allEtapes.filter(function(e) { return e.timing_var === 'On Time'; }).length;
  var delayCount = allEtapes.filter(function(e) { return e.timing_var && e.timing_var.indexOf('Delay') >= 0; }).length;
  bar.innerHTML =
    '<div class="rpt-kpi-item"><div class="kv" style="color:#00ab63;">' + fullData.length + '</div><div class="kl">Projets</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#5aafaf;">' + allEtapes.length + '</div><div class="kl">\u00c9tapes</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#FDB823;">' + onTimeCount + '</div><div class="kl">On Time</div></div>' +
    '<div class="rpt-kpi-item"><div class="kv" style="color:#E05C5C;">' + delayCount + '</div><div class="kl">En retard</div></div>';

  // Build cards
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px;">';

  projects.forEach(function(proj, pi) {
    var delayedP = proj.etapes.filter(function(e) { return e.timing_var && e.timing_var.indexOf('Delay') >= 0; }).length;
    var borderColor = delayedP > 0 ? '#E05C5C' : '#00ab63';
    var statusDot = delayedP > 0 ? '<span style="color:#E05C5C;font-size:14px;">\u25CF</span>' : '<span style="color:#00ab63;font-size:14px;">\u25CF</span>';

    html += '<div class="rpt-proj-card" style="background:rgba(58,57,92,0.12);border:1px solid rgba(' + (delayedP > 0 ? '224,92,92,0.3' : '0,171,99,0.2') + ');border-radius:14px;padding:16px 18px;border-left:3px solid ' + borderColor + ';">';

    // Card header
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' + statusDot +
      '<span style="font-weight:700;color:#FDB823;font-size:13px;">' + escapeHtml(proj.name) + '</span></div>' +
      '<span style="font-size:10px;color:var(--text-dim);">' + proj.etapes.length + ' \u00e9tape' + (proj.etapes.length > 1 ? 's' : '') +
      (delayedP > 0 ? ' \u2022 <span style="color:#E05C5C;">' + delayedP + ' retard</span>' : '') + '</span></div>';

    // Étapes list (compact) — sorted most recent first
    var sortedEtapes = proj.etapes.slice().sort(function(a, b) {
      var aLast = a.history && a.history.length > 0 ? a.history[a.history.length - 1].week : '';
      var bLast = b.history && b.history.length > 0 ? b.history[b.history.length - 1].week : '';
      // Parse date from "S11 - 09/03/2026" format
      var aMatch = aLast.match(/(\d{2})\/(\d{2})\/(\d{4})$/);
      var bMatch = bLast.match(/(\d{2})\/(\d{2})\/(\d{4})$/);
      var aDate = aMatch ? new Date(aMatch[3], aMatch[2] - 1, aMatch[1]) : new Date(0);
      var bDate = bMatch ? new Date(bMatch[3], bMatch[2] - 1, bMatch[1]) : new Date(0);
      return bDate - aDate;
    });
    sortedEtapes.forEach(function(et, ei) {
      var lastH = et.history && et.history.length > 0 ? et.history[et.history.length - 1] : null;
      var cardId = 'proj-hist-' + pi + '-' + ei;

      html += '<div style="margin-bottom:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">';

      // Étape title + timing badge
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
        '<span style="font-size:13px;font-weight:600;color:#fff;">' + escapeHtml(et.etape) + '</span>' +
        '<span style="margin-left:8px;white-space:nowrap;">' + propsTimingBadge(et.timing_var) + '</span></div>';

      // Last comment + date
      if (lastH) {
        html += '<div style="font-size:12px;color:#fff;margin-bottom:4px;">' +
          '<span style="color:#5aafaf;font-weight:600;">' + escapeHtml(lastH.week) + '</span> \u2014 ' +
          escapeHtml(lastH.comment.length > 120 ? lastH.comment.substring(0, 120) + '...' : lastH.comment) + '</div>';
      }

      // History toggle button
      if (et.history && et.history.length > 1) {
        html += '<div style="text-align:right;">' +
          '<button onclick="var el=document.getElementById(\'' + cardId + '\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';this.textContent=el.style.display===\'none\'?\'\u25B6 Historique (' + et.history.length + ')\':\'\u25BC Masquer\'" ' +
          'style="background:none;border:1px solid rgba(253,184,35,0.2);color:#FDB823;font-size:9px;font-weight:600;padding:2px 8px;border-radius:6px;cursor:pointer;">' +
          '\u25B6 Historique (' + et.history.length + ')</button></div>';

        // Hidden history panel (most recent first)
        html += '<div id="' + cardId + '" style="display:none;margin-top:6px;padding:8px;background:rgba(0,0,0,0.2);border-radius:8px;max-height:200px;overflow-y:auto;scrollbar-width:thin;">';
        et.history.slice().reverse().forEach(function(h) {
          html += '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:11px;">' +
            '<span style="color:#5aafaf;font-weight:600;min-width:110px;display:inline-block;">' + escapeHtml(h.week) + '</span> ' +
            '<span style="color:#fff;">' + escapeHtml(h.comment) + '</span></div>';
        });
        html += '</div>';
      }

      html += '</div>'; // end étape block
    });

    html += '</div>'; // end card
  });

  html += '</div>';
  document.getElementById('rpt-props-' + sub + '-table-wrap').innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// ══ COMMERCIAL REPORTING (Vente Immo / Vente Foncière / Location) ══
// ══════════════════════════════════════════════════════════════

var _comSectionFilter = 'all';

function fmtEur(v) {
  if (v == null || v === '') return '\u2014';
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' \u20ac';
}

function buildComFilterHtml() {
  var tabs = [
    { key: 'all', label: 'Tous' },
    { key: 'immo', label: 'Vente Immobili\u00e8re' },
    { key: 'fonc', label: 'Vente Fonci\u00e8re' },
    { key: 'loc', label: 'Location' }
  ];
  var html = '';
  tabs.forEach(function(t) {
    var isActive = (_comSectionFilter === t.key);
    var bg = isActive ? 'background:rgba(253,184,35,0.15);color:#FDB823;border:1px solid rgba(253,184,35,0.3);' :
      'background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);';
    html += '<button class="rpt-com-tab" onclick="switchComSection(\'' + t.key + '\')" data-tab="' + t.key + '" ' +
      'style="' + bg + 'border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">' + t.label + '</button>';
  });
  return html;
}

function switchComSection(section) {
  _comSectionFilter = section;
  // Update tab styles
  var tabs = document.querySelectorAll('.rpt-com-tab');
  tabs.forEach(function(btn) {
    if (btn.getAttribute('data-tab') === section) {
      btn.style.background = 'rgba(253,184,35,0.15)';
      btn.style.color = '#FDB823';
      btn.style.borderColor = 'rgba(253,184,35,0.3)';
    } else {
      btn.style.background = 'rgba(255,255,255,0.04)';
      btn.style.color = 'var(--text-muted)';
      btn.style.borderColor = 'rgba(255,255,255,0.1)';
    }
  });
  renderComTable(section);
}

function buildComSectionImmo() {
  var html = '<div style="margin-bottom:32px;">' +
    '<h3 style="color:#FDB823;font-size:14px;font-weight:700;margin:0 0 12px 0;padding:10px 14px;background:rgba(253,184,35,0.08);border-radius:10px;border-left:3px solid #FDB823;">' +
    'Vente Immobili\u00e8re \u2014 Objectif: ' + fmtEur(comData_venteImmoTotal) + '</h3>' +
    '<table class="rpt-table"><thead><tr>' +
    '<th style="min-width:150px;">Projet</th>' +
    '<th>Objectif</th>' +
    '<th>Obj. T1</th><th>R\u00e9alis\u00e9 T1</th>' +
    '<th>Obj. T2</th><th>R\u00e9alis\u00e9 T2</th>' +
    '<th>Obj. T3</th><th>R\u00e9alis\u00e9 T3</th>' +
    '<th>Obj. T4</th><th>R\u00e9alis\u00e9 T4</th>' +
    '</tr></thead><tbody>';
  comData_venteImmo.forEach(function(p) {
    html += '<tr>' +
      '<td style="font-weight:600;color:var(--text-main);font-size:12px;">' + escapeHtml(p.name) + '</td>' +
      '<td style="font-weight:700;color:#FDB823;font-size:11px;">' + fmtEur(p.objectif) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t1 ? fmtEur(p.t1) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t2 ? fmtEur(p.t2) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t3 ? fmtEur(p.t3) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t4 ? fmtEur(p.t4) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '</tr>';
  });
  html += '<tr style="background:rgba(253,184,35,0.08);font-weight:700;">' +
    '<td style="color:#FDB823;">TOTAL</td>' +
    '<td style="color:#FDB823;">' + fmtEur(comData_venteImmoTotal) + '</td>' +
    '<td colspan="8"></td></tr>';
  html += '</tbody></table></div>';
  return html;
}

function buildComSectionFonc() {
  var html = '<div style="margin-bottom:32px;">' +
    '<h3 style="color:#00ab63;font-size:14px;font-weight:700;margin:0 0 12px 0;padding:10px 14px;background:rgba(0,171,99,0.08);border-radius:10px;border-left:3px solid #00ab63;">' +
    'Vente Fonci\u00e8re \u2014 Objectif: ' + fmtEur(comData_venteFonciereTotal) + '</h3>' +
    '<table class="rpt-table"><thead><tr>' +
    '<th style="min-width:150px;">Projet</th>' +
    '<th>Objectif</th>' +
    '<th>Obj. T1</th><th>R\u00e9alis\u00e9 T1</th>' +
    '<th>Obj. T2</th><th>R\u00e9alis\u00e9 T2</th>' +
    '<th>Obj. T3</th><th>R\u00e9alis\u00e9 T3</th>' +
    '<th>Obj. T4</th><th>R\u00e9alis\u00e9 T4</th>' +
    '</tr></thead><tbody>';
  comData_venteFonciere.forEach(function(p) {
    html += '<tr>' +
      '<td style="font-weight:600;color:var(--text-main);font-size:12px;">' + escapeHtml(p.name) + '</td>' +
      '<td style="font-weight:700;color:#00ab63;font-size:11px;">' + fmtEur(p.objectif) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t1 ? fmtEur(p.t1) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t2 ? fmtEur(p.t2) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t3 ? fmtEur(p.t3) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (p.t4 ? fmtEur(p.t4) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '</tr>';
  });
  html += '<tr style="background:rgba(0,171,99,0.08);font-weight:700;">' +
    '<td style="color:#00ab63;">TOTAL</td>' +
    '<td style="color:#00ab63;">' + fmtEur(comData_venteFonciereTotal) + '</td>' +
    '<td colspan="8"></td></tr>';
  html += '</tbody></table></div>';
  return html;
}

function buildComSectionLoc() {
  var html = '<div style="margin-bottom:32px;">' +
    '<h3 style="color:#5aafaf;font-size:14px;font-weight:700;margin:0 0 12px 0;padding:10px 14px;background:rgba(90,175,175,0.08);border-radius:10px;border-left:3px solid #5aafaf;">' +
    'Location \u2014 Objectif mensuel: ' + fmtEur(comData_locationTotal) + ' /mois</h3>' +
    '<table class="rpt-table"><thead><tr>' +
    '<th style="min-width:150px;">Site</th>' +
    '<th>Obj. T1</th><th>R\u00e9alis\u00e9 T1</th>' +
    '<th>Obj. T2</th><th>R\u00e9alis\u00e9 T2</th>' +
    '<th>Obj. T3</th><th>R\u00e9alis\u00e9 T3</th>' +
    '<th>Obj. T4</th><th>R\u00e9alis\u00e9 T4</th>' +
    '<th>Total Obj.</th>' +
    '</tr></thead><tbody>';
  comData_location.forEach(function(loc) {
    html += '<tr>' +
      '<td style="font-weight:600;color:var(--text-main);font-size:12px;">' + escapeHtml(loc.name) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (loc.t1 ? fmtEur(loc.t1) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (loc.t2 ? fmtEur(loc.t2) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (loc.t3 ? fmtEur(loc.t3) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + (loc.t4 ? fmtEur(loc.t4) : '\u2014') + '</td>' +
      '<td style="font-size:11px;color:#00ab63;font-weight:600;">\u2014</td>' +
      '<td style="font-weight:700;color:#5aafaf;font-size:11px;">' + fmtEur(loc.total) + '</td>' +
      '</tr>';
  });
  var locTotalObj = comData_location.reduce(function(s, l) { return s + (l.total || 0); }, 0);
  html += '<tr style="background:rgba(90,175,175,0.08);font-weight:700;">' +
    '<td style="color:#5aafaf;">TOTAL</td>' +
    '<td colspan="8"></td>' +
    '<td style="color:#5aafaf;">' + fmtEur(locTotalObj) + '</td>' +
    '</tr>';
  html += '</tbody></table></div>';
  return html;
}

function renderComTable(section) {
  section = section || 'all';

  // KPI bar - highlight active section
  var bar = document.getElementById('rpt-props-com-kpi-bar');
  var immoActive = (section === 'immo') ? 'background:rgba(253,184,35,0.12);border:1px solid rgba(253,184,35,0.3);border-radius:10px;cursor:pointer;' : 'cursor:pointer;';
  var foncActive = (section === 'fonc') ? 'background:rgba(0,171,99,0.12);border:1px solid rgba(0,171,99,0.3);border-radius:10px;cursor:pointer;' : 'cursor:pointer;';
  var locActive = (section === 'loc') ? 'background:rgba(90,175,175,0.12);border:1px solid rgba(90,175,175,0.3);border-radius:10px;cursor:pointer;' : 'cursor:pointer;';

  bar.innerHTML =
    '<div class="rpt-kpi-item" onclick="switchComSection(\'immo\')" style="' + immoActive + '"><div class="kv" style="color:#FDB823;">' + fmtEur(comData_venteImmoTotal) + '</div><div class="kl">Vente Immo</div></div>' +
    '<div class="rpt-kpi-item" onclick="switchComSection(\'fonc\')" style="' + foncActive + '"><div class="kv" style="color:#00ab63;">' + fmtEur(comData_venteFonciereTotal) + '</div><div class="kl">Vente Fonci\u00e8re</div></div>' +
    '<div class="rpt-kpi-item" onclick="switchComSection(\'loc\')" style="' + locActive + '"><div class="kv" style="color:#5aafaf;">' + fmtEur(comData_locationTotal) + ' /mois</div><div class="kl">Location</div></div>';

  var html = '';
  if (section === 'all' || section === 'immo') html += buildComSectionImmo();
  if (section === 'all' || section === 'fonc') html += buildComSectionFonc();
  if (section === 'all' || section === 'loc') html += buildComSectionLoc();

  document.getElementById('rpt-props-com-table-wrap').innerHTML = html;
}

function renderPropsPoleCards() {
  // Helper: build clickable KPIs for SAV/TVX/DEV cards
  function buildCardKpis(sub, projects, data) {
    var delayed = data.filter(function(r) { return r.timing_var && r.timing_var.indexOf('Delay') >= 0; }).length;
    return '<div class="rpt-pole-kpi" onclick="event.stopPropagation();openPropsDirectSub(\'' + sub + '\')" style="cursor:pointer;">' +
      '<span class="kv" style="color:#FDB823;">' + projects.length + '</span><span class="kl">Projets</span></div>' +
      '<div class="rpt-pole-kpi" onclick="event.stopPropagation();openPropsDirectSub(\'' + sub + '\')" style="cursor:pointer;">' +
      '<span class="kv" style="color:#00ab63;">' + data.length + '</span><span class="kl">\u00c9tapes</span></div>' +
      '<div class="rpt-pole-kpi" onclick="event.stopPropagation();openPropsDirectSubWithDelay(\'' + sub + '\')" style="cursor:pointer;background:rgba(224,92,92,0.08);border-radius:8px;">' +
      '<span class="kv" style="color:#E05C5C;">' + delayed + '</span><span class="kl">Retard \u25BC</span></div>';
  }

  // SAV card
  var savProjects = propsGroupByProject(propsData_sav);
  var savEl = document.getElementById('rpt-pole-sav-kpis');
  if (savEl) savEl.innerHTML = buildCardKpis('sav', savProjects, propsData_sav);
  var savSub = document.getElementById('rpt-pole-sav-sub');
  if (savSub) savSub.textContent = savProjects.length + ' projets \u2022 ' + propsData_sav.length + ' \u00e9tapes';

  // TVX card
  var tvxProjects = propsGroupByProject(propsData_tvx);
  var tvxEl = document.getElementById('rpt-pole-tvx-kpis');
  if (tvxEl) tvxEl.innerHTML = buildCardKpis('tvx', tvxProjects, propsData_tvx);
  var tvxSub = document.getElementById('rpt-pole-tvx-sub');
  if (tvxSub) tvxSub.textContent = tvxProjects.length + ' projets \u2022 ' + propsData_tvx.length + ' \u00e9tapes';

  // DEV card
  var devProjects = propsGroupByProject(propsData_dev);
  var devEl = document.getElementById('rpt-pole-dev-kpis');
  if (devEl) devEl.innerHTML = buildCardKpis('dev', devProjects, propsData_dev);
  var devSub = document.getElementById('rpt-pole-dev-sub');
  if (devSub) devSub.textContent = devProjects.length + ' projets \u2022 ' + propsData_dev.length + ' \u00e9tapes';

  // COM card - KPIs are also clickable, open commercial detail
  var comEl = document.getElementById('rpt-pole-com-kpis');
  if (comEl) {
    comEl.innerHTML =
      '<div class="rpt-pole-kpi" onclick="event.stopPropagation();openPropsDirectSub(\'com\')" style="cursor:pointer;">' +
      '<span class="kv" style="color:#FDB823;">' + (comData_venteImmoTotal / 1000000).toFixed(1) + 'M</span><span class="kl">Vente Immo</span></div>' +
      '<div class="rpt-pole-kpi" onclick="event.stopPropagation();openPropsDirectSub(\'com\')" style="cursor:pointer;">' +
      '<span class="kv" style="color:#00ab63;">' + (comData_venteFonciereTotal / 1000000).toFixed(1) + 'M</span><span class="kl">Vente Fonc.</span></div>' +
      '<div class="rpt-pole-kpi" onclick="event.stopPropagation();openPropsDirectSub(\'com\')" style="cursor:pointer;">' +
      '<span class="kv" style="color:#E05C5C;">' + (comData_locationTotal / 1000).toFixed(0) + 'k/m</span><span class="kl">Location</span></div>';
  }
}

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  initReporting();
  renderInvReportingPoleCard();
  renderLfoPoleCard();
  renderHfoPoleCard();
  renderPropsPoleCards();
  setTimeout(syncReportingToEnrProjects, 100);
});
