import React from 'react'
import { createRoot } from 'react-dom/client'
import Overlay from './Overlay'

let currentRoot: any = null
let currentContainer: HTMLElement | null = null

function getYoutubeId(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('v')
}

function injectOverlay() {
  const youtubeId = getYoutubeId()
  
  // Clean up existing overlay
  if (currentRoot) {
    currentRoot.unmount()
    currentRoot = null
  }
  if (currentContainer && currentContainer.parentNode) {
    currentContainer.parentNode.removeChild(currentContainer)
  }

  // Only inject if watching a video
  if (!youtubeId || !window.location.pathname.startsWith('/watch')) {
    return
  }

  const anchor = document.querySelector('#secondary-inner') || document.querySelector('ytd-watch-flexy')
  if (!anchor) {
    setTimeout(injectOverlay, 1000)
    return
  }

  currentContainer = document.createElement('div')
  currentContainer.id = 'bloom-extension-root'
  
  if (anchor.id === 'secondary-inner') {
    anchor.prepend(currentContainer)
  } else {
    document.body.appendChild(currentContainer)
    currentContainer.style.position = 'fixed'
    currentContainer.style.top = '100px'
    currentContainer.style.right = '20px'
    currentContainer.style.zIndex = '9999'
  }

  const shadow = currentContainer.attachShadow({ mode: 'open' })
  const rootElement = document.createElement('div')
  shadow.appendChild(rootElement)

  currentRoot = createRoot(rootElement)
  currentRoot.render(<Overlay youtubeId={youtubeId} />)
}

// Observe title changes to detect YouTube SPA navigation
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    injectOverlay()
  }
}).observe(document, { subtree: true, childList: true })

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectOverlay)
} else {
  injectOverlay()
}
