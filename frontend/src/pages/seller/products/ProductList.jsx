import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts, deleteProduct, updateStock } from '../../../redux/slices/sellerSlice';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiPackage } from 'react-icons/fi';
import styles from './ProductList.module.css';

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.seller);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (searchTerm) params.search = searchTerm;
    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await dispatch(deleteProduct(id));
    }
  };

  const handleStockUpdate = async (id, newStock) => {
    await dispatch(updateStock({ id, stock: parseInt(newStock) }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>My Products</h1>
          <p>Manage your product inventory</p>
        </div>
        <Link to="/seller/products/add" className={styles.addButton}>
          <FiPlus /> Add New Product
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading products...</div>
      ) : (
        <div className={styles.grid}>
          {(products || []).map((product) => (
            <div key={product._id} className={styles.productCard}>
              <div className={styles.productImage}>
                <img src={product.images?.[0]?.url || '/placeholder.png'} alt={product.title} />
                <span className={`${styles.status} ${styles[product.status]}`}>{product.status}</span>
              </div>
              <div className={styles.productInfo}>
                <h3>{product.title}</h3>
                <p className={styles.sku}>SKU: {product.sku || 'N/A'}</p>
                <div className={styles.priceStock}>
                  <span className={styles.price}>${product.price?.toFixed(2)}</span>
                  <div className={styles.stockControl}>
                    <FiPackage />
                    <input type="number" value={product.stock} onChange={(e) => handleStockUpdate(product._id, e.target.value)} className={styles.stockInput} min="0" />
                  </div>
                </div>
                <div className={styles.actions}>
                  <Link to={`/seller/products/edit/${product._id}`} className={styles.editBtn}><FiEdit /> Edit</Link>
                  <button onClick={() => handleDelete(product._id)} className={styles.deleteBtn}><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {products?.length === 0 && !loading && (
        <div className={styles.empty}>
          <FiPackage className={styles.emptyIcon} />
          <h3>No products yet</h3>
          <p>Start by adding your first product</p>
          <Link to="/seller/products/add" className={styles.addButton}><FiPlus /> Add Product</Link>
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className={styles.pageBtn}>Previous</button>
        <span>Page {currentPage}</span>
        <button onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageBtn}>Next</button>
      </div>
    </div>
  );
};

export default ProductList;
