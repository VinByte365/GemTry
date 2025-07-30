const express = require('express');
const mysql = require('mysql2');
const app = express();

// Basic database connection test
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'final',
    port: 3306
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected successfully!');
});

// Test API endpoint
app.get('/api/v1/product', (req, res) => {
    const sql = 'SELECT * FROM items LIMIT 5';
    
    db.execute(sql, (err, result) => {
        if (err) {
            console.error('❌ Database query failed:', err.message);
            return res.status(500).json({ error: 'Database query failed' });
        }
        console.log('✅ Database query successful, found', result.length, 'products');
        res.json(result);
    });
});

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

const port = 8080;
const host = '0.0.0.0';
app.listen(port, host, () => {
    console.log(`✅ Test server running on http://${host}:${port}`);
    console.log(`🌐 Accessible from any network interface`);
    console.log(`📊 Test API endpoint: http://localhost:${port}/api/v1/product`);
}); 