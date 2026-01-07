import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Store from '../models/Store.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import {
  mapCategoryField,
  parseExistingImages,
  uploadProductImages,
  ensureUniqueSlug,
  normalizeNumericFields,
} from '../utils/productHelpers.js';
import { sendEmail } from '../utils/sendEmail.js';

const paidStatuses = ['processing', 'packed', 'shipped', 'delivered'];

const getOverviewStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const baseMatch = { status: { $in: paidStatuses } };

    const buildRevenuePipeline = (extraMatch = {}) => [
      { $match: { ...baseMatch, ...extraMatch } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ];

    const [totalRevenue, todayRevenue, monthRevenue, yearRevenue] = await Promise.all([
      Order.aggregate(buildRevenuePipeline()),
      Order.aggregate(buildRevenuePipeline({ createdAt: { $gte: today } })),
      Order.aggregate(buildRevenuePipeline({ createdAt: { $gte: firstDayOfMonth } })),
      Order.aggregate(buildRevenuePipeline({ createdAt: { $gte: firstDayOfYear } })),
    ]);

    const lastMonthRevenue = await Order.aggregate(
      buildRevenuePipeline({ createdAt: { $gte: lastMonth, $lt: firstDayOfMonth } })
    );

    const revenueGrowth = lastMonthRevenue[0]?.total
      ? ((monthRevenue[0]?.total - lastMonthRevenue[0]?.total) / lastMonthRevenue[0]?.total) * 100
      : 0;

    const [totalOrders, todayOrders, monthOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const [totalCustomers, newCustomersMonth] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: firstDayOfMonth } }),
    ]);

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    const recentOrdersRaw = await Order.find()
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'firstName lastName email')
      .lean();

    const recentOrders = recentOrdersRaw.map((order) => ({
      ...order,
      totalAmount: order.totalPrice,
    }));

    res.json({
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0,
        year: yearRevenue[0]?.total || 0,
        growth: revenueGrowth,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        month: monthOrders,
        byStatus: ordersByStatus,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersMonth,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      pendingReviews,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    let startDate = new Date();

    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === '1year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const revenueOverTime = await Order.aggregate([
      { $match: { status: { $in: paidStatuses }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByCategory = await Order.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const revenueByPaymentMethod = await Order.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
    ]);

    const avgOrderValue = await Order.aggregate([
      { $match: { status: { $in: paidStatuses }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      revenueOverTime,
      revenueByCategory,
      revenueByPaymentMethod,
      avgOrderValue,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesAnalytics = async (req, res, next) => {
  try {
    const bestSellingProducts = await Order.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          image: { $arrayElemAt: ['$product.images.url', 0] },
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    res.json({
      bestSellingProducts,
      conversionRate,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerAnalytics = async (req, res, next) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const customerGrowth = await User.aggregate([
      { $match: { role: 'user', createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topCustomers = await Order.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $project: {
          name: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
          email: '$customer.email',
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    res.json({
      customerGrowth,
      topCustomers,
    });
  } catch (error) {
    next(error);
  }
};

const getProductPerformance = async (req, res, next) => {
  try {
    const topRatedProducts = await Product.find()
      .sort('-rating')
      .limit(10)
      .select('name rating numReviews images');

    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort('stock')
      .limit(10)
      .select('name stock price images');

    res.json({
      topRatedProducts,
      lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};

const buildAdminProductQuery = (queryString) => {
  const query = {};
  const { search, status, category, seller } = queryString;

  if (status) query.status = status;
  if (category) query.category = category;
  if (seller) query.seller = seller;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }
  return query;
};

const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const mongoQuery = buildAdminProductQuery(req.query);

    const [products, total] = await Promise.all([
      Product.find(mongoQuery)
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Product.countDocuments(mongoQuery),
    ]);

    res.json({
      products,
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

const createAdminProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    if (!productData.title) {
      return res.status(400).json({ message: 'Product title is required' });
    }

    productData.slug = await ensureUniqueSlug(productData.title, productData.slug);

    normalizeNumericFields(productData, ['price', 'discountPrice', 'stock', 'weight', 'tax', 'costPrice']);
    await mapCategoryField(productData, 'category');
    await mapCategoryField(productData, 'subcategory');

    const existingImages = parseExistingImages(productData.existingImages);
    delete productData.existingImages;

    if (req.files?.length) {
      const uploads = await uploadProductImages(req.files);
      productData.images = [...(existingImages || []), ...uploads];
    } else if (existingImages) {
      productData.images = existingImages;
    }

    productData.approvalStatus = 'approved';

    const product = await Product.create(productData);
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    next(error);
  }
};

const updateAdminProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = { ...req.body };

    if (updateData.title && !updateData.slug) {
      updateData.slug = await ensureUniqueSlug(updateData.title);
    }

    normalizeNumericFields(updateData, ['price', 'discountPrice', 'stock', 'weight', 'tax', 'costPrice']);
    await mapCategoryField(updateData, 'category');
    await mapCategoryField(updateData, 'subcategory');

    const existingImages = parseExistingImages(updateData.existingImages);
    delete updateData.existingImages;

    if (req.files?.length) {
      const uploads = await uploadProductImages(req.files);
      updateData.images = [...(existingImages || product.images || []), ...uploads];
    } else if (existingImages) {
      updateData.images = existingImages;
    }

    Object.assign(product, updateData);
    await product.save();

    res.json({ message: 'Product updated', product });
  } catch (error) {
    next(error);
  }
};

const deleteAdminProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = 'inactive';
    product.approvalStatus = 'rejected';
    await product.save();

    res.json({ message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

const buildSellerQuery = ({ status, search, accountStatus }) => {
  const query = { role: 'seller' };

  if (status && status !== 'all') {
    query['businessInfo.verificationStatus'] = status;
  }

  if (accountStatus) {
    query.accountStatus = accountStatus;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { 'businessInfo.businessName': regex },
    ];
  }

  return query;
};

const getAdminSellers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, accountStatus } = req.query;
    const numericLimit = Number(limit) || 20;
    const numericPage = Number(page) || 1;
    const query = buildSellerQuery({ status, search, accountStatus });

    const sellers = await User.find(query)
      .select('firstName lastName email phone businessInfo accountStatus createdAt avatar')
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean();

    const sellerIds = sellers.map((seller) => seller._id);

    let productsCountMap = {};
    if (sellerIds.length) {
      const counts = await Product.aggregate([
        { $match: { seller: { $in: sellerIds } } },
        { $group: { _id: '$seller', count: { $sum: 1 } } },
      ]);
      productsCountMap = counts.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
      }, {});
    }

    const sellersWithStats = sellers.map((seller) => ({
      ...seller,
      productsCount: productsCountMap[seller._id.toString()] || 0,
    }));

    const total = await User.countDocuments(query);

    res.json({
      sellers: sellersWithStats,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
      currentPage: numericPage,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminSellerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid seller id' });
    }

    const seller = await User.findOne({ _id: id, role: 'seller' })
      .select('-password -refreshToken')
      .lean();

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const sellerId = new mongoose.Types.ObjectId(id);

    const [store, productStats, orderStats] = await Promise.all([
      Store.findOne({ seller: sellerId }).lean(),
      Product.aggregate([
        { $match: { seller: sellerId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
              },
            },
            outOfStock: {
              $sum: {
                $cond: [{ $eq: ['$status', 'outofstock'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { 'orderItems.seller': sellerId } },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          },
        },
      ]),
    ]);

    const metrics = {
      products: productStats[0]?.total || 0,
      activeProducts: productStats[0]?.active || 0,
      lowStockProducts: productStats[0]?.outOfStock || 0,
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalRevenue: orderStats[0]?.revenue || 0,
    };

    res.json({
      seller,
      store,
      metrics,
    });
  } catch (error) {
    next(error);
  }
};

const verifySellerAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const allowedStatuses = ['approved', 'rejected', 'pending'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const seller = await User.findOne({ _id: id, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessInfo = seller.businessInfo || {};
    seller.businessInfo.verificationStatus = status;
    seller.businessInfo.isVerified = status === 'approved';
    seller.businessInfo.rejectionReason = status === 'rejected' ? rejectionReason || 'Not specified' : undefined;

    seller.accountStatus =
      status === 'approved'
        ? 'active'
        : status === 'pending'
        ? 'pending_verification'
        : 'suspended';

    await seller.save();

    try {
      await sendEmail({
        to: seller.email,
        subject: 'Seller Verification Update',
        html: `<p>Your seller account status has been updated to <strong>${status}</strong>.</p>${
          status === 'rejected' ? `<p>Reason: ${seller.businessInfo.rejectionReason}</p>` : ''
        }`,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.warn('[verifySellerAccount] Failed to send email notification', emailError);
    }

    res.json({ message: 'Seller status updated', seller });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN ORDERS ====================
const buildOrderQuery = ({ status, search, paymentMethod, dateFrom, dateTo }) => {
  const query = {};
  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { guestEmail: { $regex: search, $options: 'i' } },
    ];
  }
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }
  return query;
};

const getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, paymentMethod, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const numericLimit = Number(limit) || 20;
    const numericPage = Number(page) || 1;
    const query = buildOrderQuery({ status, search, paymentMethod, dateFrom, dateTo });

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .populate('orderItems.product', 'title images')
        .populate('orderItems.seller', 'firstName lastName')
        .sort(sortOptions)
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      orders,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
      currentPage: numericPage,
      statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    });
  } catch (error) {
    next(error);
  }
};

const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('user', 'firstName lastName email phone')
      .populate('orderItems.product', 'title images sku')
      .populate('orderItems.seller', 'firstName lastName email businessInfo')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const allowedStatuses = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user?._id,
      updatedAt: new Date(),
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Send email notification
    const customerEmail = order.user ? (await User.findById(order.user))?.email : order.guestEmail;
    if (customerEmail) {
      try {
        await sendEmail({
          to: customerEmail,
          subject: `Order ${order.orderNumber} - Status Update`,
          html: `<p>Your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>`,
        });
      } catch (emailError) {
        console.warn('[updateAdminOrderStatus] Email failed', emailError);
      }
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { status, trackingNumber, carrier, trackingUrl } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const item = order.orderItems.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    item.itemStatus = status;
    if (trackingNumber || carrier || trackingUrl) {
      item.trackingInfo = {
        trackingNumber: trackingNumber || item.trackingInfo?.trackingNumber,
        carrier: carrier || item.trackingInfo?.carrier,
        trackingUrl: trackingUrl || item.trackingInfo?.trackingUrl,
        shippedAt: status === 'shipped' ? new Date() : item.trackingInfo?.shippedAt,
      };
    }

    await order.save();
    res.json({ message: 'Item status updated', order });
  } catch (error) {
    next(error);
  }
};

const cancelAdminOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: reason || 'Cancelled by admin',
      updatedBy: req.user?._id,
      updatedAt: new Date(),
    });

    // Restore stock for cancelled items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    await order.save();
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    next(error);
  }
};

const refundAdminOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      note: reason || `Refunded $${refundAmount || order.totalPrice}`,
      updatedBy: req.user?._id,
      updatedAt: new Date(),
    });

    await order.save();
    res.json({ message: 'Order refunded', order });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN CUSTOMERS ====================
const buildCustomerQuery = ({ search, status, role }) => {
  const query = { role: role || 'user' };
  if (status) query.accountStatus = status;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }
  return query;
};

const getAdminCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const numericLimit = Number(limit) || 20;
    const numericPage = Number(page) || 1;
    const query = buildCustomerQuery({ search, status });

    const customers = await User.find(query)
      .select('firstName lastName email phone accountStatus createdAt avatar')
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean();

    const customerIds = customers.map((c) => c._id);

    // Get order stats for each customer
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: customerIds }, status: { $in: paidStatuses } } },
      { $group: { _id: '$user', ordersCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } },
    ]);

    const statsMap = orderStats.reduce((acc, item) => {
      acc[item._id.toString()] = { ordersCount: item.ordersCount, totalSpent: item.totalSpent };
      return acc;
    }, {});

    const customersWithStats = customers.map((customer) => ({
      ...customer,
      ordersCount: statsMap[customer._id.toString()]?.ordersCount || 0,
      totalSpent: statsMap[customer._id.toString()]?.totalSpent || 0,
    }));

    const total = await User.countDocuments(query);

    res.json({
      customers: customersWithStats,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
      currentPage: numericPage,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await User.findById(id).select('-password -refreshToken').lean();

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [orderStats, recentOrders, reviewCount] = await Promise.all([
      Order.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), status: { $in: paidStatuses } } },
        { $group: { _id: null, ordersCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' }, avgOrderValue: { $avg: '$totalPrice' } } },
      ]),
      Order.find({ user: id }).sort({ createdAt: -1 }).limit(10).lean(),
      Review.countDocuments({ user: id }),
    ]);

    res.json({
      customer,
      stats: {
        ordersCount: orderStats[0]?.ordersCount || 0,
        totalSpent: orderStats[0]?.totalSpent || 0,
        avgOrderValue: orderStats[0]?.avgOrderValue || 0,
        reviewCount,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountStatus, reason } = req.body;
    const allowedStatuses = ['active', 'suspended', 'banned'];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).json({ message: 'Invalid account status' });
    }

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.accountStatus = accountStatus;
    await customer.save();

    // Send notification email
    try {
      await sendEmail({
        to: customer.email,
        subject: 'Account Status Update',
        html: `<p>Your account status has been updated to <strong>${accountStatus}</strong>.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}`,
      });
    } catch (emailError) {
      console.warn('[updateCustomerStatus] Email failed', emailError);
    }

    res.json({ message: 'Customer status updated', customer });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN REVIEWS ====================
const getAdminReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, rating, search } = req.query;
    const numericLimit = Number(limit) || 20;
    const numericPage = Number(page) || 1;

    const query = {};
    if (status) query.status = status;
    if (rating) query.rating = Number(rating);
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'firstName lastName email avatar')
        .populate('product', 'title images')
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Review.countDocuments(query),
    ]);

    const statusCounts = await Review.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      reviews,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
      currentPage: numericPage,
      statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    });
  } catch (error) {
    next(error);
  }
};

const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid review status' });
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review status updated', review });
  } catch (error) {
    next(error);
  }
};

const deleteAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update product rating
    const productReviews = await Review.find({ product: review.product, status: 'approved' });
    const avgRating = productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;

    await Product.findByIdAndUpdate(review.product, {
      rating: avgRating,
      numReviews: productReviews.length,
    });

    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN COUPONS ====================

const getAdminCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const numericLimit = Number(limit) || 20;
    const numericPage = Number(page) || 1;

    const query = {};
    if (status === 'active') {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiresAt = { $lte: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    if (search) {
      query.code = { $regex: search, $options: 'i' };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Coupon.countDocuments(query),
    ]);

    res.json({
      coupons,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
      currentPage: numericPage,
    });
  } catch (error) {
    next(error);
  }
};

