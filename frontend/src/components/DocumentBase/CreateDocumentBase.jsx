import React, { useState } from "react"
import { useDocumentBases } from "../../context/DocumentBasesContext"
import { useCompany } from "../../context/CompanyContext"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"

const CreateDocumentBase = () => {
  const [baseName, setBaseName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { createDocumentBase, error } = useDocumentBases()
  const { companyId } = useCompany() // Obtener company_id actual
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!baseName.trim()) {
      return
    }

    setIsCreating(true)
    try {
      const data = {
        base_name: baseName.trim(),
        company_id: companyId || null // Usar company_id actual, null si no hay empresa
      }
      
      const response = await createDocumentBase(data)
      
      if (response.success) {
        setBaseName("")
      }
    } catch (err) {
      console.error("Error creating document base:", err)
    } finally {
      setIsCreating(false)
    }
  }

  const getButtonStyles = () => {
    const isDisabled = isCreating || !baseName.trim()
    
    return {
      backgroundColor: isDisabled ? "var(--bg-tertiary)" : "var(--color-primary-dark)",
      color: isDisabled ? "var(--text-tertiary)" : "var(--text-white)",
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.6 : 1,
      transition: "all 0.2s ease"
    }
  }

  const handleButtonHover = (e, isEntering) => {
    const isDisabled = isCreating || !baseName.trim()
    if (!isDisabled && isEntering) {
      e.target.style.backgroundColor = "var(--color-primary-light)"
    } else if (!isDisabled && !isEntering) {
      e.target.style.backgroundColor = "var(--color-primary-dark)"
    }
  }

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
          placeholder={t("document_base.name_placeholder")}
          className="flex-1 px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-primary)"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-primary-dark)"
            e.target.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border-medium)"
            e.target.style.boxShadow = "none"
          }}
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={isCreating || !baseName.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1"
          style={getButtonStyles()}
          onMouseEnter={(e) => handleButtonHover(e, true)}
          onMouseLeave={(e) => handleButtonHover(e, false)}
        >
          <Plus className="w-4 h-4" />
          {t("document_base.create")}
        </button>
      </form>
      
      {error && (
        <div 
          className="mt-2 text-sm"
          style={{ color: "var(--color-error)" }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

export default CreateDocumentBase