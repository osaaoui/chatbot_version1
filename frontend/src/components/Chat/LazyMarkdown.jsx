import React, { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"

const LazyMarkdown = React.memo(({ text, components }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div 
          className="h-4 rounded mb-2"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        ></div>
        <div 
          className="h-4 rounded mb-2 w-3/4"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        ></div>
        <div 
          className="h-4 rounded w-1/2"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        ></div>
      </div>
    )
  }

  return (
    <ReactMarkdown components={components}>
      {text}
    </ReactMarkdown>
  )
})

LazyMarkdown.displayName = "LazyMarkdown"

export default LazyMarkdown