import { useState } from 'react'
import {
  createGame, deal, hit, stand, doubleDown, splitHand, newRound,
  handValue, isBlackjack, isBust, canSplit, getHint,
} from './engine.js'

const RED_SUITS = ['♥', '♦']

function CardFace({ rank, suit }) {
  const isRed = RED_SUITS.includes(suit)
  return (
    <div style={{
      width: 54, height: 76,
      background: '#f8f8f0',
      border: '1px solid #ccc',
      borderRadius: 7,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: isRed ? '#dc2626' : '#1a1a2e',
      fontWeight: 700, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      gap: 2,
    }}>
      <div style={{ fontSize: 15 }}>{rank}</div>
      <div style={{ fontSize: 14 }}>{suit}</div>
    </div>
  )
}

function CardBack() {
  return (
    <div style={{
      width: 54, height: 76,
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%)',
      border: '2px solid #2d5be3',
      borderRadius: 7,
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    }} />
  )
}

function HandDisplay({ cards, hiddenFirst = false, label, isActive = false, result = null }) {
  const visibleCards = hiddenFirst ? cards.slice(1) : cards
  const value = hiddenFirst ? handValue(visibleCards) : handValue(cards)
  const bj = !hiddenFirst && isBlackjack(cards)
  const bust = !hiddenFirst && isBust(cards)

  let valueColor = '#e2e8f0'
  if (bust) valueColor = '#ef4444'
  else if (bj) valueColor = '#c9a227'
  else if (!hiddenFirst && value >= 18) valueColor = '#22c55e'

  const RESULT_STYLE = {
    player:    { bg: '#22c55e22', border: '#22c55e44', color: '#22c55e', label: 'Gagné' },
    blackjack: { bg: '#c9a22722', border: '#c9a22744', color: '#c9a227', label: 'Blackjack !' },
    dealer:    { bg: '#ef444422', border: '#ef444444', color: '#ef4444', label: 'Perdu' },
    push:      { bg: '#8899bb22', border: '#8899bb44', color: '#8899bb', label: 'Égalité' },
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '14px 16px',
      background: isActive ? '#232f47' : 'transparent',
      borderRadius: 12,
      border: `1px solid ${isActive ? '#c9a22740' : 'transparent'}`,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </span>
        {!hiddenFirst && (
          <span style={{ fontSize: 15, fontWeight: 700, color: valueColor }}>
            {bust ? 'Bust !' : bj ? '21 ♠' : value}
          </span>
        )}
        {hiddenFirst && (
          <span style={{ fontSize: 13, color: '#8899bb' }}>
            {value}+?
          </span>
        )}
        {result && (() => {
          const s = RESULT_STYLE[result.outcome]
          return (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            }}>
              {s.label}
            </span>
          )
        })()}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
        {cards.map((card, i) =>
          i === 0 && hiddenFirst
            ? <CardBack key={i} />
            : <CardFace key={i} rank={card.rank} suit={card.suit} />
        )}
      </div>
    </div>
  )
}

const CHIP_VALUES = [10, 25, 50, 100, 200]

