import React, { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"

const Avatar = ({ 
  name = "", 
  size = "w-10 h-10",
  menuItems = [],
  className = "",
  showMenu = true,
  profileImage = null
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
    { label: t("avatar.settings"), onClick: () => console.log("Configuración") },
    { label: t("avatar.help"), onClick: () => console.log("Ayuda") },
    { separator: true },
    { label: t("avatar.logout"), onClick: () => console.log("Logout") }
  ]
  
  const items = menuItems.length > 0 ? menuItems : defaultItems
  
  const handleClick = () => {
    if (showMenu) {
      setIsOpen(!isOpen)
    }
  }
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={`${size} rounded-full font-semibold flex items-center justify-center transition-colors focus:outline-none overflow-hidden ${showMenu ? 'focus:ring-2 cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        style={{
          backgroundColor: profileImage ? "transparent" : "var(--bg-secondary-dark)",
          color: "var(--text-primary)",
          borderRadius: "50%"
        }}
      >
        {profileImage ? (
          <img 
            src={profileImage} 
            alt={name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          getInitial(name)
        )}
      </button>
      
      {showMenu && isOpen && (
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