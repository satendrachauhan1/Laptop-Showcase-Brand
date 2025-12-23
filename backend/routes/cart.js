const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addToCart, getCart, removeItem, clearCart, updateQuantity } = require('../controllers/cartController');

router.post('/', auth, addToCart);
router.get('/', auth, getCart);
router.delete('/:id', auth, removeItem);
router.post('/clear', auth, clearCart);
router.patch('/:id', auth, updateQuantity);

module.exports = router;
