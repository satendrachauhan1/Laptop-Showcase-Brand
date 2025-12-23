const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addToCart, getCart, removeItem, clearCart, updateQuantity } = require('../controllers/cartController');

// Add item to cart (authenticated)
router.post('/', auth, addToCart);

// Get cart items for the logged-in user
router.get('/', auth, getCart);

// Remove an item by id
router.delete('/:id', auth, removeItem);

// Clear the cart
router.post('/clear', auth, clearCart);

// Update quantity
router.patch('/:id', auth, updateQuantity);

module.exports = router;
