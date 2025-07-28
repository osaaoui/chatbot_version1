"use client"

import { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FileText, File, Image, Loader2 } from "lucide-react"
import { documentService } from "../../services/documentService"

// eslint-disable-next-line no-unused-vars
const DocumentList = forwardRef(({ folderId, level = 0, stagedFiles = [], setStagedFiles }, ref) => {
  const { t } = useTranslation()
  const [apiDocuments, setApiDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const paddingLeft = level * 16

  useImperativeHandle(ref, () => ({
    refreshDocuments: fetchDocuments,
  }))

  useEffect(() => {
    if (folderId) {
      fetchDocuments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await documentService.getDocumentsByFolder(folderId)

      if (response.success && response.data.documents) {
        setApiDocuments(response.data.documents)
      } else {
        setApiDocuments([])
      }
    } catch (err) {
      console.error("Error fetching documents:", err)
      setError(t("documents.errorLoading"))
      setApiDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const documentsToDisplay = useMemo(() => {
    const folderStagedFiles = stagedFiles.filter((f) => f.folderId === folderId)
    const combinedDocuments = new Map(apiDocuments.map((doc) => [doc.document_id, doc]))

    folderStagedFiles.forEach((stagedFile) => {
      combinedDocuments.set(stagedFile.documentId, {
        document_id: stagedFile.documentId,
        document_name: stagedFile.original || stagedFile.name, 
        file_type: stagedFile.name.split(".").pop() || "unknown", 
        status: stagedFile.status,
        creation_date: new Date().toISOString(), 
        total_chunks: 0,
      })
    })

    return Array.from(combinedDocuments.values())
  }, [apiDocuments, stagedFiles, folderId])

  const getFileIcon = (fileType) => {
    const lowerType = fileType.toLowerCase()
    
    if (lowerType.includes("pdf")) {
      return <FileText className="w-4 h-4" style={{ color: "var(--color-error)" }} />
    }
    if (lowerType.includes("doc") || lowerType.includes("docx")) {
      return <FileText className="w-4 h-4" style={{ color: "var(--color-primary-dark)" }} />
    }
    if (lowerType.includes("txt")) {
      return <FileText className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
    }
    if (lowerType.includes("jpg") || lowerType.includes("jpeg") || lowerType.includes("png")) {
      return <Image className="w-4 h-4" style={{ color: "var(--color-success)" }} />
    }
    
    // Icono por defecto - siempre visible
    return <File className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "upload":
      case "uploaded":
      case "processed": 
        return "var(--color-success)"
      case "processing":
      case "uploading":
      case "loaded":
      case "inactive": 
        return "var(--color-warning)"
      case "error":
      case "failed":
        return "var(--color-error)"
      default:
        return "var(--text-tertiary)"
    }
  }

  const getStatusMessage = () => {
    if (loading) return t("documents.loadingDocuments")
    if (error) return error
    return t("documents.noDocumentsInFolder")
  }

  const getStatusIconAndColor = () => {
    if (loading) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary-dark)" }} />,
        textColor: "var(--text-secondary)",
        bgColor: "var(--bg-primary)",
        borderColor: "var(--border-light)"
      }
    }
    
    if (error) {
      return {
        icon: <File className="w-4 h-4" style={{ color: "var(--color-error)" }} />,
        textColor: "var(--color-error)",
        bgColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "var(--color-error)"
      }
    }
    
    return {
      icon: <File className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />,
      textColor: "var(--text-tertiary)",
      bgColor: "var(--bg-primary)",
      borderColor: "var(--border-light)"
    }
  }

  if (loading || error || documentsToDisplay.length === 0) {
    const { icon, textColor, bgColor, borderColor } = getStatusIconAndColor()
    
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div 
          className="flex items-center gap-2 p-2 rounded-md transition-colors"
          style={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`
          }}
        >
          {icon}
          <span 
            className="text-xs"
            style={{ color: textColor }}
          >
            {getStatusMessage()}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-1 space-y-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
      {documentsToDisplay.map((document) => (
        <div
          key={document.document_id}
          className="flex items-start gap-2 p-2 rounded-md transition-colors cursor-pointer"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-light)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-primary)"
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getFileIcon(document.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 
                  className="text-sm  truncate" 
                
                  title={document.document_name}
                >
                  {document.document_name}
                </h4>
              </div>
              <div className="flex gap-1 ml-2 items-center">
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(document.status) }}
                  title={`Estado: ${document.status || "unknown"}`}
                ></span>
                <span 
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)"
                  }}
                >
                  {document.file_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

DocumentList.displayName = "DocumentList"

export default DocumentList