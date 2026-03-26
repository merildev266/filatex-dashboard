import { useState, useMemo, useRef, useEffect } from 'react'
import { propsData_dev } from '../../data/props_data'
import { propsData_dev_full } from '../../data/props_data_dev_full'

const AZUR = '#426ab3'
const NEON_RED = '#ff2040'
const RED = '#ff5050'
const VERT = '#00ab63'
const YELLOW = '#FDB823'
const TEAL = '#5aafaf'

/* ────── devProjects: hardcoded Gantt data from original properties.js ────── */
const devProjects = [
  { id:'casa-del-lago', name:'Casa Del Lago', duree:1308, debut:'2024-12-19', fin:'2029-12-24', glissMax:168,
    tasks:[
      {name:'GO du CSI',debut:'2024-12-19',fin:'2024-12-19',g:0},
      {name:'Programme & architecte',debut:'2025-01-06',fin:'2025-03-28',g:0},
      {name:'Conception sommaire',debut:'2025-04-28',fin:'2025-08-15',g:56},
      {name:'Brochure',debut:'2025-08-18',fin:'2026-01-30',g:168},
      {name:'Dossier APD et DCE',debut:'2025-08-18',fin:'2026-02-13',g:126},
      {name:"Appel d'offre",debut:'2026-02-16',fin:'2026-03-27',g:112},
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
      {name:"Appel d'offre",debut:'2026-02-16',fin:'2026-03-13',g:115},
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
]

/* ────── Helpers ────── */
function pDate(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]) }
function daysDiff(a, b) { return Math.round((b - a) / 86400000) }
function fmtDate(s) { const p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2) }

const today = new Date()

// Compute project state
devProjects.forEach(p => {
  p.phases = []
  p.nextPhase = null
  const d0 = pDate(p.debut), df = pDate(p.fin)
  p.pct = today >= df ? 100 : today <= d0 ? 0 : Math.round(daysDiff(d0, today) / daysDiff(d0, df) * 100)
  p.tasks.forEach(t => {
    const td = pDate(t.debut), tf = pDate(t.fin)
    t.done = today >= tf
    t.active = td <= today && today <= tf
    if (t.active) p.phases.push(t.name)
    else if (td > today && !p.nextPhase) p.nextPhase = t.name
  })
  p.status = p.glissMax > 30 ? 'retard' : p.glissMax > 0 ? 'leger' : 'ok'
})

/* ────── Find matching full data for a project (for weekly comments) ────── */
function findFullProject(projectName) {
  const normName = projectName.toLowerCase().replace(/[^a-z]/g, '')
  return propsData_dev_full.find(fp => {
    const fpNorm = fp.name.toLowerCase().replace(/[^a-z]/g, '')
    return fpNorm.includes(normName) || normName.includes(fpNorm)
  })
}

function findTaskHistory(fullProject, taskName) {
  if (!fullProject) return null
  const normTask = taskName.toLowerCase().replace(/[^a-z]/g, '')
  return fullProject.etapes.find(e => {
    const eNorm = e.etape.toLowerCase().replace(/[^a-z]/g, '')
    // Fuzzy match: check if significant words overlap
    return eNorm.includes(normTask) || normTask.includes(eNorm) ||
      taskName.toLowerCase().split(/\s+/).filter(w => w.length > 3).some(w => eNorm.includes(w.toLowerCase().replace(/[^a-z]/g, '')))
  })
}

