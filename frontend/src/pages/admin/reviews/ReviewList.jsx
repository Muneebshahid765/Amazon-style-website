import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviews, updateReviewStatus, deleteReview } from '../../../redux/slices/adminSlice';
import { FiSearch, FiStar, FiCheck, FiX, FiTrash2, FiEye } from 'react-icons/fi';
import styles from './ReviewList.module.css';

const ReviewList = () => {
  const dispatch = useDispatch();
  const { reviews, reviewStatusCounts, loading, pagination } = useSelector((state) => state.admin);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (activeTab !== 'all') params.status = activeTab;
    if (searchTerm) params.search = searchTerm;
    dispatch(fetchReviews(params));
  }, [dispatch, activeTab, currentPage, searchTerm]);

  const handleStatusChange = async (id, status) => {
    await dispatch(updateReviewStatus({ id, status }));
    dispatch(fetchReviews({ page: currentPage, status: activeTab !== 'all' ? activeTab : undefined }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await dispatch(deleteReview(id));
    }
  };

  const tabs = [
    { id: 'all', label: 'All Reviews' },
    { id: 'pending', label: 'Pending', badge: reviewStatusCounts.pending || 0 },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar key={i} className={i < rating ? styles.starFilled : styles.starEmpty} />
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Review Management</h1>
          <p>Moderate and manage customer reviews</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
          >
            {tab.label}
            {tab.badge > 0 && <span className={styles.tabBadge}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading reviews...</div>
      ) : (
        <div className={styles.reviewsGrid}>
          {reviews.map((review) => (
            <div key={review._id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className={styles.userName}>{review.user?.firstName} {review.user?.lastName}</p>
                    <p className={styles.userEmail}>{review.user?.email}</p>
                  </div>
                </div>
                <div className={styles.rating}>{renderStars(review.rating)}</div>
              </div>

              <div className={styles.productInfo}>
                <img
                  src={review.product?.images?.[0]?.url || '/placeholder.png'}
                  alt={review.product?.title}
                  className={styles.productImage}
                />
                <span className={styles.productName}>{review.product?.title}</span>
              </div>

              {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
              <p className={styles.reviewComment}>{review.comment}</p>

              <div className={styles.reviewFooter}>
                <span className={`${styles.status} ${styles[review.status]}`}>{review.status}</span>
                <span className={styles.date}>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>

              <div className={styles.actions}>
                {review.status === 'pending' && (
                  <>
                    <button
                      className={`${styles.actionBtn} ${styles.approveBtn}`}
                      onClick={() => handleStatusChange(review._id, 'approved')}
                      title="Approve"
                    >
                      <FiCheck />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.rejectBtn}`}
                      onClick={() => handleStatusChange(review._id, 'rejected')}
                      title="Reject"
                    >
                      <FiX />
                    </button>
                  </>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.viewBtn}`}
                  onClick={() => setSelectedReview(review)}
                  title="View Details"
                >
                  <FiEye />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(review._id)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className={styles.empty}>No reviews found</div>
          )}
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
        <span className={styles.pageInfo}>Page {currentPage} of {pagination.totalPages}</span>
        <button
          disabled={currentPage >= pagination.totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>

      {selectedReview && (
        <div className={styles.modal} onClick={() => setSelectedReview(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Review Details</h3>
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <label>Customer</label>
                <p>{selectedReview.user?.firstName} {selectedReview.user?.lastName} ({selectedReview.user?.email})</p>
              </div>
              <div className={styles.modalSection}>
                <label>Product</label>
                <p>{selectedReview.product?.title}</p>
              </div>
              <div className={styles.modalSection}>
                <label>Rating</label>
                <div className={styles.rating}>{renderStars(selectedReview.rating)}</div>
              </div>
              {selectedReview.title && (
                <div className={styles.modalSection}>
                  <label>Title</label>
                  <p>{selectedReview.title}</p>
                </div>
              )}
              <div className={styles.modalSection}>
                <label>Comment</label>
                <p>{selectedReview.comment}</p>
              </div>
              <div className={styles.modalSection}>
                <label>Verified Purchase</label>
                <p>{selectedReview.verifiedPurchase ? 'Yes' : 'No'}</p>
              </div>
              <div className={styles.modalSection}>
                <label>Date</label>
                <p>{new Date(selectedReview.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setSelectedReview(null)} className={styles.closeBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
