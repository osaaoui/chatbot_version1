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
  updateFolder: async (folderId, folderName = null, parentFolderId = undefined) => {
    try {
      const params = {};
      
      // Agregar folder_name si no es null
      if (folderName !== null) {
        params.folder_name = folderName;
      }
      
      // Manejar parent_folder_id y change_parent flag
      if (parentFolderId !== undefined) {
        params.parent_folder_id = parentFolderId; // null se enviará como empty string
        params.change_parent = true; // ⭐ NUEVO: Indicar que queremos cambiar el parent explícitamente
      }

      console.log('Updating folder with params:', params); // Debug

      const response = await axios.put(`${BASE_URL}/${folderId}`, null, {
        headers: getAuthHeaders(),
        params: params
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