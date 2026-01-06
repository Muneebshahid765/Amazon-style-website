import Order from '../models/Order.js';
import Product from '../models/Product.js';

const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.orderNumber = new RegExp(req.query.search, 'i');
    }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images');

    res.json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity },
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    const daysSinceDelivery = Math.floor(
      (new Date() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > 7) {
      return res.status(400).json({ message: 'Return period has expired (7 days)' });
    }

    order.status = 'return_requested';
    order.returnReason = reason;
    order.returnRequestedAt = new Date();
    await order.save();

    res.json({ message: 'Return request submitted successfully', order });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.$or = [
        { orderNumber: new RegExp(req.query.search, 'i') },
        { 'shippingAddress.fullName': new RegExp(req.query.search, 'i') },
      ];
    }

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name');

    res.json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const revenue = revenueResult[0]?.total || 0;
    const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const ordersOverTime = await Order.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      revenue,
      averageOrderValue,
      ordersByStatus,
      ordersOverTime,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['packed', 'cancelled'],
      packed: ['shipped'],
      shipped: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      return_requested: ['returned', 'delivered'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    order.status = status;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity },
        });
      }
      order.cancelledAt = new Date();
    }

    await order.save();

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    next(error);
  }
};

const addTrackingInfo = async (req, res, next) => {
  try {
    const { trackingNumber, carrier, trackingUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.trackingNumber = trackingNumber;
    order.carrier = carrier;
    order.trackingUrl = trackingUrl;
    await order.save();

    res.json({ message: 'Tracking information added successfully', order });
  } catch (error) {
    next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'Order is not paid yet' });
    }

    order.status = 'refunded';
    order.refundAmount = amount || order.totalAmount;
    order.refundReason = reason;
    order.refundedAt = new Date();
    await order.save();

    res.json({ message: 'Refund processed successfully', order });
  } catch (error) {
    next(error);
  }
};

export {
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  getAllOrders,
  getOrderStats,
  updateOrderStatus,
  addTrackingInfo,
  processRefund,
};
