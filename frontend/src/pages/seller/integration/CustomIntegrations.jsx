import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiLink, FiPlus, FiExternalLink, FiCheck, FiLoader, FiTrash2 } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchIntegrations, createIntegration, deleteIntegration, requestCustomIntegration } from '../../../redux/slices/sellerSlice';
import styles from './CustomIntegrations.module.css';

const INTEGRATION_ICONS = {
  shopify: '🛍️',
  woocommerce: '🛒',
  quickbooks: '📊',
  salesforce: '☁️',
  hubspot: '🔶',
  mailchimp: '📧',
  zapier: '⚡',
  slack: '💬',
  stripe: '💳',
  custom: '🔧',
};

const CustomIntegrations = () => {
  const dispatch = useDispatch();
  const { integrations, integrationsLoading } = useSelector((state) => state.seller);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  const handleRequestIntegration = async () => {
    if (!requestName.trim()) {
      toast.error('Please enter integration name');
      return;
    }
    setRequesting(true);
    try {
      await dispatch(requestCustomIntegration({
        name: requestName,
        description: requestDescription,
        requirements: requestDescription,
      })).unwrap();
      toast.success('Integration request submitted! Our team will contact you within 24 hours.');
      setShowRequestModal(false);
      setRequestName('');
      setRequestDescription('');
    } catch (error) {
      toast.error(error || 'Failed to submit request');
    } finally {
      setRequesting(false);
    }
  };

  const handleConnect = async (type, name) => {
    try {
      await dispatch(createIntegration({
        name,
        type: type.toLowerCase(),
        description: `${name} integration`,
      })).unwrap();
      toast.success(`${name} integration request submitted!`);
    } catch (error) {
      toast.error(error || 'Failed to connect');
    }
  };

  const handleDelete = async (integrationId) => {
    if (!window.confirm('Are you sure you want to remove this integration?')) return;
    try {
      await dispatch(deleteIntegration(integrationId)).unwrap();
      toast.success('Integration removed');
    } catch (error) {
      toast.error(error || 'Failed to remove integration');
    }
  };

  if (integrationsLoading) {
    return (
      <FeatureGuard featureKey="customIntegrations">
        <div className={styles.customIntegrations}>
          <div className={styles.loading}>
            <FiLoader className={styles.spinner} />
            <p>Loading integrations...</p>
          </div>
        </div>
      </FeatureGuard>
    );
  }

  return (
    <FeatureGuard featureKey="customIntegrations">
      <div className={styles.customIntegrations}>
        <div className={styles.header}>
          <div>
            <h1>Custom Integrations</h1>
            <p>Build custom integrations with our development team</p>
          </div>
          <button onClick={() => setShowRequestModal(true)} className={styles.requestBtn}>
            <FiPlus /> Request Integration
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Your Integrations</h2>
            {integrations.length === 0 ? (
              <div className={styles.emptyState}>
                <FiLink />
                <p>No integrations yet</p>
                <span>Connect your first integration or request a custom one</span>
              </div>
            ) : (
              <div className={styles.integrationsList}>
                {integrations.map((integration) => (
                  <div key={integration._id} className={styles.integrationCard}>
                    <div className={styles.integrationIcon}>
                      {INTEGRATION_ICONS[integration.type] || '🔧'}
                    </div>
                    <div className={styles.integrationInfo}>
                      <h3>{integration.name}</h3>
                      <p>{integration.description}</p>
                    </div>
                    <div className={styles.integrationActions}>
                      <span className={`${styles.statusBadge} ${styles[integration.status]}`}>
                        {integration.status === 'active' && <FiCheck />}
                        {integration.status}
                      </span>
                      <button 
                        onClick={() => handleDelete(integration._id)} 
                        className={styles.deleteBtn}
                        title="Remove integration"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Popular Integrations</h2>
            <div className={styles.popularGrid}>
              {[
                { name: 'Salesforce', type: 'salesforce' },
                { name: 'HubSpot', type: 'hubspot' },
                { name: 'Mailchimp', type: 'mailchimp' },
                { name: 'Zapier', type: 'zapier' },
                { name: 'Slack', type: 'slack' },
                { name: 'Stripe', type: 'stripe' },
              ].map((item) => (
                <div key={item.name} className={styles.popularCard}>
                  <div className={styles.popularIcon}>{INTEGRATION_ICONS[item.type]}</div>
                  <h4>{item.name}</h4>
                  <button 
                    onClick={() => handleConnect(item.type, item.name)} 
                    className={styles.connectBtn}
                  >
                    <FiExternalLink /> Connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoSection}>
            <FiLink className={styles.infoIcon} />
            <div>
              <h3>Need a Custom Integration?</h3>
              <p>Our development team can build custom integrations tailored to your business needs. Contact us to discuss your requirements.</p>
              <button onClick={() => setShowRequestModal(true)} className={styles.contactBtn}>
                Contact Development Team
              </button>
            </div>
          </div>
        </div>

        {showRequestModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Request Custom Integration</h2>
              <div className={styles.formGroup}>
                <label>Integration Name</label>
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="e.g., Custom CRM Integration"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description & Requirements</label>
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Describe what you need this integration to do..."
                  rows={4}
                />
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowRequestModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button 
                  onClick={handleRequestIntegration} 
                  className={styles.submitBtn}
                  disabled={requesting}
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default CustomIntegrations;
