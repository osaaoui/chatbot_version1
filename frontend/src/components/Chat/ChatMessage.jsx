import React, { useState, useEffect, useRef } from "react"
import { UserCircle } from "lucide-react"
import { useFontSize } from "../../context/FontSizeContext"

const ChatMessage = React.memo(({ msg, handleSourceClick, renderFormattedAnswer }) => {
  const [isVisible, setIsVisible] = useState(false)
  const messageRef = useRef(null)
  const { fontSize } = useFontSize()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (messageRef.current) {
      observer.observe(messageRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const renderMessageContent = () => {
    if (msg.type === "user") {
      return (
        <div 
          className="prose prose-sm max-w-none"
          style={{ 
            fontSize: `${fontSize}px`,
            color: 'var(--text-primary)'
          }}
        >
          {msg.text || (
            <span 
              className="italic"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Mensaje vacío
            </span>
          )}
          {msg.isPending && (
            <span 
              className="italic ml-2"
              style={{ 
                fontSize: `${Math.max(fontSize - 2, 10)}px`,
                color: 'var(--text-tertiary)'
              }}
            >
              Enviando...
            </span>
          )}
        </div>
      )
    }
    if (msg.text) {
      return (
        <div 
          className="prose prose-sm max-w-none"
          style={{ 
            fontSize: `${fontSize}px`,
            color: 'var(--text-primary)'
          }}
        >
          {renderFormattedAnswer(msg.text)}
        </div>
      )
    }
    return (
      <span 
        className="italic"
        style={{ 
          fontSize: `${fontSize}px`,
          color: 'var(--text-tertiary)'
        }}
      >
        {msg.isPending ? "Generando respuesta..." : "Sin respuesta"}
      </span>
    )
  }

  const getMessageStyles = () => {
    const baseStyles = {
      fontSize: `${fontSize}px`,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }

    if (msg.type === "user") {
      return {
        ...baseStyles,
        backgroundColor: 'var(--bg-secondary-dark)',
        color: 'var(--text-primary)'
      }
    } else {
      // Bot message
      if (msg.isError) {
        return {
          ...baseStyles,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-error)',
          color: 'var(--text-primary)'
        }
      }
      return {
        ...baseStyles,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-light)',
        color: 'var(--text-primary)'
      }
    }
  }

  return (
    <div 
      ref={messageRef} 
      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
      data-message-id={msg.id}
    >
      {msg.type === "bot" && (
        <div className="flex items-end mr-2">
          <div className="flex p-0 items-center justify-center text-sm font-bold">
            <img 
              src="/img/image4.png" 
              alt="Tia Landing" 
              className="logo w-24 object-contain" 
            />
          </div>
        </div>
      )}
      <div
        className={`max-w-[70%] px-4 py-3 text-sm rounded-2xl ${
          msg.type === "user" ? "rounded-br-none" : "rounded-bl-none"
        } ${msg.isPending ? "opacity-70" : ""}`}
        style={getMessageStyles()}
      >
        <div>
          {isVisible ? (
            renderMessageContent()
          ) : (
            <div 
              className="h-6 animate-pulse rounded"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            ></div>
          )}

          {msg.type === "bot" && Array.isArray(msg.sources) && msg.sources.length > 0 && isVisible && !msg.isPending && (
            <div className="mt-2">
              {msg.sources.map((source, sidx) => (
                <button
                  key={sidx}
                  onClick={() => handleSourceClick(source)}
                  className="ml-1 underline transition-colors hover:opacity-80"
                  style={{
                    color: 'var(--color-primary-dark)',
                    fontSize: `${Math.max(fontSize - 2, 10)}px`
                  }}
                  title={`Fuente ${sidx + 1}`}
                >
                  [{sidx + 1}]
                </button>
              ))}
            </div>
          )}
        </div>
        <div 
          className="text-right mt-1"
          style={{ 
            fontSize: `${Math.max(fontSize - 4, 8)}px`,
            color: 'var(--text-tertiary)'
          }}
        >
          {msg.time && msg.time instanceof Date ? msg.time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) : '--:--'}
        </div>
      </div>
      {msg.type === "user" && (
        <div className="flex items-end ml-2">
          <UserCircle 
            className="w-5 h-5" 
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      )}
    </div>
  )
})

ChatMessage.displayName = 'ChatMessage'

export default ChatMessage