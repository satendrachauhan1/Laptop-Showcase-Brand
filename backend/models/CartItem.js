const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
