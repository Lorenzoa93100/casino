import { useState, useEffect, useCallback } from 'react';
import { createGame, applyAction, botDecide, bestHand } from './engine.js';

// ─── Hint system ──────────────────────────────────────────────────────────────

function getHint(game, playerId) {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.folded) return null;

  const callAmt = Math.max(0, game.currentBet - player.roundBet);
  const canCheck = callAmt === 0;
  const potOdds = game.pot + callAmt > 0 ? callAmt / (game.pot + callAmt) : 0;
  const allCards = [...player.holeCards, ...game.communityCards];
  const hand = allCards.length >= 5 ? bestHand(allCards) : null;
  const rank = hand ? hand.rank : -1;

  // Pre-flop (no community cards yet)
  if (game.communityCards.length === 0) {
    const [c1, c2] = player.holeCards;
    const v1 = Math.max(c1.v, c2.v), v2 = Math.min(c1.v, c2.v);
    const isPair = v1 === v2, isSuited = c1.s === c2.s, gap = v1 - v2;
    const isHighPair = isPair && v1 >= 10;
    const isAce = v1 === 14;

    if (isHighPair)
      return { action: 'raise', text: `Paire de ${c1.r} pré-flop — main très forte. Relancez 3x les blindes pour isoler.` };
    if (isPair && v1 >= 7)
      return { action: 'raise', text: `Paire de ${c1.r} — bonne main. Relancez ou suivez selon la pression.` };
    if (isPair)
      return { action: canCheck ? 'check' : 'call', text: `Petite paire — jouez prudemment, cherchez un brelan au flop.` };
    if (isAce && v2 >= 10)
      return { action: 'raise', text: `${c1.r}${c1.s} ${c2.r}${c2.s} — très forte main. Relancez.` };
    if (isAce && isSuited)
      return { action: 'call', text: `As assorti — bon potentiel de couleur. Suivez ou relancez légèrement.` };
    if (v1 >= 11 && v2 >= 10)
      return { action: 'raise', text: `Deux hautes cartes connectées — relancez.` };
    if (isSuited && gap <= 2 && v1 >= 9)
      return { action: 'call', text: `Connecteurs assortis — main spéculative intéressante. Suivez si la mise est raisonnable.` };
    if (v1 >= 10 && canCheck)
      return { action: 'check', text: `Main correcte — checkez pour voir le flop sans risque.` };
    if (v1 >= 10)
      return { action: 'call', text: `Carte haute — vous pouvez suivre si la mise n'est pas trop grosse.` };
    if (!canCheck && callAmt > game.pot * 0.4)
      return { action: 'fold', text: `Main faible face à une grosse mise — couchez-vous, le risque ne vaut pas.` };
    return { action: canCheck ? 'check' : 'fold', text: canCheck ? `Main faible — checkez gratuitement.` : `Main trop faible — couchez-vous.` };
  }

  // Post-flop
  if (rank >= 6)
    return { action: 'raise', text: `${hand.name} — main dominante ! Relancez fort pour maximiser le pot.` };
  if (rank === 5)
    return { action: 'raise', text: `${hand.name} — très forte. Misez entre 50-75% du pot.` };
  if (rank === 4)
    return { action: canCheck ? 'raise' : 'call', text: `${hand.name} — bonne main. ${canCheck ? 'Misez pour faire payer les draws adverses.' : 'Suivez la mise.'}` };
  if (rank === 3)
    return { action: canCheck ? 'raise' : 'call', text: `${hand.name} — main solide. ${canCheck ? 'Value-bet : misez 30-50% du pot.' : 'Suivez.'}` };
  if (rank === 2) {
    if (canCheck) return { action: 'check', text: `${hand.name} — main correcte mais vulnérable. Checkez pour contrôler le pot.` };
    if (potOdds < 0.3) return { action: 'call', text: `${hand.name} — pot odds favorables, vous pouvez suivre.` };
    return { action: 'fold', text: `${hand.name} — face à une grosse mise, couchez-vous prudemment.` };
  }
  if (rank === 1) {
    if (canCheck) return { action: 'check', text: `${hand.name} — main faible. Checkez pour voir la suite gratuitement.` };
    if (potOdds < 0.2) return { action: 'call', text: `${hand.name} — petite paire. Suivez uniquement si la mise est minime.` };
    return { action: 'fold', text: `${hand.name} — trop risqué avec cette mise, couchez-vous.` };
  }
  // Rank 0: nothing
  if (canCheck) return { action: 'check', text: `Aucune combinaison pour l'instant — checkez et espérez vous améliorer.` };
  if (potOdds < 0.15) return { action: 'call', text: `Rien en main mais pot odds très favorables — tentez votre chance.` };
  return { action: 'fold', text: `Aucune combinaison face à une mise — couchez-vous et attendez une meilleure main.` };
}

