import React from "react"
import { useDocumentBases } from "../../context/DocumentBasesContext"
import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import DocumentBaseCard from "./DocumentBaseCard"

const DocumentBaseList = ({ 
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles,
  userEmail 
}) => {
  const { documentBases, initialLoading, isRefreshing, error } = useDocumentBases()
  const { t } = useTranslation()

  // Solo mostrar loading completo en la carga inicial
  if (initialLoading) {
    return (
      <div 
        className="w-full p-4 text-center text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        {t("document_base.loading")}
      </div>
    )
  }

  if (error && documentBases.length === 0) {
    return (
      <div 
        className="w-full p-4 text-center text-sm"
        style={{ color: "var(--color-error)" }}
      >
        {t("document_base.error")}
      </div>
    )
  }

  if (!documentBases || documentBases.length === 0) {
    return (
      <div 
        className="w-full p-4 text-center text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        {t("document_base.no_bases_available")}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Indicador sutil de refresh cuando se está actualizando en background */}
      {isRefreshing && (
        <div 
          className="w-full p-2 mb-3 rounded-md flex items-center justify-center gap-2 text-lg"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            color: "var(--text-tertiary)",
            border: "1px solid rgba(59, 130, 246, 0.1)"
          }}
        >
          <RefreshCw 
            className="w-3 h-3 animate-spin" 
            style={{ color: "var(--text-tertiary)" }}
          />
          {t("document_base.updating", { defaultValue: "Syncing..." })}
        </div>
      )}
      
      <div className="space-y-3">
        {documentBases.map((documentBase) => (
          <DocumentBaseCard 
            key={documentBase.document_base_id} 
            documentBase={documentBase}
            onProcessFiles={onProcessFiles}
            isProcessing={isProcessing}
            stagedFiles={stagedFiles}
            setStagedFiles={setStagedFiles}
            userEmail={userEmail}
          />
        ))}
      </div>
    </div>
  )
}

export default DocumentBaseList