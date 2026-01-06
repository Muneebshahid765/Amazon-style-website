import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const addReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: 'delivered',
    });

    const reviewData = {
      user: req.user._id,
      product: productId,
      rating,
      title,
      comment,
      verifiedPurchase: !!hasPurchased,
      order: hasPurchased?._id,
    };

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.slice(0, 5).map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'novamart/reviews',
              transformation: [{ width: 800, height: 800, crop: 'limit' }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({ public_id: result.public_id, url: result.secure_url });
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      });

      reviewData.images = await Promise.all(uploadPromises);
    }

    const review = await Review.create(reviewData);

    const reviews = await Review.find({ product: productId, status: 'approved' });
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

const getProductReviews = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { product: productId, status: 'approved' };

    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    if (req.query.verified === 'true') {
      query.verifiedPurchase = true;
    }

    if (req.query.withImages === 'true') {
      query.images = { $exists: true, $ne: [] };
    }

    let sort = '-createdAt';
    if (req.query.sort === 'helpful') {
      sort = '-helpfulVotes.helpful';
    } else if (req.query.sort === 'rating-high') {
      sort = '-rating';
    } else if (req.query.sort === 'rating-low') {
      sort = 'rating';
    }

    const totalReviews = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName avatar')
      .populate('sellerResponse.respondedBy', 'firstName lastName');

    const ratingBreakdown = await Review.aggregate([
      { $match: { product: productId, status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const stats = {
      totalReviews,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    ratingBreakdown.forEach((item) => {
      stats.ratingBreakdown[item._id] = item.count;
    });

    if (totalReviews > 0) {
      const sum = ratingBreakdown.reduce((acc, item) => acc + item._id * item.count, 0);
      stats.averageRating = sum / totalReviews;
    }

    res.json({
      reviews,
      stats,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    const daysSinceCreation = Math.floor(
      (new Date() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation > 30) {
      return res.status(400).json({ message: 'Reviews can only be edited within 30 days' });
    }

    review.rating = rating || review.rating;
    review.title = title !== undefined ? title : review.title;
    review.comment = comment || review.comment;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    const reviews = await Review.find({ product: review.product, status: 'approved' });
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

    if (review.images && review.images.length > 0) {
      await Promise.all(review.images.map((img) => cloudinary.uploader.destroy(img.public_id)));
    }

    const productId = review.product;
    await review.deleteOne();

    const reviews = await Review.find({ product: productId, status: 'approved' });
    const avgRating =
      reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

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
    res.json({ message: 'Vote updated', helpfulCount: review.helpfulCount });
  } catch (error) {
    next(error);
  }
};

const reportReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reportedBy.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    review.reportedBy.push(req.user._id);
    review.reportCount += 1;

    if (review.reportCount >= 5) {
      review.status = 'pending';
    }

    await review.save();
    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    next(error);
  }
};

const addSellerResponse = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.sellerResponse = {
      comment,
      respondedBy: req.user._id,
      respondedAt: new Date(),
    };

    await review.save();
    res.json({ message: 'Response added successfully', review });
  } catch (error) {
    next(error);
  }
};

const getAllReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.reported === 'true') {
      query.reportCount = { $gte: 1 };
    }

    const totalReviews = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name');

    res.json({
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = 'approved';
    await review.save();

    const reviews = await Review.find({ product: review.product, status: 'approved' });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(review.product, {
      rating: avgRating,
      numReviews: reviews.length,
    });

    res.json({ message: 'Review approved successfully', review });
  } catch (error) {
    next(error);
  }
};

const deleteReviewAdmin = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.images && review.images.length > 0) {
      await Promise.all(review.images.map((img) => cloudinary.uploader.destroy(img.public_id)));
    }

    const productId = review.product;
    await review.deleteOne();

    const reviews = await Review.find({ product: productId, status: 'approved' });
    const avgRating =
      reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length,
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  addSellerResponse,
  getAllReviews,
  approveReview,
  deleteReviewAdmin,
};
