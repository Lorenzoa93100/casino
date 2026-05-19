import { useState } from 'react'
import {
  createGame, deal, hit, stand, doubleDown, splitHand, newRound,
  handValue, isBlackjack, isBust, canSplit, getHint,
} from './engine.js'

const RED_SUITS = ['♥', '♦']

const ANIM_CSS = `
  @keyframes bjDeal {
    0%   { transform: translate(60px, -80px) rotate(15deg); opacity: 0; }
    100% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  }
  @keyframes bjFlip {
    0%   { transform: scaleX(0); opacity: 0; }
    50%  { transform: scaleX(0.2); opacity: 0.6; }
    100% { transform: scaleX(1); opacity: 1; }
  }
  @keyframes bjPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(201,162,39,0); }
    50%       { box-shadow: 0 0 0 8px rgba(201,162,39,0.25); }
  }
  @keyframes bjSlideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  .bj-deal { animation: bjDeal 0.38s cubic-bezier(0.2,0.8,0.3,1) both; }
  .bj-flip { animation: bjFlip 0.45s ease-out both; }
  .bj-pulse { animation: bjPulse 1.8s ease-in-out infinite; }
  .bj-slide { animation: bjSlideUp 0.3s ease-out both; }
`

// ─── Card components ─────────────────────────────────────────────────────────