const ACTION_COLORS = { raise: '#c9a227', call: '#22c55e', check: '#3b82f6', fold: '#ef4444' };
const ACTION_LABELS = { raise: 'Relancez', call: 'Suivez', check: 'Checkez', fold: 'Couchez-vous' };

const HAND_DESCRIPTIONS = {
  'Quinte Flush Royale': 'A K Q J 10 de la même couleur — main absolue',
  'Quinte Flush':        '5 cartes consécutives de même couleur',
  'Carré':               '4 cartes de même valeur',
  'Full House':          'Brelan + paire',
  'Couleur':             '5 cartes de la même couleur',
  'Quinte':              '5 cartes consécutives',
  'Brelan':              '3 cartes de même valeur',
  'Deux Paires':         '2 paires différentes',
  'Paire':               '2 cartes de même valeur',
  'Hauteur':             'Aucune combinaison — la carte la plus haute joue',
};

const RANK_LABELS = ['0','1','2','3','4','5','6','7','8','9'];

function ShowdownResult({ result, onNextHand }) {
  if (!result) return null;

  if (result.forced) {
    return (
      <div style={{ background:'#1c2333', border:'1px solid #c9a22730', borderRadius:12, padding:16, textAlign:'center' }}>
        <div style={{ fontSize:22, marginBottom:6 }}>🏆</div>
        <div style={{ fontSize:14, color:'#c9a227', fontWeight:700, marginBottom:4 }}>
          {result.winnerName} remporte {result.pot} chips
        </div>
        <div style={{ fontSize:12, color:'#8899bb', marginBottom:14 }}>Tous les autres joueurs ont foldé.</div>
        <button onClick={onNextHand} style={nextBtnStyle}>Main suivante →</button>
      </div>
    );
  }

  const evals = result.evaluations || [];
  const winner = evals.find(e => e.isWinner);
  const losers = evals.filter(e => !e.isWinner);
  const desc = HAND_DESCRIPTIONS[winner?.handName] || '';

  // Convert internal rank (0=worst, 9=best) to display rank (1=best, 10=worst)
  const displayRank = (r) => 10 - r;

  // Build explanation sentence
  let explanation = '';
  if (winner && losers.length > 0) {
    const loserText = losers.map(l => `${l.handName} (#${displayRank(l.handRank)})`).join(' et ');
    explanation = `La ${winner.handName} (#${displayRank(winner.handRank)}/10) bat ${loserText}.`;
    if (desc) explanation += ` — ${desc}.`;
  }

  return (
    <div style={{ background:'#1c2333', border:'1px solid #c9a22730', borderRadius:12, padding:16 }}>
      {/* Winner banner */}
      <div style={{ textAlign:'center', marginBottom:14 }}>
        <div style={{ fontSize:26, marginBottom:4 }}>🏆</div>
        <div style={{ fontSize:15, color:'#c9a227', fontWeight:700 }}>
          {result.winnerName} remporte {result.pot} chips
        </div>
      </div>

      {/* Hands comparison table */}
      {evals.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:'#8899bb', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
            Résultat des mains
          </div>
          {evals.map((e, i) => (
            <div key={e.playerId} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'7px 10px', borderRadius:8, marginBottom:4,
              background: e.isWinner ? '#c9a22715' : '#111827',
              border: `1px solid ${e.isWinner ? '#c9a22740' : '#2d3a5a'}`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14 }}>{e.isWinner ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span style={{ fontSize:13, fontWeight:600, color: e.isWinner ? '#c9a227' : '#94a3b8' }}>
                  {e.playerName}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color: e.isWinner ? '#e2e8f0' : '#8899bb', fontWeight: e.isWinner ? 700 : 400 }}>
                  {e.handName}
                </span>
                <span style={{
                  fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10,
                  background: e.isWinner ? '#c9a22730' : '#2d3a5a',
                  color: e.isWinner ? '#c9a227' : '#8899bb',
                }}>
                  #{displayRank(e.handRank)}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div style={{
          background:'#c9a22710', border:'1px solid #c9a22730',
          borderRadius:8, padding:'10px 12px', marginBottom:14,
        }}>
          <div style={{ fontSize:10, color:'#c9a227', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>
            💡 Pourquoi cette main gagne
          </div>
          <p style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.6 }}>{explanation}</p>
        </div>
      )}

      <div style={{ textAlign:'center' }}>
        <button onClick={onNextHand} style={nextBtnStyle}>Main suivante →</button>
      </div>
    </div>
  );
}

