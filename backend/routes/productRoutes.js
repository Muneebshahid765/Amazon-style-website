import express from 'express';
import { body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import upload from '../config/multer.js';
import {
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
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/search/autocomplete', searchAutocomplete);
router.get('/featured', getFeaturedProducts);
router.get('/deals', getDeals);
router.get('/category/:categorySlug', getProductsByCategory);
router.get('/:slug', getProductBySlug);

router.post(
  '/',
  protect,
  restrictTo('admin'),
  upload.array('images', 5),
  validate([
    body('name').notEmpty().trim().withMessage('Product name is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('stock').isNumeric().withMessage('Stock must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
  ]),
  createProduct
);

router.put('/:id', protect, restrictTo('admin'), upload.array('images', 5), updateProduct);

router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

router.put(
  '/:id/stock',
  protect,
  restrictTo('admin'),
  validate([body('stock').isNumeric().withMessage('Stock must be a number')]),
  updateStock
);

router.post(
  '/:id/reviews',
  protect,
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().trim().withMessage('Comment is required'),
    body('title').optional().trim(),
  ]),
  addReview
);

router.put('/reviews/:id', protect, updateReview);
router.delete('/reviews/:id', protect, deleteReview);
router.put('/reviews/:id/helpful', protect, markReviewHelpful);

export default router;
