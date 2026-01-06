import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiGrid, FiList, FiFilter, FiX } from 'react-icons/fi';
import { fetchProducts, setFilters, clearFilters, setPage } from '../redux/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import styles from '../styles/ProductList.module.css';

const ProductList = () => {
  const dispatch = useDispatch();
  const { productList, filters, status } = useSelector((state) => state.product);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRating: '',
    inStock: false,
    sort: 'newest',
  });

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const applyFilters = () => {
    dispatch(setFilters(localFilters));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      minPrice: '',
      maxPrice: '',
      minRating: '',
      inStock: false,
      sort: 'newest',
    });
    dispatch(clearFilters());
  };

  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading' && productList.products.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className={styles.productListContainer}>
      <div className={styles.topBar}>
        <div className={styles.resultsInfo}>
          <h1>All Products</h1>
          <p>{productList.totalProducts} products found</p>
        </div>

        <div className={styles.topBarActions}>
          <select
            value={localFilters.sort}
            onChange={(e) => {
              handleFilterChange('sort', e.target.value);
              dispatch(setFilters({ sort: e.target.value }));
            }}
            className={styles.sortSelect}
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
            <option value="name">Name: A-Z</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.active : ''}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
            </button>
            <button
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
            >
              <FiList />
            </button>
          </div>

          <button className={styles.filterBtn} onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterHeader}>
            <h3>Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <FiX />
            </button>
          </div>

          <div className={styles.filterGroup}>
            <label>Price Range</label>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Minimum Rating</label>
            <select
              value={localFilters.minRating}
              onChange={(e) => handleFilterChange('minRating', e.target.value)}
            >
              <option value="">All Ratings</option>
              <option value="4">4★ & above</option>
              <option value="3">3★ & above</option>
              <option value="2">2★ & above</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={localFilters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              />
              In Stock Only
            </label>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleClearFilters} className={styles.clearBtn}>
              Clear All
            </button>
            <button onClick={applyFilters} className={styles.applyBtn}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {productList.products.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No products found</h2>
          <p>Try adjusting your filters</p>
          <button onClick={handleClearFilters} className={styles.clearBtn}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className={`${styles.productsGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
            {productList.products.map((product) => (
              <ProductCard key={product._id} product={product} viewMode={viewMode} />
            ))}
          </div>

          {productList.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(productList.currentPage - 1)}
                disabled={!productList.hasPrevPage}
                className={styles.pageBtn}
              >
                Previous
              </button>

              <div className={styles.pageNumbers}>
                {[...Array(productList.totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`${styles.pageNum} ${
                      productList.currentPage === index + 1 ? styles.active : ''
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(productList.currentPage + 1)}
                disabled={!productList.hasNextPage}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
