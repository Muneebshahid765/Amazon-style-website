import mongoose from 'mongoose';
import slugify from 'slugify';
import crypto from 'crypto';
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
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import TeamMember from '../models/TeamMember.js';
import SecurityLog from '../models/SecurityLog.js';
import Integration from '../models/Integration.js';
import { AccountManager, AccountManagerAssignment } from '../models/AccountManager.js';
import MarketingCampaign from '../models/MarketingCampaign.js';
import {
  mapCategoryField,
  parseExistingImages,
  uploadProductImages,
} from '../utils/productHelpers.js';
import { stripeClient } from '../config/stripe.js';
import {
  checkPlanLimit,
  incrementUsage,
  checkAndResetCycle,
  getUserPlanWithLimits,
} from '../utils/subscriptionHelper.js';

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
    // Check and reset cycle if needed
    await checkAndResetCycle(req.user._id);

    // Check subscription limits
    const limitCheck = await checkPlanLimit(req.user._id, 'upload');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        message: limitCheck.reason,
        limit: limitCheck.limit,
        used: limitCheck.used,
        upgradeRequired: true
      });
    }

    // Check max active products limit
    const activeProductsCount = await Product.countDocuments({ 
      seller: req.user._id, 
      status: 'active' 
    });
    const planInfo = await getUserPlanWithLimits(req.user._id);
    
    if (activeProductsCount >= planInfo.limits.maxActiveProducts) {
      return res.status(403).json({ 
        message: `Maximum active products limit reached (${planInfo.limits.maxActiveProducts}). Upgrade your plan or deactivate some products.`,
        limit: planInfo.limits.maxActiveProducts,
        current: activeProductsCount,
        upgradeRequired: true
      });
    }

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

    // Increment upload usage counter
    await incrementUsage(req.user._id, 'upload');

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    // Check and reset cycle if needed
    await checkAndResetCycle(req.user._id);

    // Check subscription limits for edits
    const limitCheck = await checkPlanLimit(req.user._id, 'edit');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        message: limitCheck.reason,
        limit: limitCheck.limit,
        used: limitCheck.used,
        upgradeRequired: true
      });
    }

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

    // Increment edit usage counter
    await incrementUsage(req.user._id, 'edit');

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    // Check and reset cycle if needed
    await checkAndResetCycle(req.user._id);

    // Check subscription limits for deletes
    const limitCheck = await checkPlanLimit(req.user._id, 'delete');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        message: limitCheck.reason,
        limit: limitCheck.limit,
        used: limitCheck.used,
        upgradeRequired: true
      });
    }

    const { id } = req.params;
    const product = await Product.findOne({ _id: id, seller: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or access denied' });
    }

    product.status = 'inactive';
    await product.save();

    // Increment delete usage counter
    await incrementUsage(req.user._id, 'delete');

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

export const getAIInsights = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    
    const [products, recentOrders, store] = await Promise.all([
      Product.find({ seller: sellerId, status: 'active' }).select('title price stock lowStockThreshold'),
      Order.find({ 'orderItems.seller': sellerId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
        .populate('orderItems.product', 'title price'),
      Store.findOne({ seller: sellerId })
    ]);

    const insights = [];
    const recommendations = [];

    // Low stock insights
    const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 10));
    if (lowStockProducts.length > 0) {
      insights.push({
        id: `stock-${Date.now()}`,
        type: 'warning',
        title: 'Stock Alert',
        description: `${lowStockProducts.length} products are running low on stock and may run out soon.`,
        impact: 'high',
        action: 'Restock Now',
        icon: 'FiAlertCircle',
      });
    }

    // Revenue analysis
    let totalRevenue = 0;
    let orderCount = 0;
    recentOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.seller.toString() === sellerId.toString()) {
          totalRevenue += (item.price || 0) * (item.quantity || 0);
          orderCount++;
        }
      });
    });

    if (orderCount > 0) {
      const avgOrderValue = totalRevenue / orderCount;
      insights.push({
        id: `revenue-${Date.now()}`,
        type: 'success',
        title: 'Sales Performance',
        description: `Generated $${totalRevenue.toFixed(2)} in revenue from ${orderCount} orders this month.`,
        impact: 'high',
        potentialRevenue: `$${totalRevenue.toFixed(2)}/month`,
        icon: 'FiTrendingUp',
      });

      if (avgOrderValue < 50) {
        recommendations.push('Consider bundling products to increase average order value');
      }
    }

    // Price optimization
    const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / (products.length || 1);
    if (avgPrice < 30) {
      insights.push({
        id: `price-${Date.now()}`,
        type: 'opportunity',
        title: 'Price Optimization Opportunity',
        description: `Your average product price is $${avgPrice.toFixed(2)}. Consider premium pricing strategies.`,
        impact: 'medium',
        icon: 'FiTrendingUp',
      });
    }

    // General recommendations
    if (products.length < 10) {
      recommendations.push('Expand your product catalog to attract more customers');
    }
    if (store && !store.logo) {
      recommendations.push('Add a store logo to build brand recognition');
    }
    recommendations.push('Optimize product descriptions with relevant keywords for better visibility');
    recommendations.push('Use high-quality images to increase conversion rates');

    // Predictive analytics
    const nextMonthRevenue = totalRevenue > 0 ? (totalRevenue * 1.1).toFixed(2) : 0;
    const nextMonthOrders = orderCount > 0 ? Math.ceil(orderCount * 1.1) : 0;

    res.json({
      insights,
      recommendations,
      predictions: {
        nextMonthRevenue,
        nextMonthOrders,
        confidence: orderCount > 10 ? 88 : 65,
        churnRisk: 'Low',
        retentionRate: 94
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductAnalytics = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { period = '30days' } = req.query;

    const periodMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      '1year': 365,
    };

    const rangeDays = periodMap[period] || 30;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - rangeDays);
    const previousEnd = new Date(startDate);
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - rangeDays);

    const statusFilter = { $nin: ['cancelled', 'refunded'] };

    const buildMatch = (from, to) => {
      const match = {
        'orderItems.seller': sellerId,
        status: statusFilter,
      };

      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = from;
        if (to) match.createdAt.$lt = to;
      }

      if (match.createdAt && !Object.keys(match.createdAt).length) {
        delete match.createdAt;
      }

      return match;
    };

    const buildMetricsPipeline = (match) => [
      { $match: match },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.seller': sellerId } },
      {
        $group: {
          _id: '$_id',
          orderRevenue: {
            $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
          },
          productsSold: { $sum: '$orderItems.quantity' },
          customer: { $first: '$user' },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderRevenue' },
          totalOrders: { $sum: 1 },
          productsSold: { $sum: '$productsSold' },
          customers: { $addToSet: '$customer' },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          totalOrders: { $ifNull: ['$totalOrders', 0] },
          productsSold: { $ifNull: ['$productsSold', 0] },
          uniqueCustomers: {
            $size: { $ifNull: ['$customers', []] },
          },
        },
      },
    ];

    const calculateChange = (current = 0, previous = 0) => {
      if (!previous && !current) return 0;
      if (!previous) return 100;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const [currentStatsRaw, previousStatsRaw, revenueTrend, topProducts] = await Promise.all([
      Order.aggregate(buildMetricsPipeline(buildMatch(startDate, null))),
      Order.aggregate(buildMetricsPipeline(buildMatch(previousStart, previousEnd))),
      Order.aggregate([
        { $match: buildMatch(startDate, null) },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: {
              $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
            },
            orderIds: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: 1,
            orders: { $size: '$orderIds' },
          },
        },
        { $sort: { date: 1 } },
      ]),
      Order.aggregate([
        { $match: buildMatch(startDate, null) },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        {
          $group: {
            _id: '$orderItems.product',
            sales: { $sum: '$orderItems.quantity' },
            revenue: {
              $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
            },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $project: {
            _id: 1,
            name: {
              $ifNull: [{ $arrayElemAt: ['$product.title', 0] }, 'Product'],
            },
            sales: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    const currentStats = currentStatsRaw[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      productsSold: 0,
      uniqueCustomers: 0,
    };

    const previousStats = previousStatsRaw[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      productsSold: 0,
      uniqueCustomers: 0,
    };

    res.json({
      analytics: {
        totalRevenue: currentStats.totalRevenue,
        revenueChange: calculateChange(currentStats.totalRevenue, previousStats.totalRevenue),
        totalOrders: currentStats.totalOrders,
        ordersChange: calculateChange(currentStats.totalOrders, previousStats.totalOrders),
        uniqueCustomers: currentStats.uniqueCustomers,
        customersChange: calculateChange(currentStats.uniqueCustomers, previousStats.uniqueCustomers),
        productsSold: currentStats.productsSold,
        productsChange: calculateChange(currentStats.productsSold, previousStats.productsSold),
      },
      trend: revenueTrend,
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

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const subscriptionQuery = { user: sellerId, status: 'succeeded' };
    if (hasDateFilter) subscriptionQuery.createdAt = dateFilter;

    const payoutQuery = { seller: sellerId };
    if (hasDateFilter) payoutQuery.createdAt = dateFilter;

    const [subscriptionTransactions, payoutTransactions] = await Promise.all([
      SubscriptionTransaction.find(subscriptionQuery)
        .populate('plan', 'name tier')
        .select('amount billingCycle status createdAt plan paymentMethod')
        .lean(),
      Payout.find(payoutQuery)
        .select('amount status method createdAt transactionId notes')
        .lean(),
    ]);

    const formattedSubscriptionTransactions = subscriptionTransactions.map((sub) => ({
      id: sub._id,
      reference: `SUB-${sub._id.toString().slice(-8).toUpperCase()}`,
      description: `${sub.plan?.name || 'Subscription'} Plan (${sub.billingCycle})`,
      date: sub.createdAt,
      amount: sub.amount,
      direction: 'debit',
      method: sub.paymentMethod || 'card',
      status: sub.status,
      type: 'subscription',
    }));

    const formattedPayoutTransactions = payoutTransactions.map((payout) => ({
      id: payout._id,
      reference: payout.transactionId || `PAY-${payout._id.toString().slice(-8).toUpperCase()}`,
      description: `Payout via ${payout.method?.replace('_', ' ') || 'bank transfer'}`,
      date: payout.createdAt,
      amount: payout.amount,
      direction: 'credit',
      method: payout.method,
      status: payout.status,
      type: 'payout',
    }));

    let allTransactions = [...formattedSubscriptionTransactions, ...formattedPayoutTransactions];

    if (type) {
      if (['subscription', 'payout'].includes(type)) {
        allTransactions = allTransactions.filter((txn) => txn.type === type);
      } else if (['credit', 'debit'].includes(type)) {
        allTransactions = allTransactions.filter((txn) => txn.direction === type);
      }
    }

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = allTransactions.length;
    const numericLimit = Number(limit);
    const paginatedTransactions = allTransactions.slice((page - 1) * numericLimit, page * numericLimit);

    const totalDebits = allTransactions
      .filter((txn) => txn.direction === 'debit')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    const totalCredits = allTransactions
      .filter((txn) => txn.direction === 'credit')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    res.json({
      transactions: paginatedTransactions,
      total,
      totalPages: Math.ceil(total / numericLimit),
      currentPage: Number(page),
      summary: {
        totalDebits,
        totalCredits,
        net: totalCredits - totalDebits,
      },
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

// ==================== SUBSCRIPTION STATUS ====================

export const getSubscriptionStatus = async (req, res, next) => {
  try {
    await checkAndResetCycle(req.user._id);
    
    const planInfo = await getUserPlanWithLimits(req.user._id);
    const activeProductsCount = await Product.countDocuments({ 
      seller: req.user._id, 
      status: 'active' 
    });

    res.json({
      plan: {
        id: planInfo.planId,
        name: planInfo.planName,
        tier: planInfo.tier,
        status: planInfo.planStatus,
        assignedAt: planInfo.planAssignedAt,
        cycleStartedAt: planInfo.planCycleStartedAt,
        renewsAt: planInfo.planRenewsAt,
        featureAccess: planInfo.featureAccess,
      },
      limits: planInfo.limits,
      usage: planInfo.usage,
      activeProducts: activeProductsCount,
      remaining: {
        uploads: Math.max(0, planInfo.limits.uploadsPerCycle - planInfo.usage.uploadsUsed),
        edits: Math.max(0, planInfo.limits.editsPerCycle - planInfo.usage.editsUsed),
        deletes: Math.max(0, planInfo.limits.deletesPerCycle - planInfo.usage.deletesUsed),
        activeProducts: Math.max(0, planInfo.limits.maxActiveProducts - activeProductsCount),
      },
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

// ==================== CUSTOM BRANDING ====================

export const getStoreBranding = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ seller: sellerId });
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const branding = {
      storeName: store.name || '',
      logo: store.logo || null,
      banner: store.banner || null,
      primaryColor: store.branding?.primaryColor || '#3b82f6',
      secondaryColor: store.branding?.secondaryColor || '#8b5cf6',
      accentColor: store.branding?.accentColor || '#10b981',
      tagline: store.tagline || '',
      description: store.description || '',
    };

    res.json({ branding });
  } catch (error) {
    next(error);
  }
};

export const updateStoreBranding = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { storeName, primaryColor, secondaryColor, accentColor, tagline, description } = req.body;
    
    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (storeName) store.name = storeName;
    if (tagline) store.tagline = tagline;
    if (description) store.description = description;

    store.branding = {
      primaryColor: primaryColor || store.branding?.primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || store.branding?.secondaryColor || '#8b5cf6',
      accentColor: accentColor || store.branding?.accentColor || '#10b981',
    };

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const logoResult = await uploadToCloudinary(req.files.logo[0].path, 'store-logos');
        store.logo = logoResult.secure_url;
      }
      if (req.files.banner && req.files.banner[0]) {
        const bannerResult = await uploadToCloudinary(req.files.banner[0].path, 'store-banners');
        store.banner = bannerResult.secure_url;
      }
    }

    await store.save();
    res.json({ message: 'Branding updated successfully', store });
  } catch (error) {
    next(error);
  }
};

// ==================== API ACCESS ====================

export const getAPIKeys = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const user = await User.findById(sellerId);
    
    const apiKeys = user.apiKeys || [];
    const sanitizedKeys = apiKeys.map(key => ({
      id: key._id,
      name: key.name,
      key: key.key,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
    }));

    res.json({ apiKeys: sanitizedKeys });
  } catch (error) {
    next(error);
  }
};

export const generateAPIKey = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { name = 'API Key' } = req.body;
    
    const user = await User.findById(sellerId);
    if (!user.apiKeys) user.apiKeys = [];

    const apiKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
    const createdAt = new Date();

    const newKey = {
      name,
      key: apiKey,
      createdAt,
    };

    user.apiKeys.push(newKey);
    await user.save();

    const savedKey = user.apiKeys[user.apiKeys.length - 1];
    
    res.status(201).json({ 
      message: 'API key generated', 
      id: savedKey._id,
      name: savedKey.name,
      key: savedKey.key,
      createdAt: savedKey.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeAPIKey = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { keyId } = req.params;
    
    const user = await User.findById(sellerId);
    if (!user.apiKeys) {
      return res.status(404).json({ message: 'API key not found' });
    }

    user.apiKeys = user.apiKeys.filter(key => key._id.toString() !== keyId);
    await user.save();

    res.json({ message: 'API key revoked' });
  } catch (error) {
    next(error);
  }
};

// ==================== MULTIPLE STORES ====================

export const getStores = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const stores = await Store.find({ seller: sellerId });

    const storesWithStats = await Promise.all(stores.map(async (store) => {
      const products = await Product.countDocuments({ seller: sellerId, store: store._id });
      const orders = await Order.countDocuments({ 'orderItems.seller': sellerId });
      
      const revenueResult = await Order.aggregate([
        { $match: { 'orderItems.seller': sellerId, status: { $nin: ['cancelled', 'refunded'] } } },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } } } }
      ]);

      return {
        id: store._id,
        name: store.name,
        domain: store.domain || 'N/A',
        status: store.status || 'active',
        products,
        orders,
        revenue: revenueResult[0]?.total || 0,
        isPrimary: store.isPrimary || false,
      };
    }));

    res.json({ stores: storesWithStats });
  } catch (error) {
    next(error);
  }
};

