/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/purity */
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { createPaneTexture } from './paneTextures.js'
import { stepFor } from './phoneConfig.js'

const PANES = ['browse', 'slot', 'pay', 'track']

// phone dimensions (world units)
const BW = 0.98 // body width
const BH = 1.96 // body height
const BR = 0.15 // corner radius
const BEV = 0.018 // edge bevel
const BD = 0.049 // flat band thickness (total thickness = BD + 2 * BEV)
const ZF = BD / 2 + BEV // front surface z

// screen
const PW = 0.93
const PH = 1.898

// dynamic island canvas
const IW = 660
const IH = 150

const { damp, lerp, clamp } = THREE.MathUtils
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1)
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function roundedRect(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

function usePhoneGeometry() {
  return useMemo(() => {
    const frame = new THREE.ExtrudeGeometry(roundedRect(BW - 2 * BEV, BH - 2 * BEV, BR - BEV), {
      depth: BD,
      bevelEnabled: true,
      bevelThickness: BEV,
      bevelSize: BEV,
      bevelSegments: 8,
      curveSegments: 64,
    })
    frame.translate(0, 0, -BD / 2)

    const plate = (inset, r, depth) =>
      new THREE.ExtrudeGeometry(roundedRect(BW - inset * 2, BH - inset * 2, r), {
        depth,
        bevelEnabled: false,
        curveSegments: 64,
      })

    const camPlate = new THREE.ExtrudeGeometry(roundedRect(0.4, 0.4, 0.095), {
      depth: 0.018,
      bevelEnabled: false,
      curveSegments: 32,
    })

    return {
      frame,
      front: plate(0.008, BR - 0.008, 0.002),
      back: plate(0.016, BR - 0.016, 0.002),
      camPlate,
    }
  }, [])
}

/* ---------- Dynamic Island ---------- */

function drawIsland(ctx, index, k, t) {
  ctx.clearRect(0, 0, IW, IH)
  const w = lerp(300, 600, k)
  const h = lerp(88, 130, k)
  const x = (IW - w) / 2
  const y = 0
  const cy = y + h / 2

  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, lerp(44, 52, k))
  ctx.fill()

  // camera lens, visible while the island is collapsed
  if (k < 0.5) {
    ctx.globalAlpha = 1 - k * 2
    ctx.fillStyle = '#0d1018'
    ctx.beginPath()
    ctx.arc(x + w - 40, cy, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1b2130'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const a = clamp((k - 0.55) / 0.45, 0, 1)
  if (a <= 0) return
  ctx.globalAlpha = a

  const text = (str, tx, ty, size, weight, color, align = 'left') => {
    ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(str, tx, ty)
  }

  if (index === 0) {
    ctx.fillStyle = '#7FB39C'
    ctx.beginPath()
    ctx.arc(x + 50, cy, 9 + Math.sin(t * 3) * 2, 0, Math.PI * 2)
    ctx.fill()
    text('Live availability', x + 80, cy + 10, 30, 600, '#ECE8E1')
    text('6 open', x + w - 36, cy + 10, 30, 600, '#C9A66B', 'right')
  } else if (index === 1) {
    const rem = 600 - (t % 600)
    ctx.lineWidth = 7
    ctx.strokeStyle = '#2A303B'
    ctx.beginPath()
    ctx.arc(x + 58, cy, 28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#C9A66B'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x + 58, cy, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (rem / 600))
    ctx.stroke()
    text('Slot held', x + 108, cy - 2, 30, 600, '#ECE8E1')
    text('Basketball Court', x + 108, cy + 26, 22, 400, '#9AA1AE')
    const m = String(Math.floor(rem / 60)).padStart(2, '0')
    const s = String(Math.floor(rem % 60)).padStart(2, '0')
    text(`${m}:${s}`, x + w - 36, cy + 12, 34, 700, '#C9A66B', 'right')
  } else if (index === 2) {
    ctx.lineWidth = 7
    ctx.strokeStyle = '#2A303B'
    ctx.beginPath()
    ctx.arc(x + 58, cy, 26, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#C9A66B'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x + 58, cy, 26, t * 5, t * 5 + 4.2)
    ctx.stroke()
    text('Processing', x + 108, cy - 2, 30, 600, '#ECE8E1')
    text('₹100 · Razorpay', x + 108, cy + 26, 22, 400, '#9AA1AE')
  } else {
    ctx.fillStyle = '#4F7F6B'
    ctx.beginPath()
    ctx.arc(x + 58, cy, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 45, cy + 1)
    ctx.lineTo(x + 54, cy + 11)
    ctx.lineTo(x + 72, cy - 10)
    ctx.stroke()
    text('Checked in', x + 108, cy - 2, 30, 600, '#ECE8E1')
    text('CC-4F7K2A', x + 108, cy + 26, 22, 400, '#9AA1AE')
  }
  ctx.globalAlpha = 1
}

function Island({ index, live }) {
  const matRef = useRef()
  const k = useRef(0)
  const settled = useRef(false)

  const { ctx, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = IW
    canvas.height = IH
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return { ctx: canvas.getContext('2d'), tex: t }
  }, [])

  useEffect(() => () => tex.dispose(), [tex])

  useFrame((st, dt) => {
    const want = live.current.active === index ? 1 : 0
    k.current = damp(k.current, want, 7, dt)
    if (matRef.current) matRef.current.opacity = live.current.op[index]

    const collapsed = k.current < 0.002 && want === 0
    if (collapsed && settled.current) return // nothing to redraw
    settled.current = collapsed
    drawIsland(ctx, index, collapsed ? 0 : k.current, st.clock.elapsedTime)
    tex.needsUpdate = true
  })

  return (
    <mesh position={[0, PH / 2 - 0.1, 0.002]}>
      <planeGeometry args={[IW / 1000, IH / 1000]} />
      <meshBasicMaterial ref={matRef} map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

/* ---------- Phone ---------- */

function Phone({ progress }) {
  const outer = useRef()
  const inner = useRef()
  const panes = useRef([])
  const planeMats = useRef([])
  const state = useRef({ p: 0, op: [1, 1, 1, 1], x: [0, 0, 0, 0], sc: [1, 1, 1, 1] })
  const live = useRef({ active: -1, op: [1, 1, 1, 1] })

  const geo = usePhoneGeometry()
  const textures = useMemo(() => PANES.map((k) => createPaneTexture(k)), [])

  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) textures.forEach((t) => t.redraw())
    })
    return () => {
      alive = false
      textures.forEach((t) => t.texture.dispose())
    }
  }, [textures])

  useFrame((st, dt) => {
    const s = state.current
    s.p = damp(s.p, progress.current, 4, dt)
    const p = s.p

    const a = ease(seg(p, 0, 0.2))
    const e = ease(seg(p, 0.2, 0.38))
    const c = seg(p, 0.38, 1)
    const wide = st.size.width >= 900

    const o = outer.current
    o.rotation.y = lerp(0.5, 0.15, a) - 0.7 * e + 0.45 * c
    o.rotation.x = lerp(0.12, 0, a) + 0.08 * e - 0.08 * c
    o.position.x = wide ? 1.3 : 0
    o.position.y = (wide ? 0 : 0.6) + Math.sin(st.clock.elapsedTime * 0.8) * 0.04
    o.scale.setScalar((wide ? 1.2 : 0.8) * lerp(0.9, 1, a))

    inner.current.position.z = -0.9 * e

    const active = stepFor(p) - 1
    live.current.active = active
    live.current.op = s.op

    PANES.forEach((_, i) => {
      const stackZ = 0.05 + (3 - i) * 0.006
      const expZ = 0.22 + (3 - i) * 0.5
      const g = panes.current[i]
      g.position.z = lerp(stackZ, expZ, e)

      const peeled = active > i
      const behind = active >= 0 && active < i
      s.op[i] = damp(s.op[i], peeled ? 0 : behind ? 0.3 : 1, 5, dt)
      s.x[i] = damp(s.x[i], peeled ? 2.2 : 0, 3.5, dt)
      s.sc[i] = damp(s.sc[i], active === i ? 1.04 : 1, 6, dt)

      g.position.x = s.x[i]
      g.scale.setScalar(s.sc[i])
      g.visible = s.op[i] > 0.01
      if (planeMats.current[i]) planeMats.current[i].opacity = s.op[i]
    })
  })

  return (
    <group ref={outer}>
      <group ref={inner}>
        {/* brass frame: rounded outline extruded with a smooth bevel */}
        <mesh geometry={geo.frame}>
          <meshPhysicalMaterial
            color="#B08D57"
            metalness={1}
            roughness={0.22}
            clearcoat={0.5}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* black front glass */}
        <mesh geometry={geo.front} position={[0, 0, ZF]}>
          <meshStandardMaterial color="#05070b" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* dark glass back */}
        <mesh geometry={geo.back} position={[0, 0, -ZF - 0.002]}>
          <meshPhysicalMaterial color="#12151c" roughness={0.25} metalness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
        </mesh>

        {/* camera plate with three lenses */}
        <group position={[-0.23, BH / 2 - 0.27, -ZF - 0.002]}>
          <mesh geometry={geo.camPlate} position={[0, 0, -0.018]}>
            <meshPhysicalMaterial color="#1d212b" roughness={0.3} metalness={0.4} clearcoat={0.8} />
          </mesh>
          {[
            [-0.085, 0.085],
            [-0.085, -0.085],
            [0.085, 0],
          ].map(([x, y], k) => (
            <group key={k} position={[x, y, -0.018]}>
              <mesh>
                <torusGeometry args={[0.056, 0.009, 16, 48]} />
                <meshStandardMaterial color="#B08D57" metalness={1} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0, -0.004]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.012, 40]} />
                <meshStandardMaterial color="#06080c" metalness={0.9} roughness={0.12} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.1, 0.13, -0.018]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.008, 24]} />
            <meshStandardMaterial color="#e8dcc0" roughness={0.4} />
          </mesh>
        </group>

        {/* side buttons */}
        {[
          [-BW / 2 - 0.002, 0.55, 0.06], // action button
          [-BW / 2 - 0.002, 0.38, 0.12], // volume up
          [-BW / 2 - 0.002, 0.2, 0.12], // volume down
          [BW / 2 + 0.002, 0.4, 0.2], // power
        ].map(([x, y, len], k) => (
          <RoundedBox key={k} args={[0.016, len, 0.03]} radius={0.007} smoothness={3} position={[x, y, 0]}>
            <meshStandardMaterial color="#8A6A38" metalness={1} roughness={0.3} />
          </RoundedBox>
        ))}

        {/* the four app screens, each with its own live Dynamic Island */}
        {PANES.map((k, i) => (
          <group
            key={k}
            ref={(el) => {
              panes.current[i] = el
            }}
          >
            <mesh>
              <planeGeometry args={[PW, PH]} />
              <meshBasicMaterial
                ref={(el) => {
                  planeMats.current[i] = el
                }}
                map={textures[i].texture}
                transparent
                toneMapped={false}
              />
            </mesh>
            <Island index={i} live={live} />
          </group>
        ))}
      </group>
    </group>
  )
}

export default function PhoneScene({ progress, active }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35, near: 1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#ffe6bf" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} color="#ffe2b0" position={[-4, 3, 3]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2} color="#8FA3D1" position={[4, -1, 2]} scale={[5, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={3} color="#ffffff" position={[0, 4, -3]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, -3, 4]} scale={[8, 1, 1]} target={[0, 0, 0]} />
      </Environment>
      <Phone progress={progress} />
    </Canvas>
  )
}