import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL + '/api/v2/documentsv1';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const documentService = {
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

  getDocumentsByFolder: async (folderId) => {
    try {
      const response = await axios.get(`${BASE_URL}/folder/${folderId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents by folder:', error);
      throw error;
    }
  },

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