/* ────── Delay Popup Component ────── */
function DelayPopup({ task, project, position, onClose }) {
  const popupRef = useRef(null)
  const delayWeeks = Math.max(1, Math.round(task.g / 7))
  const fullProject = findFullProject(project.name)
  const taskHistory = findTaskHistory(fullProject, task.name)

  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Get last 5 weekly comments if available
  const comments = taskHistory?.history?.slice(-5) || []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div ref={popupRef} style={{
        background: 'var(--card)', border: '1px solid var(--card-border)',
        borderRadius: 16, padding: 0, maxWidth: 440, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(255,64,96,0.08)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,64,96,0.06)', borderBottom: '1px solid rgba(255,64,96,0.12)'
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{task.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{project.name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: NEON_RED,
              background: 'rgba(255,32,64,0.12)', padding: '3px 8px', borderRadius: 6
            }}>+{task.g}j ({delayWeeks} sem)</span>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: 16, cursor: 'pointer', padding: '2px 6px'
            }}>&#10005;</button>
          </div>
        </div>

        {/* Cause */}
        <div style={{ padding: '12px 18px' }}>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--text-dim)', marginBottom: 6
          }}>Cause</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {project.comment || "Cause en cours d'analyse"}
          </div>
        </div>

        {/* Weekly comments */}
        {comments.length > 0 && (
          <div style={{ padding: '0 18px 14px' }}>
            <div style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-dim)', marginBottom: 8
            }}>Historique hebdomadaire</div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {comments.map((c, i) => (
                <div key={i} style={{
                  padding: '7px 10px', marginBottom: 4, borderRadius: 6,
                  background: 'var(--inner-card)', border: '1px solid var(--inner-card-border)',
                  fontSize: 10, lineHeight: 1.4
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dim)', marginRight: 6 }}>{c.week}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{c.comment}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution */}
        <div style={{
          padding: '10px 18px 14px', borderTop: '1px solid var(--separator-light)'
        }}>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--text-dim)', marginBottom: 6
          }}>Suivi</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Suivi en cours — voir notes projet
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────── Gantt Chart Component ────── */
function GanttChart({ project, onTaskAlert }) {
  const allDates = []
  project.tasks.forEach(t => { allDates.push(pDate(t.debut)); allDates.push(pDate(t.fin)) })
  const projStart = new Date(Math.min(...allDates))
  const projEnd = new Date(Math.max(...allDates))
  const projDays = daysDiff(projStart, projEnd) || 1

  const sortedTasks = project.tasks.slice().sort((a, b) => pDate(a.debut) - pDate(b.debut))

  // Year markers
  const years = []
  let yCursor = new Date(projStart.getFullYear(), 0, 1)
  while (yCursor <= projEnd) {
    const yStart = new Date(Math.max(yCursor, projStart))
    const nextY = new Date(yCursor.getFullYear() + 1, 0, 1)
    const yEnd = new Date(Math.min(nextY, projEnd))
    const left = daysDiff(projStart, yStart) / projDays * 100
    const width = daysDiff(yStart, yEnd) / projDays * 100
    if (width > 3) years.push({ label: yCursor.getFullYear(), left, width })
    yCursor = nextY
  }

  const todayPct = Math.max(0, Math.min(100, daysDiff(projStart, today) / projDays * 100))
  const NAME_W = 170

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, position: 'relative' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '16px 24px 0' }}>
        Planning &middot; Gantt
      </div>

      {/* Timeline header */}
      <div style={{ display: 'flex', padding: '12px 24px 0 24px', background: 'var(--subtle-bg)' }}>
        <div style={{ flex: `0 0 ${NAME_W}px` }} />
        <div style={{ display: 'flex', flex: 1, position: 'relative', height: 28 }}>
          {years.map((y, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${y.left}%`, width: `${y.width}%`, height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
              borderLeft: '1px solid rgba(255,255,255,0.05)'
            }}>
              {y.label}
            </div>
          ))}
        </div>
      </div>

      {/* Task rows */}
      <div style={{ padding: '8px 24px 24px 24px', overflowX: 'auto' }}>
        <div style={{ position: 'relative', minWidth: '100%' }}>
          {/* Gridlines */}
          {years.map((y, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${y.left}%`, top: 0, bottom: 60,
              width: 1, background: 'var(--separator-light)', zIndex: 1, pointerEvents: 'none',
              marginLeft: NAME_W
            }} />
          ))}

          {/* Today line */}
          {todayPct > 0 && todayPct < 100 && (
            <div style={{
              position: 'absolute', left: `calc(${NAME_W}px + ${todayPct}%)`, top: 0, bottom: 60,
              width: 2, background: AZUR, opacity: 0.4, zIndex: 2, pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute', top: -4, left: -18,
                fontSize: 7, fontWeight: 700, color: 'var(--text-dim)', opacity: 0.8, whiteSpace: 'nowrap'
              }}>Auj.</div>
            </div>
          )}

          {sortedTasks.map((t, i) => {
            const td = pDate(t.debut), tf = pDate(t.fin)
            const taskDays = daysDiff(td, tf)
            const isMilestone = taskDays === 0
            const leftPct = daysDiff(projStart, td) / projDays * 100
            const widthPct = Math.max(isMilestone ? 0.5 : 1, taskDays / projDays * 100)
            const pctVal = t.done ? 100 : t.active ? Math.min(99, Math.round(daysDiff(td, today) / Math.max(taskDays, 1) * 100)) : 0
            const isDelayed = t.g > 0
            const barColor = t.done ? 'rgba(0,171,99,0.6)' : t.active ? 'rgba(90,175,175,0.6)' : 'rgba(66,106,179,0.2)'
            const barBorder = t.done ? 'rgba(0,171,99,0.3)' : t.active ? 'rgba(90,175,175,0.3)' : 'rgba(66,106,179,0.1)'

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, minHeight: 26 }}>
                <div style={{
                  width: NAME_W, flexShrink: 0,
                  fontSize: 10, fontWeight: isDelayed ? 700 : 500,
                  color: isDelayed ? 'var(--text)' : 'var(--text-muted)',
                  paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  background: 'var(--subtle-bg)'
                }}>
                  {t.name}
                </div>
                <div style={{ flex: 1, position: 'relative', height: 22 }}>
                  {isMilestone ? (
                    <div style={{
                      position: 'absolute', left: `${leftPct}%`, top: 3,
                      width: 14, height: 14, transform: 'rotate(45deg)',
                      background: isDelayed ? 'rgba(220,50,50,0.8)' : AZUR,
                      borderRadius: 2, marginLeft: -7,
                      boxShadow: isDelayed ? '0 0 10px rgba(220,50,50,0.3)' : 'none'
                    }} />
                  ) : isDelayed ? (
                    <>
                      {/* Normal portion */}
                      <div style={{
                        position: 'absolute', left: `${leftPct}%`,
                        width: `${Math.max(1, widthPct - Math.max(1, (t.g / projDays) * 100))}%`,
                        height: '100%', borderRadius: '4px 0 0 4px',
                        background: barColor, border: `1px solid ${barBorder}`, overflow: 'hidden'
                      }} />
                      {/* Red delay extension */}
                      <div
                        onClick={() => onTaskAlert && onTaskAlert(t)}
                        style={{
                          position: 'absolute',
                          left: `${leftPct + Math.max(1, widthPct - Math.max(1, (t.g / projDays) * 100))}%`,
                          width: `${Math.max(1, (t.g / projDays) * 100)}%`,
                          height: '100%', borderRadius: '0 4px 4px 0',
                          background: 'rgba(220,50,50,0.35)', border: '1px solid rgba(220,50,50,0.5)',
                          borderLeft: 'none', cursor: 'pointer', zIndex: 2,
                          animation: 'pulse-delay 2.5s ease-in-out infinite'
                        }}>
                        <div style={{ height: '100%', width: '100%', background: 'rgba(220,50,50,0.55)', borderRadius: '0 3px 3px 0' }} />
                        <div style={{
                          position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 7, fontWeight: 700, color: 'var(--text)'
                        }}>&#9888;</div>
                      </div>
                      {/* Percentage label */}
                      {pctVal > 0 && (
                        <div style={{
                          position: 'absolute', left: `${leftPct + widthPct + 0.5}%`, top: 3,
                          fontSize: 8, fontWeight: 800, color: 'var(--text-muted)'
                        }}>{pctVal}%</div>
                      )}
                      {/* Delay badge */}
                      <div style={{
                        position: 'absolute', left: `${leftPct + widthPct + (pctVal > 0 ? 4 : 0.5)}%`, top: 3,
                        fontSize: 8, fontWeight: 800, color: 'var(--text)',
                        textShadow: '0 0 6px rgba(255,135,88,0.5)'
                      }}>+{t.g}j</div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                        height: '100%', borderRadius: 5,
                        background: barColor, border: `1px solid ${barBorder}`, overflow: 'hidden'
                      }}>
                        {pctVal > 0 && pctVal < 100 && (
                          <div style={{ height: '100%', width: `${pctVal}%`, background: 'rgba(255,255,255,0.12)', borderRadius: '5px 0 0 5px' }} />
                        )}
                      </div>
                      {pctVal > 0 && (
                        <div style={{
                          position: 'absolute', left: `${leftPct + widthPct + 0.5}%`, top: 3,
                          fontSize: 8, fontWeight: 800, color: 'var(--text-muted)'
                        }}>{pctVal}%</div>
                      )}
                    </>
                  )}
                </div>
                {isDelayed && (
                  <span
                    onClick={() => onTaskAlert && onTaskAlert(t)}
                    style={{
                      flexShrink: 0, fontSize: 11, cursor: 'pointer',
                      filter: 'drop-shadow(0 0 3px rgba(255,64,96,0.4))'
                    }}>&#9888;</span>
                )}
              </div>
            )
          })}

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 16, marginTop: 16, paddingTop: 14,
            borderTop: '1px solid var(--separator)', flexWrap: 'wrap'
          }}>
            {[
              { bg: 'rgba(0,171,99,0.6)', label: 'Termine' },
              { bg: 'rgba(90,175,175,0.55)', label: 'En cours' },
              { bg: 'rgba(220,50,50,0.35)', label: 'Glissement', border: true },
              { bg: 'rgba(66,106,179,0.2)', label: 'A venir' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 8, borderRadius: 3, background: item.bg,
                  ...(item.border ? { borderLeft: '2px solid rgba(255,64,96,0.5)' } : {})
                }} />
                <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>{item.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, filter: 'drop-shadow(0 0 3px rgba(255,64,96,0.4))' }}>&#9888;</span>
              <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>Cliquer pour details retard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 2, height: 10, background: AZUR, opacity: 0.5 }} />
              <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>Aujourd'hui</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────── Full-screen Project Detail View ────── */
