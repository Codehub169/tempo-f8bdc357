import api from './api';

const API_URL = '/reports';

const getSalesSummary = async (params = {}) => {
  // params: { startDate, endDate, period ('daily', 'monthly', 'yearly') }
  try {
    const response = await api.get(`${API_URL}/sales/summary`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sales summary:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch sales summary');
  }
};

const getSalesByProduct = async (params = {}) => {
  // params: { startDate, endDate }
  try {
    const response = await api.get(`${API_URL}/sales/by-product`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sales by product:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch sales by product');
  }
};

const getTopSellingProducts = async (params = {}) => {
  // params: { limit, startDate, endDate, criteria ('revenue' or 'quantity') }
  try {
    const response = await api.get(`${API_URL}/top-selling-products`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch top selling products:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch top selling products');
  }
};

const reportService = {
  getSalesSummary,
  getSalesByProduct,
  getTopSellingProducts,
};

export default reportService;
