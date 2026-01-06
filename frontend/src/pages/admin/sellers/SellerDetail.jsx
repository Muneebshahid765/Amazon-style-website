import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerById, verifySeller } from '../../../redux/slices/adminSlice';
import { FiArrowLeft, FiCheck, FiX, FiMail, FiPhone, FiMapPin, FiPackage, FiDollarSign, FiStar, FiDownload } from 'react-icons/fi';
import styles from './SellerDetail.module.css';

const SellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedSeller, loading } = useSelector((state) => state.admin);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    dispatch(fetchSellerById(id));
  }, [dispatch, id]);

  const handleApprove = async () => {
    await dispatch(verifySeller({ id, status: 'approved' }));
    navigate('/admin/sellers');
  };

  const handleReject = async () => {
    await dispatch(verifySeller({ id, status: 'rejected', rejectionReason }));
    setShowRejectModal(false);
    navigate('/admin/sellers');
  };

  if (loading || !selectedSeller) {
    return <div className={styles.loading}>Loading seller details...</div>;
  }

  const seller = selectedSeller;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/sellers')}>
        <FiArrowLeft /> Back to Sellers
      </button>

      <div className={styles.header}>
        <div className={styles.sellerInfo}>
          <div className={styles.avatar}>
            {seller.firstName?.[0]}{seller.lastName?.[0]}
          </div>
          <div>
            <h1>{seller.firstName} {seller.lastName}</h1>
            <p className={styles.businessName}>{seller.businessInfo?.businessName}</p>
            <span className={`${styles.status} ${styles[seller.businessInfo?.verificationStatus]}`}>
              {seller.businessInfo?.verificationStatus}
            </span>
          </div>
        </div>
        
        {seller.businessInfo?.verificationStatus === 'pending' && (
          <div className={styles.actions}>
            <button className={styles.approveBtn} onClick={handleApprove}>
              <FiCheck /> Approve Seller
            </button>
            <button className={styles.rejectBtn} onClick={() => setShowRejectModal(true)}>
              <FiX /> Reject
            </button>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Personal Information</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <FiMail className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Email</p>
                <p className={styles.infoValue}>{seller.email}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <FiPhone className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Phone</p>
                <p className={styles.infoValue}>{seller.phone || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <FiMapPin className={styles.infoIcon} />
              <div>
                <p className={styles.infoLabel}>Address</p>
                <p className={styles.infoValue}>
                  {seller.addresses?.[0]?.street}, {seller.addresses?.[0]?.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Business Information</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div>
                <p className={styles.infoLabel}>Business Type</p>
                <p className={styles.infoValue}>{seller.businessInfo?.businessType || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div>
                <p className={styles.infoLabel}>Registration Number</p>
                <p className={styles.infoValue}>{seller.businessInfo?.registrationNumber || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div>
                <p className={styles.infoLabel}>Tax ID</p>
                <p className={styles.infoValue}>{seller.businessInfo?.taxId || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div>
                <p className={styles.infoLabel}>Category</p>
                <p className={styles.infoValue}>{seller.businessInfo?.businessCategory || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Store Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <FiPackage className={styles.statIcon} />
              <div>
                <p className={styles.statValue}>{seller.productsCount || 0}</p>
                <p className={styles.statLabel}>Products</p>
              </div>
            </div>
            <div className={styles.statItem}>
              <FiDollarSign className={styles.statIcon} />
              <div>
                <p className={styles.statValue}>${seller.totalRevenue || 0}</p>
                <p className={styles.statLabel}>Revenue</p>
              </div>
            </div>
            <div className={styles.statItem}>
              <FiStar className={styles.statIcon} />
              <div>
                <p className={styles.statValue}>{seller.rating || 0}</p>
                <p className={styles.statLabel}>Rating</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Business Documents</h3>
          <div className={styles.documentsList}>
            {seller.businessInfo?.documents?.map((doc, index) => (
              <div key={index} className={styles.documentItem}>
                <span>Document {index + 1}</span>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                  <FiDownload /> Download
                </a>
              </div>
            )) || <p className={styles.noDocuments}>No documents uploaded</p>}
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Reject Seller Application</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className={styles.textarea}
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className={styles.confirmRejectBtn} onClick={handleReject}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDetail;
