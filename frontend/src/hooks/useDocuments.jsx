import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../services/documentService';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createDocument = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.createDocument(data);
      if (response.success) {
        return response;
      } else {
        setError(response.message || 'Error creating document');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error creating document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentById = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getDocumentById(documentId);
      if (response.success) {
        return response;
      } else {
        setError(response.message || 'Error fetching document');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error fetching document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (documentId, documentName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.updateDocument(documentId, documentName);
      if (response.success) {
        return response;
      } else {
        setError(response.message || 'Error updating document');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error updating document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.deleteDocument(documentId);
      if (response.success) {
        return response;
      } else {
        setError(response.message || 'Error deleting document');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error deleting document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    createDocument,
    getDocumentById,
    updateDocument,
    deleteDocument
  };
};