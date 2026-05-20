import { useState } from 'react'
import RouletteWheel from './RouletteWheel.jsx'
import { spinWheel, evaluateBets, explainResult, getColor } from './engine.js'
import './roulette.css'

const CHIPS = [
  { value: 1,   color: '#e5e7eb', border: '#9ca3af', textColor: '#111' },
  { value: 5,   color: '#ef4444', border: '#b91c1c', textColor: '#fff' },
  { value: 25,  color: '#3b82f6', border: '#1d4ed8', textColor: '#fff' },
  { value: 100, color: '#16a34a', border: '#166534', textColor: '#fff' },
  { value: 500, color: '#7c3aed', border: '#5b21b6', textColor: '#fff' },
]

const SEG_COLORS = { green: '#16a34a', red: '#dc2626', black: '#1a1a1a' }

const GRID_COLS = [
  [3,6,9,12,15,18,21,24,27,30,33,36],
  [2,5,8,11,14,17,20,23,26,29,32,35],
  [1,4,7,10,13,16,19,22,25,28,31,34],
]

function getBetKey(bet) {
  return `${bet.type}:${(bet.numbers || []).join(',') || bet.type}`
}

export default function RouletteGame() {
  const [balance, setBalance] = useState(1000)
  const [selectedChip, setSelectedChip] = useState(5)
  const [bets, setBets] = useState([])
  const [spinning, setSpinning] = useState(false)
  const [resultInfo, setResultInfo] = useState(null)
  const [pendingResult, setPendingResult] = useState(null)

  function totalBet() { return bets.reduce((s, b) => s + b.amount, 0) }

  function addBet(betDef) {
    // Block if spinning OR not enough balance for the selected chip
    if (spinning || balance < selectedChip) return
    const key = getBetKey(betDef)
    setBets(prev => {
      const existing = prev.find(b => getBetKey(b) === key)
      if (existing) return prev.map(b => getBetKey(b) === key ? { ...b, amount: b.amount + selectedChip } : b)
      return [...prev, { ...betDef, amount: selectedChip }]
    })
    setBalance(b => b - selectedChip)
  }

  function clearBets() {
    if (spinning) return
    setBalance(b => b + totalBet())
    setBets([])
    setResultInfo(null)
  }

  function handleSpin() {
    if (spinning || bets.length === 0) return
    const r = spinWheel()
    setPendingResult(r)
    setSpinning(true)
    setResultInfo(null)
  }

  function handleSpinEnd() {
    setSpinning(false)
    const r = pendingResult
    const { net, breakdown } = evaluateBets(bets, r)
    const lines = explainResult(r, breakdown)
    setBalance(b => b + net + totalBet())
    setResultInfo({ net, lines })
    setBets([])
  }

  function numBet(n) {
    addBet({ type: 'straight', label: `Plein ${n}`, numbers: [n] })
  }

  function restart() {
    setBalance(1000)
    setBets([])
    setResultInfo(null)
    setPendingResult(null)
  }

  // ── Game over: no balance, no active bets, wheel stopped ─────────────────────
  const isGameOver = balance <= 0 && bets.length === 0 && !spinning

  return (
    <div className="rl-game-wrap">

      {/* Solde */}
      <div className="rl-balance-bar">
        <span>Solde : <strong className="rl-balance-gold">{balance}€</strong></span>
        <span>Mises : <strong className="rl-balance-amber">{totalBet()}€</strong></span>
      </div>

      <div className="rl-game-cols">

        {/* COLONNE GAUCHE — roue + résultat */}
        <div className="rl-wheel-col">
          <div className="rl-felt-wrap">
            <RouletteWheel spinning={spinning} result={pendingResult} onSpinEnd={handleSpinEnd} />
          </div>

          {resultInfo && (
            <div className={`rl-result-box rl-result-card ${resultInfo.net > 0 ? 'rl-result-win' : resultInfo.net < 0 ? 'rl-result-lose' : ''}`}>
              <p className="rl-result-headline">
                {resultInfo.net > 0 ? `+${resultInfo.net}€ — Gagné !` : resultInfo.net < 0 ? `${resultInfo.net}€ — Perdu` : 'Égalité'}
              </p>
              {resultInfo.lines.map((l, i) => (
                <p key={i} className={i === 0 ? 'rl-result-primary' : 'rl-result-secondary'}
                  dangerouslySetInnerHTML={{ __html: l.replace(/\*\*(.*?)\*\*/g, '<strong class="rl-gold">$1</strong>') }}
                />
              ))}
            </div>
          )}
        </div>

        {/* COLONNE DROITE — jetons + table + boutons */}
        <div className="rl-table-col">

          {isGameOver ? (

            /* ── ÉCRAN GAME OVER ─────────────────────────────────────────── */
            <div className="rl-gameover">
              <div className="rl-gameover-emoji">💸</div>
              <p className="rl-gameover-title">Plus de solde !</p>
              <p className="rl-gameover-sub">Retentez votre chance avec 1 000€.</p>
              <button className="rl-spin-btn" onClick={restart}>
                Recommencer
              </button>
            </div>

          ) : (

            /* ── JEU NORMAL ──────────────────────────────────────────────── */
            <>
              {/* Sélecteur de jetons */}
              <div className="rl-chip-row">
                <span className="rl-chip-label">Jetons :</span>
                {CHIPS.map(ch => (
                  <button
                    key={ch.value}
                    className={`rl-chip-btn${selectedChip === ch.value ? ' rl-chip-active' : ''}`}
                    onClick={() => setSelectedChip(ch.value)}
                    style={{
                      background: ch.color,
                      color: ch.textColor,
                      borderColor: selectedChip === ch.value ? '#fff' : ch.border,
                      opacity: ch.value > balance ? 0.35 : 1,
                    }}
                  >
                    {ch.value}
                  </button>
                ))}
              </div>

              {/* Table de mise */}
              <div className="rl-betting-table">

                <div className="rl-zero-row">
                  <div className="rl-num-cell rl-num-zero" onClick={() => numBet(0)}>0</div>
                </div>

                <div className="rl-grid-row">
                  {GRID_COLS.map((col, ci) => (
                    <div key={ci} className="rl-grid-col">
                      {col.map(n => {
                        const hasBet = bets.some(b => b.type === 'straight' && b.numbers[0] === n)
                        return (
                          <div
                            key={n}
                            className={`rl-num-cell${hasBet ? ' rl-num-bet' : ''}`}
                            onClick={() => numBet(n)}
                            style={{ background: SEG_COLORS[getColor(n)] }}
                          >
                            {n}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className="rl-dozens-row">
                  {[['1ère douzaine',[1,12]],['2ème douzaine',[13,24]],['3ème douzaine',[25,36]]].map(([label, nums]) => {
                    const active = bets.some(b => b.type === 'dozen' && b.numbers[0] === nums[0])
                    return (
                      <button key={label}
                        className={`rl-outside-btn${active ? ' rl-outside-active' : ''}`}
                        onClick={() => addBet({ type: 'dozen', label, numbers: nums })}>
                        {label} <span className="rl-payout-hint">2:1</span>
                      </button>
                    )
                  })}
                </div>

                <div className="rl-even-row">
                  {[
                    { type:'low',   label:'Manque',  sub:'1-18'  },
                    { type:'even',  label:'Pair',    sub:null     },
                    { type:'red',   label:'Rouge',   sub:null, cls:'rl-red-btn'   },
                    { type:'black', label:'Noir',    sub:null, cls:'rl-black-btn' },
                    { type:'odd',   label:'Impair',  sub:null     },
                    { type:'high',  label:'Passe',   sub:'19-36'  },
                  ].map(({ type, label, sub, cls }) => {
                    const active = bets.some(b => b.type === type)
                    return (
                      <button key={type}
                        className={`rl-outside-btn${cls ? ' ' + cls : ''}${active ? ' rl-outside-active' : ''}`}
                        onClick={() => addBet({ type, label: sub ? `${label} ${sub}` : label, numbers: [] })}>
                        <span>{label}</span>
                        {sub && <span className="rl-sub">{sub}</span>}
                        <span className="rl-payout-hint">1:1</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {bets.length > 0 && (
                <p className="rl-bets-summary">
                  {bets.map(b => `${b.label} (${b.amount}€)`).join(' · ')}
                </p>
              )}

              <div className="rl-actions-row">
                <button className="rl-spin-btn" onClick={handleSpin} disabled={spinning || bets.length === 0}>
                  {spinning ? 'La bille tourne…' : '🎰 Lancer'}
                </button>
                {bets.length > 0 && !spinning && (
                  <button className="rl-clear-btn" onClick={clearBets}>Effacer</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