function BettingScreen({ game, onDeal, onBet }) {
  const total = game.stats.wins + game.stats.losses + game.stats.pushes
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Vos jetons</p>
        <p style={{ fontSize: 32, fontWeight: 700, color: '#c9a227' }}>{game.chips}</p>
      </div>

      <div style={{
        background: '#1c2333', borderRadius: 16, padding: '20px 32px',
        border: '1px solid #2d3a5a', textAlign: 'center', minWidth: 200,
      }}>
        <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Mise</p>
        <p style={{ fontSize: 42, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{game.bet}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {CHIP_VALUES.map(amt => (
          <button
            key={amt}
            onClick={() => onBet(Math.min(game.bet + amt, game.chips))}
            disabled={game.bet >= game.chips}
            style={{
              padding: '8px 16px', borderRadius: 20,
              background: '#1c2333', color: '#e2e8f0',
              border: '1px solid #2d3a5a', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              opacity: game.bet >= game.chips ? 0.4 : 1,
            }}
          >
            +{amt}
          </button>
        ))}
        <button
          onClick={() => onBet(game.chips)}
          disabled={game.chips === 0}
          style={{
            padding: '8px 16px', borderRadius: 20,
            background: '#c9a22715', color: '#c9a227',
            border: '1px solid #c9a22750', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          All-in
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => onBet(0)}
          disabled={game.bet === 0}
          style={{
            padding: '10px 22px', borderRadius: 8,
            background: '#1c2333', color: '#8899bb',
            border: '1px solid #2d3a5a', cursor: game.bet === 0 ? 'default' : 'pointer',
            fontSize: 14, opacity: game.bet === 0 ? 0.5 : 1,
          }}
        >
          Effacer
        </button>
        <button
          onClick={onDeal}
          disabled={game.bet === 0}
          style={{
            padding: '10px 30px', borderRadius: 8, border: 'none',
            background: game.bet > 0 ? '#c9a227' : '#2d3a5a',
            color: game.bet > 0 ? '#111827' : '#8899bb',
            cursor: game.bet > 0 ? 'pointer' : 'default',
            fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
          }}
        >
          Distribuer →
        </button>
      </div>

      {total > 0 && (
        <div style={{
          display: 'flex', gap: 20, fontSize: 13,
          background: '#1c2333', borderRadius: 10, padding: '10px 20px',
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

const ACTION_COLORS = { hit: '#3b82f6', stand: '#22c55e', double: '#c9a227', split: '#a855f7' }
const ACTION_LABELS = { hit: 'Tirez', stand: 'Restez', double: 'Doublez', split: 'Séparez' }

function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 22px', borderRadius: 8,
      background: color + '20', color,
      border: `1px solid ${color}60`,
      cursor: 'pointer', fontSize: 14, fontWeight: 700,
      transition: 'background 0.15s',
    }}>
      {label}
    </button>
  )
}

function GameScreen({ game, onAction }) {
  const [showHint, setShowHint] = useState(false)

  const activeHand = game.playerHands[game.activeHandIndex]
  const dealerUpcard = game.dealerCards[1]
  const hint = showHint && game.phase === 'playing' && activeHand && dealerUpcard
    ? getHint(activeHand, dealerUpcard)
    : null

  const canDbl = game.phase === 'playing' && activeHand?.length === 2 && game.chips >= game.bet
  const canSpl = game.phase === 'playing' && activeHand && canSplit(activeHand) && game.chips >= game.bet

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {/* Dealer */}
      <div style={{
        background: '#1c2333', borderRadius: 14, padding: 12,
        border: '1px solid #2d3a5a', width: '100%', maxWidth: 420,
      }}>
        <HandDisplay
          cards={game.dealerCards}
          hiddenFirst={game.dealerHidden}
          label="Croupier"
        />
      </div>

      {/* Player hands */}
      <div style={{
        background: '#1c2333', borderRadius: 14, padding: 12,
        border: '1px solid #2d3a5a', width: '100%', maxWidth: 420,
      }}>
        {game.playerHands.map((hand, i) => (
          <HandDisplay
            key={i}
            cards={hand}
            label={game.playerHands.length > 1 ? `Main ${i + 1}` : 'Vous'}
            isActive={game.phase === 'playing' && i === game.activeHandIndex}
            result={game.phase === 'result' ? game.results[i] : null}
          />
        ))}
      </div>

      {/* Chips / bet info */}
      <p style={{ fontSize: 13, color: '#8899bb' }}>
        Mise : <strong style={{ color: '#c9a227' }}>{game.bet}</strong>
        {'  ·  '}
        Jetons : <strong style={{ color: '#e2e8f0' }}>{game.chips}</strong>
      </p>

      {/* Play actions */}
      {game.phase === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ActionBtn label="Tirer" color="#3b82f6" onClick={() => { onAction('hit'); setShowHint(false) }} />
            <ActionBtn label="Rester" color="#22c55e" onClick={() => { onAction('stand'); setShowHint(false) }} />
            {canDbl && <ActionBtn label="Doubler" color="#c9a227" onClick={() => { onAction('double'); setShowHint(false) }} />}
            {canSpl && <ActionBtn label="Séparer" color="#a855f7" onClick={() => { onAction('split'); setShowHint(false) }} />}
          </div>

          <button
            onClick={() => setShowHint(h => !h)}
            style={{
              background: 'none',
              border: `1px solid ${showHint ? '#c9a227' : '#2d3a5a'}`,
              borderRadius: 20, padding: '5px 16px',
              color: showHint ? '#c9a227' : '#8899bb',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            💡 {showHint ? 'Masquer le conseil' : 'Conseil débutant'}
          </button>

          {hint && (
            <div style={{
              background: '#1c2333',
              border: `1px solid ${ACTION_COLORS[hint.action]}40`,
              borderRadius: 12, padding: '12px 18px',
              maxWidth: 340, textAlign: 'center',
            }}>
              <span style={{
                display: 'inline-block', marginBottom: 8,
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                background: ACTION_COLORS[hint.action] + '25',
                color: ACTION_COLORS[hint.action],
              }}>
                {ACTION_LABELS[hint.action]}
              </span>
              <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{hint.text}</p>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {game.phase === 'result' && (
        <div style={{
          background: '#1c2333', borderRadius: 14, padding: '18px 24px',
          border: '1px solid #2d3a5a', textAlign: 'center',
          width: '100%', maxWidth: 420,
        }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
            {game.message}
          </p>
          <button
            onClick={() => onAction('newRound')}
            style={{
              padding: '10px 30px', borderRadius: 8, border: 'none',
              background: '#c9a227', color: '#111827',
              cursor: 'pointer', fontSize: 15, fontWeight: 700,
            }}
          >
            Nouvelle donne
          </button>
        </div>
      )}
    </div>
  )
}

export default function BlackjackGame() {
  const [game, setGame] = useState(() => createGame())

  function dispatch(action) {
    setGame(g => {
      if (action === 'deal') return deal(g)
      if (action === 'hit') return hit(g)
      if (action === 'stand') return stand(g)
      if (action === 'double') return doubleDown(g)
      if (action === 'split') return splitHand(g)
      if (action === 'newRound') return newRound(g)
      return g
    })
  }

  if (game.chips === 0 && game.phase === 'betting') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
        <p style={{ color: '#e2e8f0', fontSize: 17, marginBottom: 8 }}>Plus de jetons !</p>
        <p style={{ color: '#8899bb', fontSize: 13, marginBottom: 24 }}>Retentez votre chance avec 1 000 jetons.</p>
        <button
          onClick={() => setGame(createGame())}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: '#c9a227', color: '#111827',
            cursor: 'pointer', fontSize: 15, fontWeight: 700,
          }}
        >
          Recommencer
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {game.phase === 'betting'
        ? <BettingScreen game={game} onDeal={() => dispatch('deal')} onBet={amt => setGame(g => ({ ...g, bet: amt }))} />
        : <GameScreen game={game} onAction={dispatch} />
      }
    </div>
  )
}
