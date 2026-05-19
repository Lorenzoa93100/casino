export const WHEEL_SEQUENCE = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]
export const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])

export function getColor(n) {
  if (n === 0) return 'green'
  return RED_NUMBERS.has(n) ? 'red' : 'black'
}

export function spinWheel() {
  return Math.floor(Math.random() * 37)
}

export function matchesBet(bet, result) {
  const c = getColor(result)
  switch (bet.type) {
    case 'straight': return bet.numbers[0] === result
    case 'split': return bet.numbers.includes(result)
    case 'street': return bet.numbers.includes(result)
    case 'corner': return bet.numbers.includes(result)
    case 'line': return bet.numbers.includes(result)
    case 'column': {
      if (result === 0) return false
      const col = bet.numbers[0]
      return (result % 3) === (col % 3) && result !== 0
    }
    case 'dozen': {
      if (result === 0) return false
      const [lo, hi] = bet.numbers
      return result >= lo && result <= hi
    }
    case 'red': return c === 'red'
    case 'black': return c === 'black'
    case 'even': return result !== 0 && result % 2 === 0
    case 'odd': return result !== 0 && result % 2 === 1
    case 'low': return result >= 1 && result <= 18
    case 'high': return result >= 19 && result <= 36
    default: return false
  }
}

export function getPayout(betType) {
  const payouts = {
    straight: 35, split: 17, street: 11, corner: 8, line: 5,
    column: 2, dozen: 2, red: 1, black: 1, even: 1, odd: 1, low: 1, high: 1,
  }
  return payouts[betType] ?? 1
}

export function evaluateBets(bets, result) {
  let net = 0
  const breakdown = []
  for (const bet of bets) {
    if (matchesBet(bet, result)) {
      const payout = getPayout(bet.type)
      const gain = bet.amount * payout
      net += gain
      breakdown.push({ bet, won: true, gain })
    } else {
      net -= bet.amount
      breakdown.push({ bet, won: false, gain: -bet.amount })
    }
  }
  return { net, breakdown }
}

export function explainResult(result, breakdown) {
  const c = getColor(result)
  const colorFr = c === 'green' ? 'zéro' : c === 'red' ? 'rouge' : 'noir'
  const dozen = result === 0 ? null : result <= 12 ? '1ère douzaine' : result <= 24 ? '2ème douzaine' : '3ème douzaine'
  const col = result === 0 ? null : result % 3 === 1 ? '1ère colonne' : result % 3 === 2 ? '2ème colonne' : '3ème colonne'

  const lines = [`Le numéro sorti est le **${result}** (${colorFr}${result !== 0 ? `, ${result % 2 === 0 ? 'pair' : 'impair'}, ${result <= 18 ? 'manque' : 'passe'}` : ''}).`]
  if (dozen) lines.push(`Il appartient à la ${dozen} et à la ${col}.`)

  for (const { bet, won, gain } of breakdown) {
    const sign = gain > 0 ? `+${gain}` : `${gain}`
    lines.push(`${won ? '✅' : '❌'} Mise "${bet.label}" (${bet.amount}€) → ${sign}€`)
  }
  return lines
}

export const BET_TYPES = [
  { type: 'red',    label: 'Rouge',        payout: '1:1' },
  { type: 'black',  label: 'Noir',         payout: '1:1' },
  { type: 'even',   label: 'Pair',         payout: '1:1' },
  { type: 'odd',    label: 'Impair',       payout: '1:1' },
  { type: 'low',    label: 'Manque (1-18)',payout: '1:1' },
  { type: 'high',   label: 'Passe (19-36)',payout: '1:1' },
  { type: 'dozen',  label: '1ère douzaine',payout: '2:1', numbers: [1,12] },
  { type: 'dozen',  label: '2ème douzaine',payout: '2:1', numbers: [13,24] },
  { type: 'dozen',  label: '3ème douzaine',payout: '2:1', numbers: [25,36] },
  { type: 'straight',label: 'Plein',       payout: '35:1' },
]
