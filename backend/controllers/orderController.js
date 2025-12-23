const Order = require('../models/Order');
const CartItem = require('../models/CartItem');

exports.createOrder = async (req, res) => {
  try {
    const { address, mobile } = req.body;
    if (!address || !mobile) return res.status(400).json({ message: 'address and mobile are required' });

    const userId = req.user.id;
    const cartItems = await CartItem.find({ user: userId });
    if (!cartItems || cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const items = cartItems.map(i => ({ brand: i.brand, price: i.price, quantity: i.quantity }));
    const total = items.reduce((s,i)=>s + ((i.price||0)*(i.quantity||1)), 0);

    const order = await Order.create({ user: userId, items, total, address, mobile });

    // clear cart
    await CartItem.deleteMany({ user: userId });

    return res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    console.error('createOrder error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    console.error('getMyOrders error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
