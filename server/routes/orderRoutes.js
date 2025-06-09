const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./authRoutes');

const router = express.Router();

// GET /api/orders - Get all orders with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
    const { status, customer_name, sortBy = 'order_date', sortOrder = 'DESC', page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    if (status) {
        conditions.push('status = ?');
        params.push(status);
    }
    if (customer_name) {
        conditions.push('customer_name LIKE ?');
        params.push(`%${customer_name}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    const allowedSortBy = ['order_date', 'total_amount', 'customer_name', 'status', 'created_at'];
    if (allowedSortBy.includes(sortBy)) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    }

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    try {
        const db = await getDb();
        const orders = await db.all(query, params);
        
        let countQuery = 'SELECT COUNT(*) as total FROM orders';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            const countParams = params.slice(0, params.length - 2);
            const { total } = await db.get(countQuery, countParams);
            res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
        } else {
            const { total } = await db.get(countQuery);
            res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// GET /api/orders/:id - Get a single order by ID, including its items
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const items = await db.all('SELECT oi.*, p.name as product_name, p.sku as product_sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);
        res.json({ ...order, items });
    } catch (error) {
        console.error(`Error fetching order ${id}:`, error);
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
});

// POST /api/orders - Create a new order (Protected)
router.post('/', authenticateToken, async (req, res) => {
    const { customer_name, items } = req.body; // items: [{ product_id, quantity }, ...]
    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Customer name and at least one item are required' });
    }

    const db = await getDb();
    try {
        await db.run('BEGIN TRANSACTION');

        let totalOrderAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                await db.run('ROLLBACK');
                return res.status(400).json({ message: 'Invalid item data. product_id and positive quantity required for all items.' });
            }
            const product = await db.get('SELECT id, price, stock FROM products WHERE id = ?', [item.product_id]);
            if (!product) {
                await db.run('ROLLBACK');
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
            }
            if (product.stock < item.quantity) {
                await db.run('ROLLBACK');
                return res.status(400).json({ message: `Not enough stock for product ID ${item.product_id}. Available: ${product.stock}` });
            }

            const itemTotalPrice = product.price * item.quantity;
            totalOrderAmount += itemTotalPrice;
            orderItemsData.push({
                product_id: product.id,
                quantity: item.quantity,
                price_per_unit: product.price,
                total_price: itemTotalPrice,
                new_stock: product.stock - item.quantity
            });
        }

        const orderResult = await db.run(
            'INSERT INTO orders (customer_name, total_amount, status) VALUES (?, ?, ?)',
            [customer_name, totalOrderAmount, 'Pending'] // Default status
        );
        const orderId = orderResult.lastID;

        for (const oiData of orderItemsData) {
            await db.run(
                'INSERT INTO order_items (order_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
                [orderId, oiData.product_id, oiData.quantity, oiData.price_per_unit, oiData.total_price]
            );
            await db.run('UPDATE products SET stock = ? WHERE id = ?', [oiData.new_stock, oiData.product_id]);
        }

        await db.run('COMMIT');
        res.status(201).json({ message: 'Order created successfully', orderId });

    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// PUT /api/orders/:id/status - Update order status (Protected)
router.put('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    try {
        const db = await getDb();
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Logic for stock adjustment if order is cancelled and items were deducted
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            const items = await db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
            await db.run('BEGIN TRANSACTION');
            try {
                for (const item of items) {
                    await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                }
                await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
                await db.run('COMMIT');
                return res.json({ message: `Order ${id} status updated to ${status} and stock restored.` });
            } catch (transactionError) {
                await db.run('ROLLBACK');
                console.error('Error during stock restoration for cancelled order:', transactionError);
                return res.status(500).json({ message: 'Error updating order status and restoring stock.', error: transactionError.message });
            }
        }

        const result = await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
        if (result.changes === 0) {
            // This case might not be hit if the prior check for order existence is done
            return res.status(404).json({ message: 'Order not found or status not changed' });
        }
        res.json({ message: `Order ${id} status updated to ${status}` });
    } catch (error) {
        console.error(`Error updating order ${id} status:`, error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
});


module.exports = router;
