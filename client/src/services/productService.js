import api from './api';

const API_URL = '/products';

const getProducts = async (params = {}) => {
  try {
    const response = await api.get(API_URL, { params });
    return response.data; // Expected: { products: [], total: 0, page: 1, limit: 10 }
  } catch (error) {
    console.error('Failed to fetch products:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch products');
  }
};

const getProductById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error(`Failed to fetch product ${id}`);
  }
};

const addProduct = async (productData) => {
  try {
    const response = await api.post(API_URL, productData);
    return response.data;
  } catch (error) {
    console.error('Failed to add product:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to add product');
  }
};

const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update product ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error(`Failed to update product ${id}`);
  }
};

const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete product ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error(`Failed to delete product ${id}`);
  }
};

const productService = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};

export default productService;
