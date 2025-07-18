"use client"

import { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DocumentIcon, DocumentTextIcon } from "@heroicons/react/24/outline"
import { documentService } from "../../services/documentService"
import { Loader2 } from "lucide-react"

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
      return <DocumentIcon className="w-4 h-4 text-red-500" />
    }
    if (lowerType.includes("doc") || lowerType.includes("docx")) {
      return <DocumentTextIcon className="w-4 h-4 text-blue-500" />
    }
    if (lowerType.includes("txt")) {
      return <DocumentTextIcon className="w-4 h-4 text-gray-500" />
    }
    if (lowerType.includes("jpg") || lowerType.includes("jpeg") || lowerType.includes("png")) {
      return <DocumentIcon className="w-4 h-4 text-green-500" />
    }
    return <DocumentIcon className="w-4 h-4 text-gray-500" />
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "upload":
      case "uploaded":
      case "processed": 
        return "bg-green-500"
      case "processing":
      case "uploading":
      case "loaded":
      case "inactive": 
        return "bg-yellow-500"
      case "error":
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-400" 
    }
  }

  if (loading) {
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> {/* Usar Loader2 */}
          <span className="text-xs text-gray-600">{t("documents.loadingDocuments")}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <span className="text-xs text-red-600">{error}</span>
        </div>
      </div>
    )
  }

  if (documentsToDisplay.length === 0) {
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <DocumentIcon className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">{t("documents.noDocumentsInFolder")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-1 space-y-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
      {documentsToDisplay.map((document) => (
        <div
          key={document.document_id}
          className="flex items-start gap-2 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
            <>
              <div className="flex-shrink-0 mt-0.5">{getFileIcon(document.file_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate" title={document.document_name}>{document.document_name}</h4>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <span className={`px-1 py-1 h-1 mt-2 rounded-full ${getStatusColor(document.status)}`}></span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {document.file_type}
                    </span>
                  </div>
                </div>
              </div>
            </>
        </div>
      ))}
    </div>
  )
})

DocumentList.displayName = "DocumentList"

export default DocumentList
