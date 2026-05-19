import { useState } from 'react'
import RouletteWheel from './RouletteWheel.jsx'
import { spinWheel, evaluateBets, explainResult, getColor } from './engine.js'

const GAME_CSS = `
@keyframes rlSlideUp {
  from { opacity:0; transform: translateY(16px); }
  to   { opacity:1; transform: translateY(0); }
}
@keyframes rlWin {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
.rl-result-box { animation: rlSlideUp 0.4s ease; }
.rl-chip-btn {
  width:48px; height:48px; border-radius:50%; border:3px solid transparent;
  font-weight:700; font-size:13px; cursor:pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 0 4px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
}
.rl-chip-btn:hover  { transform: translateY(-2px); box-shadow: 0 6px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3); }
.rl-chip-btn:active { transform: translateY(1px);  box-shadow: 0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3); }
.rl-num-cell {
  width:32px; height:32px; display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:700; cursor:pointer; border-radius:3px;
  transition: opacity 0.15s, transform 0.1s;
  user-select: none;
}
.rl-num-cell:hover { opacity:0.8; transform:scale(1.1); }
.rl-outside-btn {
  padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:600;
  transition: opacity 0.15s, transform 0.1s; user-select:none;
}
.rl-outside-btn:hover { opacity:0.8; transform:scale(1.04); }
.rl-spin-btn {
  padding:14px 40px; border-radius:8px; border:none; cursor:pointer;
  font-size:16px; font-weight:700; letter-spacing:0.5px;
  background: linear-gradient(135deg, #c9a227 0%, #a07c10 100%);
  color:#000; box-shadow: 0 4px 12px rgba(201,162,39,0.4);
  transition: transform 0.1s, box-shadow 0.1s;
}
.rl-spin-btn:hover:not(:disabled)  { transform:translateY(-2px); box-shadow:0 6px 16px rgba(201,162,39,0.5); }
.rl-spin-btn:active:not(:disabled) { transform:translateY(1px); }
.rl-spin-btn:disabled { opacity:0.5; cursor:not-allowed; }
`

const CHIPS = [
  { value: 1,   color: '#e5e7eb', border: '#9ca3af', textColor: '#111' },
  { value: 5,   color: '#ef4444', border: '#b91c1c', textColor: '#fff' },
  { value: 25,  color: '#3b82f6', border: '#1d4ed8', textColor: '#fff' },
  { value: 100, color: '#16a34a', border: '#166534', textColor: '#fff' },
  { value: 500, color: '#7c3aed', border: '#5b21b6', textColor: '#fff' },
]

const SEG_COLORS = { green: '#16a34a', red: '#dc2626', black: '#1a1a1a' }