export const createStore = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { name, domain, description } = req.body;

    const store = await Store.create({
      seller: sellerId,
      name,
      domain,
      description,
      status: 'active',
      isPrimary: false,
    });

    res.status(201).json({ message: 'Store created', store });
  } catch (error) {
    next(error);
  }
};

export const updateStoreById = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { storeId } = req.params;

    const store = await Store.findOne({ _id: storeId, seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    Object.assign(store, req.body);
    await store.save();

    res.json({ message: 'Store updated', store });
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { storeId } = req.params;

    const store = await Store.findOne({ _id: storeId, seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.isPrimary) {
      return res.status(400).json({ message: 'Cannot delete primary store' });
    }

    await Store.findByIdAndDelete(storeId);
    res.json({ message: 'Store deleted' });
  } catch (error) {
    next(error);
  }
};

export const setPrimaryStore = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { storeId } = req.params;

    await Store.updateMany({ seller: sellerId }, { isPrimary: false });
    
    const store = await Store.findOne({ _id: storeId, seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.isPrimary = true;
    await store.save();

    res.json({ message: 'Primary store updated', store });
  } catch (error) {
    next(error);
  }
};

// ==================== ADVANCED REPORTING ====================

export const getAdvancedReport = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { reportType = 'sales', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    if (reportType === 'sales') {
      const salesData = await Order.aggregate([
        {
          $match: {
            'orderItems.seller': sellerId,
            createdAt: { $gte: start, $lte: end },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
            orders: { $sum: 1 },
            items: { $sum: '$orderItems.quantity' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      reportData = { type: 'sales', data: salesData };
    }

    res.json({ report: reportData });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    res.json({ message: 'Export functionality coming soon', downloadUrl: null });
  } catch (error) {
    next(error);
  }
};

// ==================== INVENTORY FORECASTING ====================

export const getInventoryForecast = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { timeframe = '30days' } = req.query;

    let daysToAnalyze = 30;
    if (timeframe === '7days') daysToAnalyze = 7;
    else if (timeframe === '90days') daysToAnalyze = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToAnalyze);

    const products = await Product.find({ seller: sellerId, status: 'active' })
      .select('title stock lowStockThreshold')
      .limit(50);

    const productIds = products.map(p => p._id);

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.product': { $in: productIds }, 'orderItems.seller': sellerId } },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const salesMap = {};
    salesData.forEach(item => {
      salesMap[item._id.toString()] = item;
    });

    const forecasts = products.map(product => {
      const sales = salesMap[product._id.toString()];
      const avgDailySales = sales ? sales.totalSold / daysToAnalyze : 0;
      const predictedDemand = Math.ceil(avgDailySales * 30);
      const currentStock = product.stock || 0;
      const daysUntilStockout = avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : 999;
      const threshold = product.lowStockThreshold || 10;
      const recommendedRestock = Math.max(0, (predictedDemand + threshold) - currentStock);
      const confidence = sales && sales.orderCount > 5 ? Math.min(95, 70 + sales.orderCount) : 60;

      return {
        id: product._id,
        productName: product.title,
        currentStock,
        predictedDemand,
        recommendedRestock,
        daysUntilStockout: Math.min(daysUntilStockout, 999),
        confidence,
      };
    });

    const criticalStock = forecasts.filter(f => f.daysUntilStockout < 7).length;
    const lowStock = forecasts.filter(f => f.daysUntilStockout >= 7 && f.daysUntilStockout < 14).length;
    const optimalStock = forecasts.filter(f => f.daysUntilStockout >= 14).length;

    res.json({ 
      forecasts,
      summary: {
        criticalStock,
        lowStock,
        optimalStock,
        totalProducts: forecasts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== AUTOMATED MARKETING ====================

export const getMarketingCampaigns = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    
    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.json({ campaigns: [], stats: { totalSent: 0, openRate: 0, clickRate: 0, conversion: 0 } });
    }

    const campaigns = store.marketingCampaigns || [];

    const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

    const stats = {
      totalSent,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0,
      conversion: totalSent > 0 ? ((totalConversions / totalSent) * 100).toFixed(1) : 0,
    };

    res.json({ campaigns, stats });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { name, type, content } = req.body;
    res.status(201).json({ message: 'Campaign created', campaign: { id: Date.now(), name, type, status: 'draft' } });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    res.json({ message: 'Campaign updated', campaignId });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    res.json({ message: 'Campaign deleted', campaignId });
  } catch (error) {
    next(error);
  }
};

// ==================== DEDICATED ACCOUNT MANAGER ====================

export const getAccountManager = async (req, res, next) => {
  try {
    const manager = {
      name: 'Sarah Johnson',
      title: 'Senior Account Manager',
      email: 'sarah.johnson@support.com',
      phone: '+1 (555) 123-4567',
      availability: 'Available Now',
    };

    res.json({ manager });
  } catch (error) {
    next(error);
  }
};

export const sendMessageToManager = async (req, res, next) => {
  try {
    const { message } = req.body;
    const sellerId = req.user._id;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const assignment = await AccountManagerAssignment.findOne({ store: store._id });
    if (assignment) {
      assignment.interactions.push({
        type: 'message',
        content: message,
        direction: 'inbound',
        status: 'pending',
      });
      await assignment.save();
    }

    res.json({ message: 'Message sent to account manager', success: true });
  } catch (error) {
    next(error);
  }
};

// ==================== TEAM MEMBERS ====================

export const getTeamMembers = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ seller: sellerId });
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const members = await TeamMember.find({ store: store._id })
      .populate('user', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    const stats = {
      total: members.length,
      active: members.filter(m => m.status === 'active').length,
      pending: members.filter(m => m.status === 'pending').length,
      roles: [...new Set(members.map(m => m.role))].length,
    };

    res.json({ members, stats });
  } catch (error) {
    next(error);
  }
};

export const inviteTeamMember = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { email, name, role, permissions } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const existingMember = await TeamMember.findOne({ store: store._id, email });
    if (existingMember) {
      return res.status(400).json({ message: 'Team member with this email already exists' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existingUser = await User.findOne({ email });

    const member = await TeamMember.create({
      store: store._id,
      invitedBy: sellerId,
      user: existingUser?._id,
      email,
      name: name || email.split('@')[0],
      role: role || 'staff',
      permissions: permissions || {},
      inviteToken,
      inviteTokenExpiry,
    });

    res.status(201).json({ message: 'Invitation sent successfully', member });
  } catch (error) {
    next(error);
  }
};

export const updateTeamMember = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { memberId } = req.params;
    const { role, permissions, status } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const member = await TeamMember.findOne({ _id: memberId, store: store._id });
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (role) member.role = role;
    if (permissions) member.permissions = { ...member.permissions, ...permissions };
    if (status) member.status = status;

    await member.save();
    res.json({ message: 'Team member updated', member });
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { memberId } = req.params;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const member = await TeamMember.findOneAndDelete({ _id: memberId, store: store._id });
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json({ message: 'Team member removed' });
  } catch (error) {
    next(error);
  }
};

