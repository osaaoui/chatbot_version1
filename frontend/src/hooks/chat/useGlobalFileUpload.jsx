"use client"

import { useState, useCallback } from "react"
import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL + "/api/v2"

export const useGlobalFileUpload = (setStagedFiles) => {
  // No necesitamos updateFolderStatus ni updateDocumentBaseStatus aquí para la subida inicial
  // const { updateFolderStatus } = useFolders();
  // const { updateDocumentBaseStatus } = useDocumentBases();
  const [isUploading, setIsUploading] = useState(false)

  const uploadFiles = useCallback(
    async (files, documentBaseId, folderId) => {
      setIsUploading(true)
      const uploadPromises = files.map(async (file) => {
        try {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("document_base_id", documentBaseId)
          formData.append("folder_id", folderId)

          const response = await axios.post(API_BASE + "/uploads/upload/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })

          // ELIMINAR: No actualizar el estado de la carpeta/documentBase a "Active" aquí.
          // Esto se hará solo cuando el archivo sea PROCESADO.
          // updateFolderStatus(folderId, documentBaseId, "Active");
          // updateDocumentBaseStatus(documentBaseId, "Active");

          const newStagedFile = {
            name: response.data.filename || file.name,
            original: file.name,
            documentId: response.data.document_id,
            status: "uploaded", // El estado inicial después de la subida es 'uploaded'
            folderId: folderId,
            documentBaseId: documentBaseId, // Asegurarse de pasar documentBaseId
          }

          if (setStagedFiles) {
            setStagedFiles((prev) => [...prev, newStagedFile])
          }
          return { success: true, file: file.name }
        } catch (err) {
          console.error("Error uploading file:", file.name, err)
          return { success: false, file: file.name, error: err.message }
        }
      })

      const results = await Promise.all(uploadPromises)
      setIsUploading(false)
      return results
    },
    [setStagedFiles], // updateFolderStatus y updateDocumentBaseStatus ya no son dependencias
  )

  return { uploadFiles, isUploading }
}
