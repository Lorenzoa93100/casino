import { useState } from 'react'
import PokerApp from './games/poker/PokerApp.jsx'

const GAMES = [
  {
    id: 'poker',
    name: 'Poker',
    emoji: '♠',
    description: 'Apprends les mains, positions, glossaire et teste-toi au quiz.',
    status: 'available',
    color: '#c9a227',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    emoji: '🃏',
    description: 'Bientôt disponible — stratégie de base, comptage de cartes.',
    status: 'coming-soon',
    color: '#64748b',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    emoji: '🎰',
    description: 'Bientôt disponible — comprendre les mises et probabilités.',
    status: 'coming-soon',
    color: '#64748b',
  },
]

export default function App() {
  const [currentGame, setCurrentGame] = useState(null)

  if (currentGame === 'poker') {
    return (
      <div>
        <button
          onClick={() => setCurrentGame(null)}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 1000,
            background: '#1e1e3a',
            border: '1px solid #c9a22740',
            color: '#c9a227',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 1,
          }}
        >
          ← Accueil
        </button>
        <PokerApp />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a1a',
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a1a; }
        ::-webkit-scrollbar-thumb { background: #c9a227; border-radius: 4px; }
        .game-card { transition: all 0.2s; }
        .game-card:hover { transform: translateY(-3px); }
        .game-card-available:hover { border-color: #c9a22755 !important; box-shadow: 0 8px 32px #c9a22720 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: '40px 20px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 32,
          color: '#c9a227',
          marginBottom: 8,
        }}>
          Casino Games
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Apprends les jeux de casino — règles, stratégies et quiz interactifs.
          100% éducatif, aucun argent réel.
        </p>
      </div>

      {/* Divider */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        height: 1,
        background: 'linear-gradient(90deg, transparent, #c9a22730, transparent)',
        margin: '8px 0 24px',
      }} />

      {/* Games grid */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: '0 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
          Choisir un jeu
        </p>

        {GAMES.map((game) => {
          const isAvailable = game.status === 'available'
          return (
            <div
              key={game.id}
              className={`game-card ${isAvailable ? 'game-card-available' : ''}`}
              onClick={() => isAvailable && setCurrentGame(game.id)}
              style={{
                background: '#0f0f23',
                border: `1px solid ${isAvailable ? '#1e1e3a' : '#1a1a2e'}`,
                borderRadius: 14,
                padding: '18px 20px',
                cursor: isAvailable ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: isAvailable ? 1 : 0.5,
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: isAvailable ? '#c9a22718' : '#1e1e3a',
                border: `1px solid ${isAvailable ? '#c9a22735' : '#2a2a4a'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                flexShrink: 0,
              }}>
                {game.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: isAvailable ? '#e2e8f0' : '#64748b',
                  }}>
                    {game.name}
                  </span>
                  {isAvailable ? (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#22c55e',
                      background: '#14532d',
                      padding: '2px 7px',
                      borderRadius: 20,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      Disponible
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#64748b',
                      background: '#1e1e3a',
                      padding: '2px 7px',
                      borderRadius: 20,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      Bientôt
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                  {game.description}
                </p>
              </div>

              {isAvailable && (
                <div style={{ color: '#c9a227', fontSize: 18, flexShrink: 0 }}>→</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid #1e1e3a',
        width: '100%',
      }}>
        <p style={{ fontSize: 11, color: '#334155' }}>
          Site éducatif — aucun argent réel impliqué
        </p>
      </div>
    </div>
  )
}
