import { useEffect, useRef, useState } from 'react'
import { WHEEL_SEQUENCE, getColor } from './engine.js'

const ANIM_CSS = `
@keyframes roulIndicatorPulse {
  0%,100% { opacity:1; transform:scaleY(1); }
  50%      { opacity:0.6; transform:scaleY(1.3); }
}
`

const SIZE = 320
const CX   = SIZE / 2
const CY   = SIZE / 2
const R_OUTER  = 148
const R_INNER  = 74
const R_TEXT   = 114
const R_TRACK  = 132   // outer groove — fast ball orbit radius
const R_POCKET = 88    // inner pocket  — where the ball comes to rest
const SEG_COUNT    = WHEEL_SEQUENCE.length          // 37
const SEG_ANGLE_RAD = (2 * Math.PI) / SEG_COUNT    // ≈ 0.1698 rad

// ─── Ball physics ─────────────────────────────────────────────────────────────
// Exponential friction model: v[n] = v0 * FRICTION^n
// Total angle after N frames: v0 * (1 − FRICTION^N) / (1 − FRICTION)
const FRICTION     = 0.988   // velocity multiplier per frame at ~60 fps
const TOTAL_FRAMES = 340     // ≈ 5.67 s — ends after the 5.5 s wheel CSS transition
const MIN_ROTATIONS = 8      // minimum full turns before settling

// Ball ends at 3π/2 = top of SVG (12 o'clock), directly under the indicator arrow.
// In SVG coords (y-down): cos(3π/2)=0, sin(3π/2)=−1  →  (CX, CY − r)  = top ✓
const FINAL_THETA = 3 * Math.PI / 2

