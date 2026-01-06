import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSellers, verifySeller } from '../../../redux/slices/adminSlice';
import { FiSearch, FiFilter, FiEye, FiCheck, FiX, FiMoreVertical } from 'react-icons/fi';
import styles from './SellerList.module.css';

const SellerList = () => {
  const dispatch = useDispatch();
  const { sellers, loading } = useSelector((state) => state.admin);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = { page: currentPage, limit: 20 };
    if (activeTab !== 'all') params.status = activeTab;
    if (searchTerm) params.search = searchTerm;
    dispatch(fetchSellers(params));
  }, [dispatch, activeTab, currentPage, searchTerm]);

  const handleVerify = async (id, status) => {
    await dispatch(verifySeller({ id, status }));
    dispatch(fetchSellers({ page: currentPage, status: activeTab !== 'all' ? activeTab : undefined }));
  };

  const tabs = [
    { id: 'all', label: 'All Sellers' },
    { id: 'pending', label: 'Pending', badge: sellers?.filter(s => s.businessInfo?.verificationStatus === 'pending').length },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const filteredSellers = sellers || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Seller Management</h1>
          <p>Manage and verify seller accounts</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
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
            placeholder="Search sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.filterButton}>
          <FiFilter /> Filters
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading sellers...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Business Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Products</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map((seller) => (
                <tr key={seller._id}>
                  <td>
                    <div className={styles.sellerInfo}>
                      <div className={styles.avatar}>
                        {seller.firstName?.[0]}{seller.lastName?.[0]}
                      </div>
                      <div>
                        <p className={styles.sellerName}>{seller.firstName} {seller.lastName}</p>
                        <p className={styles.sellerId}>ID: {seller._id?.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>{seller.businessInfo?.businessName || 'N/A'}</td>
                  <td>{seller.email}</td>
                  <td>
                    <span className={`${styles.status} ${styles[seller.businessInfo?.verificationStatus || 'pending']}`}>
                      {seller.businessInfo?.verificationStatus || 'pending'}
                    </span>
                  </td>
                  <td>{seller.productsCount || 0}</td>
                  <td>{new Date(seller.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/sellers/${seller._id}`} className={styles.actionBtn}>
                        <FiEye />
                      </Link>
                      {seller.businessInfo?.verificationStatus === 'pending' && (
                        <>
                          <button
                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                            onClick={() => handleVerify(seller._id, 'approved')}
                          >
                            <FiCheck />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                            onClick={() => handleVerify(seller._id, 'rejected')}
                          >
                            <FiX />
                          </button>
                        </>
                      )}
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
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SellerList;
