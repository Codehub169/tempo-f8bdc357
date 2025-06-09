const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { db, initDb } = require('./database'); // db connection is established and initDb is called here

const app = express();
const PORT = 9000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from the React app build directory
// Assumes 'client' and 'server' are sibling directories
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuildPath));

// API Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Placeholder for future API routes
// const authRoutes = require('./routes/authRoutes');
// const productRoutes = require('./routes/productRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const reportRoutes = require('./routes/reportRoutes');

// app.use('/api/auth', authRoutes); // Example: app.use('/api/auth', require('./routes/authRoutes')(db));
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/reports', reportRoutes);

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            if (!res.headersSent) {
                 res.status(500).send('Error serving frontend application. Ensure the client has been built.');
            }
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).send('Something broke on the server!');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Serving static files from: ${clientBuildPath}`);
    // Database initialization is typically handled when './database.js' is required.
    // However, an explicit call here ensures it's attempted if not already done,
    // or can be used to confirm initialization status.
    initDb().then(() => {
        console.log('Database schema ensured on server startup.');
    }).catch(error => {
        console.error('Failed to ensure database schema on server startup:', error);
    });
});

module.exports = app; // For potential testing
