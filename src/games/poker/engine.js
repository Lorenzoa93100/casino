// Pure poker engine — no React dependencies

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['♠','♥','♦','♣'];
const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

export function mkDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ r, s, v: RANK_VALUES[r] });
    }
  }
  return deck;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Evaluate a hand of exactly 5 cards
function eval5(cards) {
  const vals = cards.map(c => c.v).sort((a, b) => b - a);
  const suits = cards.map(c => c.s);
  const isFlush = suits.every(s => s === suits[0]);

  // Check for straight
  function isStraightVals(vs) {
    // Normal straight
    if (vs[0] - vs[4] === 4 && new Set(vs).size === 5) return vs[0];
    // Wheel: A-2-3-4-5
    if (vs[0] === 14 && vs[1] === 5 && vs[2] === 4 && vs[3] === 3 && vs[4] === 2) return 5;
    return 0;
  }

  const straightHigh = isStraightVals(vals);
  const isStraight = straightHigh > 0;

  // Count occurrences
  const freq = {};
  for (const v of vals) freq[v] = (freq[v] || 0) + 1;
  const counts = Object.entries(freq).map(([v, c]) => ({ v: parseInt(v), c })).sort((a, b) => b.c - a.c || b.v - a.v);

  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: 9, name: 'Quinte Flush Royale', tb: [14] };
    return { rank: 8, name: 'Quinte Flush', tb: [straightHigh] };
  }
  if (counts[0].c === 4) {
    return { rank: 7, name: 'Carré', tb: [counts[0].v, counts[1].v] };
  }
  if (counts[0].c === 3 && counts[1].c === 2) {
    return { rank: 6, name: 'Full House', tb: [counts[0].v, counts[1].v] };
  }
  if (isFlush) {
    return { rank: 5, name: 'Couleur', tb: vals };
  }
  if (isStraight) {
    return { rank: 4, name: 'Quinte', tb: [straightHigh] };
  }
  if (counts[0].c === 3) {
    const kickers = counts.slice(1).map(x => x.v);
    return { rank: 3, name: 'Brelan', tb: [counts[0].v, ...kickers] };
  }
  if (counts[0].c === 2 && counts[1].c === 2) {
    const kicker = counts[2] ? counts[2].v : 0;
    return { rank: 2, name: 'Deux Paires', tb: [Math.max(counts[0].v, counts[1].v), Math.min(counts[0].v, counts[1].v), kicker] };
  }
  if (counts[0].c === 2) {
    const kickers = counts.slice(1).map(x => x.v);
    return { rank: 1, name: 'Paire', tb: [counts[0].v, ...kickers] };
  }
  return { rank: 0, name: 'Hauteur', tb: vals };
}

function combinations(arr, k) {
  const result = [];
  function combine(start, current) {
    if (current.length === k) { result.push([...current]); return; }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      combine(i + 1, current);
      current.pop();
    }
  }
  combine(0, []);
  return result;
}

