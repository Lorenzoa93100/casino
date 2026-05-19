import { useState } from 'react'
import RouletteGame from './RouletteGame.jsx'

const RL_CSS = `
.rl-layout { display:flex; flex-direction:column; min-height:100vh; background:#111827; }
.rl-header {
  display:flex; align-items:center; gap:16px; padding:0 20px; height:57px;
  background:#111827; border-bottom:1px solid #2d3a5a;
  position:sticky; top:0; z-index:10;
}
.rl-body { display:flex; flex:1; }
.rl-sidebar {
  display:none; width:180px; flex-shrink:0;
  border-right:1px solid #2d3a5a; padding:24px 12px;
  position:sticky; top:57px; height:calc(100vh - 57px); overflow-y:auto;
}
.rl-tabbar {
  display:flex;
  background:#111827; border-top:1px solid #2d3a5a;
  position:sticky; bottom:0; z-index:10;
}
.rl-content { flex:1; overflow-y:auto; }
.rl-inner { width:100%; padding:24px 20px; }
.rl-tab-btn {
  flex:1; padding:10px 4px; border:none;
  background:none; color:#8899bb; cursor:pointer; font-size:10px; font-weight:600;
  display:flex; flex-direction:column; align-items:center; gap:3;
  transition:color 0.15s; font-family:inherit;
}
.rl-tab-btn .rl-tab-icon { font-size:18px; }
.rl-tab-btn:hover { color:#e2e8f0; }
.rl-tab-btn.active { color:#c9a227; }
.rl-sidebar-btn {
  display:flex; align-items:center; gap:10px;
  width:100%; padding:10px 12px; border-radius:8px; border:none;
  background:none; color:#8899bb; cursor:pointer; font-size:13px;
  font-family:inherit; text-align:left; transition:all 0.15s; margin-bottom:4px;
}
.rl-sidebar-btn.active { background:#c9a22718; color:#c9a227; }
.rl-section { display:flex; flex-direction:column; gap:12px; }
.rl-section-title { font-size:20px; font-weight:700; color:#c9a227; margin-bottom:4px; font-family:'DM Serif Display',serif; }
.rl-card {
  background:#1c2333; border-radius:12px; padding:16px 18px;
  border:1px solid #2d3a5a;
}
.rl-card h3 { font-size:15px; font-weight:700; color:#e2e8f0; margin:0 0 8px; }
.rl-card p, .rl-card li { font-size:13px; color:#c8d6f0; line-height:1.7; }
.rl-card ul, .rl-card ol { padding-left:18px; margin:4px 0; }
.rl-quiz-btn {
  padding:12px 16px; border-radius:10px; border:1px solid #2d3a5a;
  background:#1c2333; color:#e2e8f0; cursor:pointer; font-size:13px;
  text-align:left; width:100%; transition:all 0.15s; font-family:inherit; line-height:1.5;
}
.rl-quiz-btn:hover { border-color:#c9a227; }
.rl-quiz-btn.correct { background:#14532d; border-color:#22c55e; color:#22c55e; }
.rl-quiz-btn.wrong   { background:#450a0a; border-color:#ef4444; color:#ef4444; }
.rl-bet-card {
  background:#1c2333; border:1px solid #2d3a5a; border-radius:12px;
  padding:16px 18px;
}
.rl-bet-card h4 { margin:0 0 6px; font-size:14px; font-weight:700; color:#c9a227; }
.rl-bet-card p { margin:0; font-size:13px; color:#c8d6f0; line-height:1.7; }
.rl-payout-badge {
  display:inline-block; padding:2px 8px; border-radius:20px;
  background:#0f2d1e; color:#4ade80; font-size:11px; font-weight:700; margin-left:8px;
}
@media (min-width:768px) {
  .rl-sidebar  { display:block; }
  .rl-tabbar   { display:none; }
  .rl-inner    { padding:32px 40px; }
}
`

const TABS = [
  { id: 'rules',    label: 'Règles',    icon: '📋' },
  { id: 'bets',     label: 'Mises',     icon: '🎲' },
  { id: 'glossary', label: 'Glossaire', icon: '📖' },
  { id: 'quiz',     label: 'Quiz',      icon: '🎯' },
  { id: 'play',     label: 'Jouer',     icon: '🎰' },
]

