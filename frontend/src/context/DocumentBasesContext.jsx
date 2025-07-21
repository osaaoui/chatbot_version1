"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { documentBaseService } from "../services/documentBaseService"
import { useTranslation } from "react-i18next"
import { useAuth } from "./AuthProvider"

const DocumentBasesContext = createContext()

export const useDocumentBases = () => {
  const context = useContext(DocumentBasesContext)
  if (!context) {
    throw new Error("useDocumentBases must be used within a DocumentBasesProvider")
  }
  return context
}

export const DocumentBasesProvider = ({ children }) => {
  const { t } = useTranslation()
  const { user, token } = useAuth() // Agregar dependencia de auth
  const [documentBases, setDocumentBases] = useState([])
  const [initialLoading, setInitialLoading] = useState(false) // Cambiar a false inicialmente
  const [error, setError] = useState(null)
  
  const sessionTimeoutMessage = t("errors.sessionTimeout", {
    defaultValue:
      "Due to inactivity, your session has been closed. We're protecting your information. Please log back in to continue chatting.",
  })

  const fetchDocumentBases = useCallback(async () => {
    // Solo buscar bases de documentos si hay usuario y token
    if (!user || !token) {
      return
    }

    setError(null)
    setInitialLoading(true)
    
    try {
      const response = await documentBaseService.getDocumentBases()

      if (response.success) {
        setDocumentBases(response.data || [])
      } else {
        setError(response.message || sessionTimeoutMessage)
      }
    } catch (err) {
      setError(err.message || sessionTimeoutMessage)
    } finally {
      setInitialLoading(false)
    }
  }, [user, token, sessionTimeoutMessage]) // Agregar user y token como dependencias

  const createDocumentBase = useCallback(
    async (data) => {
      setError(null)
      try {
        const response = await documentBaseService.createDocumentBase(data)

        if (response.success) {
          if (response.data?.base_name) {
            setDocumentBases((prevBases) => [...prevBases, response.data])
          } else if (response.data?.document_base_id) {
            const completeDocument = {
              document_base_id: response.data.document_base_id,
              base_name: data.base_name,
              company_id: data.company_id || null,
              owner_user_id: "current-user-id",
              total_storage_mb: "0.00",
              created_by_user_id: "current-user-id",
              creation_date: new Date().toISOString(),
              last_modified_by_user_id: "current-user-id",
              last_modification_date: new Date().toISOString(),
              status: "Active",
            }
            setDocumentBases((prevBases) => [...prevBases, completeDocument])
          } else {
            await fetchDocumentBases()
          }
          return response
        } else {
          setError(response.message || t("errors.createDocumentBase"))
          return response
        }
      } catch (err) {
        const errorMessage = err.message || t("errors.createDocumentBase")
        setError(errorMessage)
        throw err
      }
    },
    [fetchDocumentBases, t],
  )

  const updateDocumentBase = useCallback(
    async (documentBaseId, data) => {
      setError(null)
      try {
        const response = await documentBaseService.updateDocumentBase(documentBaseId, data)
        if (response.success) {
          if (response.data) {
            setDocumentBases((prevBases) =>
              prevBases.map((base) => (base.document_base_id === documentBaseId ? response.data : base)),
            )
          } else {
            await fetchDocumentBases()
          }
          return response
        } else {
          setError(response.message || t("errors.updateDocumentBase"))
          return response
        }
      } catch (err) {
        const errorMessage = err.message || t("errors.updateDocumentBase")
        setError(errorMessage)
        throw err
      }
    },
    [fetchDocumentBases, t],
  )

  const updateDocumentBaseStatus = useCallback((documentBaseId, newStatus) => {
    setDocumentBases((prevBases) =>
      prevBases.map((base) => (base.document_base_id === documentBaseId ? { ...base, status: newStatus } : base)),
    )
  }, [])

  const deleteDocumentBase = useCallback(
    async (documentBaseId) => {
      setError(null)
      try {
        const response = await documentBaseService.deleteDocumentBase(documentBaseId)
        if (response.success) {
          setDocumentBases((prevBases) => prevBases.filter((base) => base.document_base_id !== documentBaseId))
          return response
        } else {
          setError(response.message || t("errors.deleteDocumentBase"))
          return response
        }
      } catch (err) {
        const errorMessage = err.message || t("errors.deleteDocumentBase")
        setError(errorMessage)
        throw err
      }
    },
    [t],
  )

  // Limpiar estado cuando no hay usuario autenticado
  const clearDocumentBasesData = useCallback(() => {
    setDocumentBases([])
    setError(null)
    setInitialLoading(false)
  }, [])

  // Efecto para reaccionar a cambios en la autenticación
  useEffect(() => {
    if (user && token) {
      // Usuario autenticado: cargar bases de documentos
      fetchDocumentBases()
    } else {
      // No hay usuario: limpiar datos
      clearDocumentBasesData()
    }
  }, [user, token, fetchDocumentBases, clearDocumentBasesData])

  const value = {
    documentBases,
    initialLoading,
    error,
    fetchDocumentBases,
    createDocumentBase,
    updateDocumentBase,
    deleteDocumentBase,
    updateDocumentBaseStatus,
    clearDocumentBasesData,
  }

  return <DocumentBasesContext.Provider value={value}>{children}</DocumentBasesContext.Provider>
}