import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUser, FiPhone, FiMail, FiMessageCircle, FiCalendar, FiClock, FiLoader } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchAccountManager, sendMessageToManager } from '../../../redux/slices/sellerSlice';
import styles from './DedicatedAccountManager.module.css';

const DedicatedAccountManager = () => {
  const dispatch = useDispatch();
  const { accountManager, accountManagerInteractions, loading } = useSelector((state) => state.seller);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    dispatch(fetchAccountManager());
  }, [dispatch]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      await dispatch(sendMessageToManager({ message })).unwrap();
      toast.success('Message sent to your account manager!');
      setMessage('');
      dispatch(fetchAccountManager());
    } catch (error) {
      toast.error(error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <FeatureGuard featureKey="dedicatedAccountManager">
        <div className={styles.dedicatedAccountManager}>
          <div className={styles.loading}>
            <FiLoader className={styles.spinner} />
            <p>Loading account manager...</p>
          </div>
        </div>
      </FeatureGuard>
    );
  }

  const manager = accountManager || {
    name: 'Account Manager',
    title: 'Your Dedicated Support',
    email: 'support@store.com',
    phone: '+1 (555) 000-0000',
    availability: 'available',
  };

  const interactions = accountManagerInteractions || [];

  return (
    <FeatureGuard featureKey="dedicatedAccountManager">
      <div className={styles.dedicatedAccountManager}>
        <div className={styles.header}>
          <h1>Dedicated Account Manager</h1>
          <p>Your personal account manager for business support</p>
        </div>

        <div className={styles.content}>
          <div className={styles.managerCard}>
            <div className={styles.managerAvatar}>
              {manager.avatar?.url ? (
                <img src={manager.avatar.url} alt={manager.name} />
              ) : (
                <FiUser />
              )}
            </div>
            <div className={styles.managerInfo}>
              <h2>{manager.name}</h2>
              <p className={styles.managerTitle}>{manager.title}</p>
              <span className={`${styles.availability} ${styles[manager.availability]}`}>
                <span className={styles.statusDot}></span>
                {manager.availability === 'available' ? 'Available Now' : manager.availability}
              </span>
            </div>

            <div className={styles.contactMethods}>
              <a href={`mailto:${manager.email}`} className={styles.contactBtn}>
                <FiMail /> Email
              </a>
              <a href={`tel:${manager.phone}`} className={styles.contactBtn}>
                <FiPhone /> Call
              </a>
              <button className={styles.contactBtn}>
                <FiCalendar /> Schedule Meeting
              </button>
            </div>
          </div>

          <div className={styles.quickChat}>
            <h2>Quick Message</h2>
            <div className={styles.chatBox}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
              />
              <button 
                onClick={handleSendMessage} 
                className={styles.sendBtn}
                disabled={sending}
              >
                <FiMessageCircle /> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>

          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>
                <FiUser />
              </div>
              <h3>Strategic Planning</h3>
              <p>Get personalized business growth strategies</p>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>
                <FiClock />
              </div>
              <h3>Priority Response</h3>
              <p>24/7 priority support with fast response times</p>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>
                <FiCalendar />
              </div>
              <h3>Regular Check-ins</h3>
              <p>Weekly or monthly business review meetings</p>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>
                <FiMessageCircle />
              </div>
              <h3>Direct Communication</h3>
              <p>Direct line to your dedicated manager</p>
            </div>
          </div>

          <div className={styles.recentActivity}>
            <h2>Recent Interactions</h2>
            <div className={styles.activityList}>
              {interactions.length === 0 ? (
                <div className={styles.emptyState}>
                  <FiMessageCircle />
                  <p>No interactions yet</p>
                  <span>Send a message to start the conversation</span>
                </div>
              ) : (
                interactions.map((interaction, index) => {
                  const getIcon = (type) => {
                    switch (type) {
                      case 'call': return <FiPhone />;
                      case 'email': return <FiMail />;
                      case 'meeting': return <FiCalendar />;
                      default: return <FiMessageCircle />;
                    }
                  };
                  
                  const formatDate = (date) => {
                    const d = new Date(date);
                    const now = new Date();
                    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                    if (diff === 0) return 'Today';
                    if (diff === 1) return 'Yesterday';
                    if (diff < 7) return `${diff} days ago`;
                    if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? 's' : ''} ago`;
                    return d.toLocaleDateString();
                  };

                  return (
                    <div key={interaction._id || index} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        {getIcon(interaction.type)}
                      </div>
                      <div className={styles.activityContent}>
                        <h4>{interaction.type?.charAt(0).toUpperCase() + interaction.type?.slice(1) || 'Message'}</h4>
                        <p>{interaction.content || interaction.subject || 'No details'}</p>
                        <span>{formatDate(interaction.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default DedicatedAccountManager;
