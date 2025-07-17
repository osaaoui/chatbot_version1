"use client";

import { useState, useRef } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { useLanguage } from "../../hooks/useLanguaje";
import { useFolderOperations } from "../../hooks/folder/useFolderOperations";
import { useDragAndDrop } from "../../hooks/folder/useDragAndDrop";
import { useFileUpload } from "../../hooks/folder/useFileUpload";
import {
  formatDate,
  getFolderStyles,
  getIconSize,
  getTextSize,
} from "../../utils/folderUtils";
import DocumentList from "../Document/DocumentList";
import FolderActions from "./FolderActions";
import CreateSubfolder from "./CreateSubfolder";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);
  const documentListRef = useRef(null);
  const { t } = useLanguage();

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
  } = useFolderOperations(folder);

  const {
    isDragOver,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(folder, allFolders, setIsExpanded, isExpanded);

  const { handleFileUpload, getCurrentFolderFiles } = useFileUpload(
    folder,
    stagedFiles,
    setStagedFiles
  );

  const hasChildren = folder.children && folder.children.length > 0;
  const paddingLeft = level * 16;
  const iconSize = getIconSize(level);
  const textSize = getTextSize(level);

  const {
    filesToProcess,
    processingFiles,
    hasFilesToProcess,
    isProcessingFiles,
  } = getCurrentFolderFiles();

  const handleToggleExpand = () => {
    if (!isEditing && !showDeleteConfirm && !isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleCreateSubfolderClick = (e) => {
    e.stopPropagation();
    setShowCreateSubfolder(true);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(folder.folder_name);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleEditKeyPress = (e) => {
    if (e.key === "Enter") {
      updateFolderName();
    } else if (e.key === "Escape") {
      setEditName(folder.folder_name);
      setIsEditing(false);
    }
  };

  const handleCreateSubfolderConfirm = async () => {
    const success = await createSubfolder();
    if (success && documentListRef.current) {
      setTimeout(() => {
        documentListRef.current.refreshDocuments();
      }, 500);
    }
  };

  const getFolderBaseStatusTooltip = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "active":
        return t("folder.status.active");
      case "inactive":
        return t("folder.status.inactive");
      default:
        return t("folder.status.unknown");
    }
  };

  const folderStyles = getFolderStyles(
    level,
    isDragging,
    isDragOver,
    showDeleteConfirm,
    isEditing
  );

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
        className={folderStyles}
        style={{ paddingLeft: `${8 + paddingLeft}px` }}
        onClick={handleToggleExpand}
      >
        {hasChildren || showCreateSubfolder ? (
          isExpanded ? (
            <ChevronDownIcon className={`text-gray-500 ${iconSize}`} />
          ) : (
            <ChevronRightIcon className={`text-gray-500 ${iconSize}`} />
          )
        ) : (
          <div className={iconSize} />
        )}

        <FolderIcon className={`text-yellow-500 ${iconSize}`} />

        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleEditKeyPress}
              className={`bg-transparent border-none outline-none font-medium text-gray-700 w-full ${textSize}`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : showDeleteConfirm ? (
            <span className={`font-medium text-red-700 ${textSize}`}>
              {t("folder.deleteConfirm")}
            </span>
          ) : (
            <>
              <span
                className={`font-medium text-gray-700 truncate block ${textSize}`}
              >
                {folder.folder_name}
              </span>
              {folder.creation_date && level === 0 && (
                <span className="text-xs text-gray-400 block">
                  {t("folder.created")}: {formatDate(folder.creation_date)}
                </span>
              )}
              {(hasFilesToProcess || isProcessingFiles) && (
                <div className="text-xs text-gray-500 mt-1">
                  {hasFilesToProcess && (
                    <span className="text-blue-600">
                      {filesToProcess.length} {t("folder.readyToProcess")}
                    </span>
                  )}
                  {isProcessingFiles && (
                    <span className="text-orange-600 ml-2">
                      {processingFiles.length > 0 ? processingFiles.length : ""}{" "}
                      {t("folder.processing")}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!isEditing && !showDeleteConfirm && (
          <span
            className={`w-2 h-2 rounded-full ${
              folder.status === "Active"
                ? "bg-green-500"
                : folder.status === "Inactive"
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
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
              setEditName(folder.folder_name);
              setIsEditing(false);
            }}
            onConfirmDelete={deleteFolderConfirm}
            onCancelDelete={() => setShowDeleteConfirm(false)}
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
                setSubfolderName("");
                setShowCreateSubfolder(false);
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
          />
        </div>
      )}
    </div>
  );
};

export default FolderCard;
