import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviews, replyToReview } from '../../../redux/slices/sellerSlice';
import { FiStar, FiMessageSquare, FiFilter } from 'react-icons/fi';
import styles from './Reviews.module.css';

const Reviews = () => {
  const dispatch = useDispatch();
  const { reviews, loading } = useSelector((state) => state.seller);
  const [ratingFilter, setRatingFilter] = useState('');
  const [replyModal, setReplyModal] = useState({ show: false, reviewId: null });
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const params = {};
    if (ratingFilter) params.rating = ratingFilter;
    dispatch(fetchReviews(params));
  }, [dispatch, ratingFilter]);

  const handleReply = async () => {
    await dispatch(replyToReview({ id: replyModal.reviewId, reply: replyText }));
    setReplyModal({ show: false, reviewId: null });
    setReplyText('');
    dispatch(fetchReviews({}));
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar key={i} className={i < rating ? styles.starFilled : styles.starEmpty} />
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1>Customer Reviews</h1><p>Manage and respond to customer feedback</p></div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{reviews?.length || 0}</p>
          <p className={styles.statLabel}>Total Reviews</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{(reviews?.reduce((acc, r) => acc + r.rating, 0) / (reviews?.length || 1)).toFixed(1)}</p>
          <p className={styles.statLabel}>Average Rating</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{reviews?.filter(r => !r.sellerReply).length || 0}</p>
          <p className={styles.statLabel}>Pending Reply</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className={styles.select}>
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading reviews...</div>
      ) : (
        <div className={styles.reviewsList}>
          {(reviews || []).map((review) => (
            <div key={review._id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.customerInfo}>
                  <div className={styles.avatar}>{review.user?.firstName?.[0]}</div>
                  <div>
                    <p className={styles.customerName}>{review.user?.firstName} {review.user?.lastName}</p>
                    <p className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={styles.rating}>{renderStars(review.rating)}</div>
              </div>
              <div className={styles.productInfo}>
                <img src={review.product?.images?.[0]?.url || '/placeholder.png'} alt={review.product?.title} className={styles.productImg} />
                <span>{review.product?.title}</span>
              </div>
              <p className={styles.reviewText}>{review.comment}</p>
              {review.sellerReply ? (
                <div className={styles.sellerReply}>
                  <p className={styles.replyLabel}>Your Reply:</p>
                  <p className={styles.replyText}>{review.sellerReply}</p>
                </div>
              ) : (
                <button onClick={() => setReplyModal({ show: true, reviewId: review._id })} className={styles.replyBtn}>
                  <FiMessageSquare /> Reply to Review
                </button>
              )}
            </div>
          ))}
          {(!reviews || reviews.length === 0) && <div className={styles.empty}>No reviews yet</div>}
        </div>
      )}

      {replyModal.show && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Reply to Review</h3>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." rows="4" className={styles.textarea} />
            <div className={styles.modalActions}>
              <button onClick={() => setReplyModal({ show: false, reviewId: null })} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleReply} className={styles.submitBtn}>Send Reply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
