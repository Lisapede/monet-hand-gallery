import React from 'react'
import './CameraFeed.css'

// MediaPipe Camera (loaded from CDN in index.html) manages the video stream.
// This component just renders the video + overlay canvas.
export default function CameraFeed({ videoRef, canvasRef }) {
  return (
    <div className="camera-feed">
      <div className="camera-header">
        <span className="camera-dot" />
        <span className="camera-label">Live — MediaPipe Hands</span>
      </div>
      <div className="camera-viewport">
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="camera-canvas"
          width={320}
          height={240}
        />
      </div>
    </div>
  )
}
