import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL + '/api/v2/folders';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const folderService = {
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

  updateFolder: async (folderId, folderName = null, parentFolderId = undefined) => {
    try {
      const params = {};

      if (folderName !== null) {
        params.folder_name = folderName;
      }
      
      if (parentFolderId !== undefined) {
        params.parent_folder_id = parentFolderId;
        params.change_parent = true;
      }

      console.log('Updating folder with params:', params);

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