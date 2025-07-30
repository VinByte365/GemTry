const mysql = require('mysql2');
const config = require('./server');

const db = mysql.createConnection({
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    port: config.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('Please check your .env file configuration.');
    } else {
        console.log('✅ Database connection established successfully!');
        console.log(`📊 Connected to: ${config.DB_NAME} on ${config.DB_HOST}:${config.DB_PORT}`);
    }
});

module.exports = db;