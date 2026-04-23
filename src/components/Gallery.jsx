import React, { useEffect, useRef, useState } from 'react'
import { ALL_PAINTINGS, INITIAL_COUNT } from '../data/paintings'
import './Gallery.css'

const MODES = { CAROUSEL: 'carousel', EXPAND: 'expand', GRID: 'grid' }
const FRICTION = 0.88
const SPIN_SENSITIVITY = 1

const GESTURE_TO_MODE = {
  grid:      MODES.GRID,
  expand:    MODES.EXPAND,
  spin:      MODES.CAROUSEL,
  addRemove: null,
  zoom:      null,
  idle:      null,
  none:      null,
}

export default function Gallery({ gesture }) {
  const [mode, setMode] = useState(MODES.CAROUSEL)
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [zoomed, setZoomed] = useState(false)

  const angleRef      = useRef(0)
  const velocityRef   = useRef(0)
  const rafRef        = useRef(null)
  const lastGRef      = useRef(null)
  const prevXRef      = useRef(null)
  const pinchStartRef = useRef(null)   // timestamp when right pinch began

  const [renderAngle, setRenderAngle] = useState(0)
  const [renderArc,   setRenderArc]   = useState(1)
  const modeRef = useRef(mode)
  modeRef.current = mode

  // Physics loop — runs independently of gesture/mode state
  useEffect(() => {
    let prevTime = performance.now()
    function tick(now) {
      const dt = Math.min((now - prevTime) / 16, 3)
      prevTime = now
      const g = lastGRef.current

      if (g?.type === 'spin') {
        const nx = 1 - (g.x ?? 0.5)
        if (prevXRef.current !== null) {
          const dx = nx - prevXRef.current
          velocityRef.current += dx * SPIN_SENSITIVITY * dt
        }
        prevXRef.current = nx
      } else {
        prevXRef.current = null
        velocityRef.current *= Math.pow(FRICTION, dt)
      }

      angleRef.current += velocityRef.current * dt
      const targetArc = modeRef.current === MODES.EXPAND ? 2.0 : 1.0
      setRenderArc(prev => prev + (targetArc - prev) * 0.07 * dt)
      setRenderAngle(angleRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Gesture → mode/count
  useEffect(() => {
    const prev = lastGRef.current
    lastGRef.current = gesture
    if (!gesture) return

    const nextMode = GESTURE_TO_MODE[gesture.type]
    if (nextMode !== null && nextMode !== undefined) setMode(nextMode)

    // Zoom: both-hands pinch toggles the full-screen overlay
    if (gesture.type === 'zoom' && prev?.type !== 'zoom') {
      setZoomed(z => !z)
    }
    // Any non-zoom gesture dismisses zoom
    if (gesture.type !== 'zoom' && gesture.type !== 'idle' && gesture.type !== 'none') {
      setZoomed(false)
    }

    // Track left-hand pinch duration: short tap = add, hold ≥ 600ms = remove
    if (gesture.type === 'addRemove') {
      if (prev?.type !== 'addRemove') {
        pinchStartRef.current = Date.now()   // pinch just started
      }
    } else {
      if (prev?.type === 'addRemove' && pinchStartRef.current !== null) {
        const held = Date.now() - pinchStartRef.current
        if (held < 600) {
          setVisibleCount(c => Math.min(c + 1, ALL_PAINTINGS.length))  // short = add
        } else {
          setVisibleCount(c => Math.max(c - 1, 1))                      // long  = remove
        }
        pinchStartRef.current = null
      }
    }
  }, [gesture])

  const paintings = ALL_PAINTINGS.slice(0, visibleCount)

  // Identify the front painting for the zoom overlay
  let frontPainting = paintings[0]
  if (paintings.length > 1) {
    let bestDepth = -Infinity
    paintings.forEach((p, i) => {
      const norm = (i / paintings.length) * Math.PI * 2 + renderAngle
      const radius = 260 + (renderArc - 1) * 140
      const z = Math.cos(norm) * radius
      const depth = (z + radius) / (2 * radius)
      if (depth > bestDepth) { bestDepth = depth; frontPainting = p }
    })
  }

  return (
    <div className={`gallery gallery--${mode}`}>
      {mode === MODES.GRID ? (
        <GridLayout paintings={paintings} />
      ) : (
        <CarouselLayout
          paintings={paintings}
          angle={renderAngle}
          arc={renderArc}
        />
      )}

      {/* Zoom overlay */}
      {zoomed && frontPainting && (
        <div className="zoom-overlay">
          <img src={frontPainting.url} alt={frontPainting.title} className="zoom-image" />
          <div className="zoom-label">
            <span className="zoom-title">{frontPainting.title}</span>
            <span className="zoom-year">{frontPainting.year}</span>
          </div>
          <div className="zoom-hint">Pinch both hands again to close</div>
        </div>
      )}

      {/* Count indicator */}
      <div className="gallery-count">
        {visibleCount} / {ALL_PAINTINGS.length} paintings
      </div>
    </div>
  )
}

function CarouselLayout({ paintings, angle, arc }) {
  const count = paintings.length

  // Find the index of the frontmost card (highest depthNorm = closest to viewer)
  let frontIdx = 0
  let frontDepth = -Infinity
  paintings.forEach((_, i) => {
    const norm = (i / count) * Math.PI * 2 + angle
    const radius = 260 + (arc - 1) * 140
    const z = Math.cos(norm) * radius
    const depthNorm = (z + radius) / (2 * radius)
    if (depthNorm > frontDepth) { frontDepth = depthNorm; frontIdx = i }
  })

  return (
    <div className="carousel-scene">
      <div className="carousel-ring">
        {paintings.map((p, i) => {
          const norm = (i / count) * Math.PI * 2 + angle
          const radius = 260 + (arc - 1) * 140
          const x = Math.sin(norm) * radius
          const z = Math.cos(norm) * radius
          const depthNorm = (z + radius) / (2 * radius)
          const scale = 0.45 + depthNorm * 0.65
          const opacity = 0.25 + depthNorm * 0.75
          const rotY = -Math.atan2(x, z) * (180 / Math.PI) * 0.3
          const isFront = i === frontIdx

          return (
            <div
              key={p.id}
              className={`carousel-card${isFront ? ' is-front' : ''}`}
              style={{
                transform: `translateX(${x}px) translateZ(${z}px) scale(${scale}) rotateY(${rotY}deg)`,
                opacity,
              }}
            >
              <img src={p.url} alt={p.title} draggable={false} />
              <div className={`card-label${isFront ? ' card-label--visible' : ''}`}>
                <span className="card-title">{p.title}</span>
                <span className="card-year">{p.year}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GridLayout({ paintings }) {
  return (
    <div className="grid-layout">
      {paintings.map((p) => (
        <div key={p.id} className="grid-card">
          <img src={p.url} alt={p.title} draggable={false} />
          <div className="card-label">
            <span className="card-title">{p.title}</span>
            <span className="card-year">{p.year}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