function ProjectDetail({ project, onBack }) {
  const [alertTask, setAlertTask] = useState(null)
  const statusColor = project.status === 'retard' ? NEON_RED : project.status === 'leger' ? YELLOW : VERT
  const statusLabel = project.status === 'retard' ? 'En retard' : project.status === 'leger' ? 'Leger retard' : 'Dans les temps'
  const tasksWithDelay = project.tasks.filter(t => t.g > 0)

  return (
    <div>
      {/* Title */}
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
        {project.name}
      </div>

      {/* KPIs */}
      <div className="dev-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Avancement</div>
          <div className="props-kpi-val" style={{ color: AZUR }}>{project.pct} %</div>
          <div className="props-kpi-sub">{project.duree} jours total</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Statut</div>
          <div className="props-kpi-val" style={{ color: statusColor, fontSize: 'clamp(14px,1.6vw,20px)' }}>{statusLabel}</div>
          <div className="props-kpi-sub">{project.tasks.length} taches</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Glissement max</div>
          <div className="props-kpi-val" style={{
            color: project.glissMax > 0 ? NEON_RED : VERT,
            textShadow: project.glissMax > 0 ? '0 0 12px rgba(255,32,64,0.6)' : 'none'
          }}>
            {project.glissMax > 0 ? '+' + project.glissMax + ' j' : '0 j'}
          </div>
          <div className="props-kpi-sub">{tasksWithDelay.length} tache{tasksWithDelay.length > 1 ? 's' : ''} impactee{tasksWithDelay.length > 1 ? 's' : ''}</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Periode</div>
          <div className="props-kpi-val" style={{ color: AZUR, fontSize: 'clamp(11px,1.2vw,15px)' }}>{fmtDate(project.debut)}</div>
          <div className="props-kpi-sub">au {fmtDate(project.fin)}</div>
        </div>
      </div>

      {/* Comment */}
      {project.comment && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'var(--card)', border: '1px solid var(--card-border)',
          fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 24
        }}>
          <b style={{ color: 'var(--text-secondary)' }}>Notes :</b> {project.comment}
        </div>
      )}

      {/* Gantt */}
      <GanttChart project={project} onTaskAlert={(t) => setAlertTask(t)} />

      {/* Delay Popup */}
      {alertTask && (
        <DelayPopup
          task={alertTask}
          project={project}
          onClose={() => setAlertTask(null)}
        />
      )}
    </div>
  )
}

