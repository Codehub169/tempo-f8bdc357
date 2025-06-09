const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const router = express.Router();

// JWT Secret Key - In a production app, use an environment variable!
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key'; 

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // if token is no longer valid
        req.user = user;
        next(); // move on to the next middleware or route handler
    });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const db = await getDb();
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hashedPassword]);
        
        res.status(201).json({ message: 'User registered successfully', userId: result.lastID });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const tokenPayload = { id: user.id, email: user.email };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        res.json({ 
            message: 'Login successful', 
            token,
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user', error: error.message });
    }
});

// GET /api/auth/me (Protected Route)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        // req.user is populated by authenticateToken middleware
        const user = await db.get('SELECT id, email, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
});

module.exports = { router, authenticateToken };
