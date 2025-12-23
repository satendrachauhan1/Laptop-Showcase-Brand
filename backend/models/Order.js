const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  brand: String,
  price: Number,
  quantity: { type: Number, default: 1 }
});

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  total: { type: Number, default: 0 },
  address: { type: String },
  mobile: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
