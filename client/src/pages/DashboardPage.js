import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSalesSummary } from '../services/reportService'; 
import { getOrders } from '../services/orderService';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  DocumentChartBarIcon,
  PlusIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon, trend, trendColor = 'text-success', unit = '', link, linkText }) => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-text-secondary">{title}</p>
        <p className={`text-3xl font-bold ${unit === '$' ? 'text-neutral-text-primary' : (title === 'Low Stock Items' && value > 0 ? 'text-warning' : 'text-neutral-text-primary')}`}>
          {unit === '$' && '$'}{value}{unit !== '$' && unit}
        </p>
      </div>
      <div className={`p-3 rounded-full ${title === 'Low Stock Items' && value > 0 ? 'bg-warning/20' : (title === 'New Orders' ? 'bg-accent/20' : 'bg-primary-light/30')}`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${title === 'Low Stock Items' && value > 0 ? 'text-warning' : (title === 'New Orders' ? 'text-accent' : 'text-primary')}` })}
      </div>
    </div>
    {trend && (
      <p className={`mt-2 text-xs ${trendColor} flex items-center`}>
        <ArrowUpIcon className="w-4 h-4 mr-1" /> 
        {trend}
      </p>
    )}
    {link && linkText && (
        <p className="mt-2 text-xs text-neutral-text-secondary">
            <Link to={link} className="text-primary hover:underline">{linkText}</Link>
        </p>
    )}
  </div>
);

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingSummary(true);
        const summaryRes = await getSalesSummary({ period: 'daily' }); // Fetch daily summary
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('Failed to fetch sales summary:', err);
        setError('Failed to load dashboard summary. Please try again later.');
      }
      setLoadingSummary(false);

      try {
        setLoadingOrders(true);
        const ordersRes = await getOrders({ limit: 3, sortBy: 'created_at', sortOrder: 'DESC' });
        setRecentOrders(ordersRes.data.orders || []);
      } catch (err) {
        console.error('Failed to fetch recent orders:', err);
        // Keep existing error or set new if summary was fine
        if (!error) setError('Failed to load recent orders. Please try again later.');
      }
      setLoadingOrders(false);
    };
    fetchData();
  }, [error]); // Added error to dependency array to potentially allow retry or clear on other actions

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  if (loadingSummary || loadingOrders) {
    return <Layout pageTitle="Dashboard Overview"><div className="p-6 text-center">Loading dashboard data...</div></Layout>;
  }

  if (error && !summary && recentOrders.length === 0) {
    return <Layout pageTitle="Dashboard Overview"><div className="p-6 text-center text-error">{error}</div></Layout>;
  }

  return (
    <Layout pageTitle="Dashboard Overview">
      <div className="p-6 space-y-6">
        {error && (!summary || recentOrders.length === 0) && <div className="p-3 text-sm text-error bg-red-100 rounded-md">{error}</div>}
        {/* Stats cards */} 
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Total Sales Today" 
            value={summary?.total_revenue?.toFixed(2) || '0.00'} 
            icon={<CurrencyDollarIcon />} 
            unit="$"
            // trend="15% from yesterday" // Placeholder, API doesn't provide this directly
          />
          <StatCard 
            title="New Orders Today" 
            value={summary?.total_orders || 0} 
            icon={<ShoppingCartIcon />} 
            // trend="5 more than yesterday" // Placeholder
          />
          <StatCard 
            title="Low Stock Items" 
            value={summary?.low_stock_items_count || 0} 
            icon={<ExclamationTriangleIcon />} 
            link="/products?filter=low_stock" // Assuming products page can filter by low_stock
            linkText="View items"
          />
        </div>

        {/* Recent Activity & Quick Actions */} 
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-neutral-text-primary mb-4">Recent Orders</h2>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Order ID</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Customer</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Total</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-border">
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-text-primary hover:underline">
                           <Link to={`/orders/${order.id}`}>#{order.id}</Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-text-primary">{order.customer_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-text-secondary">{formatDate(order.order_date || order.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-text-primary">${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full 
                            ${order.status === 'Completed' ? 'bg-success text-white' : 
                            order.status === 'Pending' ? 'bg-warning text-white' : 
                            order.status === 'Cancelled' ? 'bg-error text-white' : 
                            'bg-primary-light text-white'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-neutral-text-secondary">No recent orders to display.</p>
            )}
            <div className="mt-4 text-right">
              <Link to="/orders" className="text-sm font-medium text-primary hover:text-primary-light">View all orders &rarr;</Link>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-neutral-text-primary mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/orders#create-new" className="flex items-center w-full px-4 py-3 text-sm font-medium text-white bg-accent rounded-lg hover:bg-green-700 transition-colors duration-150">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create New Order
              </Link>
              <Link to="/products#add-new" className="flex items-center w-full px-4 py-3 text-sm font-medium text-neutral-text-primary bg-primary-light/20 rounded-lg hover:bg-primary-light hover:text-white transition-colors duration-150">
                <ArchiveBoxIcon className="w-5 h-5 mr-2" />
                Add New Product
              </Link>
              <Link to="/reports" className="flex items-center w-full px-4 py-3 text-sm font-medium text-neutral-text-primary bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150">
                <DocumentChartBarIcon className="w-5 h-5 mr-2" />
                Generate Sales Report
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