const BETS_DATA = [
  { name: 'Plein (Straight Up)', payout: '35:1', desc: 'Mise sur un seul numéro. Si la bille tombe sur ce numéro, vous gagnez 35 fois votre mise. Probabilité : 1/37 (2.7%).' },
  { name: 'Cheval (Split)', payout: '17:1', desc: 'Mise sur 2 numéros adjacents sur la grille. Vous gagnez si l\'un des deux sort. Probabilité : 2/37 (5.4%).' },
  { name: 'Transversale Pleine (Street)', payout: '11:1', desc: 'Mise sur une rangée de 3 numéros (ex : 1-2-3). Probabilité : 3/37 (8.1%).' },
  { name: 'Carré (Corner)', payout: '8:1', desc: 'Mise sur 4 numéros formant un carré. Probabilité : 4/37 (10.8%).' },
  { name: 'Sixain (Line)', payout: '5:1', desc: 'Mise sur 6 numéros (2 rangées de 3). Probabilité : 6/37 (16.2%).' },
  { name: 'Douzaine', payout: '2:1', desc: 'Mise sur 12 numéros : 1-12, 13-24, ou 25-36. Probabilité : 12/37 (32.4%).' },
  { name: 'Colonne', payout: '2:1', desc: 'Mise sur l\'une des 3 colonnes de 12 numéros. Probabilité : 12/37 (32.4%).' },
  { name: 'Rouge / Noir', payout: '1:1', desc: 'Mise sur la couleur. 18 numéros rouges, 18 noirs. Le 0 fait perdre. Probabilité : 18/37 (48.6%).' },
  { name: 'Pair / Impair', payout: '1:1', desc: 'Mise sur la parité du numéro. Le 0 fait perdre. Probabilité : 18/37 (48.6%).' },
  { name: 'Manque / Passe', payout: '1:1', desc: 'Manque = 1-18, Passe = 19-36. Le 0 fait perdre. Probabilité : 18/37 (48.6%).' },
]

const GLOSSARY = [
  { term: 'Zéro (0)', def: 'Numéro vert qui fait perdre toutes les mises simples et doubles chances. C\'est l\'avantage de la maison (2.7%).' },
  { term: 'Avantage de la maison', def: 'Sur la roulette européenne (1 zéro), l\'avantage est de 2.7%. La roulette américaine (double zéro) a 5.26%.' },
  { term: 'Tapis / Layout', def: 'Le tableau de mise avec la grille des numéros et les cases de mises extérieures.' },
  { term: 'Mise intérieure', def: 'Mise placée directement sur les numéros de la grille (plein, cheval, carré, etc.).' },
  { term: 'Mise extérieure', def: 'Mise placée en dehors de la grille : couleurs, parité, douzaines, colonnes.' },
  { term: 'En prison', def: 'Règle favorable : si le 0 sort sur une mise 1:1, la mise reste "en prison" pour le prochain tour.' },
  { term: 'La partage', def: 'Variante : si le 0 sort, la moitié des mises 1:1 est récupérée. Réduit l\'avantage à 1.35%.' },
  { term: 'Croupier', def: 'L\'employé du casino qui gère la table, fait tourner la roue et annonce les résultats.' },
  { term: 'Secteur', def: 'Groupe de numéros adjacents sur la roue (pas la grille). Base de mises spéciales comme Voisins du Zéro.' },
  { term: 'Voisins du Zéro', def: 'Mise spéciale couvrant les 17 numéros voisins du 0 sur la roue (22 à 25 en passant par 0).' },
  { term: 'Orphelins', def: 'Les 8 numéros non couverts par les Voisins du Zéro ni le Tiers du Cylindre.' },
  { term: 'Tiers du Cylindre', def: 'Les 12 numéros face au 0 sur la roue (27 à 33 en passant par le côté opposé).' },
  { term: 'Martingale', def: 'Stratégie risquée : doubler la mise après chaque perte. Dangereuse car la limite de table stoppe la progression.' },
  { term: 'Numéro chaud', def: 'Numéro sorti fréquemment dans les derniers tours. Croyance populaire sans réalité mathématique.' },
  { term: 'Jeton de couleur', def: 'À la roulette physique, chaque joueur reçoit des jetons d\'une couleur unique pour éviter les confusions.' },
  { term: 'Banco', def: 'Terme générique désignant la limite de mise maximale autorisée sur une table.' },
]

