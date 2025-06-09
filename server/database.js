const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db.sqlite');

let db;
let initializationPromise = null;

const connectAndInitialize = () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                return reject(err);
            }
            console.log('Connected to the SQLite database.');
            
            // Proceed with schema initialization
            db.serialize(() => {
                // Users Table
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) return reject(err); // Early exit on error
                    console.log("Users table checked/created.");
                });

                // Products Table
                db.run(`
                    CREATE TABLE IF NOT EXISTS products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        sku TEXT UNIQUE,
                        category TEXT,
                        description TEXT,
                        price REAL NOT NULL,
                        stock INTEGER NOT NULL DEFAULT 0,
                        image_url TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) return reject(err);
                    console.log("Products table checked/created.");
                });

                // Orders Table
                db.run(`
                    CREATE TABLE IF NOT EXISTS orders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        customer_name TEXT, 
                        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        total_amount REAL NOT NULL,
                        status TEXT NOT NULL DEFAULT 'Pending', -- e.g., Pending, Processing, Shipped, Delivered, Cancelled
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) return reject(err);
                    console.log("Orders table checked/created.");
                });

                // Order Items Table
                db.run(`
                    CREATE TABLE IF NOT EXISTS order_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        order_id INTEGER NOT NULL,
                        product_id INTEGER NOT NULL,
                        quantity INTEGER NOT NULL,
                        price_per_unit REAL NOT NULL, -- Price at the time of order
                        total_price REAL NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
                    )
                `, (err) => {
                    if (err) return reject(err);
                    console.log("Order items table checked/created.");
                });

                // Trigger to update 'updated_at' for products
                db.run(`
                    CREATE TRIGGER IF NOT EXISTS update_products_updated_at
                    AFTER UPDATE ON products
                    FOR EACH ROW
                    BEGIN
                        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;
                `, (err) => {
                    if (err) console.error("Error creating trigger for products: ", err.message); // Log but don't reject for triggers
                    else console.log("Trigger for products.updated_at checked/created.");
                });
                
                // Trigger to update 'updated_at' for orders
                db.run(`
                    CREATE TRIGGER IF NOT EXISTS update_orders_updated_at
                    AFTER UPDATE ON orders
                    FOR EACH ROW
                    BEGIN
                        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;
                `, (err) => {
                    if (err) {
                        console.error("Error creating trigger for orders: ", err.message);
                        return reject(err); // Reject if essential triggers fail
                    }
                    console.log("Trigger for orders.updated_at checked/created.");
                    resolve(db); // Resolve the main promise once all setup is done
                });
            });
        });
    });
    return initializationPromise;
};

// Export a function to get the DB instance (ensuring it's initialized)
// and the initDb function itself for explicit calls.
module.exports = {
    getDb: () => {
        if (!db) {
            console.warn("Database not initialized yet. Call initDb first or ensure it's called on app start.");
            // Attempt to initialize if not already
            return connectAndInitialize(); 
        }
        return Promise.resolve(db);
    },
    initDb: connectAndInitialize, // Expose the initialization function
    // Directly export db instance for convenience, but prefer getDb or initDb for guaranteed initialization
    db: new sqlite3.Database(dbPath, (err) => { 
        if (err) console.error('Initial direct db connection error (should be handled by initDb):', err.message);
        // This direct export is mostly for legacy or simple script uses;
        // initDb handles the main setup logic and is preferred.
    })
};

// Automatically attempt to initialize when the module is loaded.
connectAndInitialize().catch(err => {
    console.error("Automatic database initialization failed on module load:", err);
    // Application might not function correctly if this fails.
    // Consider exiting or implementing more robust error handling for critical DB setup.
});
