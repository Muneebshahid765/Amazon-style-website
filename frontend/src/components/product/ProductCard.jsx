import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { addToWishlist } from '../../redux/slices/userSlice';
import styles from '../../styles/ProductCard.module.css';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    dispatch(addToWishlist(product._id));
  };

  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <article className={`${styles.card} ${viewMode === 'list' ? styles.listCard : ''}`}>
      <Link to={`/products/${product.slug || product._id}`} className={styles.imageWrapper}>
        <img
          src={product.images?.[0]?.url || '/placeholder.png'}
          alt={product.name}
          loading="lazy"
          className={styles.productImage}
        />
        {discountPercentage > 0 && (
          <span className={styles.discountBadge}>{discountPercentage}% OFF</span>
        )}
        {product.stock === 0 && <div className={styles.outOfStock}>Out of Stock</div>}
        <div className={styles.quickActions}>
          <button onClick={handleAddToWishlist} className={styles.iconBtn} title="Add to Wishlist">
            <FiHeart />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/products/${product.slug || product._id}`);
            }}
            className={styles.iconBtn}
            title="Quick View"
          >
            <FiEye />
          </button>
        </div>
      </Link>

      <div className={styles.cardBody}>
        <Link to={`/products/${product.slug || product._id}`} className={styles.productName}>
          {product.name}
        </Link>

        {product.rating > 0 && (
          <div className={styles.rating}>
            <span className={styles.stars}>★</span>
            <span>{product.rating.toFixed(1)}</span>
            <span className={styles.reviewCount}>({product.numReviews || 0})</span>
          </div>
        )}

        <div className={styles.priceSection}>
          {product.discountPrice ? (
            <>
              <span className={styles.discountPrice}>Rs. {product.discountPrice}</span>
              <span className={styles.originalPrice}>Rs. {product.price}</span>
            </>
          ) : (
            <span className={styles.price}>Rs. {product.price}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={styles.addToCartBtn}
        >
          <FiShoppingCart />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
