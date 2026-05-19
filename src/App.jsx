import { useState } from 'react'
import PokerApp from './games/poker/PokerApp.jsx'
import BlackjackApp from './games/blackjack/BlackjackApp.jsx'

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
    description: 'Règles, stratégie de base, glossaire, quiz et jeu contre le croupier.',
    status: 'available',
    color: '#c9a227',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    emoji: '🎰',
    description: 'Bientôt disponible — comprendre les mises et probabilités.',
    status: 'coming-soon',
    color: '#8899bb',
  },
]

export default function App() {
  const [currentGame, setCurrentGame] = useState(null)

  if (currentGame === 'poker') {
    return <PokerApp onBack={() => setCurrentGame(null)} />
  }
  if (currentGame === 'blackjack') {
    return <BlackjackApp onBack={() => setCurrentGame(null)} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111827; }
        ::-webkit-scrollbar-thumb { background: #c9a227; border-radius: 4px; }
        .game-card { transition: all 0.2s; }
        .game-card:hover { transform: translateY(-3px); }
        .game-card-available:hover { border-color: #c9a22755 !important; box-shadow: 0 8px 32px #c9a22720 !important; }

        .home-header {
          width: 100%;
          max-width: 480px;
          padding: 40px 20px 20px;
          text-align: center;
        }
        .home-divider {
          width: 100%;
          max-width: 480px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c9a22730, transparent);
          margin: 8px 0 24px;
        }
        .games-section {
          width: 100%;
          max-width: 480px;
          padding: 0 20px 40px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .games-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .home-header {
            max-width: 860px;
            padding: 60px 40px 24px;
          }
          .home-divider {
            max-width: 860px;
            margin: 12px 0 32px;
          }
          .games-section {
            max-width: 860px;
            padding: 0 40px 60px;
          }
          .games-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .home-title {
            font-size: 42px !important;
          }
          .home-subtitle {
            font-size: 16px !important;
          }
        }

        @media (min-width: 1200px) {
          .home-header { max-width: 1100px; }
          .home-divider { max-width: 1100px; }
          .games-section { max-width: 1100px; }
          .games-list { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* Header */}
      <div className="home-header">
        <div style={{ fontSize: 52, marginBottom: 14 }}>🎲</div>
        <h1 className="home-title" style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 32,
          color: '#c9a227',
          marginBottom: 10,
        }}>
          Casino Games
        </h1>
        <p className="home-subtitle" style={{ fontSize: 14, color: '#8899bb', lineHeight: 1.7 }}>
          Apprends les jeux de casino — règles, stratégies et quiz interactifs.
          100% éducatif, aucun argent réel.
        </p>
      </div>

      <div className="home-divider" />

      {/* Games */}
      <div className="games-section">
        <p style={{ fontSize: 11, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
          Choisir un jeu
        </p>

        <div className="games-list">
          {GAMES.map((game) => {
            const isAvailable = game.status === 'available'
            return (
              <div
                key={game.id}
                className={`game-card ${isAvailable ? 'game-card-available' : ''}`}
                onClick={() => isAvailable && setCurrentGame(game.id)}
                style={{
                  background: '#1c2333',
                  border: `1px solid ${isAvailable ? '#2d3a5a' : '#1c2333'}`,
                  borderRadius: 14,
                  padding: '20px 22px',
                  cursor: isAvailable ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  opacity: isAvailable ? 1 : 0.5,
                }}
              >
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 12,
                  background: isAvailable ? '#c9a22718' : '#2d3a5a',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: isAvailable ? '#e2e8f0' : '#8899bb',
                    }}>
                      {game.name}
                    </span>
                    {isAvailable ? (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#22c55e',
                        background: '#14532d', padding: '2px 7px',
                        borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1,
                      }}>
                        Disponible
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#8899bb',
                        background: '#2d3a5a', padding: '2px 7px',
                        borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1,
                      }}>
                        Bientôt
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.5 }}>
                    {game.description}
                  </p>
                </div>

                {isAvailable && (
                  <div style={{ color: '#c9a227', fontSize: 20, flexShrink: 0 }}>→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid #2d3a5a',
        width: '100%',
      }}>
        <p style={{ fontSize: 11, color: '#334155' }}>
          Site éducatif — aucun argent réel impliqué
        </p>
      </div>
    </div>
  )
}