const nextBtnStyle = {
  background:'#c9a227', color:'#111827', border:'none',
  borderRadius:10, padding:'12px 28px',
  fontSize:14, fontWeight:700, cursor:'pointer',
  fontFamily:"'DM Sans', sans-serif",
};

// ─── Card components ──────────────────────────────────────────────────────────

const CARD_W = 44;
const CARD_H = 62;

function CardFace({ card }) {
  if (!card) return <CardSlot />;
  const isRed = card.s === '♥' || card.s === '♦';
  const color = isRed ? '#dc2626' : '#1c2333';
  return (
    <div style={{
      width: CARD_W, height: CARD_H, background: '#f8f8f0',
      borderRadius: 6, border: '2px solid #ddd',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 2px 8px #0004',
      position: 'relative',
    }}>
      <span style={{ fontSize: 12, fontWeight: 800, color, lineHeight: 1, fontFamily: 'monospace' }}>
        {card.r}
      </span>
      <span style={{ fontSize: 18, color, lineHeight: 1 }}>{card.s}</span>
    </div>
  );
}

function CardBack() {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, borderRadius: 6,
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1a237e 100%)',
      border: '2px solid #3949ab', flexShrink: 0,
      boxShadow: '0 2px 8px #0006',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: CARD_W - 12, height: CARD_H - 12, borderRadius: 4,
        border: '1px solid #5c6bc055',
        background: 'repeating-linear-gradient(45deg, #1a237e22 0px, #1a237e22 4px, #3949ab22 4px, #3949ab22 8px)',
      }} />
    </div>
  );
}

function CardSlot() {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, borderRadius: 6,
      border: '2px dashed #2a2a4a', background: '#1c233380',
      flexShrink: 0,
    }} />
  );
}

// ─── Difficulty descriptions ──────────────────────────────────────────────────

const DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Facile',
    icon: '🌱',
    desc: 'Les bots jouent simplement. Idéal pour apprendre les bases du jeu.',
    color: '#22c55e',
    bg: '#14532d',
  },
  {
    id: 'medium',
    label: 'Moyen',
    icon: '⚡',
    desc: 'Les bots calculent les pot odds et relancent plus souvent.',
    color: '#eab308',
    bg: '#713f12',
  },
  {
    id: 'hard',
    label: 'Difficile',
    icon: '🔥',
    desc: 'Les bots bluffent, relancent agressivement et font pression.',
    color: '#ef4444',
    bg: '#450a0a',
  },
];

const PHASE_LABELS = {
  preflop: 'Pré-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
};

// ─── Menu screen ──────────────────────────────────────────────────────────────

function MenuScreen({ onStart }) {
  const [selected, setSelected] = useState('medium');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 16px', minHeight: 400,
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🂡</div>
      <h2 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 26, color: '#c9a227', marginBottom: 6,
      }}>Texas Hold'em</h2>
      <p style={{ color: '#8899bb', fontSize: 13, marginBottom: 28, textAlign: 'center', maxWidth: 320 }}>
        Joueur contre 2 bots — Choisissez votre difficulté
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380, marginBottom: 28 }}>
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: selected === d.id ? d.bg : '#1c2333',
              border: `2px solid ${selected === d.id ? d.color : '#2d3a5a'}`,
              borderRadius: 12, padding: '14px 18px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', width: '100%',
            }}
          >
            <span style={{ fontSize: 26 }}>{d.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 700, fontSize: 15,
                color: selected === d.id ? d.color : '#e2e8f0',
                marginBottom: 2, fontFamily: "'DM Sans', sans-serif",
              }}>
                {d.label}
              </div>
              <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4 }}>{d.desc}</div>
            </div>
            {selected === d.id && (
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: d.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, color: '#000', fontWeight: 800,
                flexShrink: 0,
              }}>✓</div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(selected)}
        style={{
          background: '#c9a227', color: '#111827',
          border: 'none', borderRadius: 12, padding: '14px 40px',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 20px #c9a22740',
        }}
      >
        Jouer →
      </button>
    </div>
  );
}