/* ────── MAIN COMPONENT ────── */
export default function DevDetail() {
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(null)

  const total = devProjects.length
  const enRetard = devProjects.filter(p => p.glissMax > 30).length
  const permisDeposes = 3
  const glissMoy = Math.round(devProjects.reduce((s, p) => s + p.glissMax, 0) / total)
  const avgPct = Math.round(devProjects.reduce((s, p) => s + p.pct, 0) / total)

  const delayed = devProjects.filter(p => p.glissMax > 30)

  // If a project is selected, show full-screen detail view
  if (selectedProjectIdx !== null) {
    return (
      <ProjectDetail
        project={devProjects[selectedProjectIdx]}
        onBack={() => setSelectedProjectIdx(null)}
      />
    )
  }

  // Project list view
  return (
    <div>
      {/* KPIs */}
      <div className="dev-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Projets en cours</div>
          <div className="props-kpi-val" style={{ color: AZUR }}>{total}</div>
          <div className="props-kpi-sub">Développement actif</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Permis déposés</div>
          <div className="props-kpi-val">{permisDeposes} / {total}</div>
          <div className="props-kpi-sub">En instruction</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Avancement moy.</div>
          <div className="props-kpi-val" style={{ color: AZUR }}>{avgPct} %</div>
          <div className="props-kpi-sub">Tous projets</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(66,106,179,0.15)' }}>
          <div className="props-kpi-label">Glissement moy.</div>
          <div className="props-kpi-val" style={{ color: glissMoy > 30 ? RED : AZUR }}>{glissMoy} j</div>
          <div className="props-kpi-sub">{enRetard} projet{enRetard > 1 ? 's' : ''} en retard</div>
        </div>
      </div>

      {/* Alert banner */}
      {delayed.length > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 10,
          background: 'var(--card)', border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>&#9888; Projets en retard :</span>
          {delayed.map((p, i) => (
            <span key={i} style={{
              fontSize: 10, color: RED,
              background: 'rgba(255,80,80,0.1)', padding: '3px 8px', borderRadius: 6
            }}>
              {p.name} <b>+{p.glissMax}j</b>
            </span>
          ))}
        </div>
      )}

      {/* Project cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {devProjects.map((p, idx) => {
          const statusColor = p.status === 'retard' ? RED : p.status === 'leger' ? YELLOW : VERT
          const statusLabel = p.status === 'retard' ? 'En retard +' + p.glissMax + 'j' : p.status === 'leger' ? '+' + p.glissMax + 'j retard' : 'Dans les temps'
          const phaseStr = p.phases.length ? p.phases.join(', ') : (p.nextPhase ? 'Prochaine: ' + p.nextPhase : 'Non demarre')

          const d0 = pDate(p.debut), df = pDate(p.fin)
          const totalDays = daysDiff(d0, df)

          return (
            <div
              key={p.id}
              onClick={() => setSelectedProjectIdx(idx)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                borderRadius: 12, padding: 16, cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(66,106,179,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = 'none' }}
            >
              {/* Name + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: statusColor,
                  background: statusColor + '15', padding: '3px 8px', borderRadius: 6
                }}>{statusLabel}</span>
              </div>

              {/* Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Avancement</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: AZUR }}>{p.pct}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(66,106,179,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${p.pct}%`,
                  background: p.status === 'retard' ? NEON_RED : AZUR, borderRadius: 3
                }} />
              </div>

              {p.glissMax > 0 && (
                <div style={{ fontSize: 10, color: statusColor, marginTop: 8, fontWeight: 600 }}>+{p.glissMax} jours</div>
              )}

              {/* Mini timeline */}
              <div style={{ display: 'flex', gap: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                {p.tasks.map((t, ti) => {
                  const td = pDate(t.debut), tf = pDate(t.fin)
                  const w = Math.max(daysDiff(td, tf) / totalDays * 100, 0.5)
                  const hasDelay = t.g > 0
                  const bg = hasDelay
                    ? (t.done ? 'rgba(255,32,64,0.6)' : 'rgba(255,32,64,0.8)')
                    : (t.done ? 'rgba(66,106,179,0.5)' : t.active ? AZUR : 'rgba(66,106,179,0.12)')
                  return <div key={ti} style={{ width: `${w}%`, background: bg, borderRadius: 1 }} title={t.name + (hasDelay ? ` (+${t.g}j)` : '')} />
                })}
              </div>

              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>{phaseStr}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
