"use client"

import { useState } from "react"
import { useFolders } from "../../context/FoldersContext"
import { useDocumentBases } from "../../context/DocumentBasesContext"

export const useFolderOperations = (folder) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.folder_name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false)
  const [subfolderName, setSubfolderName] = useState("")

  const { createFolder, updateFolder, deleteFolder } = useFolders()
  const { updateDocumentBaseStatus } = useDocumentBases() 

  const createSubfolder = async () => {
    if (!subfolderName.trim()) return

    try {
      const data = {
        folder_name: subfolderName.trim(),
        document_base_id: folder.document_base_id,
        parent_folder_id: folder.folder_id,
      }

      const response = await createFolder(data)

      if (response.success) {
        updateDocumentBaseStatus(folder.document_base_id, "Active")

        setSubfolderName("")
        setShowCreateSubfolder(false)
        return true
      }
    } catch (err) {
      console.error("Error creating subfolder:", err)
      return false
    }
  }

  const updateFolderName = async () => {
    if (!editName.trim() || editName.trim() === folder.folder_name) {
      setIsEditing(false)
      return
    }

    try {
      const response = await updateFolder(folder.folder_id, folder.document_base_id, editName.trim(), undefined)

      if (response.success) {
        setIsEditing(false)
        return true
      }
    } catch (err) {
      console.error("Error updating folder:", err)
      return false
    }
  }

  const deleteFolderConfirm = async () => {
    try {
      const response = await deleteFolder(folder.folder_id, folder.document_base_id)

      if (response.success) {
        setShowDeleteConfirm(false)
        return true
      }
    } catch (err) {
      console.error("Error deleting folder:", err)
      return false
    }
  }

  return {
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
  }
}
