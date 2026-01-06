import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import slugify from 'slugify';

const getProducts = async (req, res, next) => {
  try {
    const features = new ApiFeatures(Product.find({ status: 'active' }), req.query)
      .search()
      .filter()
      .sort()
      .limitFields();

    const page = features.getPage();
    const limit = features.getLimit();

    const totalProducts = await Product.countDocuments(features.query.getFilter());
    const totalPages = Math.ceil(totalProducts / limit);

    features.paginate();
    const products = await features.query.populate('category', 'name slug');

    res.json({
      products,
      totalProducts,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' })
      .populate('category', 'name slug')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'firstName lastName avatar' },
        options: { sort: { createdAt: -1 }, limit: 10 },
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.views += 1;
    await product.save();

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active',
    })
      .limit(8)
      .select('name slug price discountPrice images rating');

    res.json({ product, relatedProducts });
  } catch (error) {
    next(error);
  }
};

const searchAutocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(q, 'i');
    const suggestions = await Product.find({
      $or: [{ name: regex }, { tags: regex }],
      status: 'active',
    })
      .select('name slug images')
      .limit(10);

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.categorySlug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const features = new ApiFeatures(
      Product.find({ category: category._id, status: 'active' }),
      req.query
    )
      .sort()
      .limitFields();

    const page = features.getPage();
    const limit = features.getLimit();
    const totalProducts = await Product.countDocuments({ category: category._id, status: 'active' });
    const totalPages = Math.ceil(totalProducts / limit);

    features.paginate();
    const products = await features.query;

    res.json({
      products,
      category,
      totalProducts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ featured: true, status: 'active' })
      .populate('category', 'name slug')
      .limit(12)
      .sort('-createdAt');

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

const getDeals = async (req, res, next) => {
  try {
    const products = await Product.find({
      discountPrice: { $exists: true, $ne: null },
      status: 'active',
    })
      .populate('category', 'name slug')
      .sort('-createdAt')
      .limit(20);

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    if (!productData.slug && productData.name) {
      productData.slug = slugify(productData.name, { lower: true, strict: true });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'novamart/products',
              transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({ public_id: result.public_id, url: result.secure_url });
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      });

      productData.images = await Promise.all(uploadPromises);
    }

    const product = await Product.create(productData);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    if (productData.name && !productData.slug) {
      productData.slug = slugify(productData.name, { lower: true, strict: true });
    }

    if (req.files && req.files.length > 0) {
      const product = await Product.findById(req.params.id);
      if (product && product.images) {
        await Promise.all(
          product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
        );
      }

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'novamart/products',
              transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({ public_id: result.public_id, url: result.secure_url });
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      });

      productData.images = await Promise.all(uploadPromises);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = 'inactive';
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Stock updated successfully', product });
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { rating, comment, title } = req.body;
    const productId = req.params.id;

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      comment,
      title,
    });

    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length,
    });

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'firstName lastName avatar'
    );

    res.status(201).json({ message: 'Review added successfully', review: populatedReview });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { rating, comment, title } = req.body;
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.title = title || review.title;
    await review.save();

    const reviews = await Review.find({ product: review.product });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(review.product, {
      rating: avgRating,
    });

    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    const productId = review.product;
    await review.deleteOne();

    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
      : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length,
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const markReviewHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user._id.toString();
    const helpfulIndex = review.helpfulVotes.helpful.indexOf(userId);
    const notHelpfulIndex = review.helpfulVotes.notHelpful.indexOf(userId);

    if (helpfulIndex > -1) {
      review.helpfulVotes.helpful.splice(helpfulIndex, 1);
    } else {
      if (notHelpfulIndex > -1) {
        review.helpfulVotes.notHelpful.splice(notHelpfulIndex, 1);
      }
      review.helpfulVotes.helpful.push(userId);
    }

    await review.save();
    res.json({ message: 'Review vote updated', review });
  } catch (error) {
    next(error);
  }
};

export {
  getProducts,
  getProductBySlug,
  searchAutocomplete,
  getProductsByCategory,
  getFeaturedProducts,
  getDeals,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  addReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
};
