import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import { MathUtils } from 'three'

// Liquid brass blob that leans toward the cursor
function Blob({ low, reduce }) {
  const mesh = useRef()

  useFrame((state, delta) => {
    if (reduce) return
    mesh.current.rotation.y = MathUtils.damp(mesh.current.rotation.y, state.pointer.x * 0.7, 3, delta)
    mesh.current.rotation.x = MathUtils.damp(mesh.current.rotation.x, -state.pointer.y * 0.45, 3, delta)
  })

  return (
    <Float speed={reduce ? 0 : 1.4} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.5, low ? 12 : 24]} />
        <MeshDistortMaterial
          color="#b08d57"
          metalness={1}
          roughness={0.16}
          distort={0.38}
          speed={reduce ? 0 : 1.6}
          envMapIntensity={1.25}
        />
      </mesh>
    </Float>
  )
}

// Small brass and ink spheres orbiting the blob
function Orbiters({ count = 7, reduce }) {
  const group = useRef()

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return { a, r: 2.6 + (i % 3) * 0.45, y: Math.sin(i * 1.7) * 0.9, s: 0.12 + (i % 3) * 0.06 }
      }),
    [count]
  )

  useFrame((_, delta) => {
    if (!reduce) group.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={[Math.cos(it.a) * it.r, it.y, Math.sin(it.a) * it.r]} scale={it.s}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={i % 2 ? '#1e2a4a' : '#d9b97f'}
            metalness={i % 2 ? 0.25 : 1}
            roughness={i % 2 ? 0.15 : 0.25}
            clearcoat={1}
          />
        </mesh>
      ))}
    </group>
  )
}

// A warm light that follows the cursor, creating glints on the brass
function PointerLight() {
  const light = useRef()
  useFrame(({ pointer, viewport }) => {
    light.current.position.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 3)
  })
  return <pointLight ref={light} intensity={40} distance={12} decay={2} color="#ffe2b0" />
}

function Scene({ low, reduce }) {
  const { viewport } = useThree()
  const wide = viewport.aspect > 1.1
  const scale = Math.min(1, viewport.width / 4.2)

  return (
    <>
      <ambientLight intensity={0.2} />
      <PointerLight />

      {/* Studio reflections made from light panels, with no external files to download */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[-5, 2, -2]} scale={[8, 3, 1]} color="#ffd9a0" target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.5} position={[5, -1, 3]} scale={[6, 2, 1]} color="#8fa3d1" target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={3} position={[0, 4, 2]} scale={3} color="#ffffff" target={[0, 0, 0]} />
      </Environment>

      <group position={[wide ? viewport.width * 0.2 : 0, wide ? 0 : viewport.height * 0.14, 0]} scale={wide ? 1 : scale}>
        <Blob low={low} reduce={reduce} />
        <Orbiters count={low ? 5 : 7} reduce={reduce} />
      </group>

      <Sparkles
        count={low ? 20 : 55}
        scale={[12, 7, 6]}
        size={2.2}
        speed={reduce ? 0 : 0.3}
        opacity={0.6}
        color="#c9a66b"
      />
    </>
  )
}

export default function HeroScene({ active, low, reduce, eventSource }) {
  return (
    <Canvas
      dpr={low ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: !low, alpha: true, powerPreference: 'high-performance' }}
      frameloop={reduce ? 'demand' : active ? 'always' : 'never'}
      eventSource={eventSource}
      eventPrefix="client"
    >
      <Scene low={low} reduce={reduce} />
    </Canvas>
  )
}