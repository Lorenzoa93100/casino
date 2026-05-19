const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']

export function createDeck(numDecks = 6) {
  const deck = []
  for (let d = 0; d < numDecks; d++)
    for (const suit of SUITS)
      for (const rank of RANKS)
        deck.push({ rank, suit })
  return deck
}

export function shuffle(deck) {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function handValue(cards) {
  let total = 0, aces = 0
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 11 }
    else if (['J','Q','K'].includes(c.rank)) total += 10
    else total += parseInt(c.rank)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

export function isSoft(cards) {
  let total = 0, aces = 0
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 11 }
    else if (['J','Q','K'].includes(c.rank)) total += 10
    else total += parseInt(c.rank)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return aces > 0
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards) === 21
}

export function isBust(cards) {
  return handValue(cards) > 21
}

export function canSplit(cards) {
  if (cards.length !== 2) return false
  const norm = c => ['J','Q','K'].includes(c.rank) ? '10' : c.rank
  return norm(cards[0]) === norm(cards[1])
}

export function dealerShouldHit(cards) {
  const val = handValue(cards)
  return val < 17 || (val === 17 && isSoft(cards))
}

export function compareHands(playerCards, dealerCards) {
  if (isBust(playerCards)) return 'dealer'
  if (isBust(dealerCards)) return 'player'
  const pBj = isBlackjack(playerCards)
  const dBj = isBlackjack(dealerCards)
  if (pBj && dBj) return 'push'
  if (pBj) return 'blackjack'
  if (dBj) return 'dealer'
  const pv = handValue(playerCards), dv = handValue(dealerCards)
  if (pv > dv) return 'player'
  if (dv > pv) return 'dealer'
  return 'push'
}

export function createGame() {
  return {
    phase: 'betting',
    deck: shuffle(createDeck(6)),
    playerHands: [[]],
    activeHandIndex: 0,
    dealerCards: [],
    dealerHidden: true,
    bet: 0,
    chips: 1000,
    results: [],
    message: '',
    stats: { wins: 0, losses: 0, pushes: 0, blackjacks: 0 },
  }
}

export function deal(game) {
  if (game.bet === 0) return game
  let deck = game.deck.length < 78 ? shuffle(createDeck(6)) : [...game.deck]
  const playerCards = [deck.pop(), deck.pop()]
  const dealerCards = [deck.pop(), deck.pop()]
  const base = {
    ...game, deck,
    playerHands: [playerCards],
    activeHandIndex: 0,
    dealerCards,
    dealerHidden: true,
    chips: game.chips - game.bet,
    phase: 'playing',
    results: [],
    message: '',
  }
  if (isBlackjack(playerCards)) {
    if (isBlackjack(dealerCards)) {
      return { ...base, dealerHidden: false, phase: 'result',
        chips: base.chips + game.bet,
        results: [{ outcome: 'push', payout: game.bet }],
        message: 'Égalité — double Blackjack !',
        stats: { ...game.stats, pushes: game.stats.pushes + 1 } }
    }
    const payout = Math.floor(game.bet * 2.5)
    return { ...base, dealerHidden: false, phase: 'result',
      chips: base.chips + payout,
      results: [{ outcome: 'blackjack', payout }],
      message: `Blackjack ! +${payout - game.bet} jetons`,
      stats: { ...game.stats, wins: game.stats.wins + 1, blackjacks: game.stats.blackjacks + 1 } }
  }
  return base
}