// ==================== SECURITY ====================

export const getSecuritySettings = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ seller: sellerId });
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const settings = store.securitySettings || {
      twoFactorAuth: false,
      ipWhitelist: false,
      whitelistedIPs: [],
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginNotifications: true,
    };

    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateSecuritySettings = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { twoFactorAuth, ipWhitelist, whitelistedIPs, sessionTimeout, passwordExpiry, loginNotifications } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.securitySettings = {
      twoFactorAuth: twoFactorAuth ?? store.securitySettings?.twoFactorAuth ?? false,
      ipWhitelist: ipWhitelist ?? store.securitySettings?.ipWhitelist ?? false,
      whitelistedIPs: whitelistedIPs || store.securitySettings?.whitelistedIPs || [],
      sessionTimeout: sessionTimeout ?? store.securitySettings?.sessionTimeout ?? 30,
      passwordExpiry: passwordExpiry ?? store.securitySettings?.passwordExpiry ?? 90,
      loginNotifications: loginNotifications ?? store.securitySettings?.loginNotifications ?? true,
    };

    await store.save();

    await SecurityLog.create({
      user: sellerId,
      store: store._id,
      type: 'settings_change',
      status: 'success',
      message: 'Security settings updated',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'Security settings updated', settings: store.securitySettings });
  } catch (error) {
    next(error);
  }
};

