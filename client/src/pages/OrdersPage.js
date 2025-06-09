import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import OrderModal from '../components/OrderModal';
import BillModal from '../components/BillModal';
import orderService from '../services/orderService'; // Updated import
import { PlusIcon, EyeIcon, MagnifyingGlassIcon, PrinterIcon } from '@heroicons/react/24/outline';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOption, setSortOption] = useState('order_date_desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10; // Orders per page

  const location = useLocation();
  const navigate = useNavigate();

  const fetchOrdersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit,
        customer_name: searchTerm, // API expects customer_name for search
        status: filterStatus,
        sortBy: sortOption.split('_')[0], // API uses 'sortBy'
        sortOrder: sortOption.split('_')[1]?.toUpperCase() || 'ASC',
      };
      const data = await orderService.getOrders(params); // Updated usage
      setOrders(data.orders || []);
      setTotalPages(Math.ceil(data.total / limit) || 1); // API returns 'total' for total orders
      setTotalOrders(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, sortOption, limit]);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  useEffect(() => {
    if (location.hash === '#create-new') {
      setIsOrderModalOpen(true);
      navigate(location.pathname, { replace: true }); // Clear hash
    }
  }, [location, navigate]);

  const handleCreateNewOrder = () => {
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (orderData) => {
    try {
      await orderService.createOrder(orderData); // Updated usage
      fetchOrdersData(); // Refresh list
      setIsOrderModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to create order.');
      alert(err.response?.data?.message || err.message || 'Failed to create order.');
    }
  };

  const handleViewBill = async (order) => {
    // Fetch full order details including items for the bill
    try {
        setLoading(true);
        const fullOrder = await orderService.getOrderById(order.id); // Updated usage
        setSelectedOrderForBill(fullOrder);
        setIsBillModalOpen(true);
    } catch (err) {
        setError('Failed to fetch order details for bill.');
        alert('Failed to fetch order details for bill.');
    } finally {
        setLoading(false);
    }
  };
  
  const handleChangeStatus = async (orderId, newStatus) => {
    if (!newStatus) {
        alert('Please select a new status.');
        return;
    }
    const currentOrder = orders.find(o => o.id === orderId);
    if (currentOrder && currentOrder.status === newStatus) {
        return; // No change in status
    }

    if (window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
        try {
            await orderService.updateOrderStatus(orderId, newStatus); // Updated usage
            fetchOrdersData(); // Refresh list
        } catch (err) {
            setError(err.message || 'Failed to update order status.');
            alert(err.response?.data?.message || err.message || 'Failed to update order status.');
        }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-success text-white';
      case 'Shipped': return 'bg-blue-500 text-white';
      case 'Processing': return 'bg-yellow-500 text-black';
      case 'Pending': return 'bg-warning text-white';
      case 'Cancelled': return 'bg-error text-white';
      default: return 'bg-gray-300 text-neutral-text-primary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  return (
    <Layout pageTitle="Order Management">
      <div className="p-6 space-y-6">
        {/* Search and Filters */} 
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="relative flex-grow md:col-span-1">
                <label htmlFor="search-orders" className="sr-only">Search orders</label>
                <input
                    type="text"
                    id="search-orders"
                    placeholder="Search by Customer Name..."
                    className="w-full px-4 py-2.5 pr-10 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-neutral-text-secondary" />
                </span>
            </div>
            <div>
                <label htmlFor="filterStatus" className="block text-sm font-medium text-neutral-text-primary mb-1">Status</label>
                <select 
                    id="filterStatus" 
                    className="w-full px-4 py-2.5 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">All Statuses</option>
                    {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="sortOrders" className="block text-sm font-medium text-neutral-text-primary mb-1">Sort By</label>
                <select 
                    id="sortOrders"
                    className="w-full px-4 py-2.5 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={sortOption}
                    onChange={(e) => {
                        setSortOption(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="order_date_desc">Order Date (Newest First)</option>
                    <option value="order_date_asc">Order Date (Oldest First)</option>
                    <option value="total_amount_desc">Total Amount (High to Low)</option>
                    <option value="total_amount_asc">Total Amount (Low to High)</option>
                    <option value="customer_name_asc">Customer Name (A-Z)</option>
                    <option value="customer_name_desc">Customer Name (Z-A)</option>
                     <option value="status_asc">Status (A-Z)</option>
                    <option value="status_desc">Status (Z-A)</option>
                </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-text-primary">Order List ({totalOrders})</h2>
            <button 
                onClick={handleCreateNewOrder} 
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                Create New Order
            </button>
        </div>

        {error && <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}

        {/* Orders Table */} 
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <p className="p-4 text-center text-neutral-text-secondary">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-4 text-center text-neutral-text-secondary">No orders found. Try adjusting your search or filters.</p>
          ) : (
            <table className="min-w-full divide-y divide-neutral-border">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-border">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary hover:underline">
                        <Link to={`/orders/${order.id}`}>#{order.id.toString().padStart(6, '0')}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">{order.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-secondary">{formatDate(order.order_date || order.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                        <select 
                            value={order.status} 
                            onChange={(e) => handleChangeStatus(order.id, e.target.value)}
                            className="text-xs p-1 border rounded-md border-neutral-border focus:ring-primary focus:border-primary disabled:opacity-50"
                            disabled={order.status === 'Completed' || order.status === 'Cancelled'}
                        >
                            {statusOptions.map(s => <option key={s} value={s} disabled={s === order.status}>{s}</option>)}
                        </select>
                        {(order.status === 'Completed' || order.status === 'Shipped') && (
                            <button onClick={() => handleViewBill(order)} className="text-accent hover:text-green-700 p-1" title="View Bill">
                                <PrinterIcon className="w-5 h-5" />
                            </button>
                        )}
                         <Link to={`/orders/${order.id}`} className="text-primary hover:text-primary-light p-1" title="View Details">
                            <EyeIcon className="w-5 h-5" />
                        </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */} 
        {totalPages > 1 && (
           <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-border sm:px-6 rounded-b-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-neutral-border text-sm font-medium rounded-md text-neutral-text-secondary bg-white hover:bg-gray-50 disabled:opacity-50"> Previous </button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-border text-sm font-medium rounded-md text-neutral-text-secondary bg-white hover:bg-gray-50 disabled:opacity-50"> Next </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-neutral-text-secondary">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalOrders)}</span> of <span className="font-medium">{totalOrders}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-border bg-white text-sm font-medium text-neutral-text-secondary hover:bg-gray-50 disabled:opacity-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                  </button>
                  {[...Array(totalPages).keys()].map(num => (
                     <button 
                        key={num+1} 
                        onClick={() => handlePageChange(num+1)} 
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === num+1 ? 'z-10 bg-primary-light border-primary text-neutral-text-primary' : 'bg-white border-neutral-border text-neutral-text-secondary hover:bg-gray-50'}`}
                      >
                        {num+1}
                      </button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-border bg-white text-sm font-medium text-neutral-text-secondary hover:bg-gray-50 disabled:opacity-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010-1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSaveOrder={handleSaveOrder}
      />
      {selectedOrderForBill && (
        <BillModal
          isOpen={isBillModalOpen}
          onClose={() => {
            setIsBillModalOpen(false);
            setSelectedOrderForBill(null);
          }}
          order={selectedOrderForBill}
        />
      )}
    </Layout>
  );
};

export default OrdersPage;
