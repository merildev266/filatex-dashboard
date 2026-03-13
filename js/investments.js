/* === Investments JS === */


// ══════════════ INVESTMENTS ══════════════
var invProjects = [
  {id:'Inv_E_OASIS',nom:'OASIS',resp:'Imtiaz',type:'externe',status:'En cours',week:9,capex:{invest:'5.6 M$',etat:'5.6 M$',pct:100}},
  {id:'Inv_E_ORGA EARTH',nom:'Orga Earth',resp:'Imtiaz',type:'externe',status:'En cours',week:7,capex:{invest:'150 k$',etat:'150 k$',pct:100}},
  {id:'Inv_I_HAKANTO HOUSE',nom:'Hakanto House',resp:'Imtiaz',type:'interne',status:'En cours',week:7,capex:null},
  {id:'Inv_E_MLF',nom:'MLF',resp:'Imtiaz',type:'externe',status:'En cours',week:7,capex:null},
  {id:'Inv_E_ENERGIESTRO',nom:'Energiestro',resp:'Imtiaz',type:'externe',status:'En cours',week:7,capex:{invest:'100 k$',etat:'120 k$',pct:100}},
  {id:'Inv_I_HOTEL TAMATAVE',nom:'Hotel Tamatave',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:{invest:'2.7 M$',etat:'1.4 M$',pct:50}},
  {id:'Inv_E_SUNFARMING',nom:'Sunfarming',resp:'Imtiaz',type:'externe',status:'En cours',week:10,capex:null},
  {id:'Inv_E_AFRIDOCTOR',nom:'Afridoctor',resp:'Imtiaz',type:'externe',status:'En cours',week:10,capex:null},
  {id:'Inv_E_ARTEMIS',nom:'Artemis',resp:'Imtiaz',type:'externe',status:'En cours',week:10,capex:null},
  {id:'Inv_E_BGFI',nom:'BGFI',resp:'Imtiaz',type:'externe',status:'En cours',week:10,capex:{invest:'1.3 M$',etat:'—',pct:0}},
  {id:'Inv_E_OUI CODING',nom:'Ouicoding',resp:'Imtiaz',type:'externe',status:'En cours',week:10,capex:null},
  {id:'Inv_E_SEED STAR',nom:'Seedstars',resp:'Imtiaz',type:'externe',status:'En cours',week:10,capex:{invest:'4.3 M$',etat:'5 M$',pct:100}},
  {id:'Inv_I_CAFE MARY',nom:'Caf\u00e9 Mary',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:null},
  {id:'Inv_I_GHU',nom:'GHU',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:null},
  {id:'Inv_I_HAYA',nom:'HAYA',resp:'Imtiaz',type:'interne',status:'En cours',week:9,capex:null},
  {id:'Inv_I_MAISON DES COTONNIERS',nom:'Maison des Cotonniers',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:null},
  {id:'Inv_I_SHOW ROOM',nom:'Showroom',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:null},
  {id:'Inv_I_SPORT-SENS LASER-SENS',nom:'SS LS',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:null},
  {id:'Inv_I_TAXI BROUSSE PIZZA',nom:'Taxi Brousse Pizza',resp:'Imtiaz',type:'interne',status:'En cours',week:10,capex:null}
];
var _invCurrentType = 'externe';
function _setInvBanner(title) { document.getElementById('inv-banner-title').textContent = title; }

function _invCalcCapex(type) {
  var filtered = invProjects.filter(function(p){ return p.type === type; });
  var total = filtered.length;
  var encours = filtered.filter(function(p){ return p.status === 'En cours'; }).length;
  var withCapex = filtered.filter(function(p){ return p.capex !== null; });
  var budgetTotal = 0, decaisseTotal = 0;
  withCapex.forEach(function(p){
    var inv = p.capex.invest.replace(/[^\d.,]/g,'').replace(',','.'); var eta = p.capex.etat.replace(/[^\d.,]/g,'').replace(',','.');
    var invNum = parseFloat(inv) || 0; var etaNum = parseFloat(eta) || 0;
    var mult = p.capex.invest.indexOf('M') !== -1 ? 1 : 0.001; var multE = p.capex.etat.indexOf('M') !== -1 ? 1 : 0.001;
    budgetTotal += invNum * mult; decaisseTotal += etaNum * multE;
  });
  var pctDecaisse = budgetTotal > 0 ? Math.round(decaisseTotal / budgetTotal * 100) : 0;
  var budgetStr = budgetTotal >= 1 ? budgetTotal.toFixed(1) : (budgetTotal * 1000).toFixed(0) + ' k';
  var decaisseStr = decaisseTotal >= 1 ? decaisseTotal.toFixed(1) : (decaisseTotal * 1000).toFixed(0) + ' k';
  if (withCapex.length === 0) { budgetStr = '—'; decaisseStr = '—'; pctDecaisse = '—'; }
  return { total: total, encours: encours, budget: budgetStr, decaisse: decaisseStr, pct: pctDecaisse === '—' ? '—' : pctDecaisse + '%' };
}

