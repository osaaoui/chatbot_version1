// src/contexts/DocumentBasesContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { documentBaseService } from '../services/documentBaseService';

const DocumentBasesContext = createContext();

export const useDocumentBases = () => {
  const context = useContext(DocumentBasesContext);
  if (!context) {
    throw new Error('useDocumentBases must be used within a DocumentBasesProvider');
  }
  return context;
};

export const DocumentBasesProvider = ({ children }) => {
  const [documentBases, setDocumentBases] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true); // Solo para carga inicial
  const [error, setError] = useState(null);

  const fetchDocumentBases = useCallback(async () => {
    setError(null);
    try {
      const response = await documentBaseService.getDocumentBases();
      
      if (response.success) {
        setDocumentBases(response.data || []);
      } else {
        setError(response.message || 'Error fetching document bases');
      }
    } catch (err) {
      setError(err.message || 'Error fetching document bases');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const createDocumentBase = useCallback(async (data) => {
    setError(null);
    try {
      const response = await documentBaseService.createDocumentBase(data);
      
      if (response.success) {
        if (response.data && response.data.base_name) {
          setDocumentBases(prevBases => [...prevBases, response.data]);
        } else if (response.data && response.data.document_base_id) {
          const completeDocument = {
            document_base_id: response.data.document_base_id,
            base_name: data.base_name,
            company_id: data.company_id || null,
            owner_user_id: 'current-user-id',
            total_storage_mb: '0.00',
            created_by_user_id: 'current-user-id',
            creation_date: new Date().toISOString(),
            last_modified_by_user_id: 'current-user-id',
            last_modification_date: new Date().toISOString(),
            status: 'Active'
          };
          
          setDocumentBases(prevBases => [...prevBases, completeDocument]);
        } else {
          await fetchDocumentBases();
        }
        return response;
      } else {
        setError(response.message || 'Error creating document base');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error creating document base';
      setError(errorMessage);
      throw err;
    }
  }, [fetchDocumentBases]);

  const updateDocumentBase = useCallback(async (documentBaseId, data) => {
    setError(null);
    try {
      const response = await documentBaseService.updateDocumentBase(documentBaseId, data);
      if (response.success) {
        if (response.data) {
          setDocumentBases(prevBases => 
            prevBases.map(base => 
              base.document_base_id === documentBaseId ? response.data : base
            )
          );
        } else {
          await fetchDocumentBases();
        }
        return response;
      } else {
        setError(response.message || 'Error updating document base');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error updating document base';
      setError(errorMessage);
      throw err;
    }
  }, [fetchDocumentBases]);

  const deleteDocumentBase = useCallback(async (documentBaseId) => {
    setError(null);
    try {
      const response = await documentBaseService.deleteDocumentBase(documentBaseId);
      if (response.success) {
        setDocumentBases(prevBases => 
          prevBases.filter(base => base.document_base_id !== documentBaseId)
        );
        return response;
      } else {
        setError(response.message || 'Error deleting document base');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error deleting document base';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDocumentBases();
  }, [fetchDocumentBases]);

  const value = {
    documentBases,
    initialLoading,
    error,
    fetchDocumentBases,
    createDocumentBase,
    updateDocumentBase,
    deleteDocumentBase
  };

  return (
    <DocumentBasesContext.Provider value={value}>
      {children}
    </DocumentBasesContext.Provider>
  );
};