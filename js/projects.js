/* === Projects JS === */

/* ══════════════════════════════════════════════
   PROJECT DETAIL — Fiche Projet complète
   ══════════════════════════════════════════════ */

function openProjectDetail(projectId) {
  const projects = window._enrProjects;
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const phase = window._getPhase(p);
  const color = window._phaseColors[phase];
  const rgb = window._phaseBgs[phase];
  const hasCc = p.cc && p.cc.bac != null && p.cc.bac > 0;

  renderPdHeader(p, phase, color, rgb);
  renderPdKpiRow(p, phase, color, rgb, hasCc);
  renderPdEvm(p, hasCc, color, rgb);
  renderPdBudget(p, color, rgb);
  renderPdCashflow(p, hasCc, color, rgb);
  renderPdGantt(p, phase, color, rgb);
  renderPdSchedule(p, color, rgb, hasCc);
  renderPdComments(p);

  const panel = document.getElementById('panel-project-detail');
  panel.style.transform = 'translateX(0)';
  panel.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeProjectDetail() {
  document.getElementById('panel-project-detail').style.transform = 'translateX(100%)';
  document.body.style.overflow = '';
}

/* ── Section 1: Header ── */
function renderPdHeader(p, phase, color, rgb) {
  document.getElementById('pd-header').innerHTML = `
    <div class="inner-topbar" style="border-bottom-color:rgba(${rgb},0.15);margin-bottom:36px;">
      <div style="text-align:center;width:100%;">
        <div class="inner-title" style="color:${color};">${typeIcon(p.type)} ${p.name}</div>
        <div class="inner-subtitle" style="color:rgba(${rgb},0.5);">
          ${p.pvMw} MW${p.bessMwh ? ' + ' + p.bessMwh + ' MWh BESS' : ''}
          · 📍 ${p.loc}
          ${p.chef ? ' · 👤 ' + p.chef : ''}
          · <span style="background:rgba(${rgb},0.15);color:${color};border:1px solid rgba(${rgb},0.3);border-radius:6px;padding:2px 10px;font-weight:700;font-size:10px;">${window._phaseLabels[phase]}</span>
        </div>
      </div>
    </div>`;
}

/* ── Section 2: KPI Row ── */
function renderPdKpiRow(p, phase, color, rgb, hasCc) {
  const engPct = p.engPct != null ? p.engPct : 0;
  const avReel = hasCc && p.cc.avReel != null ? p.cc.avReel : null;
  document.getElementById('pd-kpi-row').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:36px;">
      <div class="enr-kpi-card">
        <div class="ckpi-label" style="color:rgba(${rgb},0.6);">CAPEX Total</div>
        <div class="ckpi-val" style="color:${color};">${fmtM(p.capexM)}</div>
        <div class="ckpi-sub">Dév. ${fmtK(p.costDev)}</div>
        <div class="ckpi-sub">PV ${fmtK(p.costPv)}</div>
      </div>
      <div class="enr-kpi-card">
        <div class="ckpi-label" style="color:rgba(${rgb},0.6);">TRI</div>
        <div class="ckpi-val" style="color:${p.tri >= 10 ? '#00ab63' : p.tri ? '#f37056' : 'rgba(255,255,255,0.3)'};">
          ${p.tri != null ? p.tri + '%' : '—'}
        </div>
        <div class="ckpi-sub">${p.tri >= 10 ? 'Rentable' : p.tri ? 'Faible' : 'À déterminer'}</div>
      </div>
      <div class="enr-kpi-card">
        <div class="ckpi-label" style="color:rgba(${rgb},0.6);">Engineering</div>
        <div class="ckpi-val" style="color:${color};">${p.engPct != null ? engPct + '%' : '—'}</div>
        <div class="ckpi-progress-track" style="background:rgba(${rgb},0.12);height:5px;border-radius:3px;overflow:hidden;margin:6px 0;">
          <div class="ckpi-progress-bar" style="width:${engPct}%;background:${color};height:100%;border-radius:3px;"></div>
        </div>
        <div class="ckpi-sub">${fmtDate(p.engStart)} → ${fmtDate(p.engEnd)}</div>
      </div>
      <div class="enr-kpi-card">
        <div class="ckpi-label" style="color:rgba(${rgb},0.6);">Construction</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.8;margin-top:6px;">
          <div>Début: <span style="color:${color};font-weight:700;">${fmtDate(p.constStart)}</span></div>
          <div>COD: <span style="color:${color};font-weight:700;">${fmtDate(p.constEnd)}</span></div>
        </div>
      </div>
      <div class="enr-kpi-card">
        <div class="ckpi-label" style="color:rgba(${rgb},0.6);">Avancement Réel</div>
        ${avReel != null ? `
          <div class="ckpi-val" style="color:${color};">${avReel}%</div>
          <div class="ckpi-progress-track" style="background:rgba(${rgb},0.12);height:5px;border-radius:3px;overflow:hidden;margin:6px 0;">
            <div class="ckpi-progress-bar" style="width:${avReel}%;background:${color};height:100%;border-radius:3px;"></div>
          </div>
          <div class="ckpi-sub">SPI: ${p.cc.spi != null ? Number(p.cc.spi).toFixed(2) : '—'}</div>
        ` : `<div style="font-size:13px;color:rgba(255,255,255,0.2);margin-top:10px;">Données à venir</div>`}
      </div>
      <div class="enr-kpi-card">
        <div class="ckpi-label" style="color:rgba(${rgb},0.6);">Performance</div>
        ${p.cc && p.cc.perf && !p.cc.perf.startsWith('#') ? `
          <div style="font-size:11px;font-weight:600;color:${p.cc.perf.includes('temps') ? '#00ab63' : '#f37056'};margin-top:8px;line-height:1.5;">${p.cc.perf}</div>
          ${p.cc.cpi != null ? `<div class="ckpi-sub">CPI: ${p.cc.cpi > 10 ? '>10' : Number(p.cc.cpi).toFixed(2)}</div>` : ''}
        ` : `<div style="font-size:13px;color:rgba(255,255,255,0.2);margin-top:10px;">—</div>`}
      </div>
    </div>`;
}

/* ── Section 3: EVM ── */
function renderPdEvm(p, hasCc, color, rgb) {
  const el = document.getElementById('pd-evm-section');
  if (!hasCc) { el.innerHTML = ''; return; }
  const cc = p.cc;
  const ev = cc.bac && cc.avReel ? cc.bac * (cc.avReel / 100) : null;
  const etc = cc.forecast && cc.ac != null ? cc.forecast - cc.ac : null;
  const cv = ev != null && cc.ac != null ? ev - cc.ac : null;
  const sv = ev != null && cc.bac ? ev - (cc.bac * (cc.avReel / 100)) : null;

  el.innerHTML = `
    <div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(${rgb},0.5);margin-bottom:18px;">Earned Value Management (EVM)</div>
    <div class="neutral-card" style="margin-bottom:32px;">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">BAC</div>
          <div style="font-size:20px;font-weight:800;color:rgba(255,255,255,0.85);">${fmtK(cc.bac)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Forecast</div>
          <div style="font-size:20px;font-weight:800;color:#5aafaf;">${fmtK(cc.forecast)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Coût Réel (AC)</div>
          <div style="font-size:20px;font-weight:800;color:#FDB823;">${fmtK(cc.ac)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Valeur Acquise (EV)</div>
          <div style="font-size:20px;font-weight:800;color:#00ab63;">${ev ? fmtK(ev) : '—'}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Reste (ETC)</div>
          <div style="font-size:20px;font-weight:800;color:#f37056;">${etc != null ? fmtK(etc) : '—'}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">SPI</div>
          <div style="font-size:22px;font-weight:800;color:${cc.spi != null && cc.spi >= 1 ? '#00ab63' : cc.spi != null && cc.spi >= 0.9 ? '#FDB823' : cc.spi != null ? '#ff5050' : 'rgba(255,255,255,0.2)'};">${cc.spi != null ? Number(cc.spi).toFixed(2) : '—'}</div>
          ${cc.spi != null ? `<div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin-top:8px;">
            <div style="height:100%;width:${Math.min(cc.spi * 100, 100)}%;background:${cc.spi >= 1 ? '#00ab63' : '#f37056'};border-radius:3px;"></div>
          </div>` : ''}
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">CPI</div>
          <div style="font-size:22px;font-weight:800;color:${cc.cpi != null && cc.cpi >= 1 ? '#00ab63' : cc.cpi != null ? '#ff5050' : 'rgba(255,255,255,0.2)'};">${cc.cpi != null ? (cc.cpi > 10 ? '>10' : Number(cc.cpi).toFixed(2)) : '—'}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Écart Coût (CV)</div>
          <div style="font-size:18px;font-weight:800;color:${cv != null && cv >= 0 ? '#00ab63' : '#ff5050'};">${cv != null ? fmtK(cv) : '—'}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Écart Budget</div>
          <div style="font-size:18px;font-weight:800;color:${cc.forecast <= cc.bac ? '#00ab63' : '#ff5050'};">${fmtK(cc.forecast - cc.bac)}</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.25);margin-top:4px;">${cc.forecast <= cc.bac ? 'Sous budget' : 'Dépassement'}</div>
        </div>
      </div>
    </div>`;
}

/* ── Section 4: Budget Breakdown ── */
function renderPdBudget(p, color, rgb) {
  const total = p.capexM * 1e6;
  const dev = p.costDev || 0;
  const pv = p.costPv || 0;
  const other = Math.max(0, total - dev - pv);
  const pDev = total > 0 ? (dev/total)*100 : 0;
  const pPv = total > 0 ? (pv/total)*100 : 0;
  const pOth = total > 0 ? (other/total)*100 : 0;

  document.getElementById('pd-budget-section').innerHTML = `
    <div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(${rgb},0.5);margin-bottom:18px;">Répartition Budget</div>
    <div class="neutral-card" style="margin-bottom:32px;">
      <div style="display:flex;height:28px;border-radius:8px;overflow:hidden;margin-bottom:18px;">
        <div style="flex:${Math.max(pDev,0.5)};background:rgba(90,175,175,0.7);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;">${pDev > 8 ? 'Dév.' : ''}</div>
        <div style="flex:${Math.max(pPv,0.5)};background:rgba(0,171,99,0.6);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;">${pPv > 8 ? 'PV / EPC' : ''}</div>
        <div style="flex:${Math.max(pOth,0.5)};background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:rgba(255,255,255,0.5);">${pOth > 8 ? 'Autres' : ''}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
        <div style="text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(90,175,175,0.6);margin-bottom:4px;">Développement</div>
          <div style="font-size:20px;font-weight:800;color:#5aafaf;">${fmtK(dev)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3);">${pDev.toFixed(1)}%</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(0,171,99,0.6);margin-bottom:4px;">PV / EPC</div>
          <div style="font-size:20px;font-weight:800;color:#00ab63;">${fmtK(pv)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3);">${pPv.toFixed(1)}%</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Autres</div>
          <div style="font-size:20px;font-weight:800;color:rgba(255,255,255,0.5);">${fmtK(other)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3);">${pOth.toFixed(1)}%</div>
        </div>
      </div>
    </div>`;
}

/* ── Section 5: Cash Flow ── */
function renderPdCashflow(p, hasCc, color, rgb) {
  const el = document.getElementById('pd-cashflow-section');
  const quarters = p.qtr;
  if (!quarters || !quarters.length) {
    el.innerHTML = `
      <div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(${rgb},0.5);margin-bottom:18px;">Flux Financiers</div>
      <div style="background:rgba(${rgb},0.04);border:1px dashed rgba(${rgb},0.2);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
        <div style="font-size:12px;color:rgba(255,255,255,0.25);">Données financières à venir</div>
      </div>`;
    return;
  }

  const maxVal = Math.max(...quarters.map(q => q.a), 1);
  const now = new Date();
  const curQ = 'Q' + Math.ceil((now.getMonth()+1)/3) + '-' + String(now.getFullYear()).slice(2);

  // Determine if quarter is in the past
  function qtrOrder(q) {
    const [qn, yr] = q.replace('Q','').split('-');
    return parseInt('20'+yr)*10 + parseInt(qn);
  }
  const curOrd = qtrOrder(curQ);

  const totalQtr = quarters.reduce((s,q) => s + q.a, 0);
  const spentQtr = quarters.filter(q => qtrOrder(q.q) < curOrd).reduce((s,q) => s + q.a, 0);
  const remainQtr = totalQtr - spentQtr;

  el.innerHTML = `
    <div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(${rgb},0.5);margin-bottom:18px;">Flux Financiers · Décaissements Trimestriels</div>
    <div class="neutral-card" style="margin-bottom:32px;">
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:#00ab63;"></div><span style="font-size:9px;color:rgba(255,255,255,0.4);">Dépensé</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:rgba(253,184,35,0.7);"></div><span style="font-size:9px;color:rgba(255,255,255,0.4);">En cours</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:rgba(243,112,86,0.5);"></div><span style="font-size:9px;color:rgba(255,255,255,0.4);">À venir</span></div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px;padding-bottom:4px;">
        ${quarters.map(q => {
          const h = Math.max(4, Math.round((q.a / maxVal) * 90));
          const ord = qtrOrder(q.q);
          const barColor = ord < curOrd ? '#00ab63' : ord === curOrd ? 'rgba(253,184,35,0.7)' : 'rgba(243,112,86,0.5)';
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
            <div style="font-size:7px;color:rgba(255,255,255,0.4);font-weight:700;">${q.a >= 1e6 ? (q.a/1e6).toFixed(1)+'M' : q.a >= 1e3 ? Math.round(q.a/1e3)+'k' : q.a}</div>
            <div style="width:100%;height:${h}px;background:${barColor};border-radius:4px 4px 0 0;transition:height 0.5s;"></div>
            <div style="font-size:7px;color:rgba(255,255,255,0.25);white-space:nowrap;">${q.q}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px;">
        <div style="text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);">Dépensé</div>
          <div style="font-size:20px;font-weight:800;color:#00ab63;">${hasCc ? fmtK(p.cc.ac) : fmtK(spentQtr)}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);">Reste à décaisser</div>
          <div style="font-size:20px;font-weight:800;color:#f37056;">${hasCc && p.cc.forecast ? fmtK(p.cc.forecast - p.cc.ac) : fmtK(remainQtr)}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);">Total Planifié</div>
          <div style="font-size:20px;font-weight:800;color:#5aafaf;">${fmtK(totalQtr)}</div>
        </div>
      </div>
    </div>`;
}

/* ── Section 6: Gantt simplifié ── */
/* ── Delay Popup ── */
function showDelayPopup(taskName, delayLabel, cause, resolution) {
  const existing = document.querySelector('.sg-popup-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'sg-popup-overlay';
  overlay.innerHTML = `<div class="sg-popup">
    <div class="sg-popup-header">
      <div class="sg-popup-title">${taskName}</div>
      <div class="sg-popup-badge">${delayLabel}</div>
      <button class="sg-popup-close" onclick="this.closest('.sg-popup-overlay').remove()">✕</button>
    </div>
    <div class="sg-popup-section">
      <div class="sg-popup-section-label cause">Cause</div>
      <div class="sg-popup-section-text">${cause}</div>
    </div>
    <div class="sg-popup-section">
      <div class="sg-popup-section-label resolution">Résolution</div>
      <div class="sg-popup-section-text">${resolution}</div>
    </div>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

/* ── Auto-generate stages from project phases ── */
function autoStages(p) {
  const stages = [];
  if (p.engStart && p.engEnd) {
    const ep = p.engPct || 0;
    stages.push({name:'Engineering', tasks:[
      {name:'Études préliminaires', pct:Math.min(100, Math.round(ep*1.2)), status: ep>=100?'done':ep>0?'progress':'pending'},
      {name:'Design détaillé', pct:ep, status: ep>=100?'done':ep>50?'progress':ep>0?'progress':'pending'},
    ]});
  }
  if (p.tendStart && p.tendEnd) {
    stages.push({name:'Tendering & Contrats', tasks:[
      {name:'Appel d\'offres', pct: p.tendDone?100:50, status: p.tendDone?'done':'progress'},
      {name:'Attribution contrat', pct: p.tendDone?100:0, status: p.tendDone?'done':'pending'},
    ]});
  }
  if (p.constStart && p.constEnd) {
    const cp = Math.round((p.constProg||0)*100);
    const isD = p.glissement > 0;
    stages.push({name:'Construction', tasks:[
      {name:'Procurement', pct: cp>20?100:Math.min(100,cp*5), status: cp>20?'done':cp>0?'progress':'pending'},
      {name:'Travaux site', pct:cp, status: isD?'delayed':cp>=100?'done':cp>0?'progress':'pending', delayWeeks: isD?Math.round(p.glissement/7):0},
      {name:'Commissioning', pct: cp>=95?Math.min(100,Math.round((cp-95)*20)):0, status: cp>=100?'done':cp>=95?'progress':'pending'},
    ]});
  }
  return stages;
}

/* ── Section 6: Stage-Gate Gantt ── */
function renderPdGantt(p, phase, color, rgb) {
  const stages = p.stages || autoStages(p);
  if (!stages.length) { document.getElementById('pd-gantt-section').innerHTML = ''; return; }
  const delays = p.delays || {};
  const defaultCause = p.comment || 'Cause en cours d\'analyse';
  const defaultResolution = 'En cours — suivi renforcé';

  /* Store current project delays globally for onclick handlers */
  window._sgDelays = delays;
  window._sgDefaultCause = defaultCause;
  window._sgDefaultResolution = defaultResolution;

  /* Per-stage color palette — matches reference standalone gantt */
  const stageHex = ['#74b859','#5aafaf','#8b7cf6','#f8c100','#ff8758','#6488ff'];
  const stageRgb = ['116,184,89','90,175,175','139,124,246','248,193,0','255,135,88','100,136,255'];

  let html = `<div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(${rgb},0.5);margin-bottom:18px;">Planning · Stage-Gate</div>
  <div class="neutral-card" style="margin-bottom:32px;">`;

  stages.forEach((stage, si) => {
    const sHex = stageHex[si % stageHex.length];
    const sRgb = stageRgb[si % stageRgb.length];
    const stagePct = stage.tasks.length > 0 ? Math.round(stage.tasks.reduce((s,t) => s + t.pct, 0) / stage.tasks.length) : 0;

    /* Stage header row — rendered as a thicker bar like reference */
    html += `<div class="sg-stage">
      <div style="display:flex;align-items:center;min-height:30px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:4px;">
        <div style="flex:0 0 180px;font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.75);padding-left:10px;border-left:3px solid ${sHex};white-space:nowrap;">${stage.name}</div>
        <div style="flex:1;position:relative;height:18px;">
          <div style="position:absolute;inset:0;background:rgba(255,255,255,0.03);border-radius:4px;"></div>
          <div style="position:absolute;left:0;top:0;width:${stagePct}%;height:100%;border-radius:4px;background:${sHex}44;border:1px solid ${sHex}88;overflow:hidden;">
            <div style="height:100%;width:100%;background:${sHex}99;"></div>
            ${stagePct > 15 ? `<div style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);">${stagePct}%</div>` : ''}
          </div>
          ${stagePct <= 15 && stagePct > 0 ? `<div style="position:absolute;left:${stagePct + 1}%;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:rgba(255,255,255,0.4);">${stagePct}%</div>` : ''}
        </div>
      </div>`;
    stage.tasks.forEach(t => {
      const isDelayed = t.status === 'delayed';
      const pctLabel = t.pct > 0 ? t.pct + '%' : '';
      const barW = Math.max(t.pct > 0 ? 3 : 0, t.pct);
      const dInfo = delays[t.name];
      const delayW = t.delayWeeks || (dInfo ? dInfo.weeks : 0);
      const delayLabel = delayW > 0 ? '+' + delayW + ' sem' : '';
      const cause = dInfo ? dInfo.cause : defaultCause;
      const resolution = dInfo ? dInfo.resolution : defaultResolution;
      const escapedName = t.name.replace(/'/g, "\\'");
      const escapedCause = cause.replace(/'/g, "\\'");
      const escapedResolution = resolution.replace(/'/g, "\\'");

      /* Delay offset */
      const delayBarPct = isDelayed && delayW > 0 ? Math.min(30, Math.max(8, Math.round(delayW * 0.8))) : 0;
      const adjustedBarW = isDelayed && delayBarPct > 0 && barW + delayBarPct > 100 ? 100 - delayBarPct : barW;
      const delayBarLeft = adjustedBarW;

      const isPending = t.pct === 0 && !isDelayed;
      /* Task name: indented, orange for delayed */
      const nameStyle = isDelayed ? 'color:rgba(255,135,88,0.75);font-weight:700;' : '';

      html += `<div class="sg-task">
        <div class="sg-task-name" style="padding-left:14px;${nameStyle}">${t.name}</div>
        <div class="sg-bar-track" style="border-radius:4px;${!isPending ? `border:1px solid ${sHex}55;background:${sHex}16;` : ''}">
          ${isPending ? '' : `<div class="sg-bar-fill" style="width:${adjustedBarW}%;background:${sHex}77;border-radius:3px 0 0 3px;">${pctLabel}</div>`}
          ${isDelayed && delayBarPct > 0 ? `<div style="position:absolute;top:0;left:${delayBarLeft}%;width:${delayBarPct}%;height:100%;border-radius:0 4px 4px 0;background:rgba(220,50,50,0.35);border:1px solid rgba(220,50,50,0.5);border-left:none;overflow:visible;cursor:pointer;z-index:2;animation:pulse-delay 2.5s ease-in-out infinite;" onclick="showDelayPopup('${escapedName}','${delayLabel}','${escapedCause}','${escapedResolution}')">
            <div style="height:100%;width:100%;background:rgba(220,50,50,0.55);border-radius:0 3px 3px 0;"></div>
            <div style="position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:rgba(255,180,180,0.9);">⚠</div>
          </div>` : ''}
        </div>
        ${isDelayed && delayBarPct === 0 ? `<span class="sg-warn" onclick="showDelayPopup('${escapedName}','${delayLabel}','${escapedCause}','${escapedResolution}')">⚠</span>` : ''}
      </div>`;
    });
    html += `</div>`;
  });

  /* Legend — matches reference style */
  html += `<div style="display:flex;gap:20px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:7px;"><div style="width:20px;height:8px;border-radius:3px;background:rgba(116,184,89,0.5);border:1px solid rgba(116,184,89,0.7);"></div><span style="font-size:9px;color:rgba(255,255,255,0.35);">Dans les délais</span></div>
    <div style="display:flex;align-items:center;gap:7px;"><div style="width:20px;height:8px;border-radius:3px;background:rgba(220,50,50,0.45);border:1px solid rgba(220,50,50,0.7);"></div><span style="font-size:9px;color:rgba(255,255,255,0.35);">Retard détecté ⚠</span></div>
    <div style="display:flex;align-items:center;gap:7px;"><div style="width:20px;height:4px;border-radius:2px;background:rgba(255,255,255,0.15);"></div><span style="font-size:9px;color:rgba(255,255,255,0.35);">À venir</span></div>
    <div style="display:flex;align-items:center;gap:7px;"><span style="font-size:11px;filter:drop-shadow(0 0 3px rgba(220,50,50,0.4));">⚠</span><span style="font-size:9px;color:rgba(255,255,255,0.35);">Cliquer pour détails</span></div>
  </div>`;

  html += `</div>`;
  document.getElementById('pd-gantt-section').innerHTML = html;
}

/* ── Section 7: Schedule ── */
function renderPdSchedule(p, color, rgb, hasCc) {
  const cc = p.cc || {};
  const hasExtra = cc.debPlan || cc.codPlan;
  const constDays = p.constStart && p.constEnd ? Math.round((new Date(p.constEnd)-new Date(p.constStart))/(864e5)) : null;
  const engDays = p.engStart && p.engEnd ? Math.round((new Date(p.engEnd)-new Date(p.engStart))/(864e5)) : null;

  document.getElementById('pd-schedule-section').innerHTML = `
    <div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(${rgb},0.5);margin-bottom:18px;">Planning & Écarts</div>
    <div class="neutral-card" style="margin-bottom:32px;">
      <div style="display:grid;grid-template-columns:repeat(${hasExtra && cc.ecartJours !== undefined ? 4 : 3},1fr);gap:14px;">
        <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Début ${hasExtra ? 'Planifié' : ''}</div>
          <div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.85);">${fmtDate(hasExtra ? cc.debPlan : p.constStart)}</div>
          ${hasExtra && cc.debReel ? `<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:4px;">Réel: ${fmtDate(cc.debReel)}</div>` : ''}
        </div>
        <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">COD ${hasExtra ? 'Planifiée' : ''}</div>
          <div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.85);">${fmtDate(hasExtra ? cc.codPlan : p.constEnd)}</div>
          ${hasExtra && cc.codReel ? `<div style="font-size:9px;color:${cc.ecartJours > 0 ? '#ff5050' : '#00ab63'};margin-top:4px;">Réel: ${fmtDate(cc.codReel)}</div>` : ''}
        </div>
        ${hasExtra && cc.ecartJours !== undefined ? `
          <div style="background:rgba(0,0,0,0.2);border:1px solid ${cc.ecartJours > 0 ? 'rgba(255,80,80,0.3)' : 'rgba(0,171,99,0.3)'};border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Glissement</div>
            <div style="font-size:24px;font-weight:800;color:${cc.ecartJours > 0 ? '#ff5050' : '#00ab63'};">${cc.ecartJours} j</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.3);">${cc.ecartJours > 0 ? 'En retard' : cc.ecartJours === 0 ? 'Dans les temps' : 'En avance'}</div>
          </div>
        ` : ''}
        <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Durées</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);line-height:1.8;">
            <div>Eng: <span style="font-weight:700;color:rgba(255,255,255,0.7);">${engDays ? engDays + ' j' : '—'}</span></div>
            <div>Const: <span style="font-weight:700;color:rgba(255,255,255,0.7);">${constDays ? constDays + ' j' : '—'}</span></div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Section 8: Comments ── */
function renderPdComments(p) {
  const el = document.getElementById('pd-comments-section');
  if (!p.comment) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(243,112,86,0.6);margin-bottom:18px;">Commentaires & Risques</div>
    <div style="background:rgba(243,112,86,0.06);border:1px solid rgba(243,112,86,0.15);border-radius:14px;padding:18px;margin-bottom:32px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:16px;">⚠</span>
        <div style="font-size:11px;color:rgba(255,180,130,0.8);line-height:1.6;">${p.comment}</div>
      </div>
    </div>`;
}
var diegoData = {
  dev: {
    badge: 'Phase Développement', badgeColor: '#00ab63',
    investInit: '250 000 $', tri: '10%', triRevised: '4%',
    dateDebInit: '01.02.26', dateDebReel: '01.02.26',
    dateFinInit: '30.09.26', dateFinReel: '30.09.26',
    avancement: 0,
  },
  const: {
    badge: 'Phase Construction', badgeColor: '#FDB823',
    investInit: '6 890 560 $', tri: '13%',
    dateDebInit: '20.10.26', dateDebReel: '20.10.26',
    dateFinInit: '15.09.27', dateFinReel: '15.09.27',
    avancement: 0,
  }
};

// Gantt tasks — toutes issues du fichier Excel avec avancement simulé
var ganttTasks = [
  // STAGE 1
  { stage:1, label:'STAGE 1 · Identification & Concept', start:'2022-05-31', end:'2022-11-15', pct:100, type:'stage', delay:false },
  { stage:1, label:'Identification terrain', start:'2022-05-31', end:'2022-08-14', pct:100, type:'task', delay:false },
  { stage:1, label:'Acquisition foncière', start:'2022-08-14', end:'2022-10-05', endPlanned:'2022-09-14', pct:100, type:'task', delay:true, delayInfo:{retard:'+3 sem',raison:'Négociations foncières complexes avec les propriétaires locaux — accords sur les compensations',resolution:'Médiation via autorités communales, accord signé fin Sep 2022'} },
  { stage:1, label:'Topographie & Géotechnique', start:'2022-09-28', end:'2022-10-18', pct:100, type:'task', delay:false },
  { stage:1, label:'PPA Due Diligence & Financement', start:'2022-09-26', end:'2022-11-11', pct:100, type:'task', delay:false },

  // STAGE 2
  { stage:2, label:'STAGE 2 · Étude de Faisabilité', start:'2022-06-03', end:'2022-11-23', pct:100, type:'stage', delay:false },
  { stage:2, label:'Données client & conception', start:'2022-06-03', end:'2022-10-06', pct:100, type:'task', delay:false },
  { stage:2, label:'Étude rendement (EYA)', start:'2022-08-26', end:'2022-09-08', pct:100, type:'task', delay:false },
  { stage:2, label:'Permis environnementaux', start:'2022-10-13', end:'2022-12-01', endPlanned:'2022-10-27', pct:100, type:'task', delay:true, delayInfo:{retard:'+5 sem',raison:'EIED (Étude Impact Environnemental) soumise trop tard — dossier incomplet au 1er dépôt',resolution:'Complément de dossier fourni, validation obtenue Nov 2022 après relances ministère'} },
  { stage:2, label:'Rapport final (EN/FR)', start:'2022-10-07', end:'2022-10-13', pct:100, type:'task', delay:false },

  // STAGE 3
  { stage:3, label:'STAGE 3 · Financement & Contrats', start:'2022-10-13', end:'2022-12-12', pct:100, type:'stage', delay:false },
  { stage:3, label:'Due Diligence financement', start:'2022-10-13', end:'2023-01-09', endPlanned:'2022-12-12', pct:100, type:'task', delay:true, delayInfo:{retard:'+4 sem',raison:'Demandes complémentaires de l\'institution de financement (audits, projections 25 ans)',resolution:'Fourniture rapports audités + modèle financier révisé, closing fin déc 2022'} },
  { stage:3, label:'Signature contrats', start:'2022-10-13', end:'2022-12-12', pct:100, type:'task', delay:false },

  // STAGE 4
  { stage:4, label:'STAGE 4 · Design Détaillé', start:'2022-12-13', end:'2023-03-06', pct:100, type:'stage', delay:false },
  { stage:4, label:'Accord de prêt', start:'2022-12-13', end:'2023-01-23', pct:100, type:'task', delay:false },
  { stage:4, label:'Design détaillé projet', start:'2022-12-13', end:'2023-01-23', pct:100, type:'task', delay:false },
  { stage:4, label:'Finalisation permis', start:'2023-01-24', end:'2023-03-06', pct:100, type:'task', delay:false },

  // STAGE 5
  { stage:5, label:'STAGE 5 · Construction & Achat', start:'2023-03-07', end:'2024-02-05', pct:68, type:'stage', delay:false },
  { stage:5, label:'Approvisionnement matériaux', start:'2023-03-07', end:'2023-10-09', endPlanned:'2023-08-21', pct:100, type:'task', delay:true, delayInfo:{retard:'+7 sem',raison:'Pénuries mondiales d\'acier & délais de livraison maritime post-COVID pour les mâts éoliens',resolution:'Fournisseur alternatif Europe de l\'Est, commandes fractionnées, livraison assurée Août 2023'} },
  { stage:5, label:'Structures & fondations', start:'2023-03-07', end:'2023-07-10', pct:100, type:'task', delay:false },
  { stage:5, label:'Génie civil', start:'2023-03-07', end:'2023-07-31', endPlanned:'2023-07-10', pct:100, type:'task', delay:true, delayInfo:{retard:'+3 sem',raison:'Terrain rocheux non détecté en géotechnique — renforcement fondations requis',resolution:'Adaptation technique sur site, renfort béton armé, réception travaux Juil 2023'} },
  { stage:5, label:'Installation fondations & tables', start:'2023-07-11', end:'2023-10-02', pct:85, type:'task', delay:false },
  { stage:5, label:'Installation panneaux & câblage', start:'2023-10-03', end:'2023-12-25', pct:40, type:'task', delay:false },
  { stage:5, label:'Équipements électriques', start:'2023-12-26', end:'2024-02-05', pct:10, type:'task', delay:false },

  // STAGE 6
  { stage:6, label:'STAGE 6 · Mise en Service', start:'2024-02-06', end:'2024-02-29', pct:0, type:'stage', delay:false },
  { stage:6, label:'Cold commissioning', start:'2024-02-06', end:'2024-02-14', pct:0, type:'task', delay:false },
  { stage:6, label:'Hot commissioning & PCOD', start:'2024-02-14', end:'2024-02-29', pct:0, type:'task', delay:false },
];

var stageColors = {
  1:'#00ab63', 2:'#5aafaf', 3:'#5e4c9f', 4:'#FDB823', 5:'#f37056', 6:'#426ab3'
};

function parseDateStr(s) { const [y,m,d] = s.split('-'); return new Date(+y,+m-1,+d); }

function renderDiegoGantt() {
  const el = document.getElementById('diego-gantt');
  if(!el) return;

  const allStart = new Date('2022-05-31');
  const allEnd   = new Date('2024-02-29');
  const totalMs  = allEnd - allStart;
  const today    = new Date('2023-11-15'); // simulated today

  // Month headers
  const months = [];
  let d = new Date(allStart.getFullYear(), allStart.getMonth(), 1);
  while(d <= allEnd) {
    months.push(new Date(d));
    d = new Date(d.getFullYear(), d.getMonth()+1, 1);
  }

  const pct = (dt) => Math.max(0, Math.min(100, ((parseDateStr(dt instanceof Date ? dt.toISOString().slice(0,10) : dt) - allStart) / totalMs) * 100));
  const pctDate = (dt) => {
    const dp = dt instanceof Date ? dt : parseDateStr(dt);
    return Math.max(0, Math.min(100, ((dp - allStart) / totalMs) * 100));
  };
  const widthPct = (s,e) => Math.max(0.5, pctDate(parseDateStr(e)) - pctDate(parseDateStr(s)));

  const todayPct = pctDate(today);
  const nameW = 240;

  // Build month header cells
  const monthCells = [];
  months.forEach(m => {
    const w = widthPct(
      m.toISOString().slice(0,10),
      new Date(m.getFullYear(), m.getMonth()+1, 0).toISOString().slice(0,10)
    );
    const label = m.toLocaleDateString('fr-FR',{month:'short',year:'2-digit'});
    monthCells.push({w, label, leftPct: pctDate(m)});
  });

  let html = `<div class="gantt-zp-wrapper neutral-card" style="padding:0;">
    <div class="gantt-zoom-controls">
      <button class="gantt-zoom-btn" data-action="minus">\u2212</button>
      <span class="gantt-zoom-label">1x</span>
      <button class="gantt-zoom-btn" data-action="plus">+</button>
      <span class="gantt-zoom-reset">Reset</span>
    </div>
    <div class="gantt-zp-header" style="display:flex;padding:12px 24px 0 24px;background:rgba(0,171,99,0.06);">
      <div class="gantt-zp-name" style="flex:0 0 ${nameW}px;background:rgba(0,171,99,0.06);"></div>
      <div class="gantt-timeline-inner" style="display:flex;flex:1;min-width:0;">`;
  monthCells.forEach(mc => {
    html += `<div class="gantt-timeline-cell" style="flex:0 0 ${mc.w}%;">${mc.label}</div>`;
  });
  html += `</div></div>
    <div class="gantt-zp-viewport" style="padding:8px 24px 24px 24px;">
      <div class="gantt-zp-content" style="position:relative;min-width:700px;">`;

  // Vertical gridlines
  monthCells.forEach(mc => {
    html += `<div class="gantt-zp-gridline" style="left:${mc.leftPct}%;"></div>`;
  });

  // Today line
  html += `<div style="position:absolute;left:${todayPct}%;top:0;bottom:0;width:2px;background:rgba(255,255,255,0.18);z-index:2;pointer-events:none;">
    <div style="position:absolute;top:-4px;left:-18px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.1em;white-space:nowrap;">Aujourd'hui</div>
  </div>`;

  // Rows
  ganttTasks.forEach(t => {
    const isStage = t.type === 'stage';
    const color = stageColors[t.stage];
    const barH  = isStage ? 18 : 13;
    const rowBg = isStage ? 'rgba(255,255,255,0.03)' : 'transparent';
    const nameStyle = isStage
      ? `font-size:10px;font-weight:800;color:rgba(255,255,255,0.75);`
      : `font-size:9px;font-weight:500;color:${t.delay ? 'rgba(243,112,86,0.75)' : 'rgba(255,255,255,0.45)'};padding-left:14px;`;

    // For delayed tasks with endPlanned: split bar into [start→endPlanned] (normal) + [endPlanned→end] (red)
    let barHtml = '';
    if (t.delay && t.endPlanned) {
      const leftPlan   = widthPct(allStart.toISOString().slice(0,10), t.start);
      const widthPlan  = widthPct(t.start, t.endPlanned);
      const widthOver  = widthPct(t.endPlanned, t.end);
      const totalW     = widthPlan + widthOver;
      const delayId    = 'delay-' + t.label.replace(/[^a-z0-9]/gi,'_');
      barHtml = `
        <!-- normal segment -->
        <div style="position:absolute;left:${leftPlan}%;width:${widthPlan}%;height:100%;
             background:${color}33;border:1px solid ${color}66;
             border-radius:4px 0 0 4px;overflow:hidden;">
          <div style="height:100%;width:100%;background:${color}88;"></div>
        </div>
        <!-- delay overflow (red) — clickable -->
        <div onclick="toggleDelayPopup('${delayId}',event)"
             style="position:absolute;left:${leftPlan + widthPlan}%;width:${widthOver}%;height:100%;
             background:rgba(220,50,50,0.35);border:1px solid rgba(220,50,50,0.5);border-left:none;
             border-radius:0 4px 4px 0;overflow:visible;cursor:pointer;z-index:2;
             animation:pulse-delay 2.5s ease-in-out infinite;">
          <div style="height:100%;width:100%;background:rgba(220,50,50,0.55);border-radius:0 3px 3px 0;"></div>
          <div style="position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:rgba(255,180,180,0.9);">⚠</div>
        </div>
        <!-- Popup -->
        <div id="${delayId}" style="display:none;position:absolute;left:${Math.min(leftPlan + widthPlan, 60)}%;top:calc(100% + 8px);z-index:50;
             width:280px;background:#1a0f0f;border:1px solid rgba(220,50,50,0.5);border-radius:14px;
             padding:16px;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.85);">${t.label}</span>
              <span style="font-size:9px;font-weight:700;color:#f37056;background:rgba(243,112,86,0.15);border-radius:5px;padding:2px 7px;">${t.delayInfo.retard}</span>
            </div>
            <button onclick="closeDelayPopup('${delayId}',event)"
                    style="background:rgba(255,255,255,0.08);border:none;border-radius:6px;color:rgba(255,255,255,0.5);
                    font-size:11px;cursor:pointer;padding:3px 7px;line-height:1;font-family:inherit;">✕</button>
          </div>
          <div style="background:rgba(220,50,50,0.08);border-radius:8px;padding:10px;margin-bottom:8px;">
            <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(243,112,86,0.6);margin-bottom:5px;">Cause</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.65);line-height:1.5;">${t.delayInfo.raison}</div>
          </div>
          <div style="background:rgba(0,171,99,0.06);border-radius:8px;padding:10px;">
            <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(0,171,99,0.5);margin-bottom:5px;">Résolution</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.65);line-height:1.5;">${t.delayInfo.resolution}</div>
          </div>
          <!-- Arrow -->
          <div style="position:absolute;top:-6px;left:20px;width:10px;height:10px;background:#1a0f0f;
               border-left:1px solid rgba(220,50,50,0.5);border-top:1px solid rgba(220,50,50,0.5);
               transform:rotate(45deg);"></div>
        </div>`;
    } else {
      const left  = widthPct(allStart.toISOString().slice(0,10), t.start);
      const width = widthPct(t.start, t.end);
      const barBg     = isStage ? color+'44' : color+'28';
      const barBorder = color + (isStage ? '88' : '55');
      const fillColor = color + (isStage ? '99' : '77');
      barHtml = `
        <div style="position:absolute;left:${left}%;width:${width}%;height:100%;border-radius:4px;
             background:${barBg};border:1px solid ${barBorder};overflow:hidden;">
          <div style="height:100%;width:${t.pct}%;background:${fillColor};border-radius:3px 0 0 3px;transition:width 1s;"></div>
          ${t.pct > 15 ? `<div style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);">${t.pct}%</div>` : ''}
        </div>`;
    }

    html += `<div style="display:flex;align-items:center;min-height:${barH+12}px;background:${rowBg};border-radius:6px;margin-bottom:2px;">
      <div class="gantt-zp-name" style="flex:0 0 ${nameW}px;padding-right:12px;display:flex;align-items:center;gap:6px;background:inherit;">
        <span style="${nameStyle}">${t.label}</span>
        ${t.delay ? `<span style="font-size:7px;color:#f37056;font-weight:700;">⚠</span>` : ''}
      </div>
      <div style="flex:1;position:relative;height:${barH}px;">
        <div style="position:absolute;inset:0;background:rgba(255,255,255,0.03);border-radius:4px;"></div>
        ${barHtml}
      </div>
    </div>`;
  });

  html += `</div></div></div>`; // close gantt-zp-content, gantt-zp-viewport, gantt-zp-wrapper
  el.innerHTML = html;
  initGanttZoomPan('diego-gantt', nameW);

  // Delay cards
  const delays = ganttTasks.filter(t => t.delay && t.delayInfo);
  document.getElementById('diego-delays').innerHTML = delays.map(t => `
    <div style="background:rgba(243,112,86,0.05);border:1px solid rgba(243,112,86,0.2);border-radius:14px;padding:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#f37056;flex-shrink:0;"></div>
        <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.85);">${t.label}</span>
        <span style="font-size:9px;font-weight:700;color:#f37056;background:rgba(243,112,86,0.12);border-radius:5px;padding:2px 8px;">${t.delayInfo.retard}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px 12px;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(243,112,86,0.5);margin-bottom:5px;">Cause du retard</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.5;">${t.delayInfo.raison}</div>
        </div>
        <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px 12px;">
          <div style="font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(0,171,99,0.5);margin-bottom:5px;">Résolution</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.5;">${t.delayInfo.resolution}</div>
        </div>
      </div>
    </div>`).join('');
}

function toggleDelayPopup(id, e) {
  e.stopPropagation();
  // Close any other open popup first
  document.querySelectorAll('[id^="delay-"]').forEach(el => {
    if (el.id !== id) el.style.display = 'none';
  });
  const popup = document.getElementById(id);
  if (!popup) return;
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
}
function closeDelayPopup(id, e) {
  e.stopPropagation();
  const popup = document.getElementById(id);
  if (popup) popup.style.display = 'none';
}
// Click outside closes all popups
document.addEventListener('click', function() {
  document.querySelectorAll('[id^="delay-"]').forEach(el => {
    el.style.display = 'none';
  });
});

function openDiegoDetail(phase) {
  const d = diegoData[phase] || diegoData.const;
  const badge = document.getElementById('diego-phase-badge-inline');
  badge.textContent = d.badge;
  badge.style.background = d.badgeColor + '22';
  badge.style.color = d.badgeColor;
  badge.style.border = `1px solid ${d.badgeColor}44`;

  document.getElementById('dg-kpi-budget').innerHTML = `
    <div class="ckpi-label">Budget total</div>
    <div class="ckpi-val">${d.investInit}</div>
    <div class="ckpi-sub">Investissement initial</div>`;

  document.getElementById('dg-kpi-tri').innerHTML = `
    <div class="ckpi-label">TRI</div>
    <div class="ckpi-val" style="color:#00ab63;">${d.tri}</div>
    <div class="ckpi-sub-row">
      <span class="ckpi-tag-init">Initial</span>
      ${d.triRevised ? `<span class="ckpi-delta down">Révisé ${d.triRevised}</span>` : ''}
    </div>`;

  document.getElementById('dg-kpi-debut').innerHTML = `
    <div class="ckpi-label">Date de début</div>
    <div class="ckpi-val" style="font-size:18px;">${d.dateDebInit}</div>
    <div class="ckpi-sub">Réel : ${d.dateDebReel}</div>`;

  document.getElementById('dg-kpi-fin').innerHTML = `
    <div class="ckpi-label">Date de fin</div>
    <div class="ckpi-val" style="font-size:18px;">${d.dateFinInit}</div>
    <div class="ckpi-sub">Prévisionnelle : ${d.dateFinReel}</div>`;

  document.getElementById('dg-kpi-avance').innerHTML = `
    <div class="ckpi-label">Avancement global</div>
    <div class="ckpi-val" style="color:#FDB823;">68%</div>
    <div class="ckpi-progress-wrap">
      <div class="ckpi-progress-track"><div class="ckpi-progress-bar" style="width:68%;background:#FDB823;"></div></div>
    </div>`;

  renderDiegoGantt();

  document.getElementById('panel-diego-detail').style.transform = 'translateX(0)';
  document.getElementById('panel-diego-detail').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeDiegoDetail() {
  document.getElementById('panel-diego-detail').style.transform = 'translateX(100%)';
  document.body.style.overflow = '';
}

