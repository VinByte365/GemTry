require('dotenv').config();
const express = require('express');
const path = require('path');
const config = require('./config/server');
const app = express();

const port = config.PORT;
const host = config.HOST;

// Test database connection first
const mysql = require('mysql2');
const testDb = mysql.createConnection({
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    port: config.DB_PORT
});

testDb.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('Please check your database configuration and ensure MySQL is running.');
        console.log('Current configuration from .env file:');
        console.log(`DB_HOST: ${config.DB_HOST}`);
        console.log(`DB_USER: ${config.DB_USER}`);
        console.log(`DB_NAME: ${config.DB_NAME}`);
        console.log(`DB_PORT: ${config.DB_PORT}`);
        console.log('DB_PASSWORD: [hidden]');
    } else {
        console.log('✅ Database connected successfully!');
        console.log(`📊 Connected to database: ${config.DB_NAME} on ${config.DB_HOST}:${config.DB_PORT}`);
    }
});

const productRoute = require('./routes/products')
const dashboardRoute = require('./routes/dashboard')
const userRoute = require('./routes/users')
const orderRoute = require('./routes/orders')

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.CORS_ORIGIN);
    res.header('Access-Control-Allow-Methods', config.CORS_METHODS.join(', '));
    res.header('Access-Control-Allow-Headers', config.CORS_HEADERS.join(', '));
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Serve static files (uploaded images)
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Routes
app.use('/api/v1/product', productRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/dashboard', dashboardRoute);


app.listen(port, host, () => {
    console.log(`✅ Server running on http://${host}:${port}`);
    console.log(`🌐 Accessible from any network interface`);
    console.log(`📊 API endpoints available at:`);
    console.log(`   - http://localhost:${port}/api/v1/product`);
    console.log(`   - http://localhost:${port}/api/v1/user`);
    console.log(`   - http://localhost:${port}/api/v1/order`);
    console.log(`📁 Static files served from: /storage`);
    console.log(`🔧 Configuration loaded from .env file`);
});