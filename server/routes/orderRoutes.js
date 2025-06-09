const express = require('express');
const { getDb } = require('../database');
// const { authenticateToken } = require('./authRoutes'); // Authentication removed

const router = express.Router();

// GET /api/orders - Get all orders with filtering and pagination (No longer Protected)
router.get('/', async (req, res) => {
    const { status, customer_name, sortBy = 'order_date', sortOrder = 'DESC', page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM orders';
    const sqlParams = [];
    const conditions = [];

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (status) {
        conditions.push('status = ?');
        sqlParams.push(status);
    }
    if (customer_name) {
        conditions.push('customer_name LIKE ?');
        sqlParams.push(`%${customer_name}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    const allowedSortBy = ['order_date', 'total_amount', 'customer_name', 'status', 'created_at'];
    if (allowedSortBy.includes(sortBy)) {
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortBy} ${order}`;
    } else {
        query += ' ORDER BY order_date DESC'; // Default sort if sortBy is invalid
    }

    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    sqlParams.push(limitNum, offset);

    try {
        const db = await getDb();
        const orders = await db.all(query, sqlParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM orders';
        const countParams = []; 
        if (status) {
            countParams.push(status);
        }
        if (customer_name) {
            countParams.push(`%${customer_name}%`);
        }

        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        const { total } = await db.get(countQuery, countParams);
        res.json({ orders, total, page: pageNum, limit: limitNum });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// GET /api/orders/:id - Get a single order by ID, including its items (No longer Protected)
router.get('/:id', async (req, res) => {
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

// POST /api/orders - Create a new order (No longer Protected)
router.post('/', async (req, res) => {
    const { customer_name, items } = req.body; 
    if (!customer_name || !customer_name.trim() || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Customer name and at least one item are required' });
    }

    const db = await getDb();
    let transactionStarted = false;
    try {
        await db.run('BEGIN TRANSACTION');
        transactionStarted = true;

        let totalOrderAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const quantity = parseInt(item.quantity, 10);
            if (!item.product_id || isNaN(quantity) || quantity <= 0) {
                // No need to rollback here yet, validation failure before DB ops for this item
                return res.status(400).json({ message: 'Invalid item data. product_id and positive quantity required for all items.' });
            }
            const product = await db.get('SELECT id, name, price, stock FROM products WHERE id = ?', [item.product_id]);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
            }
            if (product.stock < quantity) {
                return res.status(400).json({ message: `Not enough stock for product ${product.name} (ID: ${item.product_id}). Available: ${product.stock}, Requested: ${quantity}` });
            }

            const itemTotalPrice = product.price * quantity;
            totalOrderAmount += itemTotalPrice;
            orderItemsData.push({
                product_id: product.id,
                quantity: quantity,
                price_per_unit: product.price,
                total_price: itemTotalPrice,
                new_stock: product.stock - quantity
            });
        }

        const orderResult = await db.run(
            'INSERT INTO orders (customer_name, total_amount, status) VALUES (?, ?, ?)',
            [customer_name.trim(), totalOrderAmount, 'Pending']
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
        transactionStarted = false; // Commit successful
        
        const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
        const newOrderItems = await db.all('SELECT oi.*, p.name as product_name, p.sku as product_sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [orderId]);
        
        res.status(201).json({ message: 'Order created successfully', order: {...newOrder, items: newOrderItems} });

    } catch (error) {
        if (transactionStarted) {
            try {
                await db.run('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }
        console.error('Error creating order:', error);
        // Avoid sending detailed SQL errors to client if not necessary
        res.status(500).json({ message: 'Error creating order', error: 'An internal server error occurred.' });
    }
});

// PUT /api/orders/:id/status - Update order status (No longer Protected)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const db = await getDb();
    let transactionStarted = false;
    let order;
    try {
        order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === status) {
            const items = await db.all('SELECT oi.*, p.name as product_name, p.sku as product_sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);
            return res.json({ message: `Order ${id} status is already ${status}.`, order: {...order, items} });
        }
        
        if ((order.status === 'Completed' || order.status === 'Cancelled') && status !== 'Cancelled' && order.status !== status) {
             return res.status(400).json({ message: `Order is already ${order.status} and its status cannot be changed to ${status}.` });
        }

        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            const itemsToRestore = await db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
            await db.run('BEGIN TRANSACTION');
            transactionStarted = true;
            // Only restore stock if the order was previously in a state where stock was deducted
            if (['Pending', 'Processing', 'Shipped'].includes(order.status)) { 
                for (const item of itemsToRestore) {
                    await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                }
            }
            await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
            await db.run('COMMIT');
            transactionStarted = false;
            
            const updatedOrderData = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
            const updatedItemsData = await db.all('SELECT oi.*, p.name as product_name, p.sku as product_sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);
            return res.json({ message: `Order ${id} status updated to ${status} and stock restored if applicable.`, order: {...updatedOrderData, items: updatedItemsData} });
        } else {
            await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
            const updatedOrderData = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
            const updatedItemsData = await db.all('SELECT oi.*, p.name as product_name, p.sku as product_sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);
            res.json({ message: `Order ${id} status updated to ${status}`, order: {...updatedOrderData, items: updatedItemsData }});
        }

    } catch (error) {
        if (transactionStarted) {
            try {
                await db.run('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error rolling back transaction for status update:', rollbackError);
            }
        }
        console.error(`Error updating order ${id} status:`, error);
        res.status(500).json({ message: 'Error updating order status', error: 'An internal server error occurred.' });
    }
});

module.exports = router;
