import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  advancedSearch,
  autocomplete,
  getTrendingSearches,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
} from '../controllers/searchController.js';
import {
  getPersonalizedRecommendations,
  getRelatedProducts,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
} from '../controllers/recommendationController.js';

const router = express.Router();

router.get('/search', advancedSearch);
router.get('/search/autocomplete', autocomplete);
router.get('/search/trending', getTrendingSearches);
router.get('/search/history', protect, getSearchHistory);
router.delete('/search/history/:id', protect, deleteSearchHistory);
router.delete('/search/history', protect, clearSearchHistory);

router.get('/recommendations/for-you', protect, getPersonalizedRecommendations);
router.get('/recommendations/related/:productId', getRelatedProducts);
router.get('/recommendations/similar/:productId', getSimilarProducts);
router.get('/recommendations/frequently-bought/:productId', getFrequentlyBoughtTogether);

export default router;
