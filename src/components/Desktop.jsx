import React from 'react'
import './Desktop.css'

export default function Desktop({ children }) {
  return (
    <div className="desktop">
      <div className="desktop-wallpaper" />
      <div className="window-container">{children}</div>
    </div>
  )
}
