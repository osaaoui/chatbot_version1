import axios from 'axios';

const BASE_URL = 'http://localhost:8001/api/v2/folders';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const folderService = {
  // Listar carpetas del usuario
  getFolders: async () => {
    try {
      const response = await axios.get(BASE_URL, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  },

  // Crear carpeta
  createFolder: async (data) => {
    try {
      const response = await axios.post(BASE_URL, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  // Obtener carpeta por ID
  getFolderById: async (folderId) => {
    try {
      const response = await axios.get(`${BASE_URL}/${folderId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching folder:', error);
      throw error;
    }
  },

  // Actualizar carpeta
  updateFolder: async (folderId, folderName) => {
    try {
      const response = await axios.put(`${BASE_URL}/${folderId}`, null, {
        headers: getAuthHeaders(),
        params: { folder_name: folderName }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  // Eliminar carpeta
  deleteFolder: async (folderId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${folderId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }
};