// Number grid: rows of 3 (1-36) + 0 separately
// Columns: 1,4,7...34 | 2,5,8...35 | 3,6,9...36
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
  const [result, setResult] = useState(null)
  const [resultInfo, setResultInfo] = useState(null)
  const [pendingResult, setPendingResult] = useState(null)

  function totalBet() { return bets.reduce((s, b) => s + b.amount, 0) }

  function addBet(betDef) {
    if (spinning) return
    const key = getBetKey(betDef)
    setBets(prev => {
      const existing = prev.find(b => getBetKey(b) === key)
      if (existing) {
        return prev.map(b => getBetKey(b) === key ? { ...b, amount: b.amount + selectedChip } : b)
      }
      return [...prev, { ...betDef, amount: selectedChip }]
    })
    setBalance(b => b - selectedChip)
  }

  function clearBets() {
    if (spinning) return
    setBalance(b => b + totalBet())
    setBets([])
    setResultInfo(null)
    setResult(null)
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
    setResult(r)
    const { net, breakdown } = evaluateBets(bets, r)
    const lines = explainResult(r, breakdown)
    setBalance(b => b + net + totalBet())
    setResultInfo({ net, lines, color: getColor(r) })
    setBets([])
  }

  function numBet(n) {
    addBet({ type: 'straight', label: `Plein ${n}`, numbers: [n] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <style>{GAME_CSS}</style>

      {/* Balance */}
      <div style={{ display: 'flex', gap: 32, fontSize: 15 }}>
        <div>Solde : <strong style={{ color: '#c9a227' }}>{balance}€</strong></div>
        <div>Mises : <strong style={{ color: '#f59e0b' }}>{totalBet()}€</strong></div>
      </div>

      {/* Wheel */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% 60%, #1a4731 0%, #0f2d1e 100%)',
        borderRadius: '50% 50% 0 0',
        padding: '32px 40px 16px',
        border: '6px solid #8B6914',
        borderBottom: 'none',
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <RouletteWheel spinning={spinning} result={pendingResult} onSpinEnd={handleSpinEnd} />
      </div>

      {/* Result */}
      {resultInfo && (
        <div className="rl-result-box" style={{
          background: '#1c2333', border: '1px solid #2d3a5a',
          borderRadius: 10, padding: '16px 20px', width: '100%', maxWidth: 480,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, marginBottom: 10, textAlign: 'center',
            color: resultInfo.net > 0 ? '#4ade80' : resultInfo.net < 0 ? '#f87171' : '#e2e8f0',
          }}>
            {resultInfo.net > 0 ? `+${resultInfo.net}€ — Gagné !` : resultInfo.net < 0 ? `${resultInfo.net}€ — Perdu` : 'Égalité'}
          </div>
          {resultInfo.lines.map((l, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.6,
              fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#e2e8f0' : '#8899bb',
            }}
              dangerouslySetInnerHTML={{ __html: l.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c9a227">$1</strong>') }}
            />
          ))}
        </div>
      )}

      {/* Chip selector */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#8899bb' }}>Jetons :</span>
        {CHIPS.map(ch => (
          <button
            key={ch.value}
            className="rl-chip-btn"
            onClick={() => setSelectedChip(ch.value)}
            style={{
              background: ch.color,
              borderColor: selectedChip === ch.value ? '#fff' : ch.border,
              color: ch.textColor,
              outline: selectedChip === ch.value ? '2px solid #c9a227' : 'none',
              outlineOffset: 2,
            }}
          >
            {ch.value}
          </button>
        ))}
      </div>

      {/* Betting table */}
      <div style={{
        background: '#0f2d1e', border: '2px solid #8B6914', borderRadius: 10,
        padding: 16, width: '100%', maxWidth: 480,
      }}>
        {/* Zero */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div
            className="rl-num-cell"
            onClick={() => numBet(0)}
            style={{ background: SEG_COLORS.green, color: '#fff', width: 64 }}
          >0</div>
        </div>

        {/* Number grid */}
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 8 }}>
          {GRID_COLS.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {col.map(n => {
                const c = getColor(n)
                const hasBet = bets.some(b => b.type === 'straight' && b.numbers[0] === n)
                return (
                  <div
                    key={n}
                    className="rl-num-cell"
                    onClick={() => numBet(n)}
                    style={{
                      background: SEG_COLORS[c],
                      color: '#fff',
                      outline: hasBet ? '2px solid #c9a227' : 'none',
                      outlineOffset: 1,
                    }}
                  >{n}</div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Dozens */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 4, justifyContent: 'center' }}>
          {[['1ère douzaine',[1,12]],['2ème douzaine',[13,24]],['3ème douzaine',[25,36]]].map(([label, nums]) => (
            <button key={label} className="rl-outside-btn"
              onClick={() => addBet({ type: 'dozen', label, numbers: nums })}
              style={{ flex:1, background:'#1c4d35', color:'#e2e8f0', border:'1px solid #2d6a4f',
                       outline: bets.find(b=>b.type==='dozen'&&b.numbers[0]===nums[0]) ? '2px solid #c9a227' : 'none' }}>
              {label} <span style={{color:'#8899bb'}}>2:1</span>
            </button>
          ))}
        </div>

        {/* Even chances */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[
            { type:'low',  label:'Manque\n1-18'  },
            { type:'even', label:'Pair'           },
            { type:'red',  label:'Rouge', bg:'#7f1d1d' },
            { type:'black',label:'Noir',  bg:'#111827' },
            { type:'odd',  label:'Impair'          },
            { type:'high', label:'Passe\n19-36'   },
          ].map(({ type, label, bg }) => (
            <button key={type} className="rl-outside-btn"
              onClick={() => addBet({ type, label: label.replace('\n',' '), numbers: [] })}
              style={{
                flex:1, background: bg || '#1c4d35', color:'#e2e8f0',
                border:'1px solid #2d6a4f', textAlign:'center', whiteSpace:'pre',
                outline: bets.find(b=>b.type===type) ? '2px solid #c9a227' : 'none',
              }}>
              {label} <span style={{color:'#8899bb',fontSize:10}}>1:1</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active bets summary */}
      {bets.length > 0 && (
        <div style={{ fontSize: 12, color: '#8899bb', textAlign: 'center' }}>
          {bets.map(b => `${b.label} (${b.amount}€)`).join(' · ')}
        </div>
      )}

      {/* Spin / Clear */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="rl-spin-btn" onClick={handleSpin} disabled={spinning || bets.length === 0}>
          {spinning ? 'La bille tourne…' : '🎰 Lancer'}
        </button>
        {bets.length > 0 && !spinning && (
          <button onClick={clearBets} style={{
            padding:'14px 20px', borderRadius:8, border:'1px solid #2d3a5a',
            background:'transparent', color:'#8899bb', cursor:'pointer', fontSize:14,
          }}>
            Effacer
          </button>
        )}
      </div>

      {balance <= 0 && bets.length === 0 && (
        <button onClick={() => { setBalance(1000); setBets([]); setResultInfo(null); setResult(null) }}
          style={{ padding:'10px 24px', borderRadius:8, background:'#c9a227', color:'#000', border:'none', cursor:'pointer', fontWeight:700 }}>
          Recharger (1000€)
        </button>
      )}
    </div>
  )
}
