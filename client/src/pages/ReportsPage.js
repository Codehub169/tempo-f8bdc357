import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import reportService from '../services/reportService'; // Updated import
import { DocumentChartBarIcon, PresentationChartLineIcon, ShoppingCartIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('summary'); // 'summary', 'byProduct', 'topSelling'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters for reports
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState('daily'); // For summary: 'daily', 'monthly', 'yearly'
  const [topLimit, setTopLimit] = useState(5); // For top selling
  const [topCriteria, setTopCriteria] = useState('revenue'); // For top selling: 'revenue', 'quantity'

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      let data;
      const params = { startDate, endDate };
      if (reportType === 'summary') {
        data = await reportService.getSalesSummary({ ...params, period });
      } else if (reportType === 'byProduct') {
        data = await reportService.getSalesByProduct(params);
      } else if (reportType === 'topSelling') {
        data = await reportService.getTopSellingProducts({ ...params, limit: topLimit, criteria: topCriteria });
      }
      setReportData(data);
    } catch (err) {
      setError(err.message || `Failed to generate ${reportType} report.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, period, topLimit, topCriteria]);

  const handleGenerateReport = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
        setError("Please select both a start and end date.");
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        setError("Start date cannot be after end date.");
        return;
    }
    setError(null); // Clear previous validation errors before generating
    generateReport();
  }

  const StatCard = ({ title, value, icon }) => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-neutral-text-primary">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${title.includes('Revenue') || title.includes('Value') ? 'bg-primary-light/30' : title.includes('Orders') ? 'bg-accent/20' : title.includes('Low Stock') ? 'bg-warning/20 text-warning' : 'bg-yellow-500/20 text-yellow-600'}`}>
          {React.cloneElement(icon, { className: `w-8 h-8 ${title.includes('Revenue') || title.includes('Value') ? 'text-primary' : title.includes('Orders') ? 'text-accent' : title.includes('Low Stock') ? 'text-warning' : 'text-yellow-600'}` })}
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (loading) return <p className="text-center text-neutral-text-secondary py-8">Generating report...</p>;
    if (error && !reportData) return <p className="text-center text-red-500 py-8">Error: {error}</p>; 
    if (!reportData && !loading) return <p className="text-center text-neutral-text-secondary py-8">Select report type and parameters, then click "Generate Report".</p>;
    if (!reportData) return null; // Should be caught by above, but as a safeguard

    if (reportType === 'summary') {
      const summary = reportData.sales_summary;
      const lowStockCount = reportData.low_stock_items_count;
      if (!summary) return <p className="text-center text-neutral-text-secondary py-8">Sales summary data is unavailable for the selected period.</p>;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <StatCard title="Total Revenue" value={`$${parseFloat(summary.total_revenue || 0).toFixed(2)}`} icon={<PresentationChartLineIcon />} />
          <StatCard title="Total Orders (Completed)" value={summary.total_orders || 0} icon={<ShoppingCartIcon />} />
          <StatCard title="Average Order Value" value={`$${parseFloat(summary.average_order_value || 0).toFixed(2)}`} icon={<DocumentChartBarIcon />} />
          <StatCard title="Low Stock Items (<10)" value={lowStockCount || 0} icon={<ExclamationTriangleIcon />} />
        </div>
      );
    }

    if (reportType === 'byProduct') {
      const products = reportData.sales_by_product;
      if (!products) return <p className="text-center text-neutral-text-secondary py-8">Sales by product data is unavailable for the selected period.</p>;
      if (products.length === 0) return <p className="text-center text-neutral-text-secondary py-8">No sales data found for products within the selected period.</p>;
      return (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-6">
          <table className="min-w-full divide-y divide-neutral-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-border">
              {products.map(item => (
                <tr key={item.product_id || item.product_name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-text-primary">{item.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-secondary">{item.product_sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">{item.total_quantity_sold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">${parseFloat(item.total_revenue_from_product || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (reportType === 'topSelling') {
      const topProducts = reportData.top_selling_products;
      if (!topProducts) return <p className="text-center text-neutral-text-secondary py-8">Top selling products data is unavailable for the selected period.</p>;
      if (topProducts.length === 0) return <p className="text-center text-neutral-text-secondary py-8">No top selling products found for the selected criteria and period.</p>;
      return (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-6">
          <table className="min-w-full divide-y divide-neutral-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase">{topCriteria === 'revenue' ? 'Total Revenue' : 'Quantity Sold'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-border">
              {topProducts.map((item, index) => (
                <tr key={item.product_id || item.product_name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-text-primary">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-text-primary">{item.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-secondary">{item.product_sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">
                    {topCriteria === 'revenue' ? `$${parseFloat(item.total_revenue_from_product || 0).toFixed(2)}` : (item.total_quantity_sold || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return null;
  };
  
  useEffect(() => {
    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  }, []);

  return (
    <Layout pageTitle="Sales Reports">
      <div className="p-6 space-y-6">
        <form onSubmit={handleGenerateReport} className="p-6 bg-white rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-neutral-text-primary mb-1">Report Type</label>
              <select 
                id="reportType" 
                value={reportType} 
                onChange={(e) => {
                  setReportType(e.target.value);
                  setError(null); // Clear error when changing report type
                  setReportData(null); // Clear previous report data
                }}
                className="w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="summary">Sales Summary</option>
                <option value="byProduct">Sales by Product</option>
                <option value="topSelling">Top Selling Products</option>
              </select>
            </div>

            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-neutral-text-primary mb-1">Start Date</label>
                <input 
                    type="date" 
                    id="startDate" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    required
                    className="w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-neutral-text-primary mb-1">End Date</label>
                <input 
                    type="date" 
                    id="endDate" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    required
                    className="w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
            </div>

            {reportType === 'summary' && (
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-neutral-text-primary mb-1">Period (for Summary)</label>
                <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            {reportType === 'topSelling' && (
              <>
                <div>
                  <label htmlFor="topLimit" className="block text-sm font-medium text-neutral-text-primary mb-1">Number of Products</label>
                  <input type="number" id="topLimit" value={topLimit} onChange={(e) => setTopLimit(parseInt(e.target.value, 10) || 1)} min="1" className="w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label htmlFor="topCriteria" className="block text-sm font-medium text-neutral-text-primary mb-1">Criteria</label>
                  <select id="topCriteria" value={topCriteria} onChange={(e) => setTopCriteria(e.target.value)} className="w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="revenue">By Revenue</option>
                    <option value="quantity">By Quantity Sold</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="pt-2">
            <button 
                type="submit" 
                className="w-full md:w-auto flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>

        <div className="mt-8">
          {renderReportContent()}
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
