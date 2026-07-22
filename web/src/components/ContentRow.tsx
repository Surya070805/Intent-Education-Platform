import React, { useRef, useState, useEffect } from 'react'
import VideoCard, { Resource } from './VideoCard'

interface ContentRowProps {
  title: string
  resources: Resource[]
}

export default function ContentRow({ title, resources }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScrollability()
    el.addEventListener('scroll', checkScrollability, { passive: true })
    return () => el.removeEventListener('scroll', checkScrollability)
  }, [resources])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    })
  }

  if (!resources || resources.length === 0) return null

  return (
    <div className="content-row">
      <div className="row-header">
        <h3 className="row-title">{title}</h3>
        <span className="row-count">{resources.length} videos</span>
      </div>

      <div className="scroll-container">
        {canScrollLeft && (
          <button className="scroll-arrow scroll-arrow-left" onClick={() => scroll('left')}>
            ‹
          </button>
        )}

        <div className="scroll-track" ref={scrollRef}>
          {resources.map(resource => (
            <VideoCard key={resource.id} resource={resource} />
          ))}
        </div>

        {canScrollRight && (
          <button className="scroll-arrow scroll-arrow-right" onClick={() => scroll('right')}>
            ›
          </button>
        )}
      </div>
    </div>
  )
}
