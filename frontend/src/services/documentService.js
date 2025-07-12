import axios from 'axios';

const BASE_URL = 'http://localhost:8001/api/v2/documentsv1';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const documentService = {
  // Crear documento
  createDocument: async (data) => {
    try {
      const response = await axios.post(BASE_URL, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },

  // Obtener documento por ID
  getDocumentById: async (documentId) => {
    try {
      const response = await axios.get(`${BASE_URL}/${documentId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  // Actualizar documento
  updateDocument: async (documentId, documentName) => {
    try {
      const response = await axios.put(`${BASE_URL}/${documentId}`, null, {
        headers: getAuthHeaders(),
        params: { document_name: documentName }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Eliminar documento
  deleteDocument: async (documentId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${documentId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};