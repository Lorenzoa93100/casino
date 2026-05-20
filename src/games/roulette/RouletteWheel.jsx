import { useEffect, useRef, useState } from 'react'
import { WHEEL_SEQUENCE, getColor } from './engine.js'

const ANIM_CSS = `
@keyframes roulBallOrbit {
  from { transform: rotate(0deg) translateX(105px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(105px) rotate(-360deg); }
}
@keyframes roulBallSettle {
  from { transform: rotate(0deg) translateX(105px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(95px) rotate(-360deg); }
}
@keyframes roulIndicatorPulse {
  0%,100% { opacity:1; transform: scaleY(1); }
  50%      { opacity:0.6; transform: scaleY(1.3); }
}
`

const SIZE = 320
const CX = SIZE / 2
const CY = SIZE / 2
const R_OUTER = 148
const R_INNER = 74
const R_TEXT  = 114
const SEG_COUNT = WHEEL_SEQUENCE.length // 37

function segPath(i, total, rOuter, rInner) {
  const step = (2 * Math.PI) / total
  const start = i * step - Math.PI / 2
  const end   = start + step
  const x1 = CX + rOuter * Math.cos(start)
  const y1 = CY + rOuter * Math.sin(start)
  const x2 = CX + rOuter * Math.cos(end)
  const y2 = CY + rOuter * Math.sin(end)
  const x3 = CX + rInner * Math.cos(end)
  const y3 = CY + rInner * Math.sin(end)
  const x4 = CX + rInner * Math.cos(start)
  const y4 = CY + rInner * Math.sin(start)
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`
}

const SEGMENTS = WHEEL_SEQUENCE.map((num, i) => {
  const step = (2 * Math.PI) / SEG_COUNT
  const mid  = i * step - Math.PI / 2 + step / 2
  return {
    num,
    color: getColor(num),
    path: segPath(i, SEG_COUNT, R_OUTER, R_INNER),
    tx: CX + R_TEXT * Math.cos(mid),
    ty: CY + R_TEXT * Math.sin(mid),
    rot: (mid * 180) / Math.PI + 90,
  }
})

const SEG_COLORS = { green: '#16a34a', red: '#dc2626', black: '#1a1a1a' }
const SEG_BORDER = { green: '#15803d', red: '#b91c1c', black: '#000' }

export default function RouletteWheel({ spinning, result, onSpinEnd }) {
  const [angle, setAngle] = useState(0)
  const angleRef = useRef(0)
  const [ballSpinning, setBallSpinning] = useState(false)
  const [ballSettled, setBallSettled] = useState(false)
  const onSpinEndRef = useRef(onSpinEnd)
  useEffect(() => { onSpinEndRef.current = onSpinEnd })

  useEffect(() => {
    if (!spinning || result === null) return

    const idx = WHEEL_SEQUENCE.indexOf(result)
    const step = 360 / SEG_COUNT
    const segAngle = idx * step + step / 2

    // 5 tours complets + décalage pour amener le résultat sous l'indicateur (12h)
    const extra = (360 - segAngle + 360) % 360
    const target = angleRef.current + 5 * 360 + extra
    angleRef.current = target
    setAngle(target)
    setBallSpinning(true)
    setBallSettled(false)

    const timer = setTimeout(() => {
      setBallSpinning(false)
      setBallSettled(true)
      onSpinEndRef.current?.()
    }, 5800)

    return () => clearTimeout(timer)
  }, [spinning, result])

  return (
    <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
      <style>{ANIM_CSS}</style>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block' }}>
        <circle cx={CX} cy={CY} r={R_OUTER + 6} fill="#8B6914" />
        <circle cx={CX} cy={CY} r={R_OUTER + 3} fill="#c9a227" />

        {/* Spinning group */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? 'transform 5.5s cubic-bezier(0.17,0.67,0.08,1)' : 'none',
          }}
        >
          {SEGMENTS.map(({ num, color, path, tx, ty, rot }, i) => (
            <g key={i}>
              <path d={path} fill={SEG_COLORS[color]} stroke={SEG_BORDER[color]} strokeWidth="0.5" />
              <text
                x={tx} y={ty}
                textAnchor="middle" dominantBaseline="middle"
                fill={color === 'black' ? '#e5e7eb' : '#fff'}
                fontSize="9"
                fontWeight="700"
                transform={`rotate(${rot},${tx},${ty})`}
                style={{ pointerEvents: 'none' }}
              >
                {num}
              </text>
            </g>
          ))}

          {/* Inner hub */}
          <circle cx={CX} cy={CY} r={R_INNER} fill="#1c1c1c" stroke="#8B6914" strokeWidth="3" />
          <circle cx={CX} cy={CY} r={R_INNER - 8} fill="radial-gradient(circle,#2a2a2a,#111)" />

          {/* Spokes */}
          {[0,60,120,180,240,300].map(a => {
            const rad = (a * Math.PI) / 180
            return (
              <line key={a}
                x1={CX + (R_INNER - 2) * Math.cos(rad)} y1={CY + (R_INNER - 2) * Math.sin(rad)}
                x2={CX + (R_INNER - 14) * Math.cos(rad)} y2={CY + (R_INNER - 14) * Math.sin(rad)}
                stroke="#c9a227" strokeWidth="1.5" opacity="0.6"
              />
            )
          })}
          <circle cx={CX} cy={CY} r={8} fill="#c9a227" />
          <circle cx={CX} cy={CY} r={4} fill="#8B6914" />
        </g>

        {/* Fixed indicator arrow at top */}
        <polygon
          points={`${CX - 7},${CY - R_OUTER - 12} ${CX + 7},${CY - R_OUTER - 12} ${CX},${CY - R_OUTER + 2}`}
          fill="#c9a227"
          style={{ animation: spinning ? 'roulIndicatorPulse 0.4s ease-in-out infinite' : 'none' }}
        />
      </svg>

      {/* Ball — orbits outside wheel during spin, settles in segment after */}
      {spinning && ballSpinning && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 12, height: 12,
          marginTop: -6, marginLeft: -6,
          animation: 'roulBallOrbit 0.35s linear infinite',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 12, height: 12,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fff 0%, #ccc 60%, #888 100%)',
            boxShadow: '0 0 4px rgba(255,255,255,0.6)',
          }} />
        </div>
      )}
      {ballSettled && result !== null && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 12, height: 12,
          marginTop: -6, marginLeft: -6,
          transform: 'rotate(-90deg) translateX(100px)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 12, height: 12,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fff 0%, #ccc 60%, #888 100%)',
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
          }} />
        </div>
      )}
    </div>
  )
}
