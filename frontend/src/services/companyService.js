import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL + '/api/v2/companies';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const companyService = {
  getCompanies: async () => {
    try {
      const response = await axios.get(BASE_URL, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  updateCompany: async (companyId, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/${companyId}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }
};