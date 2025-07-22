"use client"

import { useState, useRef } from "react"
import { ChevronDown, ChevronRight, Folder } from "lucide-react"
import { useLanguage } from "../../hooks/useLanguaje"
import { useFolderOperations } from "../../hooks/folder/useFolderOperations"
import { useDragAndDrop } from "../../hooks/folder/useDragAndDrop"
import { useFileUpload } from "../../hooks/folder/useFileUpload"
import { formatDate } from "../../utils/folderUtils"
import DocumentList from "../Document/DocumentList"
import FolderActions from "./FolderActions"
import CreateSubfolder from "./CreateSubfolder"

const FolderCard = ({
  folder,
  level = 0,
  allFolders = [],
  userEmail,
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef(null)
  const documentListRef = useRef(null)
  const { t } = useLanguage()

  const {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showCreateSubfolder,
    setShowCreateSubfolder,
    subfolderName,
    setSubfolderName,
    createSubfolder,
    updateFolderName,
    deleteFolderConfirm,
  } = useFolderOperations(folder)

  const {
    isDragOver,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(folder, allFolders, setIsExpanded, isExpanded)

  const { handleFileUpload, getCurrentFolderFiles } = useFileUpload(folder, stagedFiles, setStagedFiles)

  const hasChildren = folder.children && folder.children.length > 0
  const paddingLeft = level * 16
  const getResponsiveClasses = (level) => {
    return {
      iconSize: level > 2 ? "w-3 h-3" : level > 0 ? "w-4 h-4" : "w-5 h-5",
      textSize: level > 2 ? "text-xs" : level > 0 ? "text-sm" : "text-base"
    }
  }

  const { iconSize: responsiveIconSize, textSize: responsiveTextSize } = getResponsiveClasses(level)

  const { filesToProcess, processingFiles, hasFilesToProcess, isProcessingFiles } = getCurrentFolderFiles()

  const handleToggleExpand = () => {
    if (!isEditing && !showDeleteConfirm && !isDragging) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleUploadClick = (e) => {
    e.stopPropagation()
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleCreateSubfolderClick = (e) => {
    e.stopPropagation()
    setShowCreateSubfolder(true)
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(folder.folder_name)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleEditKeyPress = (e) => {
    if (e.key === "Enter") {
      updateFolderName()
    } else if (e.key === "Escape") {
      setEditName(folder.folder_name)
      setIsEditing(false)
    }
  }

  const handleCreateSubfolderConfirm = async () => {
    const success = await createSubfolder()
    if (success && documentListRef.current) {
      setTimeout(() => {
        documentListRef.current.refreshDocuments()
      }, 500)
    }
  }

  const getFolderBaseStatusTooltip = (status) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case "active":
        return t("folder.status.active")
      case "inactive":
        return t("folder.status.inactive")
      default:
        return t("folder.status.unknown")
    }
  }

  const getStatusColor = (status) => {
    return status === "Active" ? "var(--color-success)" : "var(--color-warning)"
  }

  const getFolderCardStyles = (level, isDragging, isDragOver, showDeleteConfirm, isEditing) => {
    const baseStyles = {
      backgroundColor: "var(--bg-primary)",
      border: "1px solid var(--border-light)",
      borderRadius: "0.375rem",
      padding: "0.5rem",
      margin: "0.125rem 0",
      cursor: (!isEditing && !showDeleteConfirm) ? "pointer" : "default",
      transition: "all 0.2s ease",
      opacity: isDragging ? 0.5 : 1,
      transform: isDragging ? "scale(0.95)" : "scale(1)"
    }

    if (isDragOver) {
      baseStyles.backgroundColor = "rgba(59, 130, 246, 0.1)"
      baseStyles.borderColor = "var(--color-primary-dark)"
    }

    if (showDeleteConfirm) {
      baseStyles.backgroundColor = "rgba(239, 68, 68, 0.1)"
      baseStyles.borderColor = "var(--color-error)"
    }

    if (isEditing) {
      baseStyles.backgroundColor = "rgba(251, 191, 36, 0.1)"
      baseStyles.borderColor = "var(--color-warning)"
    }

    return baseStyles
  }

  const folderCardStyles = getFolderCardStyles(level, isDragging, isDragOver, showDeleteConfirm, isEditing)

  return (
    <div className="w-full">
      <div
        draggable={!isEditing && !showDeleteConfirm}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex items-center gap-2 group"
        style={{
          ...folderCardStyles,
          paddingLeft: `${8 + paddingLeft}px`
        }}
        onClick={handleToggleExpand}
        onMouseEnter={(e) => {
          if (!isDragOver && !showDeleteConfirm && !isEditing) {
            e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragOver && !showDeleteConfirm && !isEditing) {
            e.currentTarget.style.backgroundColor = "var(--bg-primary)"
          }
        }}
      >
        {hasChildren || showCreateSubfolder ? (
          isExpanded ? (
            <ChevronDown 
              className={responsiveIconSize} 
              style={{ color: "var(--text-tertiary)" }}
            />
          ) : (
            <ChevronRight 
              className={responsiveIconSize} 
              style={{ color: "var(--text-tertiary)" }}
            />
          )
        ) : (
          <div className={responsiveIconSize} />
        )}

        <Folder 
          className={responsiveIconSize} 
          style={{ color: "var(--color-warning)" }}
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleEditKeyPress}
              className={`bg-transparent border-none outline-none font-medium w-full ${responsiveTextSize}`}
              style={{ color: "var(--text-primary)" }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : showDeleteConfirm ? (
            <span 
              className={`font-medium ${responsiveTextSize}`}
              style={{ color: "var(--color-error)" }}
            >
              {t("folder.deleteConfirm")}
            </span>
          ) : (
            <>
              <span 
                className={`font-medium truncate block ${responsiveTextSize}`}
                style={{ color: "var(--text-primary)" }}
              >
                {folder.folder_name}
              </span>
              {folder.creation_date && level === 0 && (
                <span 
                  className="text-xs block"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {t("folder.created")}: {formatDate(folder.creation_date)}
                </span>
              )}
              {(hasFilesToProcess || isProcessingFiles) && (
                <div className="text-xs mt-1">
                  {hasFilesToProcess && (
                    <span style={{ color: "var(--color-primary-dark)" }}>
                      {filesToProcess.length} {t("folder.readyToProcess")}
                    </span>
                  )}
                  {isProcessingFiles && (
                    <span 
                      className="ml-2"
                      style={{ color: "var(--color-warning)" }}
                    >
                      {processingFiles.length > 0 ? processingFiles.length : ""} {t("folder.processing")}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!isEditing && !showDeleteConfirm && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getStatusColor(folder.status) }}
            title={getFolderBaseStatusTooltip(folder.status)}
          ></span>
        )}

        <div className="flex items-center gap-1">
          <FolderActions
            level={level}
            isEditing={isEditing}
            showDeleteConfirm={showDeleteConfirm}
            editName={editName}
            onConfirmEdit={updateFolderName}
            onCancelEdit={() => {
              setEditName(folder.folder_name)
              setIsEditing(false)
            }}
            onConfirmDelete={deleteFolderConfirm}
            onUpload={handleUploadClick}
            onCreateSubfolder={handleCreateSubfolderClick}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.docx,.jpg,.jpeg,.png"
        className="hidden"
        multiple
      />

      {isExpanded && (
        <div className="mt-1 space-y-1">
          {showCreateSubfolder && (
            <CreateSubfolder
              subfolderName={subfolderName}
              setSubfolderName={setSubfolderName}
              onConfirm={handleCreateSubfolderConfirm}
              onCancel={() => {
                setSubfolderName("")
                setShowCreateSubfolder(false)
              }}
              paddingLeft={paddingLeft}
            />
          )}

          {hasChildren && (
            <>
              {folder.children.map((childFolder) => (
                <FolderCard
                  key={childFolder.folder_id}
                  folder={childFolder}
                  level={level + 1}
                  allFolders={allFolders}
                  userEmail={userEmail}
                  onProcessFiles={onProcessFiles}
                  isProcessing={isProcessing}
                  stagedFiles={stagedFiles} 
                  setStagedFiles={setStagedFiles} 
                />
              ))}
            </>
          )}

          <DocumentList
            ref={documentListRef}
            folderId={folder.folder_id}
            level={level}
            stagedFiles={stagedFiles}
            setStagedFiles={setStagedFiles}
          />
        </div>
      )}
    </div>
  )
}

export default FolderCard