export const getSecurityLogs = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 20, type } = req.query;

    const query = { user: sellerId };
    if (type) query.type = type;

    const [logs, total] = await Promise.all([
      SecurityLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      SecurityLog.countDocuments(query),
    ]);

    res.json({
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== INTEGRATIONS ====================

export const getIntegrations = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ seller: sellerId });
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const integrations = await Integration.find({ store: store._id }).sort({ createdAt: -1 });

    res.json({ integrations });
  } catch (error) {
    next(error);
  }
};

export const createIntegration = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { name, type, description, config } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const integration = await Integration.create({
      store: store._id,
      name,
      type,
      description,
      config,
      status: 'pending',
    });

    res.status(201).json({ message: 'Integration created', integration });
  } catch (error) {
    next(error);
  }
};

export const updateIntegration = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { integrationId } = req.params;
    const { status, config } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const integration = await Integration.findOne({ _id: integrationId, store: store._id });
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    if (status) integration.status = status;
    if (config) integration.config = { ...integration.config, ...config };

    await integration.save();
    res.json({ message: 'Integration updated', integration });
  } catch (error) {
    next(error);
  }
};

export const deleteIntegration = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { integrationId } = req.params;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const integration = await Integration.findOneAndDelete({ _id: integrationId, store: store._id });
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    res.json({ message: 'Integration deleted' });
  } catch (error) {
    next(error);
  }
};

