"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Check, X } from "lucide-react"
import { useFolders } from "../../context/FoldersContext"
import { useDocumentBases } from "../../context/DocumentBasesContext"
import { useLanguage } from "../../hooks/useLanguaje"
import FolderCard from "../Folder/FolderCard"

const DocumentBaseCard = ({
  documentBase,
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles,
  userEmail,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldLoadFolders, setShouldLoadFolders] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [isDragOverRoot, setIsDragOverRoot] = useState(false)

  const { t } = useLanguage()

  const { getFoldersForDocumentBase, fetchFolders, createFolder, updateFolder, getFoldersHierarchy, error } =
    useFolders()
  const { updateDocumentBaseStatus } = useDocumentBases()

  const folders = getFoldersForDocumentBase(documentBase.document_base_id)
  const folderHierarchy = getFoldersHierarchy(documentBase.document_base_id)
  const hasFolders = folderHierarchy.length > 0

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleToggleExpand = () => {
    if (!isExpanded && !shouldLoadFolders) {
      setShouldLoadFolders(true)
      setIsExpanded(true)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  const handleCreateFolderClick = (e) => {
    e.stopPropagation()
    setShowCreateFolder(true)
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return
    try {
      const data = {
        folder_name: folderName.trim(),
        document_base_id: documentBase.document_base_id,
        parent_folder_id: null,
      }

      const response = await createFolder(data)

      if (response.success) {
        updateDocumentBaseStatus(documentBase.document_base_id, "Active")
        setFolderName("")
        setShowCreateFolder(false)
      }
    } catch (err) {
      console.error("Error creating folder:", err)
    }
  }

  const handleCancelCreateFolder = () => {
    setFolderName("")
    setShowCreateFolder(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCreateFolder()
    } else if (e.key === "Escape") {
      handleCancelCreateFolder()
    }
  }

  const handleRootDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const getDocumentBaseStatusTooltip = (status, hasContent = true) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case "active":
        return hasContent ? t("document_base.status.active") : t("document_base.status.empty")
      case "inactive":
        return t("document_base.status.inactive")
      default:
        return t("document_base.status.unknown")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "var(--color-success)"
      case "Inactive":
        return "var(--color-error)"
      default:
        return "var(--color-warning)"
    }
  }

  const handleRootDragEnter = (e) => {
    e.preventDefault()
    setIsDragOverRoot(true)
  }

  const handleRootDragLeave = (e) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverRoot(false)
    }
  }

  const handleRootDrop = async (e) => {
    e.preventDefault()
    setIsDragOverRoot(false)
    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"))
      const { folderId: draggedFolderId, documentBaseId } = dragData
      const response = await updateFolder(draggedFolderId, documentBaseId, undefined, null)
      if (!response.success) {
        console.error("Failed to move folder to root")
      }
    } catch (err) {
      console.error("Error moving folder to root:", err)
    }
  }

  useEffect(() => {
    if (shouldLoadFolders && folders.length === 0) {
      fetchFolders(documentBase.document_base_id)
    }
  }, [shouldLoadFolders, fetchFolders, documentBase.document_base_id, folders.length])

  return (
    <div 
      className="w-full rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--border-light)"
      }}
    >
      <div
        className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
        onClick={handleToggleExpand}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-secondary)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"
        }}
      >
        {isExpanded ? (
          <ChevronDown 
            className="w-5 h-5" 
            style={{ color: "var(--text-tertiary)" }}
          />
        ) : (
          <ChevronRight 
            className="w-5 h-5" 
            style={{ color: "var(--text-tertiary)" }}
          />
        )}

        <div className="flex-1 min-w-0">
          <h3 
            className="text-sm font-semibold truncate" 
            style={{ color: "var(--text-primary)" }}
            title={documentBase.base_name}
          >
            {documentBase.base_name}
          </h3>
          <div className="flex items-center gap-4 text-xs mt-1">
            <span style={{ color: "var(--text-tertiary)" }}>
              {t("document_base.created")}: {formatDate(documentBase.creation_date)}
            </span>
            <span
              className="px-1 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: getStatusColor(documentBase.status),
                width: "8px",
                height: "8px",
                minWidth: "8px",
                padding: "0"
              }}
              title={getDocumentBaseStatusTooltip(documentBase.status, hasFolders)}
            ></span>
          </div>
        </div>
        {isExpanded && (
          <button
            onClick={handleCreateFolderClick}
            className="p-2 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.target.style.color = "var(--color-primary-dark)"
              e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)"
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "var(--text-tertiary)"
              e.target.style.backgroundColor = "transparent"
            }}
            title={t("document_base.create_folder")}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      {isExpanded && (
        <div
          className="transition-colors"
          style={{
            borderTop: "1px solid var(--border-light)",
            backgroundColor: isDragOverRoot ? "rgba(59, 130, 246, 0.1)" : "var(--bg-primary)"
          }}
          onDragOver={handleRootDragOver}
          onDragEnter={handleRootDragEnter}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          {isDragOverRoot && (
            <div 
              className="p-2 m-2 border-2 border-dashed rounded-md text-center text-sm"
              style={{
                borderColor: "var(--color-primary-dark)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                color: "var(--color-primary-dark)"
              }}
            >
              {t("document_base.drop_here_root")}
            </div>
          )}
          {showCreateFolder && (
            <div 
              className="p-3"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div 
                className="flex items-center gap-2 p-2 border rounded-md"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  borderColor: "var(--color-primary-dark)"
                }}
              >
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t("document_base.folder_name_placeholder")}
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ 
                    color: "var(--text-primary)",
                    "::placeholder": { color: "var(--text-tertiary)" }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!folderName.trim()}
                  className="p-1 rounded transition-colors"
                  style={{
                    color: folderName.trim() ? "var(--color-success)" : "var(--text-tertiary)",
                    cursor: folderName.trim() ? "pointer" : "not-allowed"
                  }}
                  onMouseEnter={(e) => {
                    if (folderName.trim()) {
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
                  onClick={handleCancelCreateFolder} 
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
          )}
          {hasFolders ? (
            <div className="p-3 space-y-2">
              {folderHierarchy.map((folder) => (
                <FolderCard
                  key={folder.folder_id}
                  folder={folder}
                  allFolders={folders}
                  userEmail={userEmail}
                  onProcessFiles={onProcessFiles}
                  isProcessing={isProcessing}
                  stagedFiles={stagedFiles}
                  setStagedFiles={setStagedFiles}
                  setDocumentBaseStatus={updateDocumentBaseStatus}
                />
              ))}
            </div>
          ) : !showCreateFolder ? (
            <div 
              className="p-4 text-center text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("document_base.no_folders")}
            </div>
          ) : null}
          {error && (
            <div 
              className="p-3 text-sm"
              style={{
                color: "var(--color-error)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderTop: "1px solid var(--color-error)"
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DocumentBaseCard