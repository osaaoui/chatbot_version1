import React, { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"

const Avatar = ({ 
  name = "", 
  size = "w-10 h-10",
  menuItems = [],
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { t } = useTranslation()
  
  const getInitial = (name) => name.charAt(0).toUpperCase() + name.charAt(1).toUpperCase()
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  const defaultItems = [
    { label: t("avatar.myProfile"), onClick: () => console.log("Perfil") },
    { label: "Configuración", onClick: () => console.log("Configuración") },
    { label: "Ayuda", onClick: () => console.log("Ayuda") },
    { separator: true },
    { label: t("avatar.logout"), onClick: () => console.log("Logout") }
  ]
  
  const items = menuItems.length > 0 ? menuItems : defaultItems
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${size} rounded-full font-semibold flex items-center justify-center transition-colors focus:outline-none focus:ring-2`}
        style={{
          backgroundColor: "var(--bg-secondary-dark)",
          color: "var(--text-primary)",
          borderRadius: "50%"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "var(--bg-tertiary)"
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "var(--bg-secondary-dark)"
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = "0 0 0 2px var(--color-primary-dark)"
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none"
        }}
      >
        {getInitial(name)}
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-[9999] right-0 mt-2 w-48 rounded-lg shadow-lg py-1"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-light)"
          }}
        >
          {items.map((item, index) => (
            item.separator ? (
              <hr 
                key={index} 
                className="my-1" 
                style={{ borderColor: "var(--border-light)" }}
              />
            ) : (
              <button
                key={index}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick()
                  }
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "var(--bg-tertiary)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                }}
              >
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default Avatar