const createAdminCoupon = async (req, res, next) => {
  try {
    const couponData = req.body;

    if (!couponData.code || !couponData.discountValue || !couponData.expiresAt) {
      return res.status(400).json({ message: 'Code, discount value, and expiry date are required' });
    }

    const existingCoupon = await Coupon.findOne({ code: couponData.code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      ...couponData,
      code: couponData.code.toUpperCase(),
    });

    res.status(201).json({ message: 'Coupon created', coupon });
  } catch (error) {
    next(error);
  }
};

const updateAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon updated', coupon });
  } catch (error) {
    next(error);
  }
};

const deleteAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN CATEGORIES ====================
const getAdminCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const numericLimit = Number(limit) || 50;
    const numericPage = Number(page) || 1;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate('parent', 'name slug')
        .sort({ name: 1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Category.countDocuments(query),
    ]);

    // Get product counts for each category
    const categoryIds = categories.map((c) => c._id);
    const productCounts = await Product.aggregate([
      { $match: { category: { $in: categoryIds } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = productCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      productCount: countMap[cat._id.toString()] || 0,
    }));

    res.json({
      categories: categoriesWithCounts,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
      currentPage: numericPage,
    });
  } catch (error) {
    next(error);
  }
};

const createAdminCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parent, image, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existingCategory = await Category.findOne({ $or: [{ name }, { slug: slug || name.toLowerCase().replace(/\s+/g, '-') }] });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name or slug already exists' });
    }

    const category = await Category.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      parent: parent || null,
      image,
      isActive: isActive !== false,
    });

    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    next(error);
  }
};

const updateAdminCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated', category });
  } catch (error) {
    next(error);
  }
};

const deleteAdminCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({ message: `Cannot delete category with ${productCount} products` });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN ACTIVITY LOGS ====================
const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type, userId, dateFrom, dateTo } = req.query;
    const numericLimit = Number(limit) || 50;
    const numericPage = Number(page) || 1;

    // Get recent orders as activity
    const orderActivities = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get recent user registrations
    const userActivities = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get recent reviews
    const reviewActivities = await Review.find()
      .populate('user', 'firstName lastName')
      .populate('product', 'title')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const activities = [
      ...orderActivities.map((o) => ({
        type: 'order',
        action: `New order #${o.orderNumber}`,
        user: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest',
        amount: o.totalPrice,
        timestamp: o.createdAt,
      })),
      ...userActivities.map((u) => ({
        type: 'user',
        action: `New ${u.role} registration`,
        user: `${u.firstName} ${u.lastName}`,
        email: u.email,
        timestamp: u.createdAt,
      })),
      ...reviewActivities.map((r) => ({
        type: 'review',
        action: `New review on ${r.product?.title || 'product'}`,
        user: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown',
        rating: r.rating,
        timestamp: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      activities: activities.slice((numericPage - 1) * numericLimit, numericPage * numericLimit),
      total: activities.length,
      totalPages: Math.ceil(activities.length / numericLimit) || 1,
      currentPage: numericPage,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN PLATFORM STATS ====================
const getPlatformStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      activeUsers7Days,
      newUsers30Days,
      pendingSellers,
      lowStockProducts,
      pendingReviews,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $in: paidStatuses } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.distinct('user', { createdAt: { $gte: last7Days } }).then((ids) => ids.length),
      User.countDocuments({ createdAt: { $gte: last30Days } }),
      User.countDocuments({ role: 'seller', 'businessInfo.verificationStatus': 'pending' }),
      Product.countDocuments({ stock: { $lt: 10 }, status: 'active' }),
      Review.countDocuments({ status: 'pending' }),
    ]);

    // Sales trend (last 7 days)
    const salesTrend = await Order.aggregate([
      { $match: { status: { $in: paidStatuses }, createdAt: { $gte: last7Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      users: { total: totalUsers, newLast30Days: newUsers30Days, activeLast7Days: activeUsers7Days },
      sellers: { total: totalSellers, pending: pendingSellers },
      products: { total: totalProducts, lowStock: lowStockProducts },
      orders: { total: totalOrders },
      revenue: { total: totalRevenue[0]?.total || 0 },
      reviews: { pending: pendingReviews },
      salesTrend,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getOverviewStats,
  getRevenueAnalytics,
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductPerformance,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminSellers,
  getAdminSellerById,
  verifySellerAccount,
  // Orders
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  updateOrderItemStatus,
  cancelAdminOrder,
  refundAdminOrder,
  // Customers
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
  // Reviews
  getAdminReviews,
  updateReviewStatus,
  deleteAdminReview,
  // Coupons
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  // Categories
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  // Activity & Stats
  getActivityLogs,
  getPlatformStats,
};
