import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts, deleteProduct } from '../../../redux/slices/adminSlice';
import { FiSearch, FiFilter, FiEye, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import styles from './ProductList.module.css';

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, searchTerm, selectedCategory]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await dispatch(deleteProduct(id));
      dispatch(fetchProducts({ page: currentPage }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>All Products</h1>
          <p>Manage products from all sellers</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.select}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home & Garden</option>
        </select>
        <button className={styles.filterButton}>
          <FiFilter /> More Filters
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading products...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products || []).map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className={styles.productInfo}>
                      <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.title}
                        className={styles.productImage}
                      />
                      <div>
                        <p className={styles.productName}>{product.title}</p>
                        <p className={styles.productId}>ID: {product._id?.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>{product.sku || 'N/A'}</td>
                  <td>{product.category?.name || 'N/A'}</td>
                  <td>${product.price?.toFixed(2)}</td>
                  <td>
                    <span className={product.stock < 10 ? styles.lowStock : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td>{product.seller?.firstName || 'N/A'}</td>
                  <td>
                    <span className={`${styles.status} ${styles[product.status]}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/products/${product._id}`} className={styles.actionBtn}>
                        <FiEye />
                      </Link>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(product._id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className={styles.pageBtn}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>Page {currentPage}</span>
        <button onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageBtn}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductList;