function finishRound(game) {
  let deck = [...game.deck]
  let dealerCards = [...game.dealerCards]
  if (!game.playerHands.every(h => isBust(h))) {
    while (dealerShouldHit(dealerCards)) dealerCards.push(deck.pop())
  }
  const results = game.playerHands.map(hand => {
    const outcome = compareHands(hand, dealerCards)
    let payout = 0
    if (outcome === 'player') payout = game.bet * 2
    else if (outcome === 'push') payout = game.bet
    else if (outcome === 'blackjack') payout = Math.floor(game.bet * 2.5)
    return { outcome, payout }
  })
  const totalPayout = results.reduce((s, r) => s + r.payout, 0)
  const net = totalPayout - game.bet * game.playerHands.length
  const outcomes = results.map(r => r.outcome)
  let message = ''
  if (outcomes.every(o => o === 'push')) message = 'Égalité !'
  else if (outcomes.every(o => o === 'dealer')) message = `Perdu — ${Math.abs(net)} jetons`
  else if (outcomes.every(o => o === 'player' || o === 'blackjack')) message = `Gagné ! +${net} jetons`
  else message = `Résultat mixte : ${net >= 0 ? '+' : ''}${net} jetons`
  const wins = outcomes.filter(o => o === 'player' || o === 'blackjack').length
  const losses = outcomes.filter(o => o === 'dealer').length
  const pushes = outcomes.filter(o => o === 'push').length
  return {
    ...game, deck, dealerCards, dealerHidden: false,
    phase: 'result', chips: game.chips + totalPayout, results, message,
    stats: {
      ...game.stats,
      wins: game.stats.wins + wins,
      losses: game.stats.losses + losses,
      pushes: game.stats.pushes + pushes,
    },
  }
}

function advanceHand(game) {
  const next = game.activeHandIndex + 1
  if (next < game.playerHands.length) return { ...game, activeHandIndex: next }
  return finishRound(game)
}

export function hit(game) {
  if (game.phase !== 'playing') return game
  let deck = [...game.deck]
  const hands = game.playerHands.map(h => [...h])
  hands[game.activeHandIndex] = [...hands[game.activeHandIndex], deck.pop()]
  const updated = { ...game, deck, playerHands: hands }
  const val = handValue(hands[game.activeHandIndex])
  if (val > 21 || val === 21) return advanceHand(updated)
  return updated
}

export function stand(game) {
  if (game.phase !== 'playing') return game
  return advanceHand(game)
}

export function doubleDown(game) {
  if (game.phase !== 'playing') return game
  const activeHand = game.playerHands[game.activeHandIndex]
  if (activeHand.length !== 2 || game.chips < game.bet) return game
  let deck = [...game.deck]
  const hands = game.playerHands.map(h => [...h])
  hands[game.activeHandIndex] = [...hands[game.activeHandIndex], deck.pop()]
  return advanceHand({ ...game, deck, playerHands: hands, chips: game.chips - game.bet, bet: game.bet * 2 })
}

export function splitHand(game) {
  if (game.phase !== 'playing') return game
  const activeHand = game.playerHands[game.activeHandIndex]
  if (!canSplit(activeHand) || game.chips < game.bet) return game
  let deck = [...game.deck]
  const hands = game.playerHands.map(h => [...h])
  const [c1, c2] = activeHand
  hands.splice(game.activeHandIndex, 1, [c1, deck.pop()], [c2, deck.pop()])
  return { ...game, deck, playerHands: hands, chips: game.chips - game.bet }
}

export function newRound(game) {
  return {
    ...game,
    phase: 'betting',
    playerHands: [[]],
    activeHandIndex: 0,
    dealerCards: [],
    dealerHidden: true,
    bet: 0,
    results: [],
    message: '',
  }
}

