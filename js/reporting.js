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
    populateInvWeekSelector();
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

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  initReporting();
  renderInvReportingPoleCard();
  setTimeout(syncReportingToEnrProjects, 100);
});
