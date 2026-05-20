import { useState } from 'react'
import BlackjackGame from './BlackjackGame.jsx'
import './blackjack.css'

// ─── Data ───────────────────────────────────────────────────────────────────

const RULES = [
  {
    title: 'Objectif',
    icon: '🎯',
    content: 'Obtenir un total de cartes plus proche de 21 que le croupier, sans dépasser 21. Si vous dépassez 21, vous perdez immédiatement (Bust).',
  },
  {
    title: 'Valeur des cartes',
    icon: '🃏',
    content: null,
    table: [
      { label: '2 à 10', value: 'Valeur nominale (2 = 2, 5 = 5…)' },
      { label: 'Valet, Dame, Roi', value: '10 points chacun' },
      { label: 'As', value: '1 ou 11 — ce qui est le plus avantageux pour la main' },
    ],
  },
  {
    title: 'Déroulement',
    icon: '🔄',
    steps: [
      'Vous placez votre mise avant la donne.',
      'Le croupier distribue 2 cartes à chaque joueur (visibles) et 2 à lui-même (1 visible, 1 cachée).',
      'Vous choisissez votre action : Tirer, Rester, Doubler ou Séparer.',
      'Quand vous avez fini, le croupier révèle sa carte cachée et joue selon des règles fixes.',
      'Le plus proche de 21 sans dépasser gagne.',
    ],
  },
  {
    title: 'Actions disponibles',
    icon: '⚡',
    content: null,
    actions: [
      { name: 'Tirer (Hit)', color: '#3b82f6', desc: 'Recevoir une carte supplémentaire.' },
      { name: 'Rester (Stand)', color: '#22c55e', desc: 'Garder sa main telle quelle et passer au croupier.' },
      { name: 'Doubler (Double Down)', color: '#c9a227', desc: 'Doubler sa mise et ne recevoir qu\'une seule carte. Disponible sur les 2 premières cartes.' },
      { name: 'Séparer (Split)', color: '#a855f7', desc: 'Diviser une paire en 2 mains séparées avec une mise égale. Disponible sur les 2 premières cartes.' },
    ],
  },
  {
    title: 'Blackjack naturel',
    icon: '⭐',
    content: 'Un As + une carte valant 10 (10, V, D, R) en 2 cartes = Blackjack naturel. Il paye 3:2 (mise ×2.5). Si le croupier a aussi un Blackjack, c\'est une égalité.',
  },
  {
    title: 'Règles du croupier',
    icon: '🎩',
    content: 'Le croupier doit tirer jusqu\'à atteindre 17 ou plus. Il tire aussi sur un "17 souple" (As + 6). Au-dessus de 17, il est obligé de rester.',
  },
  {
    title: 'Résultats',
    icon: '🏆',
    content: null,
    table: [
      { label: 'Victoire', value: 'Vous êtes plus proche de 21 que le croupier — vous doublez votre mise.' },
      { label: 'Blackjack', value: 'Vous gagnez 3:2 (×2.5) sur votre mise initiale.' },
      { label: 'Égalité (Push)', value: 'Même total que le croupier — la mise est remboursée.' },
      { label: 'Défaite', value: 'Le croupier est plus proche de 21, ou vous avez dépassé 21.' },
    ],
  },
]

const DEALER_COLS = ['2','3','4','5','6','7','8','9','10','A']

const HARD_ROWS = [
  { label: '8 ou -', row: ['H','H','H','H','H','H','H','H','H','H'] },
  { label: '9',      row: ['H','D','D','D','D','H','H','H','H','H'] },
  { label: '10',     row: ['D','D','D','D','D','D','D','D','H','H'] },
  { label: '11',     row: ['D','D','D','D','D','D','D','D','D','H'] },
  { label: '12',     row: ['H','H','S','S','S','H','H','H','H','H'] },
  { label: '13',     row: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '14',     row: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '15',     row: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '16',     row: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '17+',    row: ['S','S','S','S','S','S','S','S','S','S'] },
]

