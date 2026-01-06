import Product from '../models/Product.js';
import User from '../models/User.js';

const advancedSearch = async (req, res, next) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      discount,
      inStock,
      newArrivals,
      freeShipping,
      sort = 'relevance',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status: 'active' };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      query.brand = { $in: brands };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (discount) {
      query.discountPercentage = { $gte: Number(discount) };
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock = 0;
    }

    if (newArrivals === 'true') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    if (freeShipping === 'true') {
      query.freeShipping = true;
    }

    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'best-selling':
        sortOption = { soldCount: -1 };
        break;
      case 'top-rated':
        sortOption = { rating: -1 };
        break;
      default:
        sortOption = { _id: -1 };
    }

    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .select('name price discountPrice images rating numReviews stock category brand slug');

    if (req.user && q) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          searchHistory: {
            $each: [{ query: q, timestamp: new Date() }],
            $slice: -20,
          },
        },
      });
    }

    res.json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
      filters: {
        q,
        category,
        brand,
        minPrice,
        maxPrice,
        minRating,
        discount,
        inStock,
        sort,
      },
    });
  } catch (error) {
    next(error);
  }
};

const autocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const [products, categories, brands] = await Promise.all([
      Product.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
        status: 'active',
      })
        .limit(5)
        .select('name images price slug'),

      Product.distinct('category', {
        category: { $regex: q, $options: 'i' },
        status: 'active',
      }).limit(3),

      Product.distinct('brand', {
        brand: { $regex: q, $options: 'i' },
        status: 'active',
      }).limit(3),
    ]);

    res.json({
      suggestions: {
        products,
        categories,
        brands,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTrendingSearches = async (req, res, next) => {
  try {
    const trending = await User.aggregate([
      { $unwind: '$searchHistory' },
      {
        $group: {
          _id: '$searchHistory.query',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ trending: trending.map((t) => t._id) });
  } catch (error) {
    next(error);
  }
};

const getSearchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('searchHistory');
    const history = user.searchHistory || [];

    res.json({
      history: history.reverse().slice(0, 20),
    });
  } catch (error) {
    next(error);
  }
};

const deleteSearchHistory = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { searchHistory: { _id: req.params.id } },
    });

    res.json({ message: 'Search history item deleted' });
  } catch (error) {
    next(error);
  }
};

const clearSearchHistory = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      searchHistory: [],
    });

    res.json({ message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};

export {
  advancedSearch,
  autocomplete,
  getTrendingSearches,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
};
