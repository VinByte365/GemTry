const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../middleware/authentication');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartCount, cartCheckout } = require('../controllers/cart');

// Cart main routes
router.route('/')
    .get(authorizeRoles('user'), getCart);

// Add to cart route
router.route('/add')
    .post(authorizeRoles('user'), addToCart);

// Update cart route
router.route('/update')
    .put(authorizeRoles('user'), updateCartItem);

// Remove specific item route
router.route('/remove/:cart_id')
    .delete(authorizeRoles('user'), removeFromCart);

// Clear cart route
router.route('/clear')
    .delete(authorizeRoles('user'), clearCart);

// Cart count route
router.route('/count')
    .get(authorizeRoles('user'), getCartCount);

router.route('/checkout')
    .get(authorizeRoles('user'), cartCheckout);
    
module.exports = router;
