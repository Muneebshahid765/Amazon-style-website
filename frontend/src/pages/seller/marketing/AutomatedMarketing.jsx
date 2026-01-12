import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiMail, FiSend, FiUsers, FiTrendingUp, FiCalendar, FiPlus, FiLoader, FiEdit2, FiTrash2, FiPause, FiPlay } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchMarketingCampaigns, createCampaign } from '../../../redux/slices/sellerSlice';
import styles from './AutomatedMarketing.module.css';

const AutomatedMarketing = () => {
  const dispatch = useDispatch();
  const { marketingCampaigns, marketingStats, loading } = useSelector((state) => state.seller);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('email');
  const [campaignTemplate, setCampaignTemplate] = useState('custom');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchMarketingCampaigns());
  }, [dispatch]);

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    setCreating(true);
    try {
      await dispatch(createCampaign({
        name: campaignName,
        type: campaignType,
        template: campaignTemplate,
      })).unwrap();
      toast.success('Campaign created successfully!');
      setShowCreateModal(false);
      setCampaignName('');
      setCampaignType('email');
      setCampaignTemplate('custom');
    } catch (error) {
      toast.error(error || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleUseTemplate = (template) => {
    setCampaignTemplate(template);
    setCampaignName(template.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <FeatureGuard featureKey="automatedMarketing">
        <div className={styles.automatedMarketing}>
          <div className={styles.loading}>
            <FiLoader className={styles.spinner} />
            <p>Loading marketing data...</p>
          </div>
        </div>
      </FeatureGuard>
    );
  }

  const stats = marketingStats || {
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    conversion: 0
  };

  const campaigns = marketingCampaigns || [];

  return (
    <FeatureGuard featureKey="automatedMarketing">
      <div className={styles.automatedMarketing}>
        <div className={styles.header}>
          <div>
            <h1>Automated Marketing</h1>
            <p>Email campaigns and automated promotions</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className={styles.createBtn}>
            <FiPlus /> Create Campaign
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#3b82f6' }}>
                <FiMail />
              </div>
              <div className={styles.statContent}>
                <h3>Total Sent</h3>
                <div className={styles.statValue}>{Number(stats.totalSent || 0).toLocaleString()}</div>
                <span className={styles.statChange}>All campaigns</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#10b981' }}>
                <FiSend />
              </div>
              <div className={styles.statContent}>
                <h3>Open Rate</h3>
                <div className={styles.statValue}>{stats.openRate || 0}%</div>
                <span className={styles.statChange}>Average across campaigns</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#8b5cf6' }}>
                <FiUsers />
              </div>
              <div className={styles.statContent}>
                <h3>Click Rate</h3>
                <div className={styles.statValue}>{stats.clickRate || 0}%</div>
                <span className={styles.statChange}>Average across campaigns</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#f59e0b' }}>
                <FiTrendingUp />
              </div>
              <div className={styles.statContent}>
                <h3>Conversion</h3>
                <div className={styles.statValue}>{stats.conversion || 0}%</div>
                <span className={styles.statChange}>Average across campaigns</span>
              </div>
            </div>
          </div>

          <div className={styles.campaignsSection}>
            <h2>Active Campaigns</h2>
            <div className={styles.campaignsList}>
              {campaigns.length > 0 ? campaigns.map((campaign) => (
                <div key={campaign._id} className={styles.campaignCard}>
                  <div className={styles.campaignHeader}>
                    <div>
                      <h3>{campaign.name}</h3>
                      <span className={styles.campaignType}>{campaign.type}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className={styles.campaignStats}>
                    <div className={styles.campaignStat}>
                      <span>Sent</span>
                      <strong>{(campaign.stats?.sent || 0).toLocaleString()}</strong>
                    </div>
                    <div className={styles.campaignStat}>
                      <span>Opened</span>
                      <strong>{(campaign.stats?.opened || 0).toLocaleString()}</strong>
                    </div>
                    <div className={styles.campaignStat}>
                      <span>Clicked</span>
                      <strong>{(campaign.stats?.clicked || 0).toLocaleString()}</strong>
                    </div>
                    <div className={styles.campaignStat}>
                      <span>Rate</span>
                      <strong>{campaign.stats?.sent > 0 ? ((campaign.stats.clicked / campaign.stats.sent) * 100).toFixed(1) : 0}%</strong>
                    </div>
                  </div>

                  <div className={styles.campaignActions}>
                    <button className={styles.actionBtn}><FiEdit2 /> Edit</button>
                    <button className={styles.actionBtn}>
                      {campaign.status === 'active' ? <><FiPause /> Pause</> : <><FiPlay /> Resume</>}
                    </button>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>
                  <FiMail />
                  <p>No campaigns created yet</p>
                  <span>Create your first campaign to start engaging with customers</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.templatesSection}>
            <h2>Campaign Templates</h2>
            <div className={styles.templatesGrid}>
              <div className={styles.templateCard}>
                <FiMail />
                <h3>Welcome Email</h3>
                <p>Greet new customers</p>
                <button onClick={() => handleUseTemplate('welcome')}>Use Template</button>
              </div>
              <div className={styles.templateCard}>
                <FiCalendar />
                <h3>Seasonal Sale</h3>
                <p>Promote seasonal offers</p>
                <button onClick={() => handleUseTemplate('seasonal_sale')}>Use Template</button>
              </div>
              <div className={styles.templateCard}>
                <FiTrendingUp />
                <h3>Product Launch</h3>
                <p>Announce new products</p>
                <button onClick={() => handleUseTemplate('product_launch')}>Use Template</button>
              </div>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Create Campaign</h2>
              <div className={styles.formGroup}>
                <label>Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer Sale Campaign"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Campaign Type</label>
                <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Template</label>
                <select value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)}>
                  <option value="custom">Custom</option>
                  <option value="welcome">Welcome Email</option>
                  <option value="seasonal_sale">Seasonal Sale</option>
                  <option value="product_launch">Product Launch</option>
                  <option value="abandoned_cart">Abandoned Cart</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowCreateModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button 
                  onClick={handleCreateCampaign} 
                  className={styles.submitBtn}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default AutomatedMarketing;