export const requestCustomIntegration = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { name, description, requirements } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const integration = await Integration.create({
      store: store._id,
      name,
      type: 'custom',
      description,
      isCustom: true,
      requestedAt: new Date(),
      requestNotes: requirements,
      status: 'pending',
    });

    res.status(201).json({ message: 'Custom integration request submitted', integration });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATED MARKETING CAMPAIGNS ====================

export const getMarketingCampaignsFromDB = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ seller: sellerId });
    
    if (!store) {
      return res.json({ campaigns: [], stats: { totalSent: 0, openRate: 0, clickRate: 0, conversion: 0 } });
    }

    const campaigns = await MarketingCampaign.find({ store: store._id }).sort({ createdAt: -1 });

    const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.stats?.clicked || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.stats?.conversions || 0), 0);

    const stats = {
      totalSent,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0,
      conversion: totalSent > 0 ? ((totalConversions / totalSent) * 100).toFixed(1) : 0,
    };

    res.json({ campaigns, stats });
  } catch (error) {
    next(error);
  }
};

export const createMarketingCampaign = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { name, type, template, subject, content, audience, schedule } = req.body;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const campaign = await MarketingCampaign.create({
      store: store._id,
      seller: sellerId,
      name,
      type: type || 'email',
      template: template || 'custom',
      subject,
      content,
      audience,
      schedule,
      status: 'draft',
    });

    res.status(201).json({ message: 'Campaign created', campaign });
  } catch (error) {
    next(error);
  }
};

