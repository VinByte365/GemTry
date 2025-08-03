const express = require('express');
const router = express.Router();
const { authorizeRoles, isAuthenticatedUser } = require('../middleware/authentication');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartCount, cartCheckout } = require('../controllers/cart');

// Cart main routes
router.route('/')
    .get(isAuthenticatedUser, authorizeRoles('user'), getCart);

// Add to cart route
router.route('/add')
    .post(isAuthenticatedUser, authorizeRoles('user'), addToCart);

// Update cart route
router.route('/update')
    .put(isAuthenticatedUser, authorizeRoles('user'), updateCartItem);

// Remove specific item route
router.route('/remove/:cart_id')
    .delete(isAuthenticatedUser, authorizeRoles('user'), removeFromCart);

// Clear cart route
router.route('/clear')
    .delete(isAuthenticatedUser, authorizeRoles('user'), clearCart);

// Cart count route
router.route('/count')
    .get(isAuthenticatedUser, authorizeRoles('user'), getCartCount);

router.route('/checkout')
    .post(isAuthenticatedUser, authorizeRoles('user'), cartCheckout);
    
module.exports = router;
