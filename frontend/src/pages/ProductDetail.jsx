import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FiHeart, FiMinus, FiPlus, FiTruck, FiShield } from 'react-icons/fi';
import { fetchProductBySlug, clearSingleProduct } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist } from '../redux/slices/userSlice';
import ProductCard from '../components/product/ProductCard.jsx';
import styles from '../styles/ProductDetail.module.css';

const TABS = ['description', 'specifications', 'reviews', 'shipping'];

const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { singleProduct: product, relatedProducts, status } = useSelector((state) => state.product);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    return () => {
      dispatch(clearSingleProduct());
    };
  }, [dispatch, slug]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [product?._id]);

  const productTitle = useMemo(
    () =>
      product?.name?.trim() ||
      product?.title?.trim() ||
      product?.metaTitle?.trim() ||
      'Product',
    [product]
  );

  const images = useMemo(() => product?.images || [], [product]);

  const handleQuantityChange = (type) => {
    if (type === 'inc') {
      setQuantity((prev) => Math.min(prev + 1, product?.stock || prev + 1));
    } else {
      setQuantity((prev) => Math.max(1, prev - 1));
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({ productId: product._id, quantity }));
  };

  const handleWishlist = () => {
    if (!product) return;
    dispatch(addToWishlist(product._id));
  };

  if (status === 'loading' || !product) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading product...</p>
      </div>
    );
  }

  return (
    <div className={styles.productDetailContainer}>
      <div className={styles.topSection}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            <img src={images[activeImage]?.url || '/placeholder.png'} alt={productTitle} />
          </div>
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, index) => (
                <button
                  key={img.public_id || index}
                  className={`${styles.thumbnailBtn} ${index === activeImage ? styles.active : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={img.url} alt={`${productTitle}-${index}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.infoSection}>
          <p className={styles.breadcrumb}>Home / {product.category?.name || 'Catalog'}</p>
          <h1 className={styles.title}>{productTitle}</h1>
          <p className={styles.brand}>Brand: {product.brand || 'NovaMart'}</p>

          {product.rating > 0 && (
            <div className={styles.rating}>
              <span className={styles.stars}>★ {product.rating.toFixed(1)}</span>
              <span>({product.numReviews} reviews)</span>
            </div>
          )}

          <div className={styles.priceBox}>
            <div>
              <span className={styles.currentPrice}>
                Rs. {product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <>
                  <span className={styles.oldPrice}>Rs. {product.price}</span>
                  <span className={styles.badge}>
                    -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>
            <p className={product.stock > 0 ? styles.inStock : styles.outOfStock}>
              {product.stock > 0 ? `${product.stock} items available` : 'Out of stock'}
            </p>
          </div>

          <p className={styles.shortDesc}>{product.shortDescription || product.description?.slice(0, 160)}</p>

          <div className={styles.actions}>
            <div className={styles.quantityControl}>
              <button onClick={() => handleQuantityChange('dec')} disabled={quantity === 1}>
                <FiMinus />
              </button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange('inc')} disabled={quantity === product.stock}>
                <FiPlus />
              </button>
            </div>
            <button
              className={styles.addToCartBtn}
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            <button className={styles.wishlistBtn} onClick={handleWishlist}>
              <FiHeart />
            </button>
          </div>

          <div className={styles.metaInfo}>
            <div>
              <FiTruck />
              <div>
                <strong>Fast Shipping</strong>
                <p>Free delivery on orders above Rs. 5,000</p>
              </div>
            </div>
            <div>
              <FiShield />
              <div>
                <strong>Secure Checkout</strong>
                <p>SSL encrypted payments & buyer protection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabsSection}>
        <div className={styles.tabButtons}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? styles.active : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'description' && (
            <p>{product.description || 'No description available.'}</p>
          )}

          {activeTab === 'specifications' && (
            <table className={styles.specTable}>
              <tbody>
                {Object.entries(product.specifications || {}).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{Array.isArray(value) ? value.join(', ') : value}</td>
                  </tr>
                ))}
                {!product.specifications && (
                  <tr>
                    <td colSpan="2">Specifications not provided.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'reviews' && (
            <div className={styles.reviewsList}>
              {product.reviews?.length ? (
                product.reviews.map((review) => (
                  <article key={review._id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div>
                        <strong>
                          {review.user?.firstName} {review.user?.lastName}
                        </strong>
                        <p>{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={styles.reviewRating}>★ {review.rating}</span>
                    </div>
                    {review.title && <h4>{review.title}</h4>}
                    <p>{review.comment}</p>
                  </article>
                ))
              ) : (
                <p>No reviews yet. Be the first to review this product!</p>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <ul className={styles.shippingInfo}>
              <li>Standard delivery within 3-5 business days.</li>
              <li>Next-day delivery available in major cities.</li>
              <li>Free returns within 7 days of delivery.</li>
              <li>Cash on Delivery (COD) available on orders under Rs. 20,000.</li>
            </ul>
          )}
        </div>
      </div>

      {relatedProducts?.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.sectionHeader}>
            <h2>Related Products</h2>
            <p>Customers also viewed</p>
          </div>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
