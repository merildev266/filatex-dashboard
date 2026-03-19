/* === Properties JS === */

(function(){
  const azur='#426ab3', terra='#f37056', vert='#00ab63', red='#ff5050', neonRed='#ff2040';
  const today = new Date();

  const devProjects = [
    { id:'casa-del-lago', name:'Casa Del Lago', duree:1308, debut:'2024-12-19', fin:'2029-12-24', glissMax:168,
      tasks:[
        {name:'GO du CSI',debut:'2024-12-19',fin:'2024-12-19',g:0},
        {name:'Programme & architecte',debut:'2025-01-06',fin:'2025-03-28',g:0},
        {name:'Conception sommaire',debut:'2025-04-28',fin:'2025-08-15',g:56},
        {name:'Brochure',debut:'2025-08-18',fin:'2026-01-30',g:168},
        {name:'Dossier APD et DCE',debut:'2025-08-18',fin:'2026-02-13',g:126},
        {name:'Appel d\'offre',debut:'2026-02-16',fin:'2026-03-27',g:112},
        {name:'Morcellement judiciaire',debut:'2025-09-01',fin:'2026-05-08',g:0},
        {name:'Instruction permis construire',debut:'2025-09-09',fin:'2026-04-20',g:56},
        {name:'Travaux',debut:'2026-04-21',fin:'2029-12-24',g:56}
      ],
      comment:'Brochure +168j. Vente terrains nus stand-by 1 mois. Problemes politiques sept/oct impact 1 mois.'
    },
    { id:'hermes', name:'Hermes', duree:948, debut:'2024-12-19', fin:'2028-08-15', glissMax:0,
      tasks:[
        {name:'GO du CSI',debut:'2024-12-19',fin:'2024-12-19',g:0},
        {name:'Programme & architecte',debut:'2025-01-16',fin:'2025-03-03',g:0},
        {name:'Process P2P',debut:'2025-03-03',fin:'2025-03-17',g:0},
        {name:'Conception sommaire',debut:'2025-03-17',fin:'2025-08-15',g:0},
        {name:'Brochure',debut:'2025-07-07',fin:'2025-12-15',g:0},
        {name:'DCE et nego',debut:'2025-07-07',fin:'2026-02-13',g:0},
        {name:'Instruction permis construire',debut:'2025-09-08',fin:'2026-06-15',g:0},
        {name:'Travaux bloc B + C',debut:'2026-06-16',fin:'2028-08-15',g:0}
      ],
      comment:'Dans les temps. 2 blocs: extension (B) + renovation (C).'
    },
    { id:'hotel-tamatave', name:'Hotel Tamatave', duree:880, debut:'2025-01-15', fin:'2028-05-30', glissMax:230,
      tasks:[
        {name:'Esquisse Jordi',debut:'2025-01-15',fin:'2025-02-11',g:0},
        {name:'Programme & architecte',debut:'2025-01-15',fin:'2025-03-11',g:0},
        {name:'Conception',debut:'2025-03-12',fin:'2025-08-26',g:42},
        {name:'DCE',debut:'2025-08-27',fin:'2026-02-13',g:129},
        {name:'Appel d\'offre',debut:'2026-02-16',fin:'2026-03-13',g:115},
        {name:'Contractualisation exploitant',debut:'2025-03-12',fin:'2025-11-18',g:140},
        {name:'Depot financement bancaire',debut:'2026-03-02',fin:'2026-03-02',g:230},
        {name:'Instruction permis construire',debut:'2025-09-24',fin:'2026-06-02',g:126},
        {name:'Travaux',debut:'2026-06-03',fin:'2028-05-30',g:126}
      ],
      comment:'Retard important. Nego exploitant tres longue (+140j). Pb politiques sept/oct. Paiement bloque phase conception.'
    },
    { id:'ivatosoa', name:'Residence Ivatosoa', duree:1160, debut:'2026-02-27', fin:'2030-08-08', glissMax:0,
      tasks:[
        {name:'GO du CSI',debut:'2026-02-27',fin:'2026-02-27',g:0},
        {name:'Calage plan masse',debut:'2026-02-27',fin:'2026-03-26',g:0},
        {name:'DCE et permis construire',debut:'2026-03-27',fin:'2026-06-18',g:0},
        {name:'Instruction permis',debut:'2026-06-19',fin:'2026-09-10',g:0},
        {name:'AO et negociations',debut:'2026-06-19',fin:'2026-07-30',g:0},
        {name:'Travaux villas temoins',debut:'2026-09-11',fin:'2026-12-31',g:0},
        {name:'Commercialisation villas',debut:'2027-01-01',fin:'2027-03-25',g:0},
        {name:'Dev projet complet',debut:'2027-03-26',fin:'2030-08-08',g:0}
      ],
      comment:'Nouveau projet. Phase 1 villas temoins puis developpement complet si succes.'
    },
    { id:'zf-colina', name:'ZF Colina', duree:807, debut:'2025-12-12', fin:'2029-01-15', glissMax:31,
      tasks:[
        {name:'GO du CSI',debut:'2025-12-12',fin:'2025-12-12',g:0},
        {name:'Process P2P',debut:'2025-12-15',fin:'2026-02-13',g:29},
        {name:'Etudes EIES',debut:'2026-02-16',fin:'2026-05-08',g:29},
        {name:'APD complet',debut:'2026-02-16',fin:'2026-06-05',g:29},
        {name:'Pre-commercialisation',debut:'2026-04-10',fin:'2026-06-04',g:29},
        {name:'Permis environnemental',debut:'2026-05-11',fin:'2026-07-03',g:9},
        {name:'DCE et AO',debut:'2026-06-08',fin:'2026-07-31',g:29},
        {name:'Instruction permis construire',debut:'2026-07-07',fin:'2026-10-26',g:31},
        {name:'Consultations bailleurs',debut:'2025-12-15',fin:'2026-04-03',g:0},
        {name:'Travaux phase 1',debut:'2026-10-27',fin:'2029-01-15',g:31}
      ],
      comment:'Blocage P2P (+29j). Delai instruction PC tres court, appui necessaire.'
    },
    { id:'projet-ecole', name:'Projet Ecole', duree:730, debut:'2025-12-17', fin:'2027-09-10', glissMax:55,
      tasks:[
        {name:'GO du CA',debut:'2025-12-17',fin:'2025-12-17',g:0},
        {name:'Accord formel MLF',debut:'2026-01-20',fin:'2026-02-13',g:38},
        {name:'Choix equipe MOE',debut:'2026-01-19',fin:'2026-02-27',g:30},
        {name:'Prescriptions urbanisme',debut:'2025-12-17',fin:'2026-01-15',g:0},
        {name:'Etude APS',debut:'2026-03-02',fin:'2026-04-28',g:32},
        {name:'Validation APS',debut:'2026-04-29',fin:'2026-05-05',g:32},
        {name:'APD',debut:'2026-05-06',fin:'2026-07-02',g:30},
        {name:'DCE phase 1',debut:'2026-07-10',fin:'2026-08-07',g:30},
        {name:'AO phase 1',debut:'2026-08-10',fin:'2026-09-18',g:30},
        {name:'Instruction permis construire',debut:'2026-07-24',fin:'2026-11-12',g:55},
        {name:'Travaux phase 1',debut:'2026-10-12',fin:'2027-09-10',g:16}
      ],
      comment:'Accord MLF non finalise au 04/02 (+38j). Appui necessaire pour raccourcir instruction PC.'
    },
    { id:'eden-extension', name:'Eden Extension 6 Villas', duree:1200, debut:'2026-02-12', fin:'2030-09-18', glissMax:0,
      tasks:[
        {name:'GO du COPIL',debut:'2026-02-12',fin:'2026-02-12',g:0},
        {name:'Acquisition propriete',debut:'2026-02-12',fin:'2026-06-03',g:0},
        {name:'Modification PUDe',debut:'2026-06-04',fin:'2026-11-18',g:0},
        {name:'Permis environnemental',debut:'2026-06-04',fin:'2026-11-18',g:0},
        {name:'Conception et etudes',debut:'2026-11-19',fin:'2027-05-05',g:0},
        {name:'Brochure',debut:'2027-05-06',fin:'2027-06-30',g:0},
        {name:'Instruction permis construire',debut:'2027-05-06',fin:'2027-12-15',g:0},
        {name:'Travaux',debut:'2027-12-16',fin:'2030-09-18',g:0}
      ],
      comment:'Nouveau projet. 6 villas haut de gamme. Permis environnemental sur 2 saisons requis.'
    }
  ];

  window._devProjects = devProjects;

  function pDate(s){ const p=s.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
  function daysDiff(a,b){ return Math.round((b-a)/86400000); }
  function fmtDate(s){ const p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(2); }

  // Current phases
  devProjects.forEach(p => {
    p.phases = [];
    p.nextPhase = null;
    const d0 = pDate(p.debut), df = pDate(p.fin);
    p.pct = today >= df ? 100 : today <= d0 ? 0 : Math.round(daysDiff(d0,today)/daysDiff(d0,df)*100);
    p.tasks.forEach(t => {
      const td = pDate(t.debut), tf = pDate(t.fin);
      t.done = today >= tf;
      t.active = td <= today && today <= tf;
      if(t.active) p.phases.push(t.name);
      else if(td > today && !p.nextPhase) p.nextPhase = t.name;
    });
    p.status = p.glissMax > 30 ? 'retard' : p.glissMax > 0 ? 'leger' : 'ok';
  });

  // KPIs
  const total = devProjects.length;
  const enRetard = devProjects.filter(p=>p.glissMax>30).length;
  const permisDeposes = 3;
  const glissMoy = Math.round(devProjects.reduce((s,p)=>s+p.glissMax,0)/total);
  const avgPct = Math.round(devProjects.reduce((s,p)=>s+p.pct,0)/total);

  document.getElementById('dev-kpi-grid').innerHTML = `
    <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Projets en cours</div><div class="props-kpi-val" style="color:${azur};">${total}</div><div class="props-kpi-sub">Developpement actif</div></div>
    <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Permis deposes</div><div class="props-kpi-val">${permisDeposes} / ${total}</div><div class="props-kpi-sub">En instruction</div></div>
    <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Avancement moy.</div><div class="props-kpi-val" style="color:${azur};">${avgPct} %</div><div class="props-kpi-sub">Tous projets</div></div>
    <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Glissement moy.</div><div class="props-kpi-val" style="color:${glissMoy>30?red:azur};">${glissMoy} j</div><div class="props-kpi-sub">${enRetard} projet${enRetard>1?'s':''} en retard</div></div>
  `;

  // Alert banner
  const delayed = devProjects.filter(p=>p.glissMax>30);
  if(delayed.length){
    document.getElementById('dev-alert-banner').innerHTML = `
      <div style="margin-top:12px;padding:10px 16px;border-radius:10px;background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.15);display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:#ff5050;">&#9888; Projets en retard :</span>
        ${delayed.map(p=>`<span style="font-size:10px;color:#ff5050;background:rgba(255,80,80,0.1);padding:3px 8px;border-radius:6px;">${p.name} <b>+${p.glissMax}j</b></span>`).join('')}
      </div>`;
  }

  // Project cards — clickable
  const list = document.getElementById('dev-projects-list');
  devProjects.forEach((p,idx) => {
    const statusColor = p.status==='retard' ? red : p.status==='leger' ? '#FDB823' : vert;
    const statusLabel = p.status==='retard' ? 'En retard +'+p.glissMax+'j' : p.status==='leger' ? '+'+p.glissMax+'j retard' : 'Dans les temps';
    const phaseStr = p.phases.length ? p.phases.join(', ') : (p.nextPhase ? 'Prochaine: '+p.nextPhase : 'Non demarre');
    const d0 = pDate(p.debut), df = pDate(p.fin);
    const totalDays = daysDiff(d0,df);
    let timelineHtml = '<div style="display:flex;gap:1px;height:6px;border-radius:3px;overflow:hidden;margin-top:6px;">';
    p.tasks.forEach(t => {
      const td = pDate(t.debut), tf = pDate(t.fin);
      const w = Math.max(daysDiff(td,tf)/totalDays*100, 0.5);
      const hasDelay = t.g > 0;
      const bg = hasDelay ? (t.done ? 'rgba(255,32,64,0.6)' : 'rgba(255,32,64,0.8)') : (t.done ? 'rgba(66,106,179,0.5)' : t.active ? azur : 'rgba(66,106,179,0.12)');
      timelineHtml += '<div style="width:'+w+'%;background:'+bg+';border-radius:1px;" title="'+t.name+(hasDelay?' (+'+t.g+'j)':'')+'"></div>';
    });
    timelineHtml += '</div>';

    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(66,106,179,0.04);border:1px solid rgba(66,106,179,0.12);border-radius:12px;padding:16px;cursor:pointer;transition:border-color 0.2s,transform 0.15s;';
    card.onmouseenter = function(){ this.style.borderColor='rgba(66,106,179,0.35)'; this.style.transform='translateY(-2px)'; };
    card.onmouseleave = function(){ this.style.borderColor='rgba(66,106,179,0.12)'; this.style.transform='none'; };
    card.onclick = function(){ openDevProject(idx); };
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;color:#fff;">${p.name}</div>
        <span style="font-size:9px;font-weight:700;color:${statusColor};background:${statusColor}15;padding:3px 8px;border-radius:6px;">${statusLabel}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.5);">Avancement</span>
        <span style="font-size:12px;font-weight:700;color:${azur};">${p.pct}%</span>
      </div>
      <div style="height:5px;background:rgba(66,106,179,0.1);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${p.pct}%;background:${p.status==='retard'?neonRed:azur};border-radius:3px;"></div>
      </div>
      ${p.glissMax > 0 ? '<div style="font-size:10px;color:'+statusColor+';margin-top:8px;font-weight:600;">+'+p.glissMax+' jours</div>' : ''}
      <div style="margin-top:8px;font-size:10px;color:rgba(255,255,255,0.45);">${phaseStr}</div>
    `;
    list.appendChild(card);
  });

  // Update main Properties card
  const devCard = document.querySelector('[data-pole="dev"]');
  if(devCard){
    const cells = devCard.querySelectorAll('.csec-kpi-val');
    if(cells[0]) cells[0].textContent = total;
    if(cells[1]) cells[1].textContent = permisDeposes + ' / ' + total;
    if(cells[2]) cells[2].textContent = avgPct + ' %';
    if(cells[3]){ cells[3].textContent = glissMoy + ' j'; cells[3].style.color = glissMoy>30?red:terra; }
    const labels = devCard.querySelectorAll('.csec-kpi-label');
    if(labels[1]) labels[1].textContent = 'Permis deposes';
    if(labels[2]) labels[2].textContent = 'Avancement moy.';
  }

  // ═══ OPEN PROJECT DETAIL WITH GANTT ═══
  window.openDevProject = function(idx){
    const p = devProjects[idx];
    const panel = document.getElementById('panel-dev-project');
    panel.style.display = '';
    document.getElementById('dev-proj-title').textContent = p.name;

    const statusColor = p.status==='retard' ? neonRed : p.status==='leger' ? '#FDB823' : vert;
    const statusLabel = p.status==='retard' ? 'En retard' : p.status==='leger' ? 'Leger retard' : 'Dans les temps';
    const tasksWithDelay = p.tasks.filter(t=>t.g>0);
    const maxDelay = p.glissMax;

    // KPIs
    document.getElementById('dev-proj-kpis').innerHTML = `
      <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Avancement</div><div class="props-kpi-val" style="color:${azur};">${p.pct} %</div><div class="props-kpi-sub">${p.duree} jours total</div></div>
      <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Statut</div><div class="props-kpi-val" style="color:${statusColor};font-size:clamp(14px,1.6vw,20px);">${statusLabel}</div><div class="props-kpi-sub">${p.tasks.length} taches</div></div>
      <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Glissement max</div><div class="props-kpi-val" style="color:${maxDelay>0?neonRed:vert};${maxDelay>0?'text-shadow:0 0 12px rgba(255,32,64,0.6);':''}">${maxDelay > 0 ? '+'+maxDelay+' j' : '0 j'}</div><div class="props-kpi-sub">${tasksWithDelay.length} tache${tasksWithDelay.length>1?'s':''} impactee${tasksWithDelay.length>1?'s':''}</div></div>
      <div class="props-kpi-card" style="border-color:rgba(66,106,179,0.15);"><div class="props-kpi-label">Periode</div><div class="props-kpi-val" style="color:${azur};font-size:clamp(11px,1.2vw,15px);">${fmtDate(p.debut)}</div><div class="props-kpi-sub">au ${fmtDate(p.fin)}</div></div>
    `;

    // Comment
    document.getElementById('dev-proj-comment').innerHTML = p.comment ? `<div style="padding:10px 14px;border-radius:8px;background:rgba(66,106,179,0.06);border:1px solid rgba(66,106,179,0.1);font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;"><b style="color:rgba(255,255,255,0.8);">Notes :</b> ${p.comment}</div>` : '';

    // ═══ STAGE-GATE GANTT (temporal) ═══
    // Compute project timeline
    const allDates = [];
    p.tasks.forEach(t => { allDates.push(pDate(t.debut)); allDates.push(pDate(t.fin)); });
    const projStart = new Date(Math.min(...allDates));
    const projEnd = new Date(Math.max(...allDates));
    const projDays = daysDiff(projStart, projEnd) || 1;

    // Build task list in chronological order with temporal positioning
    const sortedTasks = p.tasks.slice().sort((a,b) => pDate(a.debut) - pDate(b.debut));

    // Year markers
    const years = [];
    let yCursor = new Date(projStart.getFullYear(), 0, 1);
    while(yCursor <= projEnd){
      const yStart = new Date(Math.max(yCursor, projStart));
      const nextY = new Date(yCursor.getFullYear()+1, 0, 1);
      const yEnd = new Date(Math.min(nextY, projEnd));
      const left = daysDiff(projStart, yStart)/projDays*100;
      const width = daysDiff(yStart, yEnd)/projDays*100;
      if(width > 3) years.push({label:yCursor.getFullYear(), left, width});
      yCursor = nextY;
    }

    // Today position
    const todayPct = Math.max(0, Math.min(100, daysDiff(projStart, today)/projDays*100));

    const devNameW = 170;
    let html = `<div style="font-size:9px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:rgba(66,106,179,0.5);margin-bottom:18px;">Planning · Gantt</div>
    <div class="gantt-zp-wrapper" style="background:rgba(66,106,179,0.06);border:1px solid rgba(66,106,179,0.18);border-radius:20px;margin-bottom:32px;position:relative;padding:0;">
      <div class="gantt-zoom-controls">
        <button class="gantt-zoom-btn" data-action="minus">\u2212</button>
        <span class="gantt-zoom-label">1x</span>
        <button class="gantt-zoom-btn" data-action="plus">+</button>
        <span class="gantt-zoom-reset">Reset</span>
      </div>
      <div class="gantt-zp-header" style="display:flex;padding:12px 24px 0 24px;background:rgba(66,106,179,0.06);">
        <div class="gantt-zp-name" style="flex:0 0 ${devNameW}px;background:rgba(66,106,179,0.06);"></div>
        <div class="gantt-timeline-inner" style="display:flex;flex:1;position:relative;height:28px;">`;
    years.forEach((y,i) => {
      html += `<div class="gantt-timeline-cell" style="position:absolute;left:${y.left}%;width:${y.width}%;height:100%;display:flex;align-items:center;justify-content:center;">${y.label}</div>`;
    });
    html += `</div></div>
      <div class="gantt-zp-viewport" style="padding:8px 24px 24px 24px;">
        <div class="gantt-zp-content" style="position:relative;">`;

    // Vertical gridlines
    years.forEach(y => {
      html += `<div class="gantt-zp-gridline" style="left:${y.left}%;"></div>`;
    });

    // Today vertical line
    if(todayPct > 0 && todayPct < 100){
      html += `<div style="position:absolute;left:${todayPct}%;top:0;bottom:60px;width:2px;background:${azur};opacity:0.4;z-index:2;pointer-events:none;">
        <div style="position:absolute;top:-4px;left:-18px;font-size:7px;font-weight:700;color:${azur};opacity:0.8;white-space:nowrap;">Auj.</div>
      </div>`;
    }

    // Task rows (chronological)
    sortedTasks.forEach(t => {
      const td = pDate(t.debut), tf = pDate(t.fin);
      const taskDays = daysDiff(td, tf);
      const isMilestone = taskDays === 0;
      const leftPct = daysDiff(projStart, td)/projDays*100;
      const widthPct = Math.max(isMilestone ? 0.5 : 1, taskDays/projDays*100);
      const pctVal = t.done ? 100 : t.active ? Math.min(99,Math.round(daysDiff(td,today)/Math.max(taskDays,1)*100)) : 0;
      const isDelayed = t.g > 0;
      const status = isDelayed ? 'delayed' : t.done ? 'done' : t.active ? 'progress' : 'pending';
      const delayWeeks = isDelayed ? Math.max(1,Math.round(t.g/7)) : 0;
      const delayLabel = delayWeeks > 0 ? '+' + delayWeeks + ' sem' : '';
      const escapedName = t.name.replace(/'/g, "\\'");
      const cause = (p.comment||'Cause en cours d\'analyse').replace(/'/g, "\\'");
      const resolution = 'Suivi en cours — voir notes projet'.replace(/'/g, "\\'");

      // Color for the bar — NEVER red for main bar, red only for delay extension
      const barColor = t.done ? 'rgba(0,171,99,0.6)' : t.active ? 'rgba(90,175,175,0.6)' : 'rgba(66,106,179,0.2)';
      const barBorder = t.done ? 'rgba(0,171,99,0.3)' : t.active ? 'rgba(90,175,175,0.3)' : 'rgba(66,106,179,0.1)';

      html += `<div style="display:flex;align-items:center;margin-bottom:6px;min-height:26px;">
        <div class="sg-task-name gantt-zp-name ${isDelayed?'delayed':''}" style="width:${devNameW}px;flex-shrink:0;background:rgba(66,106,179,0.06);">${t.name}</div>
        <div style="flex:1;position:relative;height:22px;">`;

      if(isMilestone){
        // Diamond milestone
        html += `<div style="position:absolute;left:${leftPct}%;top:3px;width:14px;height:14px;transform:rotate(45deg);background:${isDelayed?'rgba(220,50,50,0.8)':azur};border-radius:2px;margin-left:-7px;${isDelayed?'box-shadow:0 0 10px rgba(220,50,50,0.3);':''}"></div>`;
      } else if(isDelayed && t.g > 0) {
        // Split bar: original color + red delay extension (matches reference)
        const delayWidthPct = Math.max(1, (t.g / projDays) * 100);
        const normalWidthPct = Math.max(1, widthPct - delayWidthPct);
        const fillW = pctVal;
        // Normal portion (stage/status color)
        html += `<div style="position:absolute;left:${leftPct}%;width:${normalWidthPct}%;height:100%;border-radius:4px 0 0 4px;background:${barColor};border:1px solid ${barBorder};overflow:hidden;">
          <div style="height:100%;width:100%;background:${barColor};"></div>
        </div>`;
        // Red delay overflow — matches reference style
        html += `<div onclick="showDelayPopup('${escapedName}','${delayLabel}','${cause}','${resolution}')" style="position:absolute;left:${leftPct + normalWidthPct}%;width:${delayWidthPct}%;height:100%;border-radius:0 4px 4px 0;background:rgba(220,50,50,0.35);border:1px solid rgba(220,50,50,0.5);border-left:none;overflow:visible;cursor:pointer;z-index:2;animation:pulse-delay 2.5s ease-in-out infinite;">
          <div style="height:100%;width:100%;background:rgba(220,50,50,0.55);border-radius:0 3px 3px 0;"></div>
          <div style="position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:rgba(255,180,180,0.9);">⚠</div>
        </div>`;
        // Percentage label
        if(pctVal > 0){
          html += `<div style="position:absolute;left:${leftPct + widthPct + 0.5}%;top:3px;font-size:8px;font-weight:800;color:rgba(255,255,255,0.5);">${pctVal}%</div>`;
        }
        // Delay badge
        html += `<div style="position:absolute;left:${leftPct + widthPct + (pctVal>0?4:0.5)}%;top:3px;font-size:8px;font-weight:800;color:rgba(255,135,88,0.9);text-shadow:0 0 6px rgba(255,135,88,0.5);">+${t.g}j</div>`;
      } else {
        // Normal bar (no delay)
        const fillW = pctVal;
        html += `<div style="position:absolute;left:${leftPct}%;width:${widthPct}%;height:100%;border-radius:5px;background:${barColor};border:1px solid ${barBorder};overflow:hidden;">
          ${fillW > 0 && fillW < 100 ? `<div style="height:100%;width:${fillW}%;background:rgba(255,255,255,0.12);border-radius:5px 0 0 5px;"></div>` : ''}
        </div>`;
        if(pctVal > 0){
          html += `<div style="position:absolute;left:${leftPct + widthPct + 0.5}%;top:3px;font-size:8px;font-weight:800;color:rgba(255,255,255,0.5);">${pctVal}%</div>`;
        }
      }

      html += `</div>`;
      html += isDelayed ? `<span class="sg-warn" style="flex-shrink:0;" onclick="showDelayPopup('${escapedName}','${delayLabel}','${cause}','${resolution}')">⚠</span>` : '';
      html += `</div>`;
    });

    /* Legend */
    html += `<div style="display:flex;gap:16px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;border-radius:3px;background:rgba(0,171,99,0.6);"></div><span style="font-size:8px;color:rgba(255,255,255,0.35);">Terminé</span></div>
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;border-radius:3px;background:rgba(90,175,175,0.55);"></div><span style="font-size:8px;color:rgba(255,255,255,0.35);">En cours</span></div>
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:8px;border-radius:3px;background:repeating-linear-gradient(110deg,rgba(255,64,96,0.25),rgba(255,64,96,0.25) 3px,rgba(255,64,96,0.1) 3px,rgba(255,64,96,0.1) 6px);border-left:2px solid rgba(255,64,96,0.5);"></div><span style="font-size:8px;color:rgba(255,255,255,0.35);">Glissement</span></div>
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;border-radius:3px;background:rgba(66,106,179,0.2);"></div><span style="font-size:8px;color:rgba(255,255,255,0.35);">À venir</span></div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:11px;filter:drop-shadow(0 0 3px rgba(255,64,96,0.4));">⚠</span><span style="font-size:8px;color:rgba(255,255,255,0.35);">Cliquer pour détails retard</span></div>
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:2px;height:10px;background:${azur};opacity:0.5;"></div><span style="font-size:8px;color:rgba(255,255,255,0.35);">Aujourd'hui</span></div>
    </div>`;

    html += `</div></div></div>`; // close gantt-zp-content, gantt-zp-viewport, gantt-zp-wrapper
    document.getElementById('dev-proj-gantt').innerHTML = html;
    initGanttZoomPan('dev-proj-gantt', devNameW);

    panel.style.transform = 'translateX(0)';
    panel.scrollTop = 0;
  };

  window.closePanelDevProject = function(){
    document.getElementById('panel-dev-project').style.transform = 'translateX(100%)';
  };
})();

/* ═══ Gantt Zoom / Pan / Sticky Header ═══ */
function initGanttZoomPan(containerId, nameWidth, opts) {
  opts = Object.assign({ minZoom: 1, maxZoom: 5, zoomStep: 0.25 }, opts || {});
  const container = document.getElementById(containerId);
  if (!container) return;
  let zoom = 1;
  const viewport = container.querySelector('.gantt-zp-viewport');
  const content = container.querySelector('.gantt-zp-content');
  const zoomLabel = container.querySelector('.gantt-zoom-label');
  const header = container.querySelector('.gantt-zp-header');
  if (!viewport || !content) return;

  function applyZoom(newZoom, focalX) {
    newZoom = Math.round(Math.max(opts.minZoom, Math.min(opts.maxZoom, newZoom)) * 100) / 100;
    if (newZoom === zoom) return;
    const sl = viewport.scrollLeft, vw = viewport.clientWidth;
    const focal = focalX != null ? focalX : vw / 2;
    const ratio = (sl + focal) / (vw * zoom);
    zoom = newZoom;
    content.style.minWidth = (zoom * 100) + '%';
    viewport.scrollLeft = Math.max(0, ratio * vw * zoom - focal);
    if (zoomLabel) zoomLabel.textContent = zoom === 1 ? '1x' : zoom.toFixed(1) + 'x';
    syncHeader();
  }

  viewport.addEventListener('wheel', function(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    applyZoom(zoom + (e.deltaY > 0 ? -opts.zoomStep : opts.zoomStep), e.clientX - rect.left);
  }, { passive: false });

  const btnPlus = container.querySelector('[data-action="plus"]');
  const btnMinus = container.querySelector('[data-action="minus"]');
  const btnReset = container.querySelector('.gantt-zoom-reset');
  if (btnPlus) btnPlus.addEventListener('click', () => applyZoom(zoom + opts.zoomStep));
  if (btnMinus) btnMinus.addEventListener('click', () => applyZoom(zoom - opts.zoomStep));
  if (btnReset) btnReset.addEventListener('click', () => { applyZoom(1); viewport.scrollLeft = 0; });

  // Remove previous document-level handlers to prevent listener accumulation
  if (window._ganttMouseMove) document.removeEventListener('mousemove', window._ganttMouseMove);
  if (window._ganttMouseUp) document.removeEventListener('mouseup', window._ganttMouseUp);

  let panning = false, px0 = 0, py0 = 0, sx0 = 0, sy0 = 0;
  viewport.addEventListener('mousedown', function(e) {
    if (e.button !== 0 || e.target.closest('button,[onclick],.sg-warn,a')) return;
    panning = true; px0 = e.clientX; py0 = e.clientY;
    sx0 = viewport.scrollLeft; sy0 = viewport.scrollTop;
    viewport.style.cursor = 'grabbing'; viewport.style.userSelect = 'none';
    e.preventDefault();
  });
  window._ganttMouseMove = function(e) {
    if (!panning) return;
    viewport.scrollLeft = sx0 + (px0 - e.clientX);
    viewport.scrollTop = sy0 + (py0 - e.clientY);
    syncHeader();
  };
  window._ganttMouseUp = function() {
    if (!panning) return;
    panning = false; viewport.style.cursor = 'grab'; viewport.style.userSelect = '';
  };
  document.addEventListener('mousemove', window._ganttMouseMove);
  document.addEventListener('mouseup', window._ganttMouseUp);

  function syncHeader() {
    if (!header) return;
    const inner = header.querySelector('.gantt-timeline-inner');
    if (inner) inner.style.transform = 'translateX(' + (-viewport.scrollLeft) + 'px)';
  }
  viewport.addEventListener('scroll', syncHeader);
}

