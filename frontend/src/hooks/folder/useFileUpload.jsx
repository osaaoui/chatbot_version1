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
            // Si el archivo está 'uploaded' o 'ready_to_process', no lo marcamos como 'processed' aquí
            if (stagedFile.status === "uploaded" || stagedFile.status === "ready_to_process") {
              return { ...localFile, status: stagedFile.status }
            }
          }

          return localFile
        })

        return updatedFiles
      })

      // Mantener los archivos 'processed' visibles por un corto tiempo, luego eliminarlos de processedFiles
      // para que la fuente de verdad sea stagedFiles y la API
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

        // ELIMINAR: No actualizar el estado de la carpeta/documentBase a "Active" aquí.
        // Esto se hará solo cuando el archivo sea PROCESADO.
        // if (folder.status !== "Active") {
        //   updateFolderStatus(folder.folder_id, folder.document_base_id, "Active");
        // }
        // updateDocumentBaseStatus(folder.document_base_id, "Active");

        const newStagedFile = {
          name: response.data.filename || file.name,
          original: file.name,
          documentId: response.data.document_id,
          status: "uploaded", // El estado inicial después de la subida es 'uploaded'
          folderId: folder.folder_id,
          documentBaseId: folder.document_base_id, // Añadir documentBaseId para uso posterior
        }

        if (setStagedFiles) {
          setStagedFiles((prev) => [...prev, newStagedFile])
        } else {
          // Esto es un fallback si setStagedFiles no se pasa, pero debería pasarse
          setProcessedFiles((prev) => [
            ...prev,
            {
              name: response.data.filename || file.name,
              original: file.name,
              documentId: response.data.document_id,
              status: "uploaded", // Estado inicial
              folderId: folder.folder_id,
              documentBaseId: folder.document_base_id,
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