const QUIZ = [
  {
    q: 'Quel est l\'avantage de la maison à la roulette européenne ?',
    opts: ['1.35%', '2.7%', '5.26%', '0%'],
    ans: 1,
    exp: '2.7% car il y a 1 seul zéro sur 37 numéros (1/37 ≈ 2.7%). La roulette américaine avec 2 zéros monte à 5.26%.',
  },
  {
    q: 'Combien de numéros y a-t-il sur une roulette européenne ?',
    opts: ['36', '37', '38', '39'],
    ans: 1,
    exp: '37 numéros : les numéros 1 à 36 plus le zéro. La roulette américaine ajoute un double zéro (00), soit 38 cases.',
  },
  {
    q: 'Quel est le payout d\'un plein (numéro exact) ?',
    opts: ['17:1', '35:1', '11:1', '2:1'],
    ans: 1,
    exp: '35:1. Si vous misez 10€ sur un numéro et qu\'il sort, vous recevez 350€ + votre mise de 10€, soit 360€ en tout.',
  },
  {
    q: 'Qu\'est-ce qu\'une mise "manque" ?',
    opts: ['Numéros 1 à 12', 'Numéros 1 à 18', 'Numéros 19 à 36', 'Numéros pairs'],
    ans: 1,
    exp: 'Manque couvre les numéros 1 à 18 (les "bas"). Passe couvre les numéros 19 à 36. Payout 1:1.',
  },
  {
    q: 'La règle "en prison" s\'applique à :',
    opts: ['Toutes les mises', 'Les mises intérieures', 'Les mises à payout 1:1', 'Les douzaines'],
    ans: 2,
    exp: 'Quand le 0 sort, les mises simples chances (Rouge/Noir, Pair/Impair, Manque/Passe) restent "en prison" pour le prochain tour, réduisant l\'avantage de la maison.',
  },
  {
    q: 'Sur la grille de roulette, le numéro 0 est de quelle couleur ?',
    opts: ['Rouge', 'Noir', 'Vert', 'Blanc'],
    ans: 2,
    exp: 'Le zéro est toujours vert. Les numéros 1-36 sont alternativement rouges et noirs selon un schéma fixe.',
  },
]

