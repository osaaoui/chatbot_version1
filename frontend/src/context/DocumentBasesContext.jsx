"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
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
  const hasInitialized = useRef(false)
  const lastTokenRef = useRef(null)
  
  // Memoizar el mensaje de timeout para evitar re-renders
  const sessionTimeoutMessage = useRef("Due to inactivity, your session has been closed. We're protecting your information. Please log back in to continue chatting.")

  const fetchDocumentBases = useCallback(async () => {
    // Evitar múltiples llamadas para el mismo token
    if (!user || !token || lastTokenRef.current === token) {
      return
    }

    hasInitialized.current = true
    lastTokenRef.current = token
    setError(null)
    setInitialLoading(true)
    
    try {
      const response = await documentBaseService.getDocumentBases()

      if (response.success) {
        setDocumentBases(response.data || [])
      } else {
        setError(response.message || sessionTimeoutMessage.current)
      }
    } catch (err) {
      setError(err.message || sessionTimeoutMessage.current)
    } finally {
      setInitialLoading(false)
    }
  }, [user, token]) // Eliminar 't' de las dependencias

  const createDocumentBase = useCallback(
    async (data) => {
      setError(null)
      try {
        const response = await documentBaseService.createDocumentBase(data)
        if (response.success) {
          await fetchDocumentBases()
          return response
        } else {
          const errorMessage = t("errors.createDocumentBase", {
            defaultValue: "Error creating document base. Please try again.",
          })
          setError(response.message || errorMessage)
          throw new Error(response.message || errorMessage)
        }
      } catch (err) {
        const errorMessage = t("errors.createDocumentBase", {
          defaultValue: "Error creating document base. Please try again.",
        })
        setError(err.message || errorMessage)
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
          await fetchDocumentBases()
          return response
        } else {
          const errorMessage = t("errors.updateDocumentBase", {
            defaultValue: "Error updating document base. Please try again.",
          })
          setError(response.message || errorMessage)
          throw new Error(response.message || errorMessage)
        }
      } catch (err) {
        const errorMessage = t("errors.updateDocumentBase", {
          defaultValue: "Error updating document base. Please try again.",
        })
        setError(err.message || errorMessage)
        throw err
      }
    },
    [fetchDocumentBases, t],
  )

  const updateDocumentBaseStatus = useCallback((documentBaseId, newStatus) => {
    setDocumentBases((prev) =>
      prev.map((db) =>
        db.document_base_id === documentBaseId ? { ...db, status: newStatus } : db,
      ),
    )
  }, [])

  const deleteDocumentBase = useCallback(
    async (documentBaseId) => {
      setError(null)
      try {
        const response = await documentBaseService.deleteDocumentBase(documentBaseId)
        if (response.success) {
          setDocumentBases((prev) =>
            prev.filter((db) => db.document_base_id !== documentBaseId),
          )
          return response
        } else {
          const errorMessage = t("errors.deleteDocumentBase", {
            defaultValue: "Error deleting document base. Please try again.",
          })
          setError(response.message || errorMessage)
          throw new Error(response.message || errorMessage)
        }
      } catch (err) {
        const errorMessage = t("errors.deleteDocumentBase", {
          defaultValue: "Error deleting document base. Please try again.",
        })
        setError(err.message || errorMessage)
        throw err
      }
    },
    [t],
  )

  // Limpiar estado cuando no hay usuario autenticado
  const clearDocumentBasesData = useCallback(() => {
    setDocumentBases([])
    setInitialLoading(false)
    setError(null)
    hasInitialized.current = false
    lastTokenRef.current = null
  }, [])

  // Efecto para reaccionar SOLO a cambios en user/token
  useEffect(() => {
    if (user && token) {
      // Usuario autenticado: cargar bases de documentos
      fetchDocumentBases()
    } else {
      // No hay usuario: limpiar datos
      clearDocumentBasesData()
    }
  }, [user, token]) // Eliminar fetchDocumentBases y clearDocumentBasesData

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