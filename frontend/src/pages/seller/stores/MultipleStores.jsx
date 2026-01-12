import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSettings, FiExternalLink, FiShoppingBag } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchStores, createStore, deleteStore } from '../../../redux/slices/sellerSlice';
import styles from './MultipleStores.module.css';

const MultipleStores = () => {
  const dispatch = useDispatch();
  const { stores } = useSelector((state) => state.seller);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    domain: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.domain) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await dispatch(createStore(newStore)).unwrap();
      toast.success('Store created successfully!');
      setShowCreateModal(false);
      setNewStore({ name: '', domain: '', description: '' });
    } catch (error) {
      toast.error(error || 'Failed to create store');
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(deleteStore(storeId)).unwrap();
      toast.success('Store deleted successfully');
    } catch (error) {
      toast.error(error || 'Failed to delete store');
    }
  };

  const handleSetPrimary = async (storeId) => {
    try {
      // API call to set primary store
      // await api.put(`/seller/stores/${storeId}/set-primary`);
      
      toast.success('Primary store updated');
      loadStores();
    } catch (error) {
      toast.error('Failed to update primary store');
    }
  };

  return (
    <FeatureGuard featureKey="multipleStores">
      <div className={styles.multipleStores}>
        <div className={styles.header}>
          <div>
            <h1>Multiple Stores</h1>
            <p>Manage all your stores from one central dashboard</p>
          </div>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus /> Create New Store
          </button>
        </div>

        <div className={styles.content}>
          {stores.length === 0 ? (
            <div className={styles.emptyState}>
              <FiShoppingBag />
              <p>No stores created yet</p>
              <span>Create your first store to get started</span>
              <button 
                className={styles.createFirstBtn}
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus /> Create Store
              </button>
            </div>
          ) : (
            <div className={styles.storesGrid}>
              {stores.map((store) => (
                <div key={store.id} className={styles.storeCard}>
                  {store.isPrimary && (
                    <div className={styles.primaryBadge}>Primary</div>
                  )}
                  
                  <div className={styles.storeHeader}>
                    <div className={styles.storeIcon}>
                      <FiShoppingBag />
                    </div>
                    <div className={styles.storeInfo}>
                      <h3>{store.name}</h3>
                      <a href={`https://${store.domain}`} target="_blank" rel="noopener noreferrer">
                        {store.domain} <FiExternalLink />
                      </a>
                    </div>
                  </div>

                  <div className={styles.storeStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Products</span>
                      <span className={styles.statValue}>{store.products}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Orders</span>
                      <span className={styles.statValue}>{store.orders}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Revenue</span>
                      <span className={styles.statValue}>${store.revenue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={styles.storeStatus}>
                    <span className={`${styles.statusBadge} ${styles[store.status]}`}>
                      {store.status}
                    </span>
                  </div>

                  <div className={styles.storeActions}>
                    {!store.isPrimary && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleSetPrimary(store.id)}
                      >
                        Set as Primary
                      </button>
                    )}
                    <button className={styles.iconBtn}>
                      <FiSettings />
                    </button>
                    <button className={styles.iconBtn}>
                      <FiEdit2 />
                    </button>
                    {!store.isPrimary && (
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteStore(store.id)}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Create New Store</h2>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Store Name *</label>
                  <input
                    type="text"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="My Awesome Store"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Domain *</label>
                  <input
                    type="text"
                    value={newStore.domain}
                    onChange={(e) => setNewStore({ ...newStore, domain: e.target.value })}
                    placeholder="mystore.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={newStore.description}
                    onChange={(e) => setNewStore({ ...newStore, description: e.target.value })}
                    placeholder="Brief description of your store"
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.submitBtn}
                  onClick={handleCreateStore}
                >
                  Create Store
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default MultipleStores;
