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

// Reporting data from Weekly_Investments_Avancement.xlsx (S11 - Semaine 11 | 09/03/2026 - 13/03/2026)
var invReportingData = {
  'Inv_E_OASIS': {
    avancement: "- SHA revu par LEGIS, envoyé à Olivier\n- Décaissement urgent INLHE (75k en retard de 45j, 70k en retard de 15j)\n- Ventures souhaite changer le commitment sans pour autant être dillué - En discussion avec OASIS.",
    blocage: "Décaissement urgent INLHE (en retard de 45j, 70k en retard de 15j)",
    actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_ORGA EARTH': {
    avancement: "- Acte de cession : signé par Bertrand Reverdy pour clôturer MCB Maurice\n- Les 40% des 23 Millions reçu de la part de BR\n- 2 050 000 MGA note de l'expert, en cours de paiement par Ventures.\n- Appel de fonds signés : à envoyer à BR et IMARA pour paiement\n- États Financier pour déclaration D",
    blocage: "Déclaration Droit de communication : les éléments comptables n'ont pas toute été transmis.",
    actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_HAKANTO HOUSE': {
    avancement: "- Admin : contrat de partenariat et le pacte d'associé sont en cours de finalisation suite aux observations émises par l'équipe ventures.\n- HC et HCDM : statuts et autres docs signés, sont chez juridique pour dépôt\n- HC : documents de constitution déposé au niveau de l'EDBM (En cours de validation)",
    blocage: "Administratif : Signature en attente\n- Concernant le prêt d'actionnaires, nous attendons une validation de votre part du BFR et du montant CAPEX, le draft est prêt.\n- Contrat de partenariat conclu entre HCDM et Hakanto Company : En cours de validation au DJUR, et ensuite DAC",
    actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_MLF': {
    avancement: "- BP à refaire pour transmettre à PROPARCO à la demande de Patrick Collard\n- Transmettre le calendrier de construction et de financement\n- Validation du mix du loyer (CA, RN, fixe)\n- Validation du projet\n- En attente RDV Ministre de l'éducation",
    blocage: "Pas de rendez-vous avec le Ministère de l'éducation suite à la dissolution du gouvernement - À prévoir dès que la situation est stable.",
    actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_ENERGIESTRO': {
    avancement: "RAS\nCall prévu pour suivi mensuel programmer le 12/03/2025",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_HOTEL TAMATAVE': {
    avancement: "- Finalisation du BP suivant les états financiers de 2024 et 2025\n- À valider par la DAC\n- Signature contrat de bail Yannick",
    blocage: "Nouvelle structure de Capital à prévoir pour avoir un BP solide (Capital actuel de Ventures Mada 1M MGA qui ne suffit pas pour emprunter les 7 milliards)",
    actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_SUNFARMING': {
    avancement: "RAS - Faire le suivi de la LOI",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_AFRIDOCTOR': {
    avancement: "RAS",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_ARTEMIS': {
    avancement: "RAS. Attente valorisation de sortie (En attente de nouvelle).",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_BGFI': {
    avancement: "- Envoyer un mail (Alishann ou Fenohasina) pour relancer si ils sont toujours intéressés pour que l'on passe à 10% du capital.",
    blocage: "Mail avec Méril en copie à envoyé à Vololomanitra pour le passage de 2% à 10%",
    actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_OUI CODING': {
    avancement: "RAS. 1 CA par an pour suivi investissement",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_E_SEED STAR': {
    avancement: "RAS",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_CAFE MARY': {
    avancement: "En attente du COPIL pour prendre la décision sur le potentiel changement de gestion",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_GHU': {
    avancement: "Point de blocage : Pression à mettre sur Yannick pour le paiement des dettes (399M + 184k €).\nEn attente des audits de DAC\nAudit des Taux d'occupation déjà fait par la DAC\nDemander les accès de Booking.com pour avoir les taux de remplissage (taux d'activité) de l'Hotel",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_HAYA': {
    avancement: "- Nouvelle commande de la STAR\n- Carte Fiscale : En attente de validation des états financier de la part de DAC.\n- Paiement amendes : Attente de la validation de l'administration fiscale.\n- Demande de caisse fonds de roulement - Montant 1 à 2M MGA - OrangeMoney",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_MAISON DES COTONNIERS': {
    avancement: "RAS, vérifier si loyers à jour",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_SHOW ROOM': {
    avancement: "Sur les créances de Showroom envers le Groupe, ils sont en attente de paiement de la part de TCM [relance effectué]",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_SPORT-SENS LASER-SENS': {
    avancement: "Loyer Fixe et Variable reçu (vérification part variable en cours)\nProblème interne : Soucis avec Fara (LS) et coach (SS) - Solution en cours d'étude.\nOSTIE : Facture reçu pour 4ème trimestre (débauche des employés fait en Octobre 2025) - réclamation en cours.",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  },
  'Inv_I_TAXI BROUSSE PIZZA': {
    avancement: "- Admin : Dossier pour autorisation déposer au niveau de l'EDBM et du Ministère du Tourisme.\n- Opé : Matériels reçu ce 12 Mars à transférer par Maika au niveau des ateliers du prestataire\n- DL provisoire : Fin Avril",
    blocage: "", actions_prevues: "", actions_realisees: "", maj: "S11"
  }
};

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
    '<th>Mise a jour</th><th>Commentaires DG</th><th>Reponse</th>' +
    '</tr></thead><tbody>';

  var sorted = ps.slice().sort(function(a, b) {
    return a.nom.localeCompare(b.nom);
  });

  sorted.forEach(function(p) {
    var typeBadge = p.type === 'externe'
      ? '<span class="rpt-badge rpt-badge-blue">Externe</span>'
      : '<span class="rpt-badge rpt-badge-orange">Interne</span>';

    var rd = invReportingData[p.id] || {};
    var avancement = rd.avancement || '';
    var blocage = rd.blocage || '';
    var actionsPrev = rd.actions_prevues || '';
    var actionsReal = rd.actions_realisees || '';
    var maj = rd.maj || 'S' + p.week;

    html += '<tr>' +
      '<td class="nowrap" style="font-weight:600;">' + escapeHtml(p.nom) + '</td>' +
      '<td>' + typeBadge + '</td>' +
      '<td style="font-size:11px;color:#4ecdc4;">' + escapeHtml(avancement) + '</td>' +
      '<td style="font-size:11px;color:#ff8a80;">' + escapeHtml(blocage) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(actionsPrev) + '</td>' +
      '<td style="font-size:11px;color:var(--text-muted);">' + escapeHtml(actionsReal) + '</td>' +
      '<td class="nowrap" style="color:rgba(255,255,255,0.5);">' + escapeHtml(maj) + '</td>' +
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

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  initReporting();
  renderInvReportingPoleCard();
  setTimeout(syncReportingToEnrProjects, 100);
});