const SOFT_ROWS = [
  { label: 'A,2',  row: ['H','H','H','D','D','H','H','H','H','H'] },
  { label: 'A,3',  row: ['H','H','H','D','D','H','H','H','H','H'] },
  { label: 'A,4',  row: ['H','H','D','D','D','H','H','H','H','H'] },
  { label: 'A,5',  row: ['H','H','D','D','D','H','H','H','H','H'] },
  { label: 'A,6',  row: ['H','D','D','D','D','H','H','H','H','H'] },
  { label: 'A,7',  row: ['S','D','D','D','D','S','S','H','H','H'] },
  { label: 'A,8',  row: ['S','S','S','S','S','S','S','S','S','S'] },
  { label: 'A,9',  row: ['S','S','S','S','S','S','S','S','S','S'] },
]

const PAIR_ROWS = [
  { label: '2,2',   row: ['P','P','P','P','P','P','H','H','H','H'] },
  { label: '3,3',   row: ['P','P','P','P','P','P','H','H','H','H'] },
  { label: '4,4',   row: ['H','H','H','P','P','H','H','H','H','H'] },
  { label: '5,5',   row: ['D','D','D','D','D','D','D','D','H','H'] },
  { label: '6,6',   row: ['P','P','P','P','P','H','H','H','H','H'] },
  { label: '7,7',   row: ['P','P','P','P','P','P','H','H','H','H'] },
  { label: '8,8',   row: ['P','P','P','P','P','P','P','P','P','P'] },
  { label: '9,9',   row: ['P','P','P','P','P','S','P','P','S','S'] },
  { label: '10,10', row: ['S','S','S','S','S','S','S','S','S','S'] },
  { label: 'A,A',   row: ['P','P','P','P','P','P','P','P','P','P'] },
]

const CELL_COLORS = {
  H: { bg: '#3b82f620', color: '#3b82f6', label: 'T' },
  S: { bg: '#22c55e20', color: '#22c55e', label: 'R' },
  D: { bg: '#c9a22720', color: '#c9a227', label: 'D' },
  P: { bg: '#a855f720', color: '#a855f7', label: 'S' },
}

const GLOSSARY = [
  { term: 'Blackjack', def: 'Main composée d\'un As et d\'une carte valant 10 dès la première donne (2 cartes). Paye 3:2.' },
  { term: 'Hit / Tirer', def: 'Demander une carte supplémentaire au croupier.' },
  { term: 'Stand / Rester', def: 'Refuser de prendre d\'autres cartes et conserver sa main.' },
  { term: 'Bust / Dépasser', def: 'Dépasser 21 — on perd automatiquement la main.' },
  { term: 'Double Down / Doubler', def: 'Doubler sa mise initiale en échange d\'une seule carte supplémentaire. Disponible seulement sur les 2 premières cartes.' },
  { term: 'Split / Séparer', def: 'Diviser une paire en deux mains indépendantes, chacune avec une mise égale à la mise initiale.' },
  { term: 'Push / Égalité', def: 'Le joueur et le croupier ont le même total — la mise est remboursée, sans gain ni perte.' },
  { term: 'Soft Hand / Main souple', def: 'Main contenant un As compté comme 11. Ex : As + 6 = 17 souple. On peut tirer sans risquer de dépasser 21.' },
  { term: 'Hard Hand / Main dure', def: 'Main sans As, ou dont l\'As est compté comme 1 pour éviter de dépasser 21.' },
  { term: 'Upcard / Carte visible', def: 'La carte du croupier visible par tous. Essentielle pour appliquer la stratégie de base.' },
  { term: 'Hole Card / Carte cachée', def: 'La carte face cachée du croupier. Elle est révélée après que les joueurs ont joué.' },
  { term: 'Shoe / Sabot', def: 'Boîte contenant plusieurs jeux mélangés (souvent 6 ou 8), depuis laquelle les cartes sont distribuées.' },
  { term: 'Natural', def: 'Synonyme de Blackjack naturel : As + carte de valeur 10 en deux cartes.' },
  { term: 'Insurance / Assurance', def: 'Mise secondaire proposée quand le croupier montre un As. Paye 2:1 si le croupier a un Blackjack. Déconseillée par la stratégie de base.' },
  { term: 'Surrender / Abandon', def: 'Option rare : abandonner sa main en récupérant la moitié de sa mise. Utile sur 16 contre un As ou un 10 du croupier.' },
  { term: 'Stratégie de base', def: 'Ensemble de décisions mathématiquement optimales selon sa main et la carte visible du croupier. Réduit l\'avantage de la maison à ~0.5%.' },
]

