import React from 'react'
import { createRoot } from 'react-dom/client'
import Overlay from './Overlay'

function init() {
  // Wait for the YouTube DOM to be ready
  const anchor = document.querySelector('#secondary-inner') || document.querySelector('ytd-watch-flexy')
  if (!anchor) {
    // If not found, try again in 1s
    setTimeout(init, 1000)
    return
  }

  // Create container
  const container = document.createElement('div')
  container.id = 'bloom-extension-root'
  
  // Inject before the recommended videos if on watch page
  if (anchor.id === 'secondary-inner') {
    anchor.prepend(container)
  } else {
    // Fallback injection
    document.body.appendChild(container)
    container.style.position = 'fixed'
    container.style.top = '100px'
    container.style.right = '20px'
    container.style.zIndex = '9999'
  }

  // Use Shadow DOM to isolate styles
  const shadow = container.attachShadow({ mode: 'open' })
  const rootElement = document.createElement('div')
  shadow.appendChild(rootElement)

  const root = createRoot(rootElement)
  root.render(<Overlay />)
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
