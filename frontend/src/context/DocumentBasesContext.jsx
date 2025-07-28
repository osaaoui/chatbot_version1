"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { documentBaseService } from "../services/documentBaseService"
import { useTranslation } from "react-i18next"
import { useAuth } from "./AuthProvider"
import { useCompany } from "./CompanyContext"

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
  const { user, token } = useAuth()
  const { companyId } = useCompany()
  const [documentBases, setDocumentBases] = useState([])
  const [initialLoading, setInitialLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false) // Nuevo estado para refresh
  const [error, setError] = useState(null)
  const hasInitialized = useRef(false)
  const lastTokenRef = useRef(null)
  
  const sessionTimeoutMessage = useRef("Due to inactivity, your session has been closed. We're protecting your information. Please log back in to continue chatting.")

  const fetchDocumentBases = useCallback(async (isRefresh = false) => {
    if (!user || !token || lastTokenRef.current === token) {
      return
    }

    hasInitialized.current = true
    lastTokenRef.current = token
    setError(null)
    
    // Usar diferentes estados de loading según el contexto
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setInitialLoading(true)
    }
    
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
      if (isRefresh) {
        setIsRefreshing(false)
      } else {
        setInitialLoading(false)
      }
    }
  }, [user, token])

  const createDocumentBase = useCallback(
    async (data) => {
      if (!companyId) {
        const errorMessage = t("errors.noCompanySelected", {
          defaultValue: "No company selected. Please select a company first.",
        })
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      setError(null)
      try {
        const dataWithCompanyId = {
          ...data,
          company_id: companyId
        }
        
        const response = await documentBaseService.createDocumentBase(dataWithCompanyId)
        if (response.success) {
          // Actualización optimista: agregar inmediatamente el nuevo documento base
          const newDocumentBase = {
            document_base_id: response.data?.document_base_id || Date.now(),
            base_name: data.base_name,
            creation_date: new Date().toISOString(),
            status: response.data?.status || "Pending", // Respetar el estado real del servidor
            company_id: companyId,
            ...response.data // Sobrescribir con datos reales del servidor
          }
          
          setDocumentBases(prev => [newDocumentBase, ...prev])
          
          // Luego hacer refresh en background para sincronizar
          await fetchDocumentBases(true) // isRefresh = true
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
    [fetchDocumentBases, t, companyId],
  )

  const updateDocumentBase = useCallback(
    async (documentBaseId, data) => {
      setError(null)
      try {
        const response = await documentBaseService.updateDocumentBase(documentBaseId, data)
        if (response.success) {
          // Actualización optimista
          setDocumentBases(prev => 
            prev.map(db => 
              db.document_base_id === documentBaseId 
                ? { ...db, ...data, ...response.data }
                : db
            )
          )
          
          // Refresh en background
          await fetchDocumentBases(true)
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
        // Actualización optimista: remover inmediatamente
        setDocumentBases((prev) =>
          prev.filter((db) => db.document_base_id !== documentBaseId),
        )
        
        const response = await documentBaseService.deleteDocumentBase(documentBaseId)
        if (response.success) {
          return response
        } else {
          // Si falla, restaurar
          await fetchDocumentBases(true)
          const errorMessage = t("errors.deleteDocumentBase", {
            defaultValue: "Error deleting document base. Please try again.",
          })
          setError(response.message || errorMessage)
          throw new Error(response.message || errorMessage)
        }
      } catch (err) {
        // Si falla, restaurar
        await fetchDocumentBases(true)
        const errorMessage = t("errors.deleteDocumentBase", {
          defaultValue: "Error deleting document base. Please try again.",
        })
        setError(err.message || errorMessage)
        throw err
      }
    },
    [t, fetchDocumentBases],
  )

  const clearDocumentBasesData = useCallback(() => {
    setDocumentBases([])
    setInitialLoading(false)
    setIsRefreshing(false)
    setError(null)
    hasInitialized.current = false
    lastTokenRef.current = null
  }, [])

  useEffect(() => {
    if (user && token) {
      fetchDocumentBases(false) // isRefresh = false para carga inicial
    } else {
      clearDocumentBasesData()
    }
  }, [user, token])

  const value = {
    documentBases,
    initialLoading,
    isRefreshing, // Nuevo valor en el contexto
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