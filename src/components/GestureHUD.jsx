import React, { useEffect, useState } from 'react'
import './GestureHUD.css'

const GESTURES = [
  { key: 'spin',      icon: '✦', label: 'Left pinch',             desc: 'Orbit & spin speed',              color: '#5a8050' },
  { key: 'addRemove', icon: '◈', label: 'Right pinch',            desc: 'Tap = add  ·  Hold = remove',     color: '#7aa0c4' },
  { key: 'zoom',      icon: '⬡', label: 'Both hands pinch',       desc: 'Zoom into front painting',        color: '#9880b8' },
  { key: 'expand',    icon: '⟺', label: 'Both hands: pinch open', desc: 'Spread index+thumb on each hand', color: '#d4a040' },
  { key: 'grid',      icon: '⊞', label: 'All fingers open',       desc: 'Full-frame grid',                 color: '#d09898' },
]

export default function GestureHUD({ gesture }) {
  const [activeKey, setActiveKey] = useState(null)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const g = gesture?.type
    const match = GESTURES.find(x => x.key === g)
    setActiveKey(match?.key ?? null)
    if (match) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 300)
      return () => clearTimeout(t)
    }
  }, [gesture])

  return (
    <div className="gesture-hud">
      {GESTURES.map((g) => (
        <div
          key={g.key}
          className={`gesture-item ${activeKey === g.key ? 'active' : ''}`}
          style={{ '--accent': g.color }}
        >
          <span className="gesture-icon">{g.icon}</span>
          <div className="gesture-info">
            <span className="gesture-label">{g.label}</span>
            <span className="gesture-desc">{g.desc}</span>
          </div>
          {activeKey === g.key && <span className="gesture-ping" />}
        </div>
      ))}
    </div>
  )
}
