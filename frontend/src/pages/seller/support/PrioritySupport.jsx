import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiHeadphones, FiMessageCircle, FiPhone, FiMail, FiClock, FiSend } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import styles from './PrioritySupport.module.css';

const PrioritySupport = () => {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'technical',
    priority: 'high',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Priority support ticket created! Our team will respond within 1 hour.');
      setTicketForm({
        subject: '',
        category: 'technical',
        priority: 'high',
        description: '',
      });
    } catch (error) {
      toast.error('Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <FeatureGuard featureKey="prioritySupport">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Priority Support</h1>
            <p>Get fast, dedicated support from our expert team</p>
          </div>
          <div className={styles.badge}>
            <FiHeadphones />
            <span>24/7 Available</span>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.supportChannels}>
            <h2>Contact Channels</h2>
            <div className={styles.channelsGrid}>
              <div className={styles.channelCard}>
                <div className={styles.channelIcon}>
                  <FiMessageCircle />
                </div>
                <h3>Live Chat</h3>
                <p>Instant responses from our support team</p>
                <button className={styles.channelBtn}>Start Chat</button>
              </div>

              <div className={styles.channelCard}>
                <div className={styles.channelIcon}>
                  <FiPhone />
                </div>
                <h3>Phone Support</h3>
                <p>Direct line to our support specialists</p>
                <a href="tel:+1-800-SUPPORT" className={styles.channelBtn}>
                  Call Now
                </a>
              </div>

              <div className={styles.channelCard}>
                <div className={styles.channelIcon}>
                  <FiMail />
                </div>
                <h3>Email Support</h3>
                <p>Detailed assistance via email</p>
                <a href="mailto:priority@support.com" className={styles.channelBtn}>
                  Send Email
                </a>
              </div>
            </div>
          </div>

          <div className={styles.ticketSection}>
            <div className={styles.ticketHeader}>
              <h2>Create Priority Ticket</h2>
              <div className={styles.responseTime}>
                <FiClock />
                <span>Response within 1 hour</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.ticketForm}>
              <div className={styles.formGroup}>
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={ticketForm.subject}
                  onChange={handleChange}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select name="category" value={ticketForm.category} onChange={handleChange}>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="account">Account Management</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Priority *</label>
                  <select name="priority" value={ticketForm.priority} onChange={handleChange}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  name="description"
                  value={ticketForm.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about your issue..."
                  rows="6"
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Submitting...' : (
                  <>
                    <FiSend /> Submit Priority Ticket
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={styles.benefitsSection}>
            <h2>Priority Support Benefits</h2>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>⚡</div>
                <h3>1-Hour Response Time</h3>
                <p>Get answers to your questions within 60 minutes, guaranteed</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>👨‍💼</div>
                <h3>Dedicated Support Agent</h3>
                <p>Work with the same expert who understands your business</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>🎯</div>
                <h3>Priority Queue</h3>
                <p>Your tickets are handled before standard support requests</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>📞</div>
                <h3>Direct Phone Line</h3>
                <p>Skip the queue with direct access to senior support staff</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default PrioritySupport;