function CardFace({ rank, suit, delay = 0, flipped = false }) {
  const isRed = RED_SUITS.includes(suit)
  const color = isRed ? '#dc2626' : '#1a1a2e'
  return (
    <div
      className={flipped ? 'bj-flip' : 'bj-deal'}
      style={{
        animationDelay: `${delay}s`,
        width: 54, height: 76,
        background: 'linear-gradient(160deg, #fdfdf5 0%, #f2f0e0 100%)',
        border: '1px solid #ccc9b0',
        borderRadius: 7,
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}
    >
      {/* TL */}
      <div style={{
        position: 'absolute', top: 3, left: 4,
        fontSize: 9, lineHeight: 1.15, fontWeight: 800, textAlign: 'center',
      }}>
        <div>{rank}</div>
        <div style={{ fontSize: 8 }}>{suit}</div>
      </div>
      {/* Center suit */}
      <div style={{ fontSize: 20, userSelect: 'none' }}>{suit}</div>
      {/* BR (rotated) */}
      <div style={{
        position: 'absolute', bottom: 3, right: 4,
        fontSize: 9, lineHeight: 1.15, fontWeight: 800,
        textAlign: 'center', transform: 'rotate(180deg)', color,
      }}>
        <div>{rank}</div>
        <div style={{ fontSize: 8 }}>{suit}</div>
      </div>
    </div>
  )
}

function CardBack({ delay = 0 }) {
  return (
    <div
      className="bj-deal"
      style={{
        animationDelay: `${delay}s`,
        width: 54, height: 76,
        background: 'linear-gradient(145deg, #1a3580 0%, #1e40af 40%, #1a3580 100%)',
        border: '2px solid #2d55e8',
        borderRadius: 7,
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: 40, height: 60, borderRadius: 4,
        border: '1px solid #3b68f5',
        background: `repeating-linear-gradient(
          45deg,
          #1a3580, #1a3580 3px,
          #1e40af 3px, #1e40af 6px
        )`,
      }} />
    </div>
  )
}

// ─── Score display ────────────────────────────────────────────────────────────

function ScoreBadge({ cards, hidden = false }) {
  if (!cards || cards.length === 0) return null
  const visible = hidden ? cards.slice(1) : cards
  const val = handValue(visible)
  const bj = !hidden && isBlackjack(cards)
  const bust = !hidden && isBust(cards)

  let color = '#e2e8f0'
  if (bust) color = '#ef4444'
  else if (bj) color = '#c9a227'
  else if (!hidden && val >= 18) color = '#4ade80'
  else if (!hidden && val >= 14) color = '#fbbf24'

  return (
    <div style={{
      fontSize: 13, fontWeight: 800, color,
      background: 'rgba(0,0,0,0.55)',
      padding: '2px 10px', borderRadius: 20,
      backdropFilter: 'blur(4px)',
      letterSpacing: 0.5,
    }}>
      {bust ? 'Bust !' : bj ? 'BJ !' : hidden ? `${val}+?` : val}
    </div>
  )
}

// ─── Result explanation ───────────────────────────────────────────────────────

function explainResult(playerHands, dealerCards, results) {
  const dVal = handValue(dealerCards)
  const dBust = isBust(dealerCards)
  const dBj = isBlackjack(dealerCards)

  return results.map((r, i) => {
    const hand = playerHands[i]
    const pVal = handValue(hand)
    const pBust = isBust(hand)
    const pBj = isBlackjack(hand)

    switch (r.outcome) {
      case 'blackjack':
        return {
          icon: '🎉', color: '#c9a227',
          title: 'Blackjack !',
          text: `As + carte de valeur 10 en 2 cartes = Blackjack naturel. Payé 3:2, soit +${r.payout - r.payout / 2.5 | 0} jetons de gain.`,
        }
      case 'push':
        if (pBj && dBj)
          return { icon: '🤝', color: '#8899bb', title: 'Égalité', text: 'Les deux joueurs ont un Blackjack — mise remboursée.' }
        return { icon: '🤝', color: '#8899bb', title: 'Égalité', text: `Vous et le croupier avez tous les deux ${pVal}. Personne ne gagne — mise remboursée.` }
      case 'player':
        if (dBust)
          return { icon: '✅', color: '#22c55e', title: 'Gagné !', text: `Le croupier dépasse 21 (total : ${dVal}). Quand le croupier bust, tous les joueurs encore en jeu gagnent automatiquement.` }
        return { icon: '✅', color: '#22c55e', title: 'Gagné !', text: `Votre ${pVal} bat le ${dVal} du croupier. Le plus proche de 21 sans dépasser remporte la mise.` }
      case 'dealer':
        if (pBust)
          return { icon: '❌', color: '#ef4444', title: 'Perdu', text: `Vous dépassez 21 (total : ${pVal}). Un bust est une défaite automatique, peu importe la main du croupier.` }
        if (dBj)
          return { icon: '❌', color: '#ef4444', title: 'Perdu', text: `Le croupier a un Blackjack naturel (As + 10 en 2 cartes). Votre ${pVal} ne peut pas le battre — seul un Blackjack joueur aurait permis l'égalité.` }
        return { icon: '❌', color: '#ef4444', title: 'Perdu', text: `Le croupier a ${dVal}, vous avez ${pVal}. Le plus proche de 21 gagne — le croupier l'emporte cette fois.` }
      default:
        return null
    }
  })
}

// ─── Table felt ───────────────────────────────────────────────────────────────

function Table({ dealerCards, dealerHidden, playerHands, activeHandIndex, phase, results }) {
  const explanations = phase === 'result'
    ? explainResult(playerHands, dealerCards, results)
    : []

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      {/* Table felt */}
      <div style={{
        width: '100%',
        background: 'radial-gradient(ellipse at 50% 0%, #2d8a4e 0%, #1a5c32 40%, #0d3018 100%)',
        borderRadius: '44% 44% 0 0',
        border: '7px solid #8B6914',
        borderBottom: 'none',
        position: 'relative',
        padding: '28px 8% 20px',
        boxShadow: 'inset 0 -4px 30px rgba(0,0,0,0.4), 0 -2px 0 #c9a22730',
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Subtle felt texture ring */}
        <div style={{
          position: 'absolute', inset: 6,
          borderRadius: '44% 44% 0 0',
          border: '1px solid rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }} />

        {/* ── Dealer area ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600,
          }}>
            Croupier
          </div>
          <ScoreBadge cards={dealerCards} hidden={dealerHidden} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
            {dealerCards.map((card, i) =>
              i === 0 && dealerHidden
                ? <CardBack key="back" delay={i * 0.12} />
                : <CardFace
                    key={`${card.rank}${card.suit}`}
                    rank={card.rank} suit={card.suit}
                    delay={i * 0.12}
                    flipped={i === 0 && !dealerHidden}
                  />
            )}
          </div>
        </div>

        {/* ── Middle decoration ── */}
        <div style={{
          width: '75%', position: 'relative',
          display: 'flex', alignItems: 'center', margin: '4px 0 12px',
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,162,39,0.35)' }} />
          <span style={{
            fontSize: 9, color: 'rgba(201,162,39,0.6)',
            letterSpacing: 2.5, fontWeight: 700, padding: '0 12px',
            textTransform: 'uppercase',
          }}>
            ♠ Blackjack paye 3:2 ♠
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,162,39,0.35)' }} />
        </div>

        {/* ── Player hands ── */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {playerHands.map((hand, hi) => {
            const isActive = phase === 'playing' && hi === activeHandIndex
            return (
              <div
                key={hi}
                className={isActive ? 'bj-pulse' : ''}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  background: isActive ? 'rgba(201,162,39,0.12)' : 'transparent',
                  borderRadius: 12,
                  border: `1px solid ${isActive ? 'rgba(201,162,39,0.4)' : 'transparent'}`,
                  transition: 'all 0.25s',
                }}
              >
                {playerHands.length > 1 && (
                  <div style={{
                    fontSize: 9, color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase', letterSpacing: 2,
                  }}>
                    Main {hi + 1}
                  </div>
                )}
                {hi === 0 && playerHands.length === 1 && (
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.45)',
                    textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600,
                  }}>
                    Vous
                  </div>
                )}
                <ScoreBadge cards={hand} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {hand.map((card, ci) => (
                    <CardFace key={ci} rank={card.rank} suit={card.suit} delay={ci * 0.1} />
                  ))}
                </div>
                {/* Result badge per hand */}
                {phase === 'result' && results[hi] && (() => {
                  const s = { player: '#22c55e', blackjack: '#c9a227', dealer: '#ef4444', push: '#8899bb' }
                  const l = { player: 'Gagné', blackjack: 'Blackjack !', dealer: 'Perdu', push: 'Égalité' }
                  const c = s[results[hi].outcome]
                  return (
                    <span className="bj-slide" style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: c + '25', color: c, border: `1px solid ${c}50`,
                    }}>
                      {l[results[hi].outcome]}
                    </span>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>

      {/* Table base (wooden edge bottom) */}
      <div style={{
        height: 18,
        background: 'linear-gradient(180deg, #6b4b10 0%, #4a3008 100%)',
        borderLeft: '7px solid #8B6914',
        borderRight: '7px solid #8B6914',
        borderBottom: '7px solid #8B6914',
        borderRadius: '0 0 6px 6px',
      }} />

      {/* ── Result explanations ── */}
      {phase === 'result' && explanations.length > 0 && (
        <div className="bj-slide" style={{
          marginTop: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {explanations.filter(Boolean).map((exp, i) => (
            <div key={i} style={{
              background: '#1c2333',
              border: `1px solid ${exp.color}40`,
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{exp.icon}</span>
              <div>
                <p style={{
                  fontWeight: 700, fontSize: 14,
                  color: exp.color, marginBottom: 4,
                }}>
                  {exp.title}
                </p>
                <p style={{ fontSize: 13, color: '#c8d6f0', lineHeight: 1.6 }}>
                  {exp.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Betting panel ────────────────────────────────────────────────────────────

const CHIP_CONFIG = [
  { value: 10,  color: '#3b82f6', label: '10' },
  { value: 25,  color: '#22c55e', label: '25' },
  { value: 50,  color: '#a855f7', label: '50' },
  { value: 100, color: '#ef4444', label: '100' },
  { value: 200, color: '#c9a227', label: '200' },
]

function Chip({ value, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 56, height: 56, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88)`,
        border: `3px solid ${color}`,
        boxShadow: `0 4px 12px ${color}60, inset 0 1px 0 rgba(255,255,255,0.3)`,
        color: '#fff',
        fontWeight: 800, fontSize: 12,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'transform 0.1s, opacity 0.2s',
        fontFamily: 'inherit',
        outline: 'none',
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {label}
    </button>
  )
}

function BettingPanel({ game, onBet, onDeal }) {
  const total = game.stats.wins + game.stats.losses + game.stats.pushes
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      padding: '8px 0',
    }}>
      {/* Chips display */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: '#1c2333', borderRadius: 14, padding: '14px 24px',
        border: '1px solid #2d3a5a',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Jetons</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#c9a227' }}>{game.chips}</p>
        </div>
        <div style={{ width: 1, height: 40, background: '#2d3a5a' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Mise</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: game.bet > 0 ? '#e2e8f0' : '#2d3a5a' }}>{game.bet}</p>
        </div>
      </div>

      {/* Chips row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {CHIP_CONFIG.map(({ value, color, label }) => (
          <button
            key={value}
            onClick={() => onBet(Math.min(game.bet + value, game.chips))}
            disabled={game.bet >= game.chips || game.chips < value}
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${color}ee, ${color}99)`,
              border: `3px solid ${color}`,
              boxShadow: `0 4px 12px ${color}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
              color: '#fff', fontWeight: 800, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              opacity: (game.bet >= game.chips || game.chips < value) ? 0.3 : 1,
              transition: 'transform 0.1s, opacity 0.2s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => onBet(game.chips)}
          disabled={game.chips === 0}
          style={{
            width: 54, height: 54, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #c9a227dd, #7a5c1488)',
            border: '3px solid #c9a227',
            boxShadow: '0 4px 12px #c9a22750, inset 0 1px 0 rgba(255,255,255,0.25)',
            color: '#fff', fontWeight: 800, fontSize: 9,
            cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          ALL IN
        </button>
      </div>

      {/* Buttons row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => onBet(0)}
          disabled={game.bet === 0}
          style={{
            padding: '10px 22px', borderRadius: 8,
            background: '#1c2333', color: '#8899bb',
            border: '1px solid #2d3a5a', cursor: game.bet === 0 ? 'default' : 'pointer',
            fontSize: 14, opacity: game.bet === 0 ? 0.5 : 1,
            fontFamily: 'inherit',
          }}
        >
          Effacer
        </button>
        <button
          onClick={onDeal}
          disabled={game.bet === 0}
          style={{
            padding: '10px 32px', borderRadius: 8, border: 'none',
            background: game.bet > 0 ? '#c9a227' : '#2d3a5a',
            color: game.bet > 0 ? '#111827' : '#8899bb',
            cursor: game.bet > 0 ? 'pointer' : 'default',
            fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          Distribuer →
        </button>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div style={{
          display: 'flex', gap: 20, fontSize: 13,
          background: '#1c2333', borderRadius: 10, padding: '8px 20px',
          border: '1px solid #2d3a5a',
        }}>
          <span style={{ color: '#22c55e' }}>✓ {game.stats.wins}</span>
          <span style={{ color: '#ef4444' }}>✗ {game.stats.losses}</span>
          <span style={{ color: '#8899bb' }}>= {game.stats.pushes}</span>
          {game.stats.blackjacks > 0 && (
            <span style={{ color: '#c9a227' }}>BJ {game.stats.blackjacks}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Action bar ───────────────────────────────────────────────────────────────

function ActionBar({ game, onAction }) {
  const [showHint, setShowHint] = useState(false)
  const activeHand = game.playerHands[game.activeHandIndex]
  const dealerUpcard = game.dealerCards[1]
  const hint = showHint && activeHand && dealerUpcard
    ? getHint(activeHand, dealerUpcard)
    : null

  const canDbl = activeHand?.length === 2 && game.chips >= game.bet
  const canSpl = activeHand && canSplit(activeHand) && game.chips >= game.bet

  const BTNS = [
    { key: 'hit',    label: 'Tirer',   color: '#3b82f6', always: true },
    { key: 'stand',  label: 'Rester',  color: '#22c55e', always: true },
    { key: 'double', label: 'Doubler', color: '#c9a227', always: false, show: canDbl },
    { key: 'split',  label: 'Séparer', color: '#a855f7', always: false, show: canSpl },
  ]

  const HINT_COLORS = { hit: '#3b82f6', stand: '#22c55e', double: '#c9a227', split: '#a855f7' }
  const HINT_LABELS = { hit: 'Tirez', stand: 'Restez', double: 'Doublez', split: 'Séparez' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {BTNS.filter(b => b.always || b.show).map(b => (
          <button
            key={b.key}
            onClick={() => { onAction(b.key); setShowHint(false) }}
            style={{
              padding: '11px 24px', borderRadius: 8,
              background: b.color + '22', color: b.color,
              border: `1px solid ${b.color}60`,
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = b.color + '35'}
            onMouseLeave={e => e.currentTarget.style.background = b.color + '22'}
          >
            {b.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowHint(h => !h)}
        style={{
          background: 'none',
          border: `1px solid ${showHint ? '#c9a227' : '#2d3a5a'}`,
          borderRadius: 20, padding: '5px 16px',
          color: showHint ? '#c9a227' : '#8899bb',
          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
        }}
      >
        💡 {showHint ? 'Masquer le conseil' : 'Conseil débutant'}
      </button>

      {hint && (
        <div className="bj-slide" style={{
          background: '#1c2333',
          border: `1px solid ${HINT_COLORS[hint.action]}40`,
          borderRadius: 12, padding: '12px 18px',
          maxWidth: 340, textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block', marginBottom: 8,
            fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
            background: HINT_COLORS[hint.action] + '25',
            color: HINT_COLORS[hint.action],
          }}>
            {HINT_LABELS[hint.action]}
          </span>
          <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{hint.text}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BlackjackGame() {
  const [game, setGame] = useState(() => createGame())

  function dispatch(action) {
    setGame(g => {
      if (action === 'deal')     return deal(g)
      if (action === 'hit')      return hit(g)
      if (action === 'stand')    return stand(g)
      if (action === 'double')   return doubleDown(g)
      if (action === 'split')    return splitHand(g)
      if (action === 'newRound') return newRound(g)
      return g
    })
  }

  if (game.chips === 0 && game.phase === 'betting') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>💸</div>
        <p style={{ color: '#e2e8f0', fontSize: 17, marginBottom: 8 }}>Plus de jetons !</p>
        <p style={{ color: '#8899bb', fontSize: 13, marginBottom: 24 }}>
          Retentez votre chance avec 1 000 jetons.
        </p>
        <button
          onClick={() => setGame(createGame())}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: '#c9a227', color: '#111827',
            cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          Recommencer
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{ANIM_CSS}</style>

      {/* Table always visible once cards dealt */}
      {game.phase !== 'betting' && (
        <Table
          dealerCards={game.dealerCards}
          dealerHidden={game.dealerHidden}
          playerHands={game.playerHands}
          activeHandIndex={game.activeHandIndex}
          phase={game.phase}
          results={game.results}
        />
      )}

      {/* Betting phase */}
      {game.phase === 'betting' && (
        <BettingPanel
          game={game}
          onBet={amt => setGame(g => ({ ...g, bet: amt }))}
          onDeal={() => dispatch('deal')}
        />
      )}

      {/* Playing phase actions */}
      {game.phase === 'playing' && (
        <ActionBar game={game} onAction={dispatch} />
      )}

      {/* Result: info + new round */}
      {game.phase === 'result' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          marginTop: 4,
        }}>
          {/* Chips / net change display */}
          <div style={{
            background: '#1c2333', borderRadius: 12, padding: '12px 28px',
            border: '1px solid #2d3a5a', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 4 }}>Jetons restants</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#c9a227' }}>{game.chips}</p>
          </div>

          <button
            onClick={() => dispatch('newRound')}
            style={{
              padding: '11px 34px', borderRadius: 8, border: 'none',
              background: '#c9a227', color: '#111827',
              cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
            }}
          >
            Nouvelle donne →
          </button>
        </div>
      )}
    </div>
  )
}
