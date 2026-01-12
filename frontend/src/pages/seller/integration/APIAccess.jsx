import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiCopy, FiRefreshCw, FiKey, FiCode, FiBook, FiEye, FiEyeOff } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchAPIKeys, generateAPIKey, revokeAPIKey } from '../../../redux/slices/sellerSlice';
import styles from './APIAccess.module.css';

const APIAccess = () => {
  const dispatch = useDispatch();
  const { apiKeys } = useSelector((state) => state.seller);
  const [showKey, setShowKey] = useState({});
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    dispatch(fetchAPIKeys());
  }, [dispatch]);

  const generateNewKey = async () => {
    setGenerating(true);
    try {
      await dispatch(generateAPIKey({ name: 'API Key' })).unwrap();
      toast.success('New API key generated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to generate API key');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard!');
  };

  const toggleKeyVisibility = (keyId) => {
    setShowKey({
      ...showKey,
      [keyId]: !showKey[keyId],
    });
  };

  const revokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(revokeAPIKey(keyId)).unwrap();
      toast.success('API key revoked successfully');
    } catch (error) {
      toast.error(error || 'Failed to revoke API key');
    }
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  return (
    <FeatureGuard featureKey="apiAccess">
      <div className={styles.apiAccess}>
        <div className={styles.header}>
          <div>
            <h1>API Access</h1>
            <p>Integrate your store with custom applications using our REST API</p>
          </div>
          <button 
            className={styles.generateBtn}
            onClick={generateNewKey}
            disabled={generating}
          >
            <FiKey /> {generating ? 'Generating...' : 'Generate New Key'}
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Your API Keys</h2>
            {apiKeys.length === 0 ? (
              <div className={styles.emptyState}>
                <FiKey />
                <p>No API keys generated yet</p>
                <span>Generate your first API key to get started</span>
              </div>
            ) : (
              <div className={styles.keysList}>
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className={styles.keyCard}>
                    <div className={styles.keyHeader}>
                      <div className={styles.keyInfo}>
                        <h3>{apiKey.name}</h3>
                        <span className={styles.keyDate}>
                          Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.keyActions}>
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className={styles.iconBtn}
                          title={showKey[apiKey.id] ? 'Hide key' : 'Show key'}
                        >
                          {showKey[apiKey.id] ? <FiEyeOff /> : <FiEye />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className={styles.iconBtn}
                          title="Copy to clipboard"
                        >
                          <FiCopy />
                        </button>
                        <button
                          onClick={() => revokeKey(apiKey.id)}
                          className={styles.revokeBtn}
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                    <div className={styles.keyValue}>
                      <code>
                        {showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                    </div>
                    {apiKey.lastUsed && (
                      <div className={styles.keyFooter}>
                        Last used: {new Date(apiKey.lastUsed).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>API Documentation</h2>
            <div className={styles.docsGrid}>
              <div className={styles.docCard}>
                <div className={styles.docIcon}>
                  <FiBook />
                </div>
                <h3>Getting Started</h3>
                <p>Learn how to authenticate and make your first API request</p>
                <a href="#" className={styles.docLink}>
                  Read Guide →
                </a>
              </div>

              <div className={styles.docCard}>
                <div className={styles.docIcon}>
                  <FiCode />
                </div>
                <h3>API Reference</h3>
                <p>Complete reference for all available endpoints and methods</p>
                <a href="#" className={styles.docLink}>
                  View Reference →
                </a>
              </div>

              <div className={styles.docCard}>
                <div className={styles.docIcon}>
                  <FiRefreshCw />
                </div>
                <h3>Webhooks</h3>
                <p>Set up webhooks to receive real-time updates</p>
                <a href="#" className={styles.docLink}>
                  Configure Webhooks →
                </a>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Quick Start</h2>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>JavaScript</span>
                <button onClick={() => copyToClipboard(exampleCode)}>
                  <FiCopy /> Copy
                </button>
              </div>
              <pre>
                <code>{exampleCode}</code>
              </pre>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Rate Limits</h2>
            <div className={styles.limitsGrid}>
              <div className={styles.limitCard}>
                <h3>Requests per minute</h3>
                <div className={styles.limitValue}>100</div>
              </div>
              <div className={styles.limitCard}>
                <h3>Requests per day</h3>
                <div className={styles.limitValue}>10,000</div>
              </div>
              <div className={styles.limitCard}>
                <h3>Concurrent requests</h3>
                <div className={styles.limitValue}>10</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

const exampleCode = `// Initialize API client
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.yourstore.com/v1';

// Fetch products
fetch(\`\${BASE_URL}/products\`, {
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

export default APIAccess;