export const updateMarketingCampaign = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { campaignId } = req.params;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const campaign = await MarketingCampaign.findOne({ _id: campaignId, store: store._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    Object.assign(campaign, req.body);
    await campaign.save();

    res.json({ message: 'Campaign updated', campaign });
  } catch (error) {
    next(error);
  }
};

export const deleteMarketingCampaign = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { campaignId } = req.params;

    const store = await Store.findOne({ seller: sellerId });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const campaign = await MarketingCampaign.findOneAndDelete({ _id: campaignId, store: store._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATED ACCOUNT MANAGER ====================

export const getAccountManagerFromDB = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ seller: sellerId });
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const assignment = await AccountManagerAssignment.findOne({ store: store._id })
      .populate('manager');

    if (!assignment || !assignment.manager) {
      const defaultManager = await AccountManager.findOne({ isActive: true });
      
      if (defaultManager) {
        const newAssignment = await AccountManagerAssignment.create({
          store: store._id,
          seller: sellerId,
          manager: defaultManager._id,
        });

        return res.json({
          manager: {
            name: defaultManager.name,
            title: defaultManager.title,
            email: defaultManager.email,
            phone: defaultManager.phone,
            avatar: defaultManager.avatar,
            availability: defaultManager.availability,
          },
          interactions: [],
        });
      }

      return res.json({
        manager: null,
        message: 'No account manager assigned yet',
      });
    }

    res.json({
      manager: {
        name: assignment.manager.name,
        title: assignment.manager.title,
        email: assignment.manager.email,
        phone: assignment.manager.phone,
        avatar: assignment.manager.avatar,
        availability: assignment.manager.availability,
      },
      interactions: assignment.interactions.slice(-10).reverse(),
      nextFollowUp: assignment.nextFollowUp,
    });
  } catch (error) {
    next(error);
  }
};
