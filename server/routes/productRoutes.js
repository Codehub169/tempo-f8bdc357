const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./authRoutes'); // Assuming authRoutes exports authenticateToken

const router = express.Router();

// GET /api/products - Get all products with filtering and pagination
router.get('/', async (req, res) => {
    const { category, sortBy, sortOrder = 'ASC', lowStock, search, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (search) {
        conditions.push('(name LIKE ? OR sku LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
        conditions.push('category = ?');
        params.push(category);
    }
    if (lowStock === 'true') {
        conditions.push('stock < ?'); // Define what 'low stock' means, e.g., < 10
        params.push(10);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    if (sortBy) {
        const allowedSortBy = ['name', 'price', 'stock', 'created_at'];
        if (allowedSortBy.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
        }
    } else {
        query += ' ORDER BY created_at DESC'; // Default sort
    }

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    try {
        const db = await getDb();
        const products = await db.all(query, params);
        
        // For total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM products';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            // Need to pass the same params for conditions to countQuery, excluding limit/offset params
            const countParams = params.slice(0, params.length - 2);
            const { total } = await db.get(countQuery, countParams);
            res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
        } else {
            const { total } = await db.get(countQuery);
            res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
        }

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// GET /api/products/:id - Get a single product by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();
        const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

// POST /api/products - Add a new product (Protected)
router.post('/', authenticateToken, async (req, res) => {
    const { name, sku, category, description, price, stock, image_url } = req.body;
    if (!name || !sku || !price || stock === undefined) {
        return res.status(400).json({ message: 'Name, SKU, price, and stock are required' });
    }
    if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
        return res.status(400).json({ message: 'Price and stock must be valid numbers.' });
    }

    try {
        const db = await getDb();
        const result = await db.run(
            'INSERT INTO products (name, sku, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, sku, category, description, parseFloat(price), parseInt(stock), image_url]
        );
        res.status(201).json({ message: 'Product added successfully', productId: result.lastID });
    } catch (error) {
        console.error('Error adding product:', error);
        if (error.message.includes('UNIQUE constraint failed: products.sku')) {
            return res.status(409).json({ message: 'SKU already exists.' });
        }
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
});

// PUT /api/products/:id - Update an existing product (Protected)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, sku, category, description, price, stock, image_url } = req.body;

    if (!name || !sku || price === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Name, SKU, price, and stock are required fields for update.' });
    }
    if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
        return res.status(400).json({ message: 'Price and stock must be valid numbers.' });
    }

    try {
        const db = await getDb();
        const existingProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const result = await db.run(
            'UPDATE products SET name = ?, sku = ?, category = ?, description = ?, price = ?, stock = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, sku, category, description, parseFloat(price), parseInt(stock), image_url, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Product not found or no changes made' });
        }
        res.json({ message: 'Product updated successfully', productId: id });
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        if (error.message.includes('UNIQUE constraint failed: products.sku')) {
            return res.status(409).json({ message: 'SKU already exists for another product.' });
        }
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// DELETE /api/products/:id - Delete a product (Protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();
        // Check if product is part of any order. If so, prevent deletion or handle as per business logic.
        // For this example, we'll check order_items.
        const orderItems = await db.get('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [id]);
        if (orderItems.count > 0) {
            return res.status(400).json({ message: 'Cannot delete product. It is part of existing orders. Consider archiving it instead.' });
        }

        const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        // The database schema has ON DELETE RESTRICT for order_items if a product is deleted.
        // This means SQLite will prevent deletion if an order_item references it.
        // The check above is a more user-friendly way to inform this.
        if (error.message.includes('FOREIGN KEY constraint failed')) {
             return res.status(400).json({ message: 'Cannot delete product. It is referenced in existing orders.' });
        }
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

module.exports = router;