// ─── Player panel ──────────────────────────────────────────────────────────────

function PlayerPanel({ player, isCurrentTurn, isDealer, isSB, isBB, showCards, isHuman, result }) {
  const isWinner = result && result.winnerId === player.id;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '8px 12px',
      background: isCurrentTurn ? '#c9a22715' : '#1c2333',
      border: `2px solid ${isCurrentTurn ? '#c9a227' : isWinner ? '#22c55e' : '#2d3a5a'}`,
      borderRadius: 12, minWidth: 120, position: 'relative',
      transition: 'all 0.2s',
    }}>
      {isWinner && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          background: '#22c55e', color: '#000', fontSize: 10, fontWeight: 800,
          padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
        }}>
          🏆 Gagnant
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: 4, position: 'absolute', top: 6, right: 6 }}>
        {isDealer && (
          <span style={{
            background: '#c9a227', color: '#000', fontSize: 9, fontWeight: 800,
            padding: '1px 5px', borderRadius: 8,
          }}>D</span>
        )}
        {isSB && (
          <span style={{
            background: '#3b82f6', color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '1px 5px', borderRadius: 8,
          }}>SB</span>
        )}
        {isBB && (
          <span style={{
            background: '#8b5cf6', color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '1px 5px', borderRadius: 8,
          }}>BB</span>
        )}
      </div>

      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginTop: 8 }}>
        {player.name} {player.isBot ? '🤖' : '👤'}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 4 }}>
        {showCards || isHuman
          ? (player.holeCards || []).map((c, i) => <CardFace key={i} card={c} />)
          : player.folded
            ? [0, 1].map(i => (
                <div key={i} style={{
                  width: CARD_W, height: CARD_H, borderRadius: 6,
                  background: '#1c2333', border: '2px dashed #2d3a5a',
                  opacity: 0.4, flexShrink: 0,
                }} />
              ))
            : [0, 1].map(i => <CardBack key={i} />)
        }
      </div>

      {/* Chips + bet */}
      <div style={{ fontSize: 11, color: '#8899bb' }}>
        💰 {player.chips}
      </div>
      {player.roundBet > 0 && (
        <div style={{
          fontSize: 11, color: '#c9a227', fontWeight: 700,
          background: '#c9a22720', padding: '2px 8px', borderRadius: 8,
        }}>
          Mise: {player.roundBet}
        </div>
      )}
      {player.folded && (
        <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>FOLDÉ</div>
      )}
      {player.allIn && (
        <div style={{ fontSize: 10, color: '#f97316', fontWeight: 700 }}>ALL-IN</div>
      )}
      {result && !result.forced && result.evaluations && (
        <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
          {result.evaluations.find(e => e.playerId === player.id)?.handName || ''}
        </div>
      )}
    </div>
  );
}

// ─── Action buttons ────────────────────────────────────────────────────────────

function ActionBar({ game, onAction, disabled }) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const human = game.players.find(p => !p.isBot);
  const toCall = game.currentBet - human.roundBet;
  const canCheck = toCall <= 0;
  const minRaise = Math.max(game.currentBet + (game.currentBet > 0 ? game.currentBet : 20), game.currentBet + 20);
  const maxRaise = human.chips + human.roundBet;

  // Initialize raiseAmount
  useEffect(() => {
    setRaiseAmount(Math.min(minRaise, maxRaise));
  }, [game.currentBet, game.phase]);

  const btnStyle = (bg, color = '#fff') => ({
    padding: '12px 20px', borderRadius: 10, border: 'none',
    background: bg, color, fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: "'DM Sans', sans-serif",
    flex: 1, minWidth: 80,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Raise slider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#1c2333', borderRadius: 10, padding: '10px 14px',
      }}>
        <span style={{ fontSize: 12, color: '#8899bb', whiteSpace: 'nowrap' }}>Relance:</span>
        <input
          type="range"
          min={minRaise}
          max={maxRaise}
          step={10}
          value={Math.min(raiseAmount, maxRaise)}
          onChange={e => setRaiseAmount(Number(e.target.value))}
          disabled={disabled}
          style={{ flex: 1, accentColor: '#c9a227' }}
        />
        <span style={{
          fontSize: 13, fontWeight: 700, color: '#c9a227',
          minWidth: 40, textAlign: 'right',
        }}>{Math.min(raiseAmount, maxRaise)}</span>
        <button
          onClick={() => setRaiseAmount(v => Math.max(minRaise, v - 20))}
          disabled={disabled}
          style={{ ...btnStyle('#2d3a5a', '#e2e8f0'), flex: 'none', padding: '8px 10px', minWidth: 'auto', fontSize: 16 }}
        >−</button>
        <button
          onClick={() => setRaiseAmount(v => Math.min(maxRaise, v + 20))}
          disabled={disabled}
          style={{ ...btnStyle('#2d3a5a', '#e2e8f0'), flex: 'none', padding: '8px 10px', minWidth: 'auto', fontSize: 16 }}
        >+</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={btnStyle('#450a0a', '#fca5a5')}
          onClick={() => !disabled && onAction('fold')}
          disabled={disabled}
        >
          Fold
        </button>
        <button
          style={btnStyle('#0f2010', '#86efac')}
          onClick={() => !disabled && onAction(canCheck ? 'check' : 'call')}
          disabled={disabled}
        >
          {canCheck ? 'Check' : `Call ${toCall}`}
        </button>
        <button
          style={btnStyle('#713f12', '#fde68a')}
          onClick={() => !disabled && onAction('raise', Math.min(raiseAmount, maxRaise))}
          disabled={disabled || raiseAmount > maxRaise}
        >
          Raise
        </button>
        <button
          style={btnStyle('#1a1a3a', '#c9a227')}
          onClick={() => !disabled && onAction('raise', maxRaise)}
          disabled={disabled}
        >
          All-in
        </button>
      </div>
    </div>
  );
}

