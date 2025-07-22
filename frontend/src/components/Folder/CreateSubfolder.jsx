"use client"
import { Check, X } from "lucide-react"

const CreateSubfolder = ({ subfolderName, setSubfolderName, onConfirm, onCancel, paddingLeft }) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onConfirm()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <div style={{ paddingLeft: `${24 + paddingLeft}px` }}>
      <div 
        className="flex items-center gap-2 p-2 border rounded-md"
        style={{
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderColor: "var(--color-primary-dark)"
        }}
      >
        <input
          type="text"
          value={subfolderName}
          onChange={(e) => setSubfolderName(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Nombre de la subcarpeta"
          className="flex-1 bg-transparent border-none outline-none text-sm"
          style={{ 
            color: "var(--text-primary)",
            "::placeholder": { color: "var(--text-tertiary)" }
          }}
          autoFocus
        />
        <button
          onClick={onConfirm}
          disabled={!subfolderName.trim()}
          className="p-1 rounded transition-colors"
          style={{
            color: subfolderName.trim() ? "var(--color-success)" : "var(--text-tertiary)",
            cursor: subfolderName.trim() ? "pointer" : "not-allowed"
          }}
          onMouseEnter={(e) => {
            if (subfolderName.trim()) {
              e.target.style.backgroundColor = "rgba(34, 197, 94, 0.1)"
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent"
          }}
        >
          <Check className="w-4 h-4" />
        </button>
        <button 
          onClick={onCancel} 
          className="p-1 rounded transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "var(--bg-tertiary)"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent"
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default CreateSubfolder