function computeV0() {
  const norm        = ((FINAL_THETA % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const totalAngle  = MIN_ROTATIONS * 2 * Math.PI + norm
  const multiplier  = (1 - Math.pow(FRICTION, TOTAL_FRAMES)) / (1 - FRICTION)
  return totalAngle / multiplier   // ≈ 0.671 rad / frame  ≈ 6.4 rot/s
}
const V0 = computeV0()

// ─── Wheel geometry ───────────────────────────────────────────────────────────
function segPath(i, total, rOuter, rInner) {
  const step  = (2 * Math.PI) / total
  const start = i * step - Math.PI / 2
  const end   = start + step
  const x1 = CX + rOuter * Math.cos(start), y1 = CY + rOuter * Math.sin(start)
  const x2 = CX + rOuter * Math.cos(end),   y2 = CY + rOuter * Math.sin(end)
  const x3 = CX + rInner * Math.cos(end),   y3 = CY + rInner * Math.sin(end)
  const x4 = CX + rInner * Math.cos(start), y4 = CY + rInner * Math.sin(start)
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
  const [wheelAngle, setWheelAngle] = useState(0)
  const wheelAngleRef = useRef(0)
  const [ballPos, setBallPos] = useState(null)   // { cx, cy, r } | null
  const rafRef     = useRef(null)
  const onSpinEndRef = useRef(onSpinEnd)
  useEffect(() => { onSpinEndRef.current = onSpinEnd })

  useEffect(() => {
    if (!spinning || result === null) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    // ── Wheel target rotation ─────────────────────────────────────────────────
    const idx         = WHEEL_SEQUENCE.indexOf(result)
    const stepDeg     = 360 / SEG_COUNT
    const segAngleDeg = idx * stepDeg + stepDeg / 2
    // Compensate for accumulated rotation so the winning segment always ends at 12 o'clock.
    // Without subtracting currentAngle every spin after the first lands on the wrong segment.
    const currentAngle = wheelAngleRef.current % 360
    const extra        = ((360 - segAngleDeg) - currentAngle + 720) % 360
    const wheelTarget  = wheelAngleRef.current + 5 * 360 + extra
    wheelAngleRef.current = wheelTarget
    setWheelAngle(wheelTarget)
    setBallPos(null)

    // ── Ball physics loop ─────────────────────────────────────────────────────
    let theta      = 0      // ball angle (rad), starts at 3 o'clock (arbitrary)
    let v          = V0     // current angular velocity (rad / frame)
    let frameCount = 0
    let stopped    = false

    function frame() {
      if (stopped) return

      theta += v
      v     *= FRICTION
      frameCount++

      const vRatio = v / V0   // 1.0 → ~0.017 at the last frame

      // Radius: outer groove when fast, pocket when slow
      const r = R_POCKET + (R_TRACK - R_POCKET) * Math.pow(vRatio, 0.5)

      // Visual bounce: subtle sinusoidal oscillation between pocket walls at low speed.
      // Applied only to the DISPLAY angle so the physics (landing position) stay exact.
      let displayTheta = theta
      if (vRatio < 0.13) {
        const posInSeg   = ((theta % SEG_ANGLE_RAD) + SEG_ANGLE_RAD) % SEG_ANGLE_RAD
        const normalized = posInSeg / SEG_ANGLE_RAD   // 0 → 1 within one segment
        const intensity  = (0.13 - vRatio) / 0.13    // 0 → 1 as ball slows
        // peaks at centre of each segment, dips at dividers → simulates bouncing off frets
        displayTheta = theta + Math.sin(normalized * Math.PI * 2) * 0.028 * intensity
      }

      // Ball size: very slightly larger at high speed (motion blur substitute)
      setBallPos({
        cx: CX + r * Math.cos(displayTheta),
        cy: CY + r * Math.sin(displayTheta),
        r: 5 + vRatio * 2,
      })

      if (frameCount >= TOTAL_FRAMES) {
        stopped = true
        // Hard-snap to exact pocket position (offset is < 1.5° at this point)
        setBallPos({
          cx: CX + R_POCKET * Math.cos(FINAL_THETA),
          cy: CY + R_POCKET * Math.sin(FINAL_THETA),
          r: 5,
        })
        onSpinEndRef.current?.()
        return
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [spinning, result])

  return (
    // perspective container — gives depth to the rotateX child
    <div style={{ userSelect: 'none', display: 'inline-block', perspective: '700px' }}>
      {/* 3-D tilt: wheel looks like a disc on a casino table */}
      <div style={{ display: 'inline-block', transform: 'rotateX(46deg)', transformOrigin: '50% 50%' }}>
        <style>{ANIM_CSS}</style>

        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block' }}>
          <defs>
            <radialGradient id="rlBallGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#ffffff" />
              <stop offset="50%"  stopColor="#e2e2e2" />
              <stop offset="100%" stopColor="#8a8a8a" />
            </radialGradient>
            <filter id="rlBallShadow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Wooden outer rim */}
          <circle cx={CX} cy={CY} r={R_OUTER + 9} fill="#3d1f00" />
          <circle cx={CX} cy={CY} r={R_OUTER + 6} fill="#7a5200" />
          <circle cx={CX} cy={CY} r={R_OUTER + 3} fill="#c9a227" />

          {/* Ball track groove */}
          <circle cx={CX} cy={CY} r={R_TRACK + 3} fill="none" stroke="#2a1400" strokeWidth="5" />
          <circle cx={CX} cy={CY} r={R_TRACK}     fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

          {/* ── Spinning group ─────────────────────────────────────────────── */}
          <g style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform:   `rotate(${wheelAngle}deg)`,
            transition: spinning ? 'transform 5.5s cubic-bezier(0.17,0.67,0.08,1)' : 'none',
          }}>
            {SEGMENTS.map(({ num, color, path, tx, ty, rot }, i) => (
              <g key={i}>
                <path d={path} fill={SEG_COLORS[color]} stroke={SEG_BORDER[color]} strokeWidth="0.5" />
                <text
                  x={tx} y={ty}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={color === 'black' ? '#e5e7eb' : '#fff'}
                  fontSize="9" fontWeight="700"
                  transform={`rotate(${rot},${tx},${ty})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {num}
                </text>
              </g>
            ))}

            {/* Hub */}
            <circle cx={CX} cy={CY} r={R_INNER}     fill="#1c1c1c" stroke="#8B6914" strokeWidth="3" />
            <circle cx={CX} cy={CY} r={R_INNER - 8} fill="#242424" />

            {/* Spokes */}
            {[0, 60, 120, 180, 240, 300].map(a => {
              const rad = (a * Math.PI) / 180
              return (
                <line key={a}
                  x1={CX + (R_INNER - 2) * Math.cos(rad)}  y1={CY + (R_INNER - 2) * Math.sin(rad)}
                  x2={CX + (R_INNER - 14) * Math.cos(rad)} y2={CY + (R_INNER - 14) * Math.sin(rad)}
                  stroke="#c9a227" strokeWidth="1.5" opacity="0.6"
                />
              )
            })}
            <circle cx={CX} cy={CY} r={8} fill="#c9a227" />
            <circle cx={CX} cy={CY} r={4} fill="#8B6914" />
          </g>

          {/* ── Ball (SVG circle — lives in same tilted plane as the wheel) ── */}
          {ballPos && (
            <circle
              cx={ballPos.cx}
              cy={ballPos.cy}
              r={ballPos.r}
              fill="url(#rlBallGrad)"
              filter="url(#rlBallShadow)"
            />
          )}

          {/* ── Fixed indicator arrow at top (far end in 3-D view) ─────────── */}
          <polygon
            points={`${CX - 7},${CY - R_OUTER - 12} ${CX + 7},${CY - R_OUTER - 12} ${CX},${CY - R_OUTER + 2}`}
            fill="#c9a227"
            style={{ animation: spinning ? 'roulIndicatorPulse 0.4s ease-in-out infinite' : 'none' }}
          />
        </svg>
      </div>
    </div>
  )
}
