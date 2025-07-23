import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getUserSettings = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/v2/settings/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener la configuración del usuario:', error);
    throw error;
  }
};

export const updateUserSettings = async (settings, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/v2/settings/`, 
      settings,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error al actualizar la configuración del usuario:', error);
    throw error;
  }
};