function compareHands(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tb.length, b.tb.length); i++) {
    const av = a.tb[i] || 0, bv = b.tb[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function bestHand(cards) {
  if (cards.length === 5) return eval5(cards);
  const combos = combinations(cards, 5);
  let best = null;
  for (const combo of combos) {
    const h = eval5(combo);
    if (!best || compareHands(h, best) > 0) best = h;
  }
  return best;
}

// Estimate hand strength [0..1] for a player given hole cards + community cards
function handStrength(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 2) return 0.5;

  // Score the current best hand
  const h = allCards.length >= 5 ? bestHand(allCards) : null;

  // Use rank + card values as a rough normalized score
  // rank goes 0-9, tiebreakers are bonus
  let score = 0;
  if (h) {
    score = h.rank / 9;
    // Add small bonus from top tiebreaker
    const topTb = (h.tb[0] || 0);
    score += (topTb / 14) * 0.05;
  } else {
    // Pre-flop: use hole card values
    const v0 = holeCards[0] ? holeCards[0].v : 2;
    const v1 = holeCards[1] ? holeCards[1].v : 2;
    const isPair = holeCards.length === 2 && v0 === v1;
    const isSuited = holeCards.length === 2 && holeCards[0].s === holeCards[1].s;
    score = (v0 + v1) / 28; // 28 = max (A+A = 14+14)
    if (isPair) score = Math.min(1, score + 0.25);
    if (isSuited) score = Math.min(1, score + 0.05);
  }

  return Math.min(1, Math.max(0, score));
}

export function botDecide(player, game, difficulty) {
  const force = handStrength(player.holeCards, game.communityCards);
  const toCall = game.currentBet - player.roundBet;
  const canCheck = toCall <= 0;
  const bigBlind = game.bigBlind || 20;
  // raiseTotal = total amount in the pot from this player (including roundBet already posted)
  const minRaiseTotal = Math.max(game.currentBet + bigBlind, game.currentBet * 2);
  const maxRaiseTotal = player.chips + player.roundBet; // all-in
  const raiseAmount = Math.min(maxRaiseTotal, Math.max(minRaiseTotal, player.roundBet + Math.floor(game.pot * 0.6)));

  if (difficulty === 'easy') {
    // Easy: simple thresholds
    if (!canCheck && force < 0.25) return { action: 'fold' };
    if (!canCheck && force < 0.4) {
      return Math.random() < 0.5 ? { action: 'call' } : { action: 'fold' };
    }
    if (canCheck) {
      if (force > 0.65 && Math.random() < 0.25) return { action: 'raise', amount: raiseAmount };
      return { action: 'check' };
    }
    if (force > 0.65 && Math.random() < 0.25) return { action: 'raise', amount: raiseAmount };
    return { action: 'call' };
  }

  if (difficulty === 'medium') {
    // Medium: use pot odds
    const potOdds = toCall > 0 ? toCall / (game.pot + toCall) : 0;
    if (!canCheck && force < potOdds && force < 0.3) return { action: 'fold' };
    if (canCheck) {
      if (force > 0.55 && Math.random() < 0.4) return { action: 'raise', amount: raiseAmount };
      return { action: 'check' };
    }
    if (force > 0.55 && Math.random() < 0.4) return { action: 'raise', amount: raiseAmount };
    if (force >= potOdds || force > 0.35) return { action: 'call' };
    return { action: 'fold' };
  }

  // Hard: aggressive with occasional bluffs
  const potOdds = toCall > 0 ? toCall / (game.pot + toCall) : 0;
  const bigBlindHard = game.bigBlind || 20;
  const bigRaise = Math.min(maxRaiseTotal, Math.max(minRaiseTotal, player.roundBet + Math.floor(game.pot * 0.85)));

  if (canCheck) {
    // Bluff 20% of weak hands
    if (force < 0.2 && Math.random() < 0.2) return { action: 'raise', amount: Math.min(maxRaiseTotal, player.roundBet + bigBlindHard * 3) };
    if (force > 0.45 && Math.random() < 0.55) return { action: 'raise', amount: bigRaise };
    return { action: 'check' };
  }
  // Strong hand: raise aggressively
  if (force > 0.65) return { action: 'raise', amount: bigRaise };
  // Medium hand: call if pot odds make sense
  if (force > potOdds && force > 0.25) return { action: 'call' };
  // Bluff-call occasionally with a weak hand
  if (force < 0.2 && Math.random() < 0.15) return { action: 'call' };
  return { action: 'fold' };
}

const SB = 10;
const BB = 20;
const CHIPS = 1000;

function nextActive(players, from, skipId) {
  const n = players.length;
  for (let i = 1; i < n; i++) {
    const idx = (from + i) % n;
    const p = players[idx];
    if (!p.folded && !p.allIn && p.id !== skipId) return idx;
  }
  return -1;
}

function playerIndexById(players, id) {
  return players.findIndex(p => p.id === id);
}

export function createGame(difficulty, prevGame) {
  const deck = shuffle(mkDeck());

  let players;
  if (prevGame) {
    // Rotate dealer, reuse chips
    players = prevGame.players.map(p => ({
      ...p,
      holeCards: [],
      roundBet: 0,
      folded: false,
      allIn: false,
    }));
  } else {
    players = [
      { id: 0, name: 'Toi', isBot: false, chips: CHIPS, holeCards: [], roundBet: 0, folded: false, allIn: false },
      { id: 1, name: 'Yanis', isBot: true, chips: CHIPS, holeCards: [], roundBet: 0, folded: false, allIn: false },
      { id: 2, name: 'Mila', isBot: true, chips: CHIPS, holeCards: [], roundBet: 0, folded: false, allIn: false },
    ];
  }

  const prevDealer = prevGame ? prevGame.dealerIndex : null;
  const dealerIndex = prevDealer !== null
    ? (prevDealer + 1) % players.length
    : Math.floor(Math.random() * players.length);
  const sbIndex = (dealerIndex + 1) % players.length;
  const bbIndex = (dealerIndex + 2) % players.length;

  let deckPos = 0;

  // Deal 2 cards to each player starting left of dealer
  for (let i = 0; i < players.length; i++) {
    const idx = (dealerIndex + 1 + i) % players.length;
    players[idx].holeCards = [deck[deckPos++], deck[deckPos++]];
  }

  // Post blinds
  players[sbIndex].chips -= SB;
  players[sbIndex].roundBet = SB;
  players[bbIndex].chips -= BB;
  players[bbIndex].roundBet = BB;

  const pot = SB + BB;
  const remainingDeck = deck.slice(deckPos);

  // Pre-flop: UTG = left of BB acts first
  const utgIndex = (bbIndex + 1) % players.length;

  return {
    phase: 'preflop',
    deck: remainingDeck,
    players,
    communityCards: [],
    pot,
    currentBet: BB,
    bigBlind: BB,
    currentPlayerId: players[utgIndex].id,
    lastRaiserId: players[bbIndex].id, // BB counts as raiser pre-flop
    acted: [],
    dealerIndex,
    sbIndex,
    bbIndex,
    difficulty,
    result: null,
    log: [`🃏 Nouvelle main — Dealer: ${players[dealerIndex].name}`, `${players[sbIndex].name} poste SB (${SB})`, `${players[bbIndex].name} poste BB (${BB})`],
  };
}

function isRoundOver(game) {
  const active = game.players.filter(p => !p.folded && !p.allIn);
  if (active.length === 0) return true;
  const activeFolded = game.players.filter(p => !p.folded);
  if (activeFolded.length <= 1) return true;

  // Everyone still in (not folded, not all-in) must have acted and matched currentBet
  const allMatched = active.every(p => game.acted.includes(p.id) && p.roundBet === game.currentBet);
  // Also check that all-in players who haven't folded are satisfied
  return allMatched;
}

export function advancePhase(game) {
  const newGame = JSON.parse(JSON.stringify(game));

  // Reset round bets
  newGame.players.forEach(p => { p.roundBet = 0; });
  newGame.acted = [];
  newGame.currentBet = 0;

  const phases = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const phaseIdx = phases.indexOf(newGame.phase);

  // Check if only one player remains
  const notFolded = newGame.players.filter(p => !p.folded);
  if (notFolded.length === 1) {
    // Auto win
    const winner = notFolded[0];
    newGame.players[playerIndexById(newGame.players, winner.id)].chips += newGame.pot;
    newGame.result = { winnerId: winner.id, winnerName: winner.name, handName: 'Tous les autres ont foldé', pot: newGame.pot };
    newGame.phase = 'showdown';
    newGame.log = [...newGame.log.slice(-7), `🏆 ${winner.name} remporte ${newGame.pot} chips (fold)`];
    return newGame;
  }

  const nextPhase = phases[phaseIdx + 1];

  if (nextPhase === 'flop') {
    newGame.communityCards = [newGame.deck[0], newGame.deck[1], newGame.deck[2]];
    newGame.deck = newGame.deck.slice(3);
    newGame.phase = 'flop';
    newGame.log = [...newGame.log.slice(-7), `🂠 Flop: ${newGame.communityCards.map(c => c.r + c.s).join(' ')}`];
  } else if (nextPhase === 'turn') {
    newGame.communityCards = [...newGame.communityCards, newGame.deck[0]];
    newGame.deck = newGame.deck.slice(1);
    newGame.phase = 'turn';
    newGame.log = [...newGame.log.slice(-7), `🂠 Turn: ${newGame.communityCards[3].r + newGame.communityCards[3].s}`];
  } else if (nextPhase === 'river') {
    newGame.communityCards = [...newGame.communityCards, newGame.deck[0]];
    newGame.deck = newGame.deck.slice(1);
    newGame.phase = 'river';
    newGame.log = [...newGame.log.slice(-7), `🂠 River: ${newGame.communityCards[4].r + newGame.communityCards[4].s}`];
  } else if (nextPhase === 'showdown') {
    newGame.phase = 'showdown';
    // Evaluate all non-folded players
    const contenders = newGame.players.filter(p => !p.folded);
    const evaluated = contenders.map(p => {
      const h = bestHand([...p.holeCards, ...newGame.communityCards]);
      return { player: p, hand: h };
    });
    // Sort by best hand descending
    evaluated.sort((a, b) => compareHands(b.hand, a.hand));
    const winnerEval = evaluated[0];
    newGame.players[playerIndexById(newGame.players, winnerEval.player.id)].chips += newGame.pot;
    newGame.result = {
      winnerId: winnerEval.player.id,
      winnerName: winnerEval.player.name,
      handName: winnerEval.hand.name,
      pot: newGame.pot,
      evaluations: evaluated.map(e => ({
        playerId: e.player.id,
        playerName: e.player.name,
        handName: e.hand.name,
        handRank: e.hand.rank,
        isWinner: e.player.id === winnerEval.player.id,
      })),
    };
    newGame.log = [...newGame.log.slice(-7), `🏆 ${winnerEval.player.name} gagne ${newGame.pot} chips avec ${winnerEval.hand.name}`];
    return newGame;
  }

  // Find first active player to act in new street
  // Post-flop: first active player left of dealer
  const dealerIdx = newGame.players.findIndex(p => p.id === newGame.players[newGame.dealerIndex]?.id);
  // Actually use dealerIndex directly
  for (let i = 1; i <= newGame.players.length; i++) {
    const idx = (newGame.dealerIndex + i) % newGame.players.length;
    const p = newGame.players[idx];
    if (!p.folded && !p.allIn) {
      newGame.currentPlayerId = p.id;
      newGame.lastRaiserId = null;
      break;
    }
  }

  return newGame;
}

export function applyAction(game, action, amount) {
  const newGame = JSON.parse(JSON.stringify(game));
  const playerIdx = playerIndexById(newGame.players, newGame.currentPlayerId);
  const player = newGame.players[playerIdx];

  const toCall = newGame.currentBet - player.roundBet;

  if (action === 'fold') {
    player.folded = true;
    newGame.log = [...newGame.log.slice(-7), `${player.name} fold`];
  } else if (action === 'check') {
    newGame.log = [...newGame.log.slice(-7), `${player.name} check`];
  } else if (action === 'call') {
    const callAmt = Math.min(toCall, player.chips);
    player.chips -= callAmt;
    player.roundBet += callAmt;
    newGame.pot += callAmt;
    if (player.chips === 0) player.allIn = true;
    newGame.log = [...newGame.log.slice(-7), `${player.name} call ${callAmt}`];
  } else if (action === 'raise') {
    const raiseTotal = Math.min(amount || newGame.currentBet * 2, player.chips + player.roundBet);
    const extra = raiseTotal - player.roundBet;
    const paid = Math.min(extra, player.chips);
    player.chips -= paid;
    player.roundBet += paid;
    newGame.pot += paid;
    newGame.currentBet = player.roundBet;
    newGame.lastRaiserId = player.id;
    // Reset acted — everyone needs to act again except the raiser
    newGame.acted = [];
    if (player.chips === 0) player.allIn = true;
    newGame.log = [...newGame.log.slice(-7), `${player.name} raise à ${player.roundBet}`];
  }

  // Mark player as acted
  if (!newGame.acted.includes(player.id)) {
    newGame.acted.push(player.id);
  }

  // Check if round is over
  if (isRoundOver(newGame)) {
    return advancePhase(newGame);
  }

  // Find next player
  // Pre-flop special: after everyone acted once, BB gets last action if no raise
  const activePlayers = newGame.players.filter(p => !p.folded && !p.allIn);

  // Find next player after current
  let nextIdx = -1;
  for (let i = 1; i <= newGame.players.length; i++) {
    const idx = (playerIdx + i) % newGame.players.length;
    const p = newGame.players[idx];
    if (!p.folded && !p.allIn) {
      // In preflop: if we've gone around and it's BB's turn with no raise after BB
      // BB still needs a chance if they haven't acted yet and nobody raised after them
      nextIdx = idx;
      break;
    }
  }

  if (nextIdx !== -1) {
    const nextPlayer = newGame.players[nextIdx];
    // Check if this player still needs to act
    const nextToCall = newGame.currentBet - nextPlayer.roundBet;
    const hasActed = newGame.acted.includes(nextPlayer.id);

    if (hasActed && nextToCall === 0) {
      // This player is satisfied — check if round is over
      if (isRoundOver(newGame)) {
        return advancePhase(newGame);
      }
    }

    newGame.currentPlayerId = nextPlayer.id;
  }

  return newGame;
}
