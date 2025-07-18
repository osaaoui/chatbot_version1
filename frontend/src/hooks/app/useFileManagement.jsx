"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useFolders } from "../../context/FoldersContext" // Importar useFolders
import { useDocumentBases } from "../../context/DocumentBasesContext" // Importar useDocumentBases

const API_BASE = import.meta.env.VITE_API_URL + "/api/v2"

const formatFilesData = (data) =>
  data.map((entry) => ({
    name: entry.filename,
    status: "processed", // Asumimos que los archivos obtenidos de la API ya están procesados
    total_chunks: entry.total_chunks,
    processed_at: entry.processed_at,
    documentId: entry.document_id, // Asegurarse de incluir document_id
    folderId: entry.folder_id, // Asegurarse de incluir folder_id
    documentBaseId: entry.document_base_id, // Asegurarse de incluir document_base_id
  }))

const deduplicateFiles = (files) => Array.from(new Map(files.map((f) => [f.name, f])).values())

export const useFileManagement = (user, token, t) => {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [stagedFiles, setStagedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const { updateFolderStatus } = useFolders() // Obtener la función del contexto
  const { updateDocumentBaseStatus } = useDocumentBases() // Obtener la función del contexto

  const fetchFiles = useCallback(async () => {
    if (!token || !user?.email) return
    try {
      const response = await axios.get(`${API_BASE}/documents/user-documents/${user.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUploadedFiles(formatFilesData(response.data))
      setStagedFiles((prevStaged) => {
        const newProcessed = formatFilesData(response.data)
        const merged = [...prevStaged, ...newProcessed]
        const deduplicated = Array.from(
          merged
            .reduce((map, file) => {
              const existing = map.get(file.documentId || file.name)
              if (!existing || file.status === "processed") {
                map.set(file.documentId || file.name, file)
              }
              return map
            }, new Map())
            .values(),
        )
        return deduplicated
      })
    } catch (error) {
      console.error("Failed to fetch uploaded files:", error)
    }
  }, [token, user?.email])

  const handleProcess = useCallback(async () => {
    const filesToProcess = stagedFiles.filter((f) => f.status === "uploaded" || f.status === "ready_to_process")

    if (!filesToProcess.length || !token || !user) return

    setIsProcessing(true)

    setStagedFiles((prev) => prev.map((f) => (filesToProcess.includes(f) ? { ...f, status: "processing" } : f)))

    try {
      const groupedFiles = filesToProcess.reduce((acc, file) => {
        const key = `${file.documentBaseId || "no_base"}-${file.folderId || "no_folder"}`
        if (!acc[key]) {
          acc[key] = {
            document_base_id: file.documentBaseId,
            folder_id: file.folderId,
            filenames: [],
            document_ids: [],
          }
        }
        acc[key].filenames.push(file.name)
        if (file.documentId) {
          acc[key].document_ids.push(file.documentId)
        }
        return acc
      }, {})

      const processPromises = Object.values(groupedFiles).map(async (group) => {
        const payload = {
          user_id: user.email,
          filenames: group.filenames,
          document_ids: group.document_ids,
          document_base_id: group.document_base_id,
          folder_id: group.folder_id,
        }

        const response = await axios.post(`${API_BASE}/documents/process/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        return response.data
      })

      const results = await Promise.all(processPromises)

      setStagedFiles((prev) => {
        const updated = prev.map((f) => {
          const isProcessed = results.some((res) => res.processed_files?.includes(f.name))
          if (isProcessed) {
            // Si el archivo fue procesado, también actualiza el estado de la carpeta y la base de documentos
            updateFolderStatus(f.folderId, f.documentBaseId, "Active")
            updateDocumentBaseStatus(f.documentBaseId, "Active")
            return { ...f, status: "processed" }
          }
          return f
        })
        return deduplicateFiles(updated)
      })

      alert(`✅ ${t("common.success")}: Archivos procesados.`)
    } catch (err) {
      alert(`❌ ${t("common.failed")}: Error al procesar archivos.`)
      console.error(err)
      setStagedFiles((prev) => prev.map((f) => (filesToProcess.includes(f) ? { ...f, status: "uploaded" } : f)))
    } finally {
      setIsProcessing(false)
    }
  }, [stagedFiles, token, user, t, updateFolderStatus, updateDocumentBaseStatus]) // Añadir dependencias

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return {
    uploadedFiles,
    stagedFiles,
    isProcessing,
    setStagedFiles,
    handleProcess,
  }
}
