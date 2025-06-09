import api from './api';

const API_URL = '/orders';

const getOrders = async (params = {}) => {
  try {
    const response = await api.get(API_URL, { params });
    return response.data; // Expected: { orders: [], total: 0, page: 1, limit: 10 }
  } catch (error) {
    console.error('Failed to fetch orders:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch orders');
  }
};

const getOrderById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch order ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error(`Failed to fetch order ${id}`);
  }
};

const createOrder = async (orderData) => {
  try {
    const response = await api.post(API_URL, orderData);
    return response.data;
  } catch (error) {
    console.error('Failed to create order:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to create order');
  }
};

const updateOrderStatus = async (id, status) => {
  try {
    const response = await api.put(`${API_URL}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Failed to update order ${id} status:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error(`Failed to update order ${id} status`);
  }
};

const orderService = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
};

export default orderService;
