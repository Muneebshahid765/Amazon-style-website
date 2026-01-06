import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const initialState = {
  productList: {
    products: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  singleProduct: null,
  relatedProducts: [],
  featuredProducts: [],
  deals: [],
  searchResults: [],
  filters: {
    keyword: '',
    category: [],
    brand: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    inStock: false,
    sort: 'newest',
    page: 1,
    limit: 12,
  },
  status: 'idle',
  error: null,
  cache: {},
};

export const fetchProducts = createAsyncThunk(
  'product/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== null && filters[key] !== '' && filters[key] !== undefined) {
          if (Array.isArray(filters[key])) {
            filters[key].forEach((val) => params.append(key, val));
          } else {
            params.append(key, filters[key]);
          }
        }
      });
      const { data } = await api.get(`/products?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'product/fetchBySlug',
  async (slug, { rejectWithValue, getState }) => {
    try {
      const cache = getState().product.cache;
      if (cache[slug] && Date.now() - cache[slug].timestamp < 5 * 60 * 1000) {
        return cache[slug].data;
      }
      const { data } = await api.get(`/products/${slug}`);
      return { ...data, slug, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Product not found');
    }
  }
);

export const searchAutocomplete = createAsyncThunk(
  'product/searchAutocomplete',
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/search/autocomplete?q=${query}`);
      return data.suggestions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'product/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products/featured');
      return data.products;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }
);

export const fetchDeals = createAsyncThunk('product/fetchDeals', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/deals');
    return data.products;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch deals');
  }
});

export const fetchProductsByCategory = createAsyncThunk(
  'product/fetchByCategory',
  async ({ categorySlug, filters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/products/category/${categorySlug}?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    setPage(state, action) {
      state.filters.page = action.payload;
    },
    clearSingleProduct(state) {
      state.singleProduct = null;
      state.relatedProducts = [];
    },
    clearSearchResults(state) {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.productList = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchProductBySlug.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.singleProduct = action.payload.product;
        state.relatedProducts = action.payload.relatedProducts;
        state.cache[action.payload.slug] = {
          data: action.payload,
          timestamp: action.payload.timestamp,
        };
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(searchAutocomplete.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.deals = action.payload;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.productList = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setPage, clearSingleProduct, clearSearchResults } =
  productSlice.actions;
export default productSlice.reducer;
