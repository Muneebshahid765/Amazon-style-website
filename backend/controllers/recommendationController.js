import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    if (!req.user) {
      const popularProducts = await Product.find({ status: 'active' })
        .sort('-soldCount -rating')
        .limit(10)
        .select('name price discountPrice images rating numReviews slug');

      return res.json({ recommendations: popularProducts });
    }

    const user = await User.findById(req.user._id).populate('wishlist');

    const userOrders = await Order.find({ user: req.user._id }).populate('items.product');

    const viewedCategories = [];
    const purchasedProducts = [];

    userOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product) {
          purchasedProducts.push(item.product._id);
          if (item.product.category) {
            viewedCategories.push(item.product.category);
          }
        }
      });
    });

    user.wishlist.forEach((product) => {
      if (product.category) {
        viewedCategories.push(product.category);
      }
    });

    const categoryFrequency = {};
    viewedCategories.forEach((cat) => {
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    let recommendations = [];

    if (topCategories.length > 0) {
      recommendations = await Product.find({
        category: { $in: topCategories },
        _id: { $nin: [...purchasedProducts, ...user.wishlist] },
        status: 'active',
      })
        .sort('-rating -soldCount')
        .limit(10)
        .select('name price discountPrice images rating numReviews slug category');
    }

    if (recommendations.length < 10) {
      const additionalProducts = await Product.find({
        _id: { $nin: [...purchasedProducts, ...user.wishlist, ...recommendations.map((p) => p._id)] },
        status: 'active',
      })
        .sort('-soldCount -rating')
        .limit(10 - recommendations.length)
        .select('name price discountPrice images rating numReviews slug');

      recommendations = [...recommendations, ...additionalProducts];
    }

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
};

const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'active',
    })
      .sort('-rating -soldCount')
      .limit(8)
      .select('name price discountPrice images rating numReviews slug');

    res.json({ relatedProducts });
  } catch (error) {
    next(error);
  }
};

const getSimilarProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const priceRange = product.price * 0.3;

    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      price: {
        $gte: product.price - priceRange,
        $lte: product.price + priceRange,
      },
      status: 'active',
    })
      .sort('-rating')
      .limit(8)
      .select('name price discountPrice images rating numReviews slug');

    res.json({ similarProducts });
  } catch (error) {
    next(error);
  }
};

const getFrequentlyBoughtTogether = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const orders = await Order.find({
      'items.product': productId,
      status: { $in: ['processing', 'shipped', 'delivered'] },
    }).populate('items.product');

    const productFrequency = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product && item.product._id.toString() !== productId) {
          const id = item.product._id.toString();
          productFrequency[id] = (productFrequency[id] || 0) + 1;
        }
      });
    });

    const sortedProducts = Object.entries(productFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map((entry) => entry[0]);

    const frequentlyBought = await Product.find({
      _id: { $in: sortedProducts },
      status: 'active',
    }).select('name price discountPrice images rating numReviews slug');

    res.json({ frequentlyBought });
  } catch (error) {
    next(error);
  }
};

export {
  getPersonalizedRecommendations,
  getRelatedProducts,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
};
