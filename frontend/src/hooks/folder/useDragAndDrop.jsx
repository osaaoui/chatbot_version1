"use client"
import { useState } from "react"
import { useFolders } from "../../context/FoldersContext"

export const useDragAndDrop = (folder, allFolders, setIsExpanded, isExpanded) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { updateFolder } = useFolders()

  const isDescendantOf = (childId, parentId) => {
    if (childId === parentId) return true

    const findDescendants = (folderId) => {
      const children = allFolders.filter((f) => f.parent_folder_id === folderId)
      return children.flatMap((child) => [child.folder_id, ...findDescendants(child.folder_id)])
    }

    const descendants = findDescendants(parentId)
    return descendants.includes(childId)
  }

  const handleDragStart = (e) => {
    e.stopPropagation()
    setIsDragging(true)
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        folderId: folder.folder_id,
        folderName: folder.folder_name,
        documentBaseId: folder.document_base_id,
      }),
    )
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = (e) => {
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain") || "{}")
      const draggedFolderId = dragData.folderId

      if (draggedFolderId && !isDescendantOf(folder.folder_id, draggedFolderId)) {
        setIsDragOver(true)
      }
    } catch (err) {
    console.error("Error parsing drag data:", err)
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"))
      const { folderId: draggedFolderId, documentBaseId } = dragData

      if (isDescendantOf(folder.folder_id, draggedFolderId)) {
        return
      }

      const response = await updateFolder(draggedFolderId, documentBaseId, undefined, folder.folder_id)

      if (response.success && !isExpanded) {
        setIsExpanded(true)
      }
    } catch (err) {
      console.error("Error moving folder:", err)
    }
  }

  return {
    isDragOver,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  }
}
