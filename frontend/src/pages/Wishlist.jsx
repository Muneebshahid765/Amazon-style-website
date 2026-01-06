import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import {
  fetchWishlist,
  removeFromWishlist,
  optimisticRemoveFromWishlist,
} from '../redux/slices/userSlice';
import { addToCart } from '../redux/slices/cartSlice';
import styles from '../styles/Wishlist.module.css';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.user);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemove = async (productId) => {
    dispatch(optimisticRemoveFromWishlist(productId));
    await dispatch(removeFromWishlist(productId));
  };

  const handleAddToCart = async (product) => {
    await dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  const handleAddAllToCart = async () => {
    for (const product of wishlist) {
      await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.emptyState}>
        <FiHeart size={64} />
        <h2>Please log in to view your wishlist</h2>
        <Link to="/login" className={styles.loginBtn}>
          Log In
        </Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiHeart size={64} />
        <h2>Your Wishlist is Empty</h2>
        <p>Save your favorite items here to buy them later</p>
        <Link to="/products" className={styles.shopBtn}>
          <FiShoppingBag /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wishlistContainer}>
      <div className={styles.header}>
        <h1>
          <FiHeart /> My Wishlist
        </h1>
        <div className={styles.headerActions}>
          <span className={styles.count}>{wishlist.length} items</span>
          <button className={styles.addAllBtn} onClick={handleAddAllToCart}>
            <FiShoppingCart /> Add All to Cart
          </button>
        </div>
      </div>

      <div className={styles.wishlistGrid}>
        {wishlist.map((product) => (
          <div key={product._id} className={styles.productCard}>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemove(product._id)}
              title="Remove from wishlist"
            >
              <FiTrash2 />
            </button>

            {product.stock === 0 && <span className={styles.outOfStock}>Out of Stock</span>}

            <Link to={`/products/${product.slug || product._id}`} className={styles.imageWrapper}>
              <img
                src={product.images?.[0]?.url || '/placeholder.png'}
                alt={product.name}
                className={styles.productImage}
              />
            </Link>

            <div className={styles.productInfo}>
              <Link to={`/products/${product.slug || product._id}`} className={styles.productName}>
                {product.name}
              </Link>

              <div className={styles.priceSection}>
                {product.discountPrice ? (
                  <>
                    <span className={styles.discountPrice}>Rs. {product.discountPrice}</span>
                    <span className={styles.originalPrice}>Rs. {product.price}</span>
                    <span className={styles.discount}>
                      {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className={styles.price}>Rs. {product.price}</span>
                )}
              </div>

              {product.rating && (
                <div className={styles.rating}>
                  <span className={styles.stars}>★</span>
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              )}

              <button
                className={styles.addToCartBtn}
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
              >
                <FiShoppingCart /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
