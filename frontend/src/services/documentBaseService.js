// src/services/documentBaseService.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8001/api/v2/folders/document-bases/user';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const documentBaseService = {
  // Listar document bases del usuario
  getDocumentBases: async () => {
    try {
      const response = await axios.get(BASE_URL, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching document bases:', error);
      throw error;
    }
  },

  // Crear document base
  createDocumentBase: async (data) => {
    try {
      const response = await axios.post(BASE_URL, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating document base:', error);
      throw error;
    }
  },

  // Actualizar document base
  updateDocumentBase: async (documentBaseId, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/${documentBaseId}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating document base:', error);
      throw error;
    }
  },

  // Eliminar document base
  deleteDocumentBase: async (documentBaseId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${documentBaseId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting document base:', error);
      throw error;
    }
  }
};