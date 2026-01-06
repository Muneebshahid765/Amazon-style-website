import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

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

export {
  getOverviewStats,
  getRevenueAnalytics,
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductPerformance,
};
