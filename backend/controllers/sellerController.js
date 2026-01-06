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
import { sendEmail } from '../utils/sendEmail.js';

const uploadProductImages = async (files = []) => {
  if (!files.length || !cloudinary?.uploader) return [];

  const uploadOptions = {
    folder: 'novamart/products',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  };

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve({
              public_id: result.public_id,
              url: result.secure_url,
              alt: file.originalname,
            });
          });

          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        })
    )
  );
};

const parseExistingImages = (input) => {
  if (input === undefined) return null;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return Array.isArray(input) ? input : null;
};

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

    const resolveCategoryValue = async (rawValue) => {
      const normalizedSlug = slugify(rawValue, { lower: true, strict: true });

      let categoryDoc = await Category.findOne({
        $or: [
          { slug: normalizedSlug },
          { name: new RegExp(`^${rawValue}$`, 'i') },
        ],
      });

      if (!categoryDoc) {
        let slugCandidate = normalizedSlug;
        let counter = 1;
        while (await Category.exists({ slug: slugCandidate })) {
          slugCandidate = `${normalizedSlug}-${counter++}`;
        }
        categoryDoc = await Category.create({ name: rawValue, slug: slugCandidate });
      }

      return categoryDoc._id;
    };

    const mapCategoryField = async (fieldName) => {
      if (!productData[fieldName]) return;
      const rawValue = productData[fieldName];
      const isValidId = mongoose.Types.ObjectId.isValid(rawValue);
      if (isValidId) return;

      productData[fieldName] = await resolveCategoryValue(rawValue);
    };

    await mapCategoryField('category');
    await mapCategoryField('subcategory');

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

    const mapCategoryField = async (fieldName) => {
      if (!updatedData[fieldName]) return;
      const rawValue = updatedData[fieldName];
      const isValidId = mongoose.Types.ObjectId.isValid(rawValue);
      if (isValidId) return;

      updatedData[fieldName] = await resolveCategoryValue(rawValue);
    };

    await mapCategoryField('category');
    await mapCategoryField('subcategory');

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
