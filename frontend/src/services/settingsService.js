import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getUserSettings = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/v2/settings/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = response.data.data;
    if (data && data.interface_mode) {
      data.theme = data.interface_mode;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener la configuración del usuario:', error);
    throw error;
  }
};

export const updateUserSettings = async (settings, token) => {
  try {
    const backendSettings = { ...settings };
    if (backendSettings.theme) {
      backendSettings.interface_mode = backendSettings.theme;
      delete backendSettings.theme;
    }
    
    const response = await axios.patch(
      `${API_URL}/api/v2/settings/`, 
      backendSettings,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = response.data.data;
    if (data && data.interface_mode) {
      data.theme = data.interface_mode;
    }
    
    return data;
  } catch (error) {
    console.error('Error al actualizar la configuración del usuario:', error);
    throw error;
  }
};