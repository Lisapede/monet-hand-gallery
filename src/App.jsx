import React, { useRef, useState, useCallback } from 'react'
import { useHandTracking } from './hooks/useHandTracking'
import Gallery from './components/Gallery'
import CameraFeed from './components/CameraFeed'
import GestureHUD from './components/GestureHUD'
import Desktop from './components/Desktop'
import './App.css'

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [gesture, setGesture] = useState({ type: 'none' })

  const handleGesture = useCallback((g) => setGesture(g), [])
  useHandTracking(videoRef, canvasRef, handleGesture)

  return (
    <Desktop>
      <div className="app-window">
        <div className="title-bar">
          <img src="/monet_portrait.jpg" alt="Claude Monet" className="title-portrait" />
          <div className="title-content">
            <span className="title-text">Claude Monet</span>
            <span className="title-sub">Impressionist Gallery</span>
          </div>
        </div>
        <div className="app-body">
          <Gallery gesture={gesture} />
          <GestureHUD gesture={gesture} />
        </div>
      </div>
      <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
    </Desktop>
  )
}