function updateInvLanding() {
  var g = function(id){ return document.getElementById(id); };
  var ext = _invCalcCapex('externe');
  g('inv-ext-total').textContent = ext.total;
  g('inv-ext-budget').textContent = ext.budget;
  g('inv-ext-decaisse').textContent = ext.decaisse;
  g('inv-ext-pct').textContent = ext.pct;

  var int = _invCalcCapex('interne');
  g('inv-int-total').textContent = int.total;
  g('inv-int-budget').textContent = int.budget;
  g('inv-int-decaisse').textContent = int.decaisse;
  g('inv-int-pct').textContent = int.pct;
}
// Populate landing on load — call directly since script runs after DOM
updateInvLanding();
function _renderInvKpi(type) {
  var filtered = invProjects.filter(function(p){ return p.type === type; });
  var total = filtered.length;
  var withCapex = filtered.filter(function(p){ return p.capex !== null; });
  var budgetTotal = 0, decaisseTotal = 0;
  withCapex.forEach(function(p){ var inv = p.capex.invest.replace(/[^\d.,]/g,'').replace(',','.'); var eta = p.capex.etat.replace(/[^\d.,]/g,'').replace(',','.'); var invNum = parseFloat(inv) || 0; var etaNum = parseFloat(eta) || 0; var mult = p.capex.invest.indexOf('M') !== -1 ? 1 : 0.001; var multE = p.capex.etat.indexOf('M') !== -1 ? 1 : 0.001; budgetTotal += invNum * mult; decaisseTotal += etaNum * multE; });
  var pctDecaisse = budgetTotal > 0 ? Math.round(decaisseTotal / budgetTotal * 100) : 0;
  var budgetStr = budgetTotal >= 1 ? budgetTotal.toFixed(1) + ' M$' : (budgetTotal * 1000).toFixed(0) + ' k$';
  var decaisseStr = decaisseTotal >= 1 ? decaisseTotal.toFixed(1) + ' M$' : (decaisseTotal * 1000).toFixed(0) + ' k$';
  if (withCapex.length === 0) { budgetStr = 'X'; decaisseStr = 'X'; pctDecaisse = 'X'; }
  document.getElementById('inv-grid-kpi').innerHTML = [{lbl:'Projets',val:total,unit:'Total'},{lbl:'Budget r\u00e9vis\u00e9',val:budgetStr,unit:'Investissement CAPEX'},{lbl:'D\u00e9caiss\u00e9',val:(pctDecaisse==='X'?'X':pctDecaisse+'%'),unit:"Taux d'ex\u00e9cution"},{lbl:'Montant d\u00e9caiss\u00e9',val:decaisseStr,unit:'R\u00e9alis\u00e9'}].map(function(k){ return '<div class="s1-card"><div class="s1-card-label">'+k.lbl+'</div><div class="s1-card-value">'+k.val+'</div><div class="s1-card-unit-line">'+k.unit+'</div></div>'; }).join('');
}
function invNavType(type) { _invCurrentType = type; document.querySelectorAll('#inv-type-nav .inv-nav-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.inv === type); }); document.getElementById('inv-detail-view').style.display = 'none'; document.getElementById('inv-grid-view').style.display = ''; _setInvBanner(type === 'externe' ? 'Externe' : 'Interne'); _renderInvKpi(type); _renderInvCards(invProjects.filter(function(p){ return p.type === type; })); document.getElementById('page-investments').scrollTop = 0; }
function openInvLevel(type) { _invCurrentType = type; document.getElementById('inv-back-accueil').style.display = 'none'; document.getElementById('inv-landing').style.display = 'none'; document.getElementById('inv-grid-view').style.display = ''; document.querySelectorAll('#inv-type-nav .inv-nav-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.inv === type); }); _setInvBanner(type === 'externe' ? 'Externe' : 'Interne'); _renderInvKpi(type); _renderInvCards(invProjects.filter(function(p){ return p.type === type; })); document.getElementById('page-investments').scrollTop = 0; }
function _renderInvCards(filtered) {
  var c = document.getElementById('inv-cards-container'); c.innerHTML = '';
  filtered.forEach(function(p){
    var hasCx = p.capex !== null;
    var pctBar = hasCx ? '<div style="width:100%;height:4px;background:rgba(243,112,86,0.1);border-radius:2px;margin-top:8px;"><div style="width:'+p.capex.pct+'%;height:100%;background:#f37056;border-radius:2px;"></div></div>' : '';
    var cxHtml = hasCx ? '<div style="display:flex;justify-content:space-between;margin-top:8px;"><div><div style="font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">Invest</div><div style="font-size:16px;font-weight:800;color:#f37056;">'+p.capex.invest+'</div></div><div style="text-align:center;"><div style="font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">D\u00e9caiss\u00e9</div><div style="font-size:16px;font-weight:800;">'+p.capex.etat+'</div></div><div style="text-align:right;"><div style="font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">Ex\u00e9cution</div><div style="font-size:16px;font-weight:800;color:#4ecdc4;">'+p.capex.pct+'%</div></div></div>'+pctBar : '<div style="text-align:center;padding:8px 0;color:rgba(255,255,255,0.2);font-size:10px;">Donn\u00e9es CAPEX non disponibles</div>';
    var statusColor = p.status === 'En cours' ? '#4ecdc4' : (p.status === 'Termin\u00e9' ? '#a8d98a' : 'rgba(255,255,255,0.4)');
    c.innerHTML += '<div class="capex-section-card" onclick="openInvDetail(\''+p.id+'\')" style="border-color:rgba(243,112,86,0.2);cursor:pointer;padding:16px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'rgba(243,112,86,0.5)\';this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(243,112,86,0.15)\'" onmouseleave="this.style.borderColor=\'rgba(243,112,86,0.2)\';this.style.transform=\'\';this.style.boxShadow=\'\'">'+'<div style="display:flex;justify-content:space-between;align-items:center;">'+'<div style="font-size:clamp(14px,1.2vw,18px);font-weight:800;color:rgba(255,255,255,0.9);">'+p.nom+'</div>'+'<div style="font-size:9px;font-weight:700;color:'+statusColor+';border:1px solid;border-radius:4px;padding:2px 6px;">'+p.status+'</div>'+'</div>'+'<div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px;">S'+p.week+' \u00b7 '+p.resp+'</div>'+cxHtml+'</div>';
  });
}
function closeInvLevel() { document.getElementById('inv-grid-view').style.display = 'none'; document.getElementById('inv-landing').style.display = ''; document.getElementById('inv-back-accueil').style.display = ''; _setInvBanner('Ventures'); document.getElementById('page-investments').scrollTop = 0; }
function openInvDetail(id) {
  var p = invProjects.find(function(x){ return x.id === id; }); if (!p) return;
  document.getElementById('inv-grid-view').style.display = 'none'; document.getElementById('inv-detail-view').style.display = '';
  _setInvBanner(p.nom);
  document.getElementById('inv-detail-back').textContent = p.type === 'externe' ? 'Externe' : 'Interne';
  var nav = document.getElementById('inv-proj-nav'); var filtered = invProjects.filter(function(x){ return x.type === p.type; }); nav.innerHTML = '';
  filtered.forEach(function(fp){ nav.innerHTML += '<button class="site-nav-btn inv-nav-btn'+(fp.id===id?' active':'')+'" onclick="openInvDetail(\''+fp.id+'\')" style="white-space:nowrap;">'+fp.nom+'</button>'; });
  var hasCx = p.capex !== null;
  var html = '<div class="capex-section-card" style="border-color:rgba(243,112,86,0.25);padding:24px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
  html += '<div><div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.15em;">Responsable</div><div style="font-size:14px;font-weight:700;">'+p.resp+'</div></div>';
  var stColor = p.status === 'En cours' ? '#4ecdc4' : '#a8d98a';
  html += '<div style="text-align:center;"><div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.15em;">Statut</div><div style="font-size:14px;font-weight:700;color:'+stColor+';">'+p.status+'</div></div>';
  html += '<div style="text-align:right;"><div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.15em;">Derni\u00e8re MAJ</div><div style="font-size:14px;font-weight:700;">Semaine '+p.week+'</div></div></div>';
  if (hasCx) {
    html += '<div style="border-top:1px solid rgba(243,112,86,0.1);padding-top:12px;"><div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Donn\u00e9es CAPEX</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;"><div style="text-align:center;"><div style="font-size:10px;color:rgba(255,255,255,0.3);">Investissement</div><div style="font-size:22px;font-weight:800;color:#f37056;">'+p.capex.invest+'</div></div><div style="text-align:center;"><div style="font-size:10px;color:rgba(255,255,255,0.3);">D\u00e9caiss\u00e9</div><div style="font-size:22px;font-weight:800;">'+p.capex.etat+'</div></div><div style="text-align:center;"><div style="font-size:10px;color:rgba(255,255,255,0.3);">Ex\u00e9cution</div><div style="font-size:22px;font-weight:800;color:#4ecdc4;">'+p.capex.pct+'%</div></div></div><div style="width:100%;height:6px;background:rgba(243,112,86,0.1);border-radius:3px;margin-top:12px;"><div style="width:'+p.capex.pct+'%;height:100%;background:#f37056;border-radius:3px;"></div></div></div>';
  }
  html += '</div>';
  document.getElementById('inv-detail-content').innerHTML = html;
  document.getElementById('page-investments').scrollTop = 0;
}
function closeInvDetail() { document.getElementById('inv-detail-view').style.display = 'none'; document.getElementById('inv-grid-view').style.display = ''; _setInvBanner(_invCurrentType === 'externe' ? 'Externe' : 'Interne'); document.getElementById('page-investments').scrollTop = 0; }





