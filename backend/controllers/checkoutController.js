import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';

const validateCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const unavailableItems = [];
    const updatedItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product || product.status !== 'active') {
        unavailableItems.push(item.product.name);
        continue;
      }

      if (product.stock < item.quantity) {
        unavailableItems.push(`${product.name} (only ${product.stock} available)`);
        continue;
      }

      const currentPrice = product.discountPrice || product.price;
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        updatedItems.push(product.name);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        message: 'Some items are unavailable',
        unavailableItems,
      });
    }

    if (updatedItems.length > 0) {
      cart.subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await cart.save();
    }

    res.json({
      valid: true,
      cart: {
        items: cart.items,
        subtotal: cart.subtotal,
      },
      updatedItems,
    });
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    if (coupon.minPurchase && cart.subtotal < coupon.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of Rs. ${coupon.minPurchase} required`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cart.subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    cart.coupon = coupon._id;
    await cart.save();

    res.json({
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      newTotal: cart.subtotal - discount,
    });
  } catch (error) {
    next(error);
  }
};

const calculateCheckout = async (req, res, next) => {
  try {
    const { shippingMethod = 'standard' } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('coupon');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const subtotal = cart.subtotal;
    const tax = subtotal * 0.18;

    let shippingCost = 0;
    if (shippingMethod === 'standard') {
      shippingCost = subtotal >= 5000 ? 0 : 200;
    } else if (shippingMethod === 'express') {
      shippingCost = 500;
    }

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === 'percentage') {
        discount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount) {
          discount = Math.min(discount, cart.coupon.maxDiscount);
        }
      } else {
        discount = cart.coupon.discountValue;
      }
    }

    const total = subtotal + tax + shippingCost - discount;

    res.json({
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      shippingMethod,
      coupon: cart.coupon ? {
        code: cart.coupon.code,
        discount,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, shippingMethod, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product coupon');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }
    }

    const subtotal = cart.subtotal;
    const tax = subtotal * 0.18;
    const shippingCost = shippingMethod === 'express' ? 500 : (subtotal >= 5000 ? 0 : 200);

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === 'percentage') {
        discount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount) {
          discount = Math.min(discount, cart.coupon.maxDiscount);
        }
      } else {
        discount = cart.coupon.discountValue;
      }
    }

    const total = subtotal + tax + shippingCost - discount;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress,
      itemsPrice: subtotal,
      taxPrice: tax,
      shippingPrice: shippingCost,
      discount,
      totalAmount: total,
      paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }

    if (cart.coupon) {
      await Coupon.findByIdAndUpdate(cart.coupon._id, {
        $inc: { usedCount: 1 },
      });
    }

    cart.items = [];
    cart.coupon = null;
    cart.subtotal = 0;
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { validateCart, applyCoupon, calculateCheckout, createOrder };