export function getHint(playerCards, dealerUpcard) {
  if (!playerCards || playerCards.length < 2 || !dealerUpcard) return null
  const val = handValue(playerCards)
  const soft = isSoft(playerCards)
  const pair = canSplit(playerCards)
  const dv = dealerUpcard.rank === 'A' ? 11
    : ['J','Q','K'].includes(dealerUpcard.rank) ? 10
    : parseInt(dealerUpcard.rank)

  if (pair) {
    const r = ['J','Q','K'].includes(playerCards[0].rank) ? '10' : playerCards[0].rank
    if (r === 'A') return { action: 'split', text: 'Toujours séparer les As — chaque main repart avec une excellente carte.' }
    if (r === '8') return { action: 'split', text: 'Toujours séparer les 8 — 16 est une mauvaise main, deux mains de 8 sont bien meilleures.' }
    if (r === '10') return { action: 'stand', text: 'Ne jamais séparer les 10. Rester sur 20, c\'est presque imbattable.' }
    if (r === '5') return { action: 'double', text: 'Ne pas séparer les 5 — traitez-les comme un 10 et doublez si possible.' }
    if (r === '4') {
      if (dv === 5 || dv === 6) return { action: 'split', text: 'Séparez les 4 contre un 5 ou 6 du croupier.' }
      return { action: 'hit', text: 'Tirez avec 4-4 contre ce croupier — deux mains de 4 sont trop faibles.' }
    }
    if (r === '9') {
      if ([7, 10, 11].includes(dv)) return { action: 'stand', text: 'Restez sur 18 contre ce croupier fort — c\'est une bonne main.' }
      return { action: 'split', text: 'Séparez les 9 pour avoir deux mains prometteuses.' }
    }
    if (r === '7') {
      if (dv >= 2 && dv <= 7) return { action: 'split', text: 'Séparez les 7 contre un croupier de 2 à 7.' }
      return { action: 'hit', text: 'Tirez avec 7-7 contre ce croupier fort.' }
    }
    if (r === '6') {
      if (dv >= 2 && dv <= 6) return { action: 'split', text: 'Séparez les 6 contre un croupier faible.' }
      return { action: 'hit', text: 'Tirez avec 6-6 contre ce croupier — séparer serait risqué.' }
    }
    if (r === '2' || r === '3') {
      if (dv >= 2 && dv <= 7) return { action: 'split', text: `Séparez les ${r} contre un croupier de 2 à 7.` }
      return { action: 'hit', text: `Tirez avec ${r}-${r} contre ce croupier fort.` }
    }
  }

  if (soft) {
    if (val >= 19) return { action: 'stand', text: `Restez sur ${val} souple — c'est une très bonne main.` }
    if (val === 18) {
      if (dv >= 2 && dv <= 6) return { action: 'double', text: 'Doublez sur As-7 contre un croupier faible.' }
      if (dv === 7 || dv === 8) return { action: 'stand', text: 'Restez sur As-7 (18) contre 7 ou 8 — c\'est suffisant.' }
      return { action: 'hit', text: 'Tirez sur As-7 contre ce croupier fort.' }
    }
    if (val === 17) {
      if (dv >= 3 && dv <= 6) return { action: 'double', text: 'Doublez sur As-6 contre un croupier faible.' }
      return { action: 'hit', text: 'Tirez sur As-6 — vous ne pouvez pas dépasser 21 avec un As souple.' }
    }
    if (val >= 15 && val <= 16) {
      if (dv >= 4 && dv <= 6) return { action: 'double', text: 'Doublez sur cette main souple contre un croupier faible.' }
      return { action: 'hit', text: 'Tirez — cette main souple est safe, l\'As protège de tout dépassement.' }
    }
    return { action: 'hit', text: 'Tirez — vous ne risquez pas de dépasser 21 grâce à l\'As souple.' }
  }

  if (val >= 17) return { action: 'stand', text: `Restez sur ${val} — tirer serait trop risqué.` }
  if (val >= 13) {
    if (dv >= 2 && dv <= 6) return { action: 'stand', text: `Restez sur ${val} — le croupier risque lui-même de dépasser 21.` }
    return { action: 'hit', text: `Tirez sur ${val} contre ce croupier fort.` }
  }
  if (val === 12) {
    if (dv >= 4 && dv <= 6) return { action: 'stand', text: 'Restez sur 12 — laissez le croupier prendre le risque.' }
    return { action: 'hit', text: 'Tirez sur 12 contre ce croupier.' }
  }
  if (val === 11) {
    if (dv <= 10) return { action: 'double', text: 'Doublez sur 11 — c\'est la meilleure situation pour doubler !' }
    return { action: 'hit', text: 'Tirez sur 11 contre un As du croupier.' }
  }
  if (val === 10) {
    if (dv <= 9) return { action: 'double', text: 'Doublez sur 10 contre ce croupier faible.' }
    return { action: 'hit', text: 'Tirez sur 10 contre un croupier fort.' }
  }
  if (val === 9) {
    if (dv >= 3 && dv <= 6) return { action: 'double', text: 'Doublez sur 9 contre ce croupier faible.' }
    return { action: 'hit', text: 'Tirez sur 9 contre ce croupier.' }
  }
  return { action: 'hit', text: `Tirez sur ${val} — vous êtes loin de 21.` }
}