const QUIZ = [
  {
    question: 'Quelle est la valeur d\'un As au Blackjack ?',
    options: ['Uniquement 1', 'Uniquement 11', '1 ou 11, selon ce qui est le plus avantageux', 'Toujours 10'],
    answer: 2,
    explanation: 'L\'As vaut 1 ou 11, selon ce qui profite le plus à la main. Ex : As + 6 = 17 souple (As = 11), mais As + 6 + 9 = 16 dur (As = 1).',
  },
  {
    question: 'Qu\'est-ce qu\'un Blackjack naturel ?',
    options: ['Toute main valant 21', 'Un As et une carte de valeur 10 en deux cartes', '21 en exactement 3 cartes', 'Une main sans figure'],
    answer: 1,
    explanation: 'Un Blackjack naturel est uniquement un As + une carte de valeur 10 (10, V, D ou R) distribués dès les deux premières cartes.',
  },
  {
    question: 'À partir de quel total le croupier doit-il s\'arrêter de tirer ?',
    options: ['À partir de 16', 'À partir de 17', 'À partir de 18', 'Il décide librement'],
    answer: 1,
    explanation: 'Le croupier est obligé de tirer jusqu\'à atteindre 17 ou plus (et même sur un 17 souple dans la plupart des casinos).',
  },
  {
    question: 'Que signifie "Doubler" (Double Down) ?',
    options: ['Doubler sa mise et recevoir autant de cartes que voulu', 'Séparer sa main en deux', 'Doubler sa mise et ne recevoir qu\'une seule carte', 'Doubler seulement si le croupier a un As'],
    answer: 2,
    explanation: 'Doubler consiste à doubler sa mise initiale en échange d\'exactement une seule carte supplémentaire. On ne peut pas demander d\'autres cartes ensuite.',
  },
  {
    question: 'Combien paye un Blackjack naturel ?',
    options: ['Mise × 1 (remboursement simple)', 'Mise × 2', 'Mise × 2,5 (soit 3:2)', 'Mise × 3'],
    answer: 2,
    explanation: 'Le Blackjack naturel paye 3:2, soit 1,5 fois la mise en gain — au total vous récupérez 2,5 fois votre mise.',
  },
  {
    question: 'Quelle est la bonne action avec une paire de 8 ?',
    options: ['Toujours rester sur 16', 'Toujours tirer', 'Toujours séparer', 'Doubler si possible'],
    answer: 2,
    explanation: '16 dur est la pire main possible. Séparer les 8 donne deux mains qui partent d\'un score de 8, bien plus favorable que rester sur 16.',
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: "'DM Serif Display', serif",
      fontSize: 20, color: '#c9a227', marginBottom: 16,
    }}>
      {children}
    </h2>
  )
}

function RulesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Règles du Blackjack</SectionTitle>
      {RULES.map(rule => (
        <div key={rule.title} style={{
          background: '#1c2333', borderRadius: 12, padding: '16px 18px',
          border: '1px solid #2d3a5a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{rule.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{rule.title}</span>
          </div>
          {rule.content && (
            <p style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.7 }}>{rule.content}</p>
          )}
          {rule.steps && (
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              {rule.steps.map((s, i) => (
                <li key={i} style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.8, marginBottom: 2 }}>{s}</li>
              ))}
            </ol>
          )}
          {rule.table && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rule.table.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: '#c9a227',
                    background: '#c9a22715', padding: '2px 10px', borderRadius: 20,
                    whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                  }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.6 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
          {rule.actions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rule.actions.map(a => (
                <div key={a.name} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: a.color,
                    background: a.color + '20', padding: '2px 10px', borderRadius: 20,
                    whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                  }}>
                    {a.name}
                  </span>
                  <span style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.6 }}>{a.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function StrategyTable({ rows, title }) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#8899bb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 360 }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', color: '#8899bb', textAlign: 'left', fontWeight: 600 }}>Votre main</th>
              {DEALER_COLS.map(c => (
                <th key={c} style={{ padding: '4px 6px', color: '#8899bb', fontWeight: 600, minWidth: 28 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, row }) => (
              <tr key={label}>
                <td style={{
                  padding: '4px 8px', fontWeight: 700, color: '#c9a227',
                  background: '#1c2333', borderRadius: 4, whiteSpace: 'nowrap',
                }}>
                  {label}
                </td>
                {row.map((cell, i) => {
                  const s = CELL_COLORS[cell]
                  return (
                    <td key={i} style={{
                      padding: '4px 6px', textAlign: 'center',
                      background: s.bg, color: s.color,
                      fontWeight: 700, borderRadius: 3,
                    }}>
                      {s.label}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StrategyTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionTitle>Stratégie de base</SectionTitle>

      <div style={{
        background: '#1c2333', borderRadius: 12, padding: '14px 18px',
        border: '1px solid #2d3a5a',
        fontSize: 13, color: '#c8d6f0', lineHeight: 1.7,
      }}>
        La <strong style={{ color: '#c9a227' }}>stratégie de base</strong> est un système mathématique qui indique
        la meilleure action à prendre selon votre main et la carte visible du croupier.
        En l'appliquant parfaitement, l'avantage du casino descend à environ <strong style={{ color: '#22c55e' }}>0,5 %</strong>.
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'H', label: 'Tirer (Hit)' },
          { key: 'S', label: 'Rester (Stand)' },
          { key: 'D', label: 'Doubler (Double)' },
          { key: 'P', label: 'Séparer (Split)' },
        ].map(({ key, label }) => {
          const s = CELL_COLORS[key]
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 24, height: 24, borderRadius: 4,
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: '#8899bb' }}>{label}</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <StrategyTable rows={HARD_ROWS} title="Totaux durs (sans As souple)" />
        <StrategyTable rows={SOFT_ROWS} title="Totaux souples (avec As compté 11)" />
        <StrategyTable rows={PAIR_ROWS} title="Paires" />
      </div>

      <div style={{
        background: '#1c2333', borderRadius: 12, padding: '14px 18px',
        border: '1px solid #2d3a5a',
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>Règles d'or à retenir</p>
        {[
          'Toujours séparer les As et les 8.',
          'Ne jamais séparer les 10 — 20 est une main quasi imbattable.',
          'Toujours doubler sur 11 contre un croupier de 2 à 10.',
          'Rester sur tout total dur ≥ 17.',
          'Rester sur 12-16 quand le croupier montre 2 à 6.',
        ].map((rule, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            <span style={{ color: '#c9a227', fontWeight: 700, flexShrink: 0 }}>→</span>
            <span style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.6 }}>{rule}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GlossaryTab() {
  const [search, setSearch] = useState('')
  const filtered = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(search.toLowerCase()) ||
    g.def.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Glossaire</SectionTitle>
      <input
        type="text"
        placeholder="Rechercher un terme…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: '#1c2333', border: '1px solid #2d3a5a',
          color: '#e2e8f0', fontSize: 14, outline: 'none',
        }}
      />
      {filtered.length === 0 && (
        <p style={{ color: '#8899bb', fontSize: 13, textAlign: 'center', padding: 20 }}>
          Aucun résultat.
        </p>
      )}
      {filtered.map(g => (
        <div key={g.term} style={{
          background: '#1c2333', borderRadius: 12, padding: '14px 18px',
          border: '1px solid #2d3a5a',
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#c9a227', marginBottom: 6 }}>{g.term}</p>
          <p style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.7 }}>{g.def}</p>
        </div>
      ))}
    </div>
  )
}

function QuizTab() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [answered, setAnswered] = useState(false)

  const q = QUIZ[current]

  function choose(idx) {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === q.answer) setScore(s => s + 1)
  }

  function next() {
    if (current + 1 >= QUIZ.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  function restart() {
    setCurrent(0); setSelected(null); setScore(0); setDone(false); setAnswered(false)
  }

  if (done) {
    const pct = Math.round((score / QUIZ.length) * 100)
    const medal = pct >= 83 ? '🏆' : pct >= 50 ? '👍' : '📚'
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{medal}</div>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#c9a227', marginBottom: 8 }}>
          {score} / {QUIZ.length}
        </p>
        <p style={{ fontSize: 14, color: '#8899bb', marginBottom: 28 }}>
          {pct >= 83 ? 'Excellent ! Tu maîtrises le Blackjack.' : pct >= 50 ? 'Pas mal ! Relis la stratégie de base.' : 'Continue à apprendre, les règles n\'ont plus de secrets bientôt.'}
        </p>
        <button onClick={restart} style={{
          padding: '10px 28px', borderRadius: 8, border: 'none',
          background: '#c9a227', color: '#111827', cursor: 'pointer', fontSize: 14, fontWeight: 700,
        }}>
          Recommencer
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle>Quiz</SectionTitle>
        <span style={{ fontSize: 12, color: '#8899bb' }}>
          {current + 1} / {QUIZ.length}
        </span>
      </div>

      <div style={{
        background: '#1c2333', borderRadius: 12, padding: '18px 20px',
        border: '1px solid #2d3a5a',
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.5 }}>{q.question}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt, i) => {
          let bg = '#1c2333', border = '#2d3a5a', color = '#e2e8f0'
          if (answered) {
            if (i === q.answer) { bg = '#14532d'; border = '#22c55e'; color = '#22c55e' }
            else if (i === selected) { bg = '#450a0a'; border = '#ef4444'; color = '#ef4444' }
          } else if (selected === i) {
            bg = '#232f47'; border = '#c9a227'
          }
          return (
            <button key={i} onClick={() => choose(i)} style={{
              padding: '12px 16px', borderRadius: 10, border: `1px solid ${border}`,
              background: bg, color, cursor: answered ? 'default' : 'pointer',
              fontSize: 13, textAlign: 'left', lineHeight: 1.5, transition: 'all 0.2s',
            }}>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <div style={{
          background: '#1c2333', borderRadius: 12, padding: '14px 18px',
          border: '1px solid #2d3a5a', fontSize: 13, color: '#c8d6f0', lineHeight: 1.7,
        }}>
          <strong style={{ color: '#c9a227' }}>Explication : </strong>{q.explanation}
        </div>
      )}

      {answered && (
        <button onClick={next} style={{
          alignSelf: 'center', padding: '10px 28px', borderRadius: 8, border: 'none',
          background: '#c9a227', color: '#111827', cursor: 'pointer', fontSize: 14, fontWeight: 700,
        }}>
          {current + 1 >= QUIZ.length ? 'Voir les résultats' : 'Question suivante →'}
        </button>
      )}
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'rules',    label: 'Règles',    icon: '📖' },
  { id: 'strategy', label: 'Stratégie', icon: '🧠' },
  { id: 'glossary', label: 'Glossaire', icon: '📚' },
  { id: 'quiz',     label: 'Quiz',      icon: '✏️' },
  { id: 'play',     label: 'Jouer',     icon: '🎮' },
]

export default function BlackjackApp({ onBack }) {
  const [tab, setTab] = useState('rules')

  return (
    <div>
      <div className="bj-layout">
        {/* Header */}
        <header className="bj-header">
          {onBack && (
            <button onClick={onBack} style={{
              background: 'none', border: '1px solid #2d3a5a', borderRadius: 8,
              color: '#8899bb', cursor: 'pointer', padding: '6px 14px', fontSize: 13,
              flexShrink: 0,
            }}>
              ← Accueil
            </button>
          )}
          <span style={{ fontSize: 24 }}>🃏</span>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 18, color: '#c9a227',
          }}>
            Blackjack
          </span>
        </header>

        <div className="bj-body">
          {/* Sidebar */}
          <nav className="bj-sidebar">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`bj-sidebar-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <main className="bj-content">
            <div className="bj-inner" style={{
              width: '100%', maxWidth: 700,
              margin: '0 auto',
              padding: '24px 20px',
            }}>
              {tab === 'rules'    && <RulesTab />}
              {tab === 'strategy' && <StrategyTab />}
              {tab === 'glossary' && <GlossaryTab />}
              {tab === 'quiz'     && <QuizTab />}
              {tab === 'play'     && <BlackjackGame />}
            </div>
          </main>
        </div>

        {/* Mobile tab bar */}
        <nav className="bj-tabbar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`bj-tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