function RulesTab() {
  return (
    <div className="rl-section">
      <h2 className="rl-section-title">Règles de la Roulette</h2>
      {[
        { icon: '🎯', title: 'Objectif', body: <p>Prédire sur quel numéro la bille s'arrêtera après que la roue ait terminé de tourner. Les joueurs placent leurs mises avant que le croupier ne lance la bille dans le sens inverse de la roue.</p> },
        { icon: '🔄', title: 'Déroulement d\'un tour', body: <ol><li><strong>Les mises</strong> : Les joueurs placent leurs jetons sur le tapis.</li><li><strong>Rien ne va plus</strong> : Le croupier annonce la fin des mises et lance la bille.</li><li><strong>Résultat</strong> : La bille s'immobilise dans un casier numéroté.</li><li><strong>Paiements</strong> : Les mises gagnantes sont payées, les perdantes ramassées.</li></ol> },
        { icon: '🎡', title: 'La roue européenne', body: <p>37 cases numérotées de 0 à 36. L'ordre sur la roue est fixe : <strong>0, 32, 15, 19, 4, 21, 2, 25, 17, 34…</strong> Les numéros rouges et noirs alternent, le 0 est vert.</p> },
        { icon: '📊', title: 'Avantage de la maison', body: <p>L'unique zéro crée un avantage de <strong>2.7%</strong> pour le casino. Un joueur perd en moyenne 2.7€ pour chaque 100€ misés à long terme.</p> },
        { icon: '🎲', title: 'Types de mises', body: <ul><li><strong>Mises intérieures</strong> : sur les numéros (plein, cheval, transversale, carré, sixain)</li><li><strong>Mises extérieures</strong> : couleurs, parité, manque/passe, douzaines, colonnes</li></ul> },
        { icon: '💡', title: 'Conseil', body: <p>La roulette est un jeu de pur hasard. Aucune stratégie ne peut réduire l'avantage mathématique. La Martingale augmente le risque sans améliorer les probabilités.</p> },
      ].map(s => (
        <div key={s.title} className="rl-card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:20 }}>{s.icon}</span>
            <h3 style={{ margin:0 }}>{s.title}</h3>
          </div>
          {s.body}
        </div>
      ))}
    </div>
  )
}

function BetsTab() {
  return (
    <div className="rl-section">
      <h2 className="rl-section-title">Types de Mises</h2>
      {BETS_DATA.map(b => (
        <div className="rl-bet-card" key={b.name}>
          <h4>{b.name} <span className="rl-payout-badge">{b.payout}</span></h4>
          <p>{b.desc}</p>
        </div>
      ))}
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
    <div className="rl-section">
      <h2 className="rl-section-title">Glossaire</h2>
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher un terme…"
        style={{
          width:'100%', padding:'10px 14px', borderRadius:8,
          border:'1px solid #2d3a5a', background:'#0f172a',
          color:'#e2e8f0', fontSize:14, marginBottom:16, boxSizing:'border-box', fontFamily:'inherit',
        }}
      />
      {filtered.map(g => (
        <div key={g.term} className="rl-card">
          <p style={{ fontWeight:700, color:'#c9a227', fontSize:14, marginBottom:6 }}>{g.term}</p>
          <p style={{ fontSize:13, color:'#c8d6f0', lineHeight:1.7, margin:0 }}>{g.def}</p>
        </div>
      ))}
      {filtered.length === 0 && <p style={{ color:'#8899bb' }}>Aucun terme trouvé.</p>}
    </div>
  )
}

function QuizTab() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  function pick(i) {
    if (selected !== null) return
    setSelected(i)
    if (i === QUIZ[current].ans) setScore(s => s + 1)
  }

  function next() {
    if (current + 1 >= QUIZ.length) { setDone(true); return }
    setCurrent(c => c + 1)
    setSelected(null)
  }

  function restart() { setCurrent(0); setSelected(null); setScore(0); setDone(false) }

  if (done) return (
    <div className="rl-section" style={{ textAlign:'center' }}>
      <h2 className="rl-section-title">Quiz terminé !</h2>
      <div style={{ fontSize:48, fontWeight:800, color:'#c9a227', margin:'20px 0' }}>{score}/{QUIZ.length}</div>
      <p>{score >= 5 ? 'Excellent ! Vous maîtrisez la roulette.' : score >= 3 ? 'Bien ! Quelques révisions s\'imposent.' : 'Revoyez les règles et retentez !'}</p>
      <button className="rl-spin-btn" onClick={restart} style={{ marginTop:16 }}>Recommencer</button>
    </div>
  )

  const q = QUIZ[current]
  return (
    <div className="rl-section">
      <h2 className="rl-section-title">Quiz — Roulette</h2>
      <div style={{ color:'#8899bb', fontSize:13, marginBottom:16 }}>Question {current+1}/{QUIZ.length} · Score : {score}</div>
      <div style={{ fontWeight:600, color:'#e2e8f0', fontSize:15, marginBottom:16 }}>{q.q}</div>
      {q.opts.map((opt, i) => {
        let cls = 'rl-quiz-btn'
        if (selected !== null) {
          if (i === q.ans) cls += ' correct'
          else if (i === selected && i !== q.ans) cls += ' wrong'
        }
        return <button key={i} className={cls} onClick={() => pick(i)} style={{ marginBottom:8 }}>{opt}</button>
      })}
      {selected !== null && (
        <div className="rl-card" style={{ fontSize:13, color:'#c8d6f0', lineHeight:1.7 }}>
          <strong style={{ color:'#c9a227' }}>Explication : </strong>{q.exp}
        </div>
      )}
      {selected !== null && (
        <button onClick={next} style={{
          marginTop:12, padding:'10px 24px', borderRadius:8,
          background:'#c9a227', color:'#000', border:'none', cursor:'pointer', fontWeight:700,
        }}>
          {current + 1 >= QUIZ.length ? 'Voir le score' : 'Question suivante →'}
        </button>
      )}
    </div>
  )
}

export default function RouletteApp({ onBack }) {
  const [tab, setTab] = useState('rules')

  return (
    <div className="rl-layout">
      <style>{RL_CSS}</style>

      {/* Header */}
      <header className="rl-header">
        <button onClick={onBack} style={{
          background:'none', border:'none', color:'#8899bb', cursor:'pointer',
          fontSize:20, lineHeight:1, padding:'4px 8px', display:'flex', alignItems:'center',
        }}>←</button>
        <span style={{ fontSize:20 }}>🎡</span>
        <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:'#e2e8f0' }}>Roulette</h1>
      </header>

      <div className="rl-body">
        {/* Desktop sidebar */}
        <nav className="rl-sidebar">
          {TABS.map(t => (
            <button key={t.id} className={`rl-sidebar-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="rl-content">
          <main>
            <div className="rl-inner">
              {tab === 'rules'    && <RulesTab />}
              {tab === 'bets'     && <BetsTab />}
              {tab === 'glossary' && <GlossaryTab />}
              {tab === 'quiz'     && <QuizTab />}
              {tab === 'play'     && <RouletteGame />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile tab bar — sticky bottom */}
      <nav className="rl-tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`rl-tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            <span className="rl-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