// ─── Game screen ──────────────────────────────────────────────────────────────

function GameScreen({ game, setGame, onBack, onNextHand }) {
  const [botThinking, setBotThinking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const human = game.players.find(p => !p.isBot);
  const isHumanTurn = game.currentPlayerId === human.id && game.phase !== 'showdown';

  const handleAction = useCallback((action, amount) => {
    if (!isHumanTurn) return;
    setGame(prev => applyAction(prev, action, amount));
  }, [isHumanTurn, setGame]);

  // Bot turns
  useEffect(() => {
    if (game.phase === 'showdown') return;
    const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
    if (!currentPlayer || !currentPlayer.isBot) return;

    setBotThinking(true);
    const delay = 800 + Math.random() * 700;
    const timer = setTimeout(() => {
      setGame(prev => {
        const cp = prev.players.find(p => p.id === prev.currentPlayerId);
        if (!cp || !cp.isBot || prev.phase === 'showdown') return prev;
        const decision = botDecide(cp, prev, prev.difficulty);
        return applyAction(prev, decision.action, decision.amount);
      });
      setBotThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [game.currentPlayerId, game.phase, setGame]);

  const isShowdown = game.phase === 'showdown';
  const result = game.result;

  const dealerIdx = game.dealerIndex;
  const sbIdx = (dealerIdx + 1) % 3;
  const bbIdx = (dealerIdx + 2) % 3;

  // Player order by id
  const playerById = (id) => game.players.find(p => p.id === id);
  const bot1 = game.players[1]; // Alex
  const bot2 = game.players[2]; // Sam

  const communitySlots = Array(5).fill(null).map((_, i) => game.communityCards[i] || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 500 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#1c2333', borderBottom: '1px solid #2d3a5a',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid #2d3a5a', borderRadius: 8,
            color: '#8899bb', padding: '6px 12px', fontSize: 12, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ← Menu
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#c9a227',
            background: '#c9a22720', padding: '4px 10px', borderRadius: 8,
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {PHASE_LABELS[game.phase] || game.phase}
          </span>
          <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700 }}>
            Pot: <span style={{ color: '#c9a227' }}>{game.pot}</span>
          </span>
          {botThinking && (
            <span style={{ fontSize: 11, color: '#8899bb', fontStyle: 'italic' }}>
              🤔 réfléchit…
            </span>
          )}
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Table area */}
      <div style={{
        flex: 1, background: '#111827', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
      }}>
        {/* Bots row */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', width: '100%' }}>
          <PlayerPanel
            player={bot1}
            isCurrentTurn={game.currentPlayerId === bot1.id}
            isDealer={game.dealerIndex === 1}
            isSB={sbIdx === 1}
            isBB={bbIdx === 1}
            showCards={isShowdown}
            isHuman={false}
            result={result}
          />
          <PlayerPanel
            player={bot2}
            isCurrentTurn={game.currentPlayerId === bot2.id}
            isDealer={game.dealerIndex === 2}
            isSB={sbIdx === 2}
            isBB={bbIdx === 2}
            showCards={isShowdown}
            isHuman={false}
            result={result}
          />
        </div>

        {/* Table oval */}
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #14532d 100%)',
          border: '4px solid #166534',
          borderRadius: 60,
          padding: '20px 28px',
          width: '100%', maxWidth: 480,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px #00000060, inset 0 2px 8px #ffffff10',
        }}>
          {/* Community cards */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {communitySlots.map((card, i) => (
              card ? <CardFace key={i} card={card} /> : <CardSlot key={i} />
            ))}
          </div>

          {/* Pot info on table */}
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#fde68a',
            background: '#00000040', padding: '4px 14px', borderRadius: 20,
          }}>
            POT: {game.pot}
          </div>
        </div>

        {/* Human player */}
        <PlayerPanel
          player={human}
          isCurrentTurn={isHumanTurn}
          isDealer={game.dealerIndex === 0}
          isSB={sbIdx === 0}
          isBB={bbIdx === 0}
          showCards={true}
          isHuman={true}
          result={result}
        />

        {/* Action buttons or showdown result */}
        <div style={{ width: '100%', maxWidth: 480 }}>
          {isShowdown && result ? (
            <ShowdownResult result={result} onNextHand={onNextHand} />
          ) : isHumanTurn ? (
            <div>
              {/* Hint panel */}
              {showHint && (() => {
                const hint = getHint(game, human.id);
                return hint ? (
                  <div style={{
                    background: '#1c2333', border: `1px solid ${ACTION_COLORS[hint.action]}50`,
                    borderRadius: 10, padding: '12px 14px', marginBottom: 10,
                    position: 'relative',
                  }}>
                    <button onClick={() => setShowHint(false)} style={{
                      position: 'absolute', top: 8, right: 10,
                      background: 'none', border: 'none', color: '#8899bb',
                      cursor: 'pointer', fontSize: 14, lineHeight: 1,
                    }}>✕</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 1 }}>💡 Conseil</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: ACTION_COLORS[hint.action] + '25',
                        color: ACTION_COLORS[hint.action],
                      }}>
                        {ACTION_LABELS[hint.action]}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, paddingRight: 20 }}>{hint.text}</p>
                  </div>
                ) : null;
              })()}
              <ActionBar game={game} onAction={(a, amt) => { setShowHint(false); handleAction(a, amt); }} disabled={false} />
              {/* Hint button */}
              <button onClick={() => setShowHint(h => !h)} style={{
                width: '100%', marginTop: 8,
                background: showHint ? '#2d3a5a' : 'none',
                border: '1px dashed #c9a22740', color: '#c9a22790',
                borderRadius: 8, padding: '8px', fontSize: 12,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}>
                💡 {showHint ? 'Masquer le conseil' : 'Afficher un conseil (débutant)'}
              </button>
            </div>
          ) : (
            <div style={{
              background: '#1c2333', borderRadius: 10, padding: '14px',
              textAlign: 'center', color: '#8899bb', fontSize: 13,
            }}>
              {botThinking ? '🤖 Le bot réfléchit…' : 'En attente…'}
            </div>
          )}
        </div>

        {/* Log */}
        <div style={{
          width: '100%', maxWidth: 480,
          background: '#1c2333', border: '1px solid #2d3a5a',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ fontSize: 10, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Journal
          </div>
          {(game.log || []).slice(-6).reverse().map((entry, i) => (
            <div key={i} style={{
              fontSize: 12, color: i === 0 ? '#e2e8f0' : '#8899bb',
              padding: '2px 0', borderBottom: i < 5 ? '1px solid #2d3a5a10' : 'none',
            }}>
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PokerGame() {
  const [screen, setScreen] = useState('menu'); // 'menu' | 'game'
  const [game, setGame] = useState(null);

  const handleStart = (difficulty) => {
    const g = createGame(difficulty, null);
    setGame(g);
    setScreen('game');
  };

  const handleBack = () => {
    setScreen('menu');
    setGame(null);
  };

  const handleNextHand = () => {
    if (!game) return;
    const g = createGame(game.difficulty, game);
    setGame(g);
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
      background: '#111827',
      minHeight: 400,
    }}>
      {screen === 'menu' && <MenuScreen onStart={handleStart} />}
      {screen === 'game' && game && (
        <GameScreen
          game={game}
          setGame={setGame}
          onBack={handleBack}
          onNextHand={handleNextHand}
        />
      )}
    </div>
  );
}
