import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PDFDocument from 'pdfkit';
import stream from 'stream';

const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Support both logged-in users and guest users
    const query = {};
    if (req.user?._id) {
      query.user = req.user._id;
    } else if (req.guestId) {
      query.guestId = req.guestId;
    } else {
      return res.status(401).json({ message: 'Authentication required' });
    }

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

    // Check authorization for both logged-in users and guests
    const isOwner = 
      (req.user?._id && order.user?._id?.toString() === req.user._id.toString()) ||
      (req.guestId && order.guestId === req.guestId);
    
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
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

const getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner =
      (req.user && order.user && order.user._id.toString() === req.user._id.toString()) ||
      (!order.user && req.guestId && req.guestId === order.guestId);

    if (!isOwner && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to access this invoice' });
    }

    const currencySymbol =
      order.currency === 'USD' ? '$' : order.currency === 'PKR' ? 'Rs. ' : `${order.currency} `;
    const formatCurrency = (value = 0) => `${currencySymbol}${Number(value || 0).toFixed(2)}`;
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    const filename = `invoice-${order.orderNumber || order._id}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');

    const passthrough = new stream.PassThrough();
    doc.pipe(passthrough);
    passthrough.pipe(res);

    // Header
    doc
      .fillColor('#1f2937')
      .fontSize(24)
      .text('NovaMart', { align: 'left' })
      .moveUp()
      .fontSize(10)
      .fillColor('#4b5563')
      .text('support@novamart.com\n+92 300 1234567', { align: 'right' })
      .moveDown(1.5);

    doc
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .strokeColor('#e5e7eb')
      .stroke();

    doc.moveDown();

    // Order meta blocks
    const billing = order.billingAddress || order.shippingAddress;
    const blockWidth = doc.page.width / 2 - 60;
    const lineHeight = 14;
    const drawInfoBlock = (x, y, title, rows) => {
      const blockHeight = rows.length * lineHeight + 34;
      doc
        .save()
        .roundedRect(x, y, blockWidth, blockHeight, 8)
        .fill('#f8fafc')
        .restore();

      doc
        .fillColor('#1f2937')
        .fontSize(12)
        .text(title, x + 14, y + 12);

      doc
        .fontSize(11)
        .fillColor('#4b5563');

      rows.forEach((row, idx) => {
        doc.text(row, x + 14, y + 30 + idx * lineHeight);
      });

      doc.fillColor('#111827');
      return y + blockHeight;
    };

    const metaY = doc.y + 10;
    const cardLabel = order.paymentCardBrand
      ? `${order.paymentCardBrand.toUpperCase()}${order.paymentCardLast4 ? ` •••• ${order.paymentCardLast4}` : ''}`
      : null;
    const paymentMethodLabel = cardLabel || (order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A');

    const leftRows = [
      `Invoice #: ${order.orderNumber || order._id}`,
      `Order Date: ${order.createdAt.toDateString()}`,
      `Payment Method: ${paymentMethodLabel}`,
      `Payment Status: ${order.isPaid ? 'Paid' : 'Pending'}`,
      order.isPaid ? `Paid On: ${order.paidAt?.toDateString() || 'N/A'}` : null,
    ].filter(Boolean);
    drawInfoBlock(40, metaY, 'Invoice Details', leftRows);

    const rightRows = [
      billing.fullName,
      billing.street,
      `${billing.city}, ${billing.state} ${billing.postalCode}`,
      billing.country,
      `Phone: ${billing.phone}`,
    ];
    const blockBottom = drawInfoBlock(doc.page.width / 2 + 20, metaY, 'Bill To', rightRows);

    doc.y = blockBottom + 20;

    // Items table header
    const tableTop = doc.y;
    const columnPositions = { item: 40, qty: 330, price: 390, total: 470 };

    doc
      .fontSize(11)
      .fillColor('#ffffff')
      .rect(40, tableTop - 5, doc.page.width - 80, 24)
      .fill('#1f2937');

    doc
      .fillColor('#ffffff')
      .text('Item', columnPositions.item, tableTop)
      .text('Qty', columnPositions.qty, tableTop)
      .text('Price', columnPositions.price, tableTop)
      .text('Total', columnPositions.total, tableTop);

    doc.fillColor('#111827');
    let rowTop = tableTop + 30;
    order.orderItems.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc
          .save()
          .rect(40, rowTop - 8, doc.page.width - 80, 24)
          .fill('#f9fafb')
          .restore();
      }

      doc.fillColor('#111827').text(item.title, columnPositions.item, rowTop, { width: 280 });
      doc.text(String(item.quantity), columnPositions.qty, rowTop, { width: 40, align: 'right' });
      doc.text(formatCurrency(item.price), columnPositions.price, rowTop, { width: 60, align: 'right' });
      doc.text(formatCurrency(item.price * item.quantity), columnPositions.total, rowTop, {
        width: 80,
        align: 'right',
      });
      rowTop += 24;
    });

    doc.moveDown(1.5);

    // Totals card
    const totalsBoxWidth = 240;
    const totalsBoxX = doc.page.width - totalsBoxWidth - 40;
    const totalsBoxY = doc.y;
    const totals = [
      ['Items Total', formatCurrency(order.itemsPrice)],
      ['Tax', formatCurrency(order.taxPrice)],
      ['Shipping', formatCurrency(order.shippingPrice)],
      ['Discount', `- ${formatCurrency(order.discount)}`],
    ];
    const totalsLineHeight = 18;
    const totalsBoxHeight = totals.length * totalsLineHeight + 70;

    doc
      .save()
      .roundedRect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalsBoxHeight, 10)
      .fill('#f3f4f6')
      .restore();

    doc
      .fontSize(12)
      .fillColor('#1f2937')
      .text('Summary', totalsBoxX + 16, totalsBoxY + 14);

    doc.fontSize(11).fillColor('#4b5563');
    totals.forEach(([label, value], idx) => {
      const lineY = totalsBoxY + 36 + idx * totalsLineHeight;
      doc.text(label, totalsBoxX + 16, lineY);
      doc.text(value, totalsBoxX + 16, lineY, {
        width: totalsBoxWidth - 32,
        align: 'right',
      });
    });

    doc
      .fontSize(13)
      .fillColor('#111827')
      .text('Grand Total', totalsBoxX + 16, totalsBoxY + totalsBoxHeight - 32);
    doc
      .fontSize(14)
      .text(formatCurrency(order.totalPrice), totalsBoxX + 16, totalsBoxY + totalsBoxHeight - 34, {
        width: totalsBoxWidth - 32,
        align: 'right',
      });

    doc.y = totalsBoxY + totalsBoxHeight + 30;
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Thank you for shopping with NovaMart. For support contact support@novamart.com', 40, doc.y, {
        width: doc.page.width - 80,
        align: 'center',
      });

    doc.end();
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
  getOrderInvoice,
};
