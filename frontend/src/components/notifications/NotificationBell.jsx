import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../redux/slices/notificationSlice.js';
import {
  FiBell,
  FiCheck,
  FiClock,
  FiTrash2,
  FiExternalLink,
  FiInbox,
  FiRefreshCw,
} from 'react-icons/fi';
import styles from './NotificationBell.module.css';

const ICON_PROPS = {
  size: 18,
};

const mapTypeToIconClass = (type) => {
  switch (type) {
    case 'order':
      return styles.iconOrder;
    case 'promotion':
      return styles.iconPromotion;
    case 'payment':
      return styles.iconPayment;
    case 'shipping':
      return styles.iconShipping;
    case 'review':
      return styles.iconReview;
    default:
      return styles.iconSystem;
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Abhi';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min pehle`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ghante pehle`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} din pehle`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} haftay pehle`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mah pehle`;
  const years = Math.floor(days / 365);
  return `${years} saal pehle`;
};

const NotificationBell = ({ variant = 'admin' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const { items, unreadCount, loading, error, pagination } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  const canLoadMore = pagination.currentPage < pagination.totalPages;

  const handleDocumentClick = useCallback((event) => {
    if (!dropdownRef.current) return;
    if (!dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }
  }, [isOpen, user, dispatch]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isOpen, handleDocumentClick]);

  const toggleDropdown = () => {
    if (!user) return;
    setIsOpen((prev) => !prev);
  };

  const handleMarkRead = async (notificationId) => {
    if (!notificationId) return;
    try {
      await dispatch(markNotificationAsRead({ id: notificationId })).unwrap();
    } catch (err) {
      console.error('Mark read fail:', err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
    } catch (err) {
      console.error('Mark all read fail:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!notificationId) return;
    try {
      await dispatch(deleteNotification({ id: notificationId })).unwrap();
    } catch (err) {
      console.error('Delete notification fail:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await dispatch(clearAllNotifications()).unwrap();
    } catch (err) {
      console.error('Clear notifications fail:', err);
    }
  };

  const handleLoadMore = async () => {
    if (!canLoadMore) return;
    try {
      await dispatch(
        fetchNotifications({
          page: pagination.currentPage + 1,
          limit: pagination.limit,
          append: true,
        })
      ).unwrap();
    } catch (err) {
      console.error('Load more notifications fail:', err);
    }
  };

  const handleNavigate = async (notification) => {
    if (!notification?.link) return;

    if (notification.link.startsWith('http')) {
      window.open(notification.link, '_blank', 'noopener');
    } else {
      navigate(notification.link);
    }

    if (!notification.readAt) {
      await handleMarkRead(notification._id);
    }
    setIsOpen(false);
  };

  const buttonClass = useMemo(() => {
    if (variant === 'seller') {
      return `${styles.bellButton} ${styles.sellerButton}`;
    }
    return styles.bellButton;
  }, [variant]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button className={buttonClass} onClick={toggleDropdown} aria-label="Notifications">
        <FiBell {...ICON_PROPS} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div>
              <h4>Notifications</h4>
              <small style={{ color: '#94a3b8' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'Sab parhe ja chuke'}
              </small>
            </div>
            <div className={styles.headerActions}>
              <button onClick={handleMarkAll} disabled={loading || unreadCount === 0}>
                <FiCheck size={14} /> Mark all
              </button>
              <button onClick={handleClearAll} disabled={loading || items.length === 0}>
                <FiTrash2 size={14} /> Clear
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.list}>
            {loading && items.length === 0 && (
              <div className={styles.loader}>
                <FiRefreshCw className={styles.loaderIcon} />
                <span style={{ marginLeft: '0.35rem' }}>Load ho raha hai...</span>
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className={styles.emptyState}>
                <FiInbox size={36} />
                <p>Koi notification nahi mila</p>
              </div>
            )}

            {items.map((notification) => (
              <article
                key={notification._id}
                className={`${styles.item} ${!notification.readAt ? styles.itemUnread : ''}`}
              >
                <div className={`${styles.icon} ${mapTypeToIconClass(notification.type)}`}>
                  <FiBell size={16} />
                </div>
                <div className={styles.content}>
                  <h5>{notification.title}</h5>
                  <p>{notification.message}</p>
                  <div className={styles.time}>
                    <FiClock size={12} style={{ marginRight: 4 }} />
                    {formatTimeAgo(notification.createdAt)}
                  </div>
                </div>
                <div className={styles.actions}>
                  {notification.link && (
                    <button
                      type="button"
                      onClick={() => handleNavigate(notification)}
                      title="Open"
                      aria-label="Open notification link"
                    >
                      <FiExternalLink size={16} />
                    </button>
                  )}
                  {!notification.readAt && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification._id)}
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <FiCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(notification._id)}
                    title="Delete"
                    aria-label="Delete notification"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {canLoadMore && (
            <div className={styles.footer}>
              <button className={styles.loadMore} onClick={handleLoadMore} disabled={loading}>
                {loading ? (
                  <>
                    <FiRefreshCw className={styles.loaderIcon} size={14} />
                    <span style={{ marginLeft: 6 }}>Loading...</span>
                  </>
                ) : (
                  'Load more'
                )}
              </button>
              <span>
                Page {pagination.currentPage} / {pagination.totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
