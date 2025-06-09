const express = require('express');
const { getDb } = require('../database');
// const { authenticateToken } = require('./authRoutes'); // Authentication removed

const router = express.Router();

// Helper to parse date range queries
const parseDateRange = (startDateStr, endDateStr) => {
    let startDate = startDateStr ? new Date(startDateStr) : null;
    let endDate = endDateStr ? new Date(endDateStr) : null;

    if (startDate && isNaN(startDate.getTime())) startDate = null;
    if (endDate && isNaN(endDate.getTime())) endDate = null;

    // If end date is provided, set time to end of day for inclusive range
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }
    // If start date is provided, set time to start of day
    if (startDate) {
        startDate.setHours(0,0,0,0);
    }

    return { startDate, endDate };
};

// GET /api/reports/sales/summary - Sales summary (No longer Protected)
router.get('/sales/summary', async (req, res) => {
    const { startDate: startDateStr, endDate: endDateStr, period } = req.query;
    let { startDate, endDate } = parseDateRange(startDateStr, endDateStr);

    if (period) {
        const today = new Date();
        today.setHours(0,0,0,0);
        // Note: tomorrow calculation was not used, removed for clarity

        switch(period.toLowerCase()) {
            case 'daily':
                startDate = today;
                endDate = new Date(today); // Make a copy
                endDate.setHours(23,59,59,999);
                break;
            case 'monthly':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
                endDate.setHours(23,59,59,999);
                break;
            case 'yearly':
                startDate = new Date(today.getFullYear(), 0, 1); // First day of current year
                endDate = new Date(today.getFullYear(), 11, 31); // Last day of current year
                endDate.setHours(23,59,59,999);
                break;
            // Default: if period is invalid, use startDate/endDate from query or null
        }
    }

    let query = `SELECT 
                    COUNT(id) as total_orders,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as average_order_value
                 FROM orders 
                 WHERE status = 'Completed'`; // Only completed orders for revenue
    const params = [];

    if (startDate) {
        query += ' AND order_date >= ?';
        params.push(startDate.toISOString());
    }
    if (endDate) {
        query += ' AND order_date <= ?';
        params.push(endDate.toISOString());
    }

    try {
        const db = await getDb();
        const summary = await db.get(query, params);
        
        const lowStockThreshold = 10; // Define low stock threshold
        const lowStockResult = await db.get('SELECT COUNT(*) as low_stock_items_count FROM products WHERE stock < ?', [lowStockThreshold]);

        res.json({ 
            sales_summary: {
                total_orders: summary?.total_orders || 0,
                total_revenue: summary?.total_revenue || 0,
                average_order_value: summary?.average_order_value || 0,
            },
            low_stock_items_count: lowStockResult?.low_stock_items_count || 0,
            period_start: startDate ? startDate.toISOString().split('T')[0] : null,
            period_end: endDate ? endDate.toISOString().split('T')[0] : null,
            filters_applied: { period, startDate: startDateStr, endDate: endDateStr } // For debugging/transparency
        });
    } catch (error) {
        console.error('Error fetching sales summary:', error);
        res.status(500).json({ message: 'Error fetching sales summary', error: error.message });
    }
});

// GET /api/reports/sales/by-product - Sales by product (No longer Protected)
router.get('/sales/by-product', async (req, res) => {
    const { startDate: startDateStr, endDate: endDateStr } = req.query;
    const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);

    let query = `SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.sku as product_sku,
                    SUM(oi.quantity) as total_quantity_sold,
                    SUM(oi.total_price) as total_revenue_from_product
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 JOIN orders o ON oi.order_id = o.id
                 WHERE o.status = 'Completed'`;
    const params = [];

    if (startDate) {
        query += ' AND o.order_date >= ?';
        params.push(startDate.toISOString());
    }
    if (endDate) {
        query += ' AND o.order_date <= ?';
        params.push(endDate.toISOString());
    }

    query += ' GROUP BY p.id, p.name, p.sku ORDER BY total_revenue_from_product DESC';

    try {
        const db = await getDb();
        const salesByProduct = await db.all(query, params);
        res.json({ 
            sales_by_product: salesByProduct,
            period_start: startDate ? startDate.toISOString().split('T')[0] : null,
            period_end: endDate ? endDate.toISOString().split('T')[0] : null,
        });
    } catch (error) {
        console.error('Error fetching sales by product:', error);
        res.status(500).json({ message: 'Error fetching sales by product', error: error.message });
    }
});

// GET /api/reports/top-selling-products - Top N selling products (No longer Protected)
router.get('/top-selling-products', async (req, res) => {
    const { startDate: startDateStr, endDate: endDateStr, criteria = 'revenue' } = req.query;
    const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);

    let queryLimit = parseInt(req.query.limit, 10);
    if (isNaN(queryLimit) || queryLimit <= 0) {
        queryLimit = 5; // Default limit if not specified or invalid
    }

    let orderByField = 'total_revenue_from_product';
    if (criteria.toLowerCase() === 'quantity') {
        orderByField = 'total_quantity_sold';
    }

    let query = `SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.sku as product_sku,
                    SUM(oi.quantity) as total_quantity_sold,
                    SUM(oi.total_price) as total_revenue_from_product
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 JOIN orders o ON oi.order_id = o.id
                 WHERE o.status = 'Completed'`;
    const params = [];

    if (startDate) {
        query += ' AND o.order_date >= ?';
        params.push(startDate.toISOString());
    }
    if (endDate) {
        query += ' AND o.order_date <= ?';
        params.push(endDate.toISOString());
    }

    query += ` GROUP BY p.id, p.name, p.sku ORDER BY ${orderByField} DESC LIMIT ?`;
    params.push(queryLimit);

    try {
        const db = await getDb();
        const topSellingProducts = await db.all(query, params);
        res.json({ 
            top_selling_products: topSellingProducts,
            limit: queryLimit, // Use the sanitized limit
            criteria,
            period_start: startDate ? startDate.toISOString().split('T')[0] : null,
            period_end: endDate ? endDate.toISOString().split('T')[0] : null,
        });
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        res.status(500).json({ message: 'Error fetching top selling products', error: error.message });
    }
});

module.exports = router;
