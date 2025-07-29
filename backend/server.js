require('dotenv').config();
const express = require('express');
const app = express();

const port = process.env.PORT || 8000;

const productRoute = require('./routes/products')
const dashboardRoute = require('./routes/dashboard')
const userRoute = require('./routes/users')
const orderRoute = require('./routes/orders')

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/v1/product', productRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/dashboard', dashboardRoute);


app.listen(port, () => console.log(`Server running on port ${port}`));