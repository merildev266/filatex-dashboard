import { useState, useMemo } from 'react'
import KpiItem from '../../components/KpiItem'

// LFO motor data (inline, matches reporting.js lfoMoteurs)
const LFO_MOTEURS = [
  // AU F23
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
  // INSTALLES
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
  // A RAPATRIER
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
  // A DEFINIR
  { n: 38, serie: '18W2920733', type: 'NTA 855', puissance: 200, depart: 'VANGAINDRANO', affectation: 'A d\u00e9finir', section: 'a_definir', transfert: 'Investigation \u00e0 faire', reparation: '', situation: 'Investigation \u00e0 Vangaindrano \u00e0 faire' },
  { n: 39, serie: '18W2920732', type: 'NTA 855', puissance: 200, depart: 'VOHEMAR', affectation: 'A d\u00e9finir', section: 'a_definir', transfert: 'Investigation \u00e0 faire', reparation: '', situation: 'Investigation \u00e0 Vohemar \u00e0 faire' },
  { n: 40, serie: '18W2920736', type: 'NTA 855', puissance: 200, depart: 'FILATEX F23', affectation: 'A d\u00e9finir', section: 'a_definir', transfert: "Investigation \u00e0 faire : n'est pas \u00e0 F23", reparation: '', situation: 'Investigation chez Roberto \u00e0 faire' },
]

const SECTION_LABELS = {
  au_f23: 'Au F23',
  installes: 'Install\u00e9s sur sites',
  a_rapatrier: 'A rapatrier',
  a_definir: 'A d\u00e9finir',
}

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'au_f23', label: 'Au F23' },
  { key: 'installes', label: 'Installes' },
  { key: 'a_rapatrier', label: 'A rapatrier' },
  { key: 'a_definir', label: 'A definir' },
]


export default function RptLfo() {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return LFO_MOTEURS
    return LFO_MOTEURS.filter(m => m.section === filter)
  }, [filter])

  // KPIs
  const total = filtered.length
  const totalKw = filtered.reduce((s, m) => s + (m.puissance || 0), 0)
  const enProd = filtered.filter(m => m.situation.indexOf('en production') >= 0).length
  const pourVente = filtered.filter(m => m.affectation === 'VENTE').length
  const enReparation = filtered.filter(m => m.reparation && m.reparation.indexOf('r\u00e9parer') >= 0).length
  const sites = new Set()
  filtered.forEach(m => {
    const aff = m.affectation
    if (aff && aff !== 'VENTE' && aff !== 'Canibalis\u00e9' && !aff.startsWith('A d') && !aff.startsWith('A def')) sites.add(aff)
  })

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
              ${filter === t.key
                ? 'bg-[rgba(0,171,99,0.15)] text-[var(--text)] border-[rgba(0,171,99,0.3)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border-[rgba(255,255,255,0.1)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI bar */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 py-3 bg-[rgba(255,255,255,0.02)] rounded-xl">
        <KpiItem value={total} label="Moteurs" color="#00ab63" />
        <KpiItem value={`${(totalKw / 1000).toFixed(1)} MW`} label="Puissance totale" color="#5aafaf" />
        <KpiItem value={enProd} label="En production" color="#4ecdc4" />
        <KpiItem value={enReparation} label="En reparation" color="#FDB823" />
        <KpiItem value={pourVente} label="Pour vente" color="#E05C5C" />
        <KpiItem value={sites.size} label="Sites" color="#b8d6ff" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.1)]">
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">N</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Num Serie</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Type</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold text-right">kW</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Site depart</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Affectation</th>
              {filter === 'all' && <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Section</th>}
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Transfert</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Reparation</th>
              <th className="px-2 py-2 text-[var(--text-muted)] font-semibold">Situation finale</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const sitColor = m.situation.indexOf('en production') >= 0
                ? '#4ecdc4'
                : m.situation.indexOf('vente') >= 0
                  ? '#E05C5C'
                  : ''
              return (
                <tr key={m.n} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-2 py-2 text-[var(--text-dim)]">{m.n}</td>
                  <td className="px-2 py-2 font-mono text-[11px]">{m.serie}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{m.type}</td>
                  <td className="px-2 py-2 text-right font-semibold">{m.puissance}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-[var(--text-muted)]">{m.depart}</td>
                  <td className="px-2 py-2 whitespace-nowrap font-semibold text-[var(--text)]">{m.affectation}</td>
                  {filter === 'all' && (
                    <td className="px-2 py-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]">
                        {SECTION_LABELS[m.section] || m.section}
                      </span>
                    </td>
                  )}
                  <td className="px-2 py-2 text-[11px] text-[var(--text-muted)] max-w-[180px] whitespace-pre-wrap break-words">{m.transfert}</td>
                  <td className="px-2 py-2 text-[11px] text-[var(--text-muted)] max-w-[180px] whitespace-pre-wrap break-words">{m.reparation}</td>
                  <td className="px-2 py-2 text-[11px] max-w-[200px] whitespace-pre-wrap break-words" style={sitColor ? { color: sitColor } : {}}>{m.situation}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
