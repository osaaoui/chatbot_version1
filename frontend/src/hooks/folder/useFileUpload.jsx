"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export const useFileUpload = (folder, stagedFiles, setStagedFiles) => {
  const [processedFiles, setProcessedFiles] = useState([])

  useEffect(() => {
    if (stagedFiles && stagedFiles.length > 0) {
      const folderStagedFiles = stagedFiles.filter((f) => f.folderId === folder.folder_id)

      setProcessedFiles((prev) => {
        const updatedFiles = prev.map((localFile) => {
          const stagedFile = folderStagedFiles.find(
            (sf) =>
              sf.documentId === localFile.documentId ||
              (sf.name === localFile.name && sf.folderId === localFile.folderId),
          )

          if (stagedFile) {
            if (stagedFile.status === "processed") {
              return { ...localFile, status: "processed" }
            }
            if (stagedFile.status === "processing") {
              return { ...localFile, status: "processing" }
            }
          }

          return localFile
        })

        return updatedFiles
      })

      setTimeout(() => {
        setProcessedFiles((prev) => prev.filter((f) => f.status !== "processed"))
      }, 1000)
    }
  }, [stagedFiles, folder.folder_id])

  const handleFileUpload = async (files) => {
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("document_base_id", folder.document_base_id)
        formData.append("folder_id", folder.folder_id)

        const response = await axios.post(import.meta.env.VITE_API_URL + "/api/v2/uploads/upload/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        const newStagedFile = {
          name: response.data.filename || file.name,
          original: file.name,
          documentId: response.data.document_id,
          status: "uploaded",
          folderId: folder.folder_id,
        }

        if (setStagedFiles) {
          setStagedFiles((prev) => [...prev, newStagedFile])
        } else {
          setProcessedFiles((prev) => [
            ...prev,
            {
              name: response.data.filename || file.name,
              original: file.name,
              documentId: response.data.document_id,
              status: "ready_to_process",
              folderId: folder.folder_id,
            },
          ])
        }
      } catch (err) {
        console.error("Error uploading file:", file.name, err)
      }
    }
  }

  const getCurrentFolderFiles = () => {
    const currentFolderProcessed = processedFiles.filter((f) => f.folderId === folder.folder_id)

    const stagedFilesForFolder = stagedFiles.filter(
      (f) => f.folderId === folder.folder_id && (f.status === "uploaded" || f.status === "ready_to_process"),
    )

    const localFilesToProcess = currentFolderProcessed.filter(
      (f) =>
        f.status === "ready_to_process" &&
        !stagedFiles.some((sf) => sf.documentId === f.documentId && sf.status === "processed"),
    )

    const allFilesToProcess = [...localFilesToProcess, ...stagedFilesForFolder]
    const processingFiles = currentFolderProcessed.filter((f) => f.status === "processing")

    return {
      filesToProcess: allFilesToProcess,
      processingFiles,
      hasFilesToProcess: allFilesToProcess.length > 0,
      isProcessingFiles: processingFiles.length > 0,
    }
  }

  return {
    processedFiles,
    handleFileUpload,
    getCurrentFolderFiles,
  }
}
