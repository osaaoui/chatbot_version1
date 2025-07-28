"use client"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { companyService } from "../services/companyService"
import { useTranslation } from "react-i18next"
import { useAuth } from "./AuthProvider"

const CompanyContext = createContext()

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}

export const CompanyProvider = ({ children }) => {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const hasInitialized = useRef(false)
  const lastTokenRef = useRef(null)

  const fetchCompanies = useCallback(async () => {
    if (!user || !token || lastTokenRef.current === token) {
      return
    }

    hasInitialized.current = true
    lastTokenRef.current = token

    try {
      setLoading(true)
      setError(null)
      
      const response = await companyService.getCompanies()
      
      if (response.success && response.data?.companies) {
        setCompanies(response.data.companies)
        
        if (response.data.companies.length > 0) {
          setCurrentCompany(response.data.companies[0])
        }
      }
    } catch (err) {
      setError("Session timeout error")
      console.error('Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }, [user, token])

  const updateCompany = useCallback(async (data) => {
    if (!currentCompany) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await companyService.updateCompany(currentCompany.company_id, data)
      
      if (response.success) {
        const updatedCompany = { ...currentCompany, ...data }
        setCurrentCompany(updatedCompany)

        setCompanies(prev => 
          prev.map(company => 
            company.company_id === currentCompany.company_id ? updatedCompany : company
          )
        )
        return response
      } else {
        const errorMessage = "Error updating company. Please try again."
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err) {
      const errorMessage = "Error updating company. Please try again."
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentCompany, t])

  const updateLocalData = useCallback((data) => {
    if (currentCompany) {
      const updatedCompany = { ...currentCompany, ...data }
      setCurrentCompany(updatedCompany)
      setCompanies(prev => 
        prev.map(company => 
          company.company_id === currentCompany.company_id 
            ? updatedCompany 
            : company
        )
      )
    }
  }, [currentCompany])

  const selectCompany = useCallback((companyId) => {
    const company = companies.find(c => c.company_id === companyId)
    if (company) {
      setCurrentCompany(company)
    }
  }, [companies])

  // Obtener iniciales
  const getInitials = useCallback(() => {
    if (!currentCompany?.company_name) return ''
    return currentCompany.company_name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }, [currentCompany?.company_name])

  const clearCompanyData = useCallback(() => {
    setCompanies([])
    setCurrentCompany(null)
    setError(null)
    setLoading(false)
    hasInitialized.current = false
    lastTokenRef.current = null
  }, [])

  useEffect(() => {
    if (user && token) {
      fetchCompanies()
    } else {
      clearCompanyData()
    }
  }, [user, token, fetchCompanies, clearCompanyData])

  const value = {
    companies,
    currentCompany,
    loading,
    error,
    setError,
    updateCompany,
    updateLocalData,
    selectCompany,
    getInitials,
    clearCompanyData,
    companyName: currentCompany?.company_name || '',
    companyId: currentCompany?.company_id || null
  }

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}