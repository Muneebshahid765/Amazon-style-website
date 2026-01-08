import mongoose from 'mongoose';
import slugify from 'slugify';
import streamifier from 'streamifier';
import { cloudinary } from '../config/cloudinary.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Store from '../models/Store.js';
import Payout from '../models/Payout.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import SellerVerification from '../models/SellerVerification.js';
import User from '../models/User.js';
import {
  mapCategoryField,
  parseExistingImages,
  uploadProductImages,
} from '../utils/productHelpers.js';
import { stripeClient } from '../config/stripe.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalRevenue, monthRevenue, totalOrders, pendingOrders, totalProducts, lowStockProducts, store] =
      await Promise.all([
        Order.aggregate([
          { $unwind: '$orderItems' },
          { $match: { 'orderItems.seller': sellerId, status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
            },
          },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: thisMonth } } },
          { $unwind: '$orderItems' },
          { $match: { 'orderItems.seller': sellerId, status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
            },
          },
        ]),
        Order.countDocuments({ 'orderItems.seller': sellerId }),
        Order.countDocuments({ 'orderItems.seller': sellerId, 'orderItems.itemStatus': 'pending' }),
        Product.countDocuments({ seller: sellerId }),
        Product.countDocuments({
          seller: sellerId,
          $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        }),
        Store.findOne({ seller: sellerId }),
      ]);

    res.json({
      revenue: { total: totalRevenue[0]?.total || 0, thisMonth: monthRevenue[0]?.total || 0 },
      orders: { total: totalOrders, pending: pendingOrders },
      products: { total: totalProducts, lowStock: lowStockProducts },
      rating: store?.rating?.average || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesOverview = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    const sellerId = req.user._id;

    let startDate = new Date();
    if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1year') startDate.setFullYear(startDate.getFullYear() - 1);

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.seller': sellerId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data: salesData });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20, search } = req.query;
    const query = { seller: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, seller: req.user._id }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body, seller: req.user._id };
    if (!productData.title) {
      return res.status(400).json({ message: 'Product title is required' });
    }

    if (!productData.slug) {
      const baseSlug = slugify(productData.title, { lower: true, strict: true });
      let uniqueSlug = baseSlug;
      let counter = 1;

      // ensure slug uniqueness
      while (await Product.exists({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }
      productData.slug = uniqueSlug;
    }

    await mapCategoryField(productData, 'category');
    await mapCategoryField(productData, 'subcategory');

    if (productData.comparePrice !== undefined) {
      productData.discountPrice =
        productData.comparePrice === '' ? undefined : Number(productData.comparePrice);
      delete productData.comparePrice;
    }

    if (productData.price !== undefined && productData.price !== '') {
      productData.price = Number(productData.price);
    }

    if (productData.stock !== undefined && productData.stock !== '') {
      productData.stock = Number(productData.stock);
    }

    if (productData.weight !== undefined && productData.weight !== '') {
      productData.weight = Number(productData.weight);
    }

    const existingImages = parseExistingImages(productData.existingImages);
    delete productData.existingImages;

    if (req.files?.length) {
      const uploads = await uploadProductImages(req.files);
      productData.images = [...(existingImages || []), ...uploads];
    } else if (existingImages) {
      productData.images = existingImages;
    }

    const store = await Store.findOne({ seller: req.user._id });
    if (store) productData.sellerInfo = store._id;

    const product = await Product.create(productData);

    if (store) {
      store.totalProducts += 1;
      await store.save();
    }

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, seller: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    const updatedData = { ...req.body };

    if (updatedData.comparePrice !== undefined) {
      updatedData.discountPrice =
        updatedData.comparePrice === '' ? undefined : Number(updatedData.comparePrice);
      delete updatedData.comparePrice;
    }

    if (updatedData.price !== undefined && updatedData.price !== '') {
      updatedData.price = Number(updatedData.price);
    }

    if (updatedData.stock !== undefined && updatedData.stock !== '') {
      updatedData.stock = Number(updatedData.stock);
    }

    if (updatedData.weight !== undefined && updatedData.weight !== '') {
      updatedData.weight = Number(updatedData.weight);
    }

    const existingImages = parseExistingImages(updatedData.existingImages);
    delete updatedData.existingImages;

    if (req.files?.length) {
      const uploads = await uploadProductImages(req.files);
      updatedData.images = [...(existingImages || product.images || []), ...uploads];
    } else if (existingImages) {
      updatedData.images = existingImages;
    }

    await mapCategoryField(updatedData, 'category');
    await mapCategoryField(updatedData, 'subcategory');

    Object.assign(product, updatedData);
    await product.save();

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, seller: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    product.status = 'inactive';
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id, seller: req.user._id },
      { stock },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { status, dateRange, page = 1, limit = 20 } = req.query;
    const matchQuery = { 'orderItems.seller': req.user._id };

    if (status) matchQuery['orderItems.itemStatus'] = status;
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      matchQuery.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    const orders = await Order.find(matchQuery)
      .populate('user', 'firstName lastName email')
      .populate('orderItems.product', 'title images')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Order.countDocuments(matchQuery);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user._id.toString();

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const sellerItems = (order.orderItems || []).filter(
      (item) => item.seller?.toString() === sellerId
    );

    if (!sellerItems.length) {
      return res.status(404).json({ message: 'No items from this order belong to you' });
    }

    const sellerSubtotal = sellerItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    order.orderItems = sellerItems;
    order.sellerSubtotal = sellerSubtotal;

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const item = order.orderItems.id(itemId);
    if (!item || item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    item.itemStatus = status;
    await order.save();

    await sendEmail({
      to: order.user.email,
      subject: 'Order Status Updated',
      html: `<p>Your order item status has been updated to: ${status}</p>`,
    });

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const addTrackingInfo = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { trackingNumber, carrier, trackingUrl } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const item = order.orderItems.id(itemId);
    if (!item || item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    item.trackingInfo = { trackingNumber, carrier, trackingUrl, shippedAt: new Date() };
    item.itemStatus = 'shipped';
    await order.save();

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const getEarnings = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const [totalEarnings, pendingPayouts, completedPayouts] = await Promise.all([
      Order.aggregate([
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId, status: 'delivered' } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          },
        },
      ]),
      Payout.aggregate([
        { $match: { seller: sellerId, status: { $in: ['pending', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payout.find({ seller: sellerId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const total = totalEarnings[0]?.total || 0;
    const pending = pendingPayouts[0]?.total || 0;
    const available = total - pending;

    res.json({
      total,
      available,
      pending,
      history: completedPayouts,
    });
  } catch (error) {
    next(error);
  }
};

export const requestPayout = async (req, res, next) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const sellerId = req.user._id;

    const earnings = await Order.aggregate([
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.seller': sellerId, status: 'delivered' } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        },
      },
    ]);

    const totalEarnings = earnings[0]?.total || 0;

    const pendingPayouts = await Payout.aggregate([
      { $match: { seller: sellerId, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const available = totalEarnings - (pendingPayouts[0]?.total || 0);

    if (amount > available) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const payout = await Payout.create({
      seller: sellerId,
      amount,
      method,
      accountDetails,
    });

    res.status(201).json({ payout });
  } catch (error) {
    next(error);
  }
};

export const getStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json({ store });
  } catch (error) {
    next(error);
  }
};

export const createBuyerProfile = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { displayName } = req.body;
    const trimmedName = displayName?.trim();

    const user = await User.findById(sellerId);
    if (!user) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const isSeller = user.role === 'seller' || user.accountType === 'seller';
    if (!isSeller) {
      return res.status(403).json({ message: 'Only sellers can create a buyer profile' });
    }

    if (user.hasBuyerProfile) {
      return res.status(400).json({ message: 'Buyer profile already exists' });
    }

    const fallbackName = user.fullName?.trim() || user.firstName || user.email?.split('@')[0] || 'Buyer';
    user.buyerProfile = {
      displayName: trimmedName && trimmedName.length >= 2 ? trimmedName : fallbackName,
      createdAt: new Date(),
    };
    user.hasBuyerProfile = true;

    await user.save();

    const safeUser = user.toObject();
    ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpire', 'verificationToken', 'verificationTokenExpires'].forEach(
      (field) => delete safeUser[field]
    );

    res.status(201).json({
      message: 'Buyer account created successfully',
      buyerProfile: user.buyerProfile,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findOneAndUpdate({ seller: req.user._id }, req.body, { new: true });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({ store });
  } catch (error) {
    next(error);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { rating, page = 1, limit = 20 } = req.query;
    const sellerId = req.user._id;

    const products = await Product.find({ seller: sellerId }).select('_id');
    const productIds = products.map((p) => p._id);

    const query = { product: { $in: productIds } };
    if (rating) query.rating = parseInt(rating);

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName')
      .populate('product', 'title images')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

export const replyToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const review = await Review.findById(id).populate('product');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    review.sellerReply = reply;
    review.repliedAt = new Date();
    await review.save();

    res.json({ review });
  } catch (error) {
    next(error);
  }
};

export const getProductAnalytics = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const analytics = await Product.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewsCount' },
          totalSold: { $sum: '$soldCount' },
          avgRating: { $avg: '$ratingsAverage' },
        },
      },
    ]);

    const topProducts = await Product.find({ seller: sellerId })
      .sort({ soldCount: -1 })
      .limit(10)
      .select('title soldCount viewsCount ratingsAverage');

    res.json({
      analytics: analytics[0] || {},
      topProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BANK ACCOUNT & PAYOUT SETTINGS ====================

export const updatePayoutSettings = async (req, res, next) => {
  try {
    const { payoutMethod, bankAccount, paypalAccount, minimumPayout, autoPayoutEnabled, autoPayoutDay } = req.body;
    
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (payoutMethod) store.payoutMethod = payoutMethod;
    if (bankAccount) {
      store.bankAccount = { ...store.bankAccount?.toObject(), ...bankAccount };
    }
    if (paypalAccount) {
      store.paypalAccount = { ...store.paypalAccount?.toObject(), ...paypalAccount };
    }
    if (minimumPayout !== undefined) store.minimumPayout = minimumPayout;
    if (autoPayoutEnabled !== undefined) store.autoPayoutEnabled = autoPayoutEnabled;
    if (autoPayoutDay !== undefined) store.autoPayoutDay = autoPayoutDay;

    await store.save();
    res.json({ store, message: 'Payout settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPayoutSettings = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id })
      .select('payoutMethod bankAccount paypalAccount stripeAccountId minimumPayout autoPayoutEnabled autoPayoutDay');
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({ payoutSettings: store });
  } catch (error) {
    next(error);
  }
};

export const getPayoutHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { seller: req.user._id };
    if (status) query.status = status;

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Payout.countDocuments(query),
    ]);

    res.json({
      payouts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const sellerId = req.user._id;

    const matchQuery = { 'orderItems.seller': sellerId, status: { $in: ['processing', 'packed', 'shipped', 'delivered'] } };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.seller': sellerId } },
      {
        $project: {
          orderId: '$_id',
          orderNumber: 1,
          date: '$createdAt',
          productTitle: '$orderItems.title',
          quantity: '$orderItems.quantity',
          price: '$orderItems.price',
          total: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
          status: '$orderItems.itemStatus',
          type: { $literal: 'sale' },
        },
      },
      { $sort: { date: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) },
    ]);

    const totalCount = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.seller': sellerId } },
      { $count: 'total' },
    ]);

    res.json({
      transactions,
      total: totalCount[0]?.total || 0,
      totalPages: Math.ceil((totalCount[0]?.total || 0) / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BUSINESS INFO ====================

export const updateBusinessInfo = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.businessInfo = { ...store.businessInfo?.toObject(), ...req.body };
    await store.save();

    res.json({ store, message: 'Business information updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== VACATION MODE ====================

export const updateVacationMode = async (req, res, next) => {
  try {
    const { isEnabled, startDate, endDate, message } = req.body;
    
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.vacationMode = {
      isEnabled: isEnabled || false,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      message: message || '',
    };

    await store.save();
    res.json({ store, message: 'Vacation mode updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== SELLER PERFORMANCE ====================

export const getPerformanceMetrics = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [store, orderStats, reviewStats] = await Promise.all([
      Store.findOne({ seller: sellerId }).select('metrics sellerLevel rating'),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$orderItems.itemStatus', 'delivered'] }, 1, 0] },
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$orderItems.itemStatus', 'cancelled'] }, 1, 0] },
            },
            returnedOrders: {
              $sum: { $cond: [{ $eq: ['$orderItems.itemStatus', 'returned'] }, 1, 0] },
            },
            onTimeShipped: {
              $sum: { $cond: [{ $lte: ['$orderItems.shippedWithinDays', 2] }, 1, 0] },
            },
          },
        },
      ]),
      Review.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        { $unwind: '$productInfo' },
        { $match: { 'productInfo.seller': sellerId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            positiveReviews: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = orderStats[0] || {};
    const reviews = reviewStats[0] || {};

    const fulfillmentRate = stats.totalOrders > 0 
      ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1) 
      : 100;
    const cancellationRate = stats.totalOrders > 0 
      ? ((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1) 
      : 0;
    const returnRate = stats.totalOrders > 0 
      ? ((stats.returnedOrders / stats.totalOrders) * 100).toFixed(1) 
      : 0;
    const onTimeShippingRate = stats.totalOrders > 0 
      ? ((stats.onTimeShipped / stats.totalOrders) * 100).toFixed(1) 
      : 100;

    res.json({
      metrics: {
        fulfillmentRate: Number(fulfillmentRate),
        cancellationRate: Number(cancellationRate),
        returnRate: Number(returnRate),
        onTimeShippingRate: Number(onTimeShippingRate),
        avgRating: reviews.avgRating?.toFixed(1) || store?.rating?.average || 0,
        totalReviews: reviews.totalReviews || 0,
        positiveReviewRate: reviews.totalReviews > 0 
          ? ((reviews.positiveReviews / reviews.totalReviews) * 100).toFixed(1) 
          : 100,
      },
      sellerLevel: store?.sellerLevel || 'new',
      storeRating: store?.rating || { average: 0, count: 0 },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REPORTS ====================

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const sellerId = req.user._id;

    const matchQuery = { 'orderItems.seller': sellerId, status: { $in: ['processing', 'packed', 'shipped', 'delivered'] } };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.seller': sellerId } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          orders: { $sum: 1 },
          unitsSold: { $sum: '$orderItems.quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = salesData.reduce(
      (acc, item) => ({
        totalRevenue: acc.totalRevenue + item.revenue,
        totalOrders: acc.totalOrders + item.orders,
        totalUnits: acc.totalUnits + item.unitsSold,
      }),
      { totalRevenue: 0, totalOrders: 0, totalUnits: 0 }
    );

    res.json({ data: salesData, totals });
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const [inventory, lowStock, outOfStock] = await Promise.all([
      Product.find({ seller: sellerId, status: 'active' })
        .select('title sku stock lowStockThreshold price images')
        .sort({ stock: 1 })
        .limit(50)
        .lean(),
      Product.countDocuments({
        seller: sellerId,
        status: 'active',
        $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
      }),
      Product.countDocuments({ seller: sellerId, status: 'active', stock: 0 }),
    ]);

    const totalValue = inventory.reduce((sum, p) => sum + (p.price * p.stock), 0);

    res.json({
      inventory,
      summary: {
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
        totalInventoryValue: totalValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BULK OPERATIONS ====================

export const bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { productId, stock }
    const sellerId = req.user._id;

    const bulkOps = updates.map(({ productId, stock }) => ({
      updateOne: {
        filter: { _id: productId, seller: sellerId },
        update: { $set: { stock: Number(stock) } },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);

    res.json({
      message: 'Stock updated successfully',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdatePrices = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { productId, price, discountPrice }
    const sellerId = req.user._id;

    const bulkOps = updates.map(({ productId, price, discountPrice }) => ({
      updateOne: {
        filter: { _id: productId, seller: sellerId },
        update: { 
          $set: { 
            price: Number(price),
            ...(discountPrice !== undefined && { discountPrice: Number(discountPrice) }),
          },
        },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);

    res.json({
      message: 'Prices updated successfully',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CATEGORIES FOR SELLER ====================

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug parent')
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

// ==================== VERIFICATION ====================

const uploadVerificationDocuments = async (files = []) => {
  if (!files.length || !cloudinary?.uploader) return [];
  const options = {
    folder: 'novamart/seller-verification',
    resource_type: 'auto',
  };

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve({ public_id: result.public_id, url: result.secure_url, name: file.originalname, type: file.mimetype });
          });
          streamifier.createReadStream(file.buffer).pipe(stream);
        })
    )
  );
};

export const submitSellerVerification = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const {
      businessName,
      businessType,
      registrationNumber,
      taxId,
      businessCategory,
      website,
      description,
      address,
      submissionNotes,
      paymentMethod,
      paymentIntentId,
      fee,
    } = req.body;

    if (!businessName) {
      return res.status(400).json({ message: 'Business name is required' });
    }

    const sellerUser = await User.findById(sellerId);
    if (!sellerUser) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    let paymentRecord = null;
    if (paymentMethod === 'stripe') {
      if (!paymentIntentId || !stripeClient) {
        return res.status(400).json({ message: 'Stripe payment intent is required' });
      }

      const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge', 'charges.data.payment_method_details.card'],
      });

      if (!intent || intent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment not completed. Please try again.' });
      }

      paymentRecord = {
        provider: 'stripe',
        paymentIntentId: intent.id,
        amount: intent.amount_received / 100,
        currency: intent.currency,
        cardBrand: intent.charges?.data?.[0]?.payment_method_details?.card?.brand,
        cardLast4: intent.charges?.data?.[0]?.payment_method_details?.card?.last4,
        paidAt: new Date(intent.created * 1000),
      };
    } else if (paymentMethod === 'wallet') {
      if (!fee || Number(fee) <= 0) {
        return res.status(400).json({ message: 'Fee is required for wallet payments' });
      }
      const store = await Store.findOne({ seller: sellerId });
      if (!store || (store.availableBalance || 0) < Number(fee)) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      store.availableBalance -= Number(fee);
      await store.save();
      paymentRecord = {
        provider: 'wallet',
        amount: Number(fee),
        currency: 'USD',
        paidAt: new Date(),
      };
    } else {
      return res.status(400).json({ message: 'Unsupported payment method' });
    }

    const existing = await SellerVerification.findOne({ seller: sellerId });
    if (existing && existing.status === 'approved') {
      return res.status(400).json({ message: 'Seller already verified' });
    }

    let parsedAddress;
    if (address) {
      try {
        parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (parseError) {
        return res.status(400).json({ message: 'Invalid address format' });
      }
    }

    const uploadedDocs = await uploadVerificationDocuments(req.files || []);

    const payload = {
      seller: sellerId,
      businessName,
      businessType,
      registrationNumber,
      taxId,
      businessCategory,
      website,
      description,
      address: parsedAddress,
      submissionNotes,
      fee: paymentRecord?.amount,
      payment: paymentRecord,
    };

    if (uploadedDocs.length) {
      payload.documents = uploadedDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        url: doc.url,
        public_id: doc.public_id,
      }));
    }

    let verification;
    if (existing) {
      verification = await SellerVerification.findOneAndUpdate(
        { seller: sellerId },
        {
          ...payload,
          status: 'pending',
          rejectionReason: undefined,
          reviewedAt: undefined,
          reviewedBy: undefined,
        },
        { new: true }
      );
    } else {
      verification = await SellerVerification.create(payload);
    }

    sellerUser.businessInfo = sellerUser.businessInfo || {};
    sellerUser.businessInfo.verificationStatus = 'pending';
    sellerUser.businessInfo.isVerified = false;
    sellerUser.accountStatus = 'pending_verification';
    await sellerUser.save();

    const store = await Store.findOne({ seller: sellerId });
    if (store) {
      store.verificationStatus = 'pending';
      store.verifiedAt = undefined;
      await store.save();
    }

    res.status(201).json({ message: 'Verification submitted', verification });
  } catch (error) {
    next(error);
  }
};

export const getSellerVerification = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const verification = await SellerVerification.findOne({ seller: sellerId }).lean();
    res.json({ verification });
  } catch (error) {
    next(error);
  }
};

export const createVerificationPaymentIntent = async (req, res, next) => {
  try {
    if (!stripeClient) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const sellerId = req.user._id;
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const amount = Number(process.env.SELLER_VERIFICATION_FEE || 49); // USD
    const currency = (process.env.SELLER_VERIFICATION_CURRENCY || 'usd').toLowerCase();

    const intent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      description: 'Seller verification fee',
      automatic_payment_methods: { enabled: true },
      receipt_email: seller.email,
      metadata: {
        sellerId: sellerId.toString(),
        purpose: 'seller_verification',
      },
    });

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount,
      currency,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SELLER COUPONS ====================

export const getSellerCoupons = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 20, status, search } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;

    const query = { seller: sellerId };
    if (status === 'active') {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.expiresAt = { $lte: new Date() };
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

export const createSellerCoupon = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const couponData = req.body;

    if (!couponData.code || !couponData.discountValue || !couponData.expiresAt) {
      return res.status(400).json({ message: 'Code, discount value, and expiry date are required' });
    }

    const existingCoupon = await Coupon.findOne({
      code: couponData.code.toUpperCase(),
      seller: sellerId,
    });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists for your store' });
    }

    const coupon = await Coupon.create({
      ...couponData,
      code: couponData.code.toUpperCase(),
      seller: sellerId,
    });

    res.status(201).json({ message: 'Coupon created', coupon });
  } catch (error) {
    next(error);
  }
};

export const updateSellerCoupon = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;
    const coupon = await Coupon.findOne({ _id: id, seller: sellerId });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    Object.assign(coupon, req.body);
    if (req.body.code) {
      coupon.code = req.body.code.toUpperCase();
    }
    await coupon.save();

    res.json({ message: 'Coupon updated', coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteSellerCoupon = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;

    const coupon = await Coupon.findOneAndDelete({ _id: id, seller: sellerId });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
