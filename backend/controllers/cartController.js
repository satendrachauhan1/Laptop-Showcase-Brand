const CartItem = require('../models/CartItem');
const mongoose = require('mongoose');

// Add item to cart (create or increment quantity)
exports.addToCart = async (req, res) => {
  try {
    const { brand, price } = req.body;
    if (!brand || typeof price !== 'number') return res.status(400).json({ message: 'brand and price required' });

    const existing = await CartItem.findOne({ user: req.user.id, brand });
    if (existing) {
      existing.quantity += 1;
      await existing.save();
    } else {
      await CartItem.create({ user: req.user.id, brand, price, quantity: 1 });
    }

    const items = await CartItem.find({ user: req.user.id });
    const totalCount = items.reduce((s,i)=>s+i.quantity,0);
    return res.json({ message: 'Added to cart', totalCount, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCart = async (req, res) => {
  try {
    const items = await CartItem.find({ user: req.user.id });
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const it = await CartItem.findOne({ _id: id, user: req.user.id });
    if (!it) return res.status(404).json({ message: 'Not found' });
    await CartItem.deleteOne({ _id: id, user: req.user.id });
    const items = await CartItem.find({ user: req.user.id });
    const totalCount = items.reduce((s,i)=>s+i.quantity,0);
    return res.json({ message: 'Removed', totalCount, items });
  } catch (err) {
    console.error('removeItem error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await CartItem.deleteMany({ user: req.user.id });
    return res.json({ message: 'Cleared' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update quantity for a cart item (set or remove if quantity <= 0)
exports.updateQuantity = async (req, res) => {
  try {
    const id = req.params.id;
    const { quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    if (typeof quantity !== 'number') return res.status(400).json({ message: 'quantity required' });

    const it = await CartItem.findOne({ _id: id, user: req.user.id });
    if (!it) return res.status(404).json({ message: 'Not found' });
    if (quantity <= 0) {
      await CartItem.deleteOne({ _id: id, user: req.user.id });
    } else {
      it.quantity = quantity;
      await it.save();
    }

    const items = await CartItem.find({ user: req.user.id });
    const totalCount = items.reduce((s,i)=>s+i.quantity,0);
    return res.json({ message: 'Updated', totalCount, items });
  } catch (err) {
    console.error('updateQuantity error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
