const express = require('express');
const { getDb } = require('../database');
// const { authenticateToken } = require('./authRoutes'); // Authentication removed

const router = express.Router();

// GET /api/products - Get all products with filtering and pagination
router.get('/', async (req, res) => {
    const { category, sortBy, sortOrder = 'ASC', lowStock, search, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM products';
    const sqlParams = []; 
    const conditions = [];

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (search) {
        conditions.push('(name LIKE ? OR sku LIKE ? OR description LIKE ?)');
        sqlParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
        conditions.push('category = ?');
        sqlParams.push(category);
    }
    if (lowStock === 'true') {
        conditions.push('stock < ?');
        sqlParams.push(10); // Example low stock threshold
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    if (sortBy) {
        const allowedSortBy = ['name', 'price', 'stock', 'created_at'];
        if (allowedSortBy.includes(sortBy)) {
            const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${sortBy} ${order}`;
        } else {
            query += ' ORDER BY created_at DESC'; // Default sort if sortBy is invalid
        }
    } else {
        query += ' ORDER BY created_at DESC'; // Default sort
    }

    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    sqlParams.push(limitNum, offset);

    try {
        const db = await getDb();
        const products = await db.all(query, sqlParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM products';
        // Params for count query should only include filtering conditions, not pagination
        const countParams = [];
        if (search) {
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (category) {
            countParams.push(category);
        }
        if (lowStock === 'true') {
            countParams.push(10);
        }
        
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        const { total } = await db.get(countQuery, countParams);
        
        res.json({ products, total, page: pageNum, limit: limitNum });

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

// POST /api/products - Add a new product (No longer Protected)
router.post('/', async (req, res) => {
    const { name, sku, category, description, price, stock, image_url } = req.body;
    if (!name || !sku || price === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Name, SKU, price, and stock are required' });
    }
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: 'Stock must be a valid non-negative integer.' });
    }

    try {
        const db = await getDb();
        const result = await db.run(
            'INSERT INTO products (name, sku, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, sku, category, description, parsedPrice, parsedStock, image_url]
        );
        const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        if (error.message && error.message.includes('UNIQUE constraint failed: products.sku')) {
            return res.status(409).json({ message: 'SKU already exists.' });
        }
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
});

// PUT /api/products/:id - Update an existing product (No longer Protected)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, sku, category, description, price, stock, image_url } = req.body;

    if (!name || !sku || price === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Name, SKU, price, and stock are required fields for update.' });
    }
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: 'Stock must be a valid non-negative integer.' });
    }

    try {
        const db = await getDb();
        const existingProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const result = await db.run(
            'UPDATE products SET name = ?, sku = ?, category = ?, description = ?, price = ?, stock = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, sku, category, description, parsedPrice, parsedStock, image_url, id]
        );
        
        const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.json({ message: 'Product updated successfully (no changes detected)', product: updatedProduct });
        }
        res.json({ message: 'Product updated successfully', product: updatedProduct });

    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        if (error.message && error.message.includes('UNIQUE constraint failed: products.sku')) {
            return res.status(409).json({ message: 'SKU already exists for another product.' });
        }
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// DELETE /api/products/:id - Delete a product (No longer Protected)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();
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
        if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
             return res.status(400).json({ message: 'Cannot delete product. It is referenced in existing orders.' });
        }
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

module.exports = router;
