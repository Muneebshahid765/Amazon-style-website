import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiZap, FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchAIInsights } from '../../../redux/slices/sellerSlice';
import styles from './AIInsights.module.css';

const AIInsights = () => {
  const dispatch = useDispatch();
  const { aiInsights, loading } = useSelector((state) => state.seller);

  useEffect(() => {
    dispatch(fetchAIInsights());
  }, [dispatch]);

  const getIconComponent = (iconName) => {
    const icons = {
      FiTrendingUp,
      FiAlertCircle,
      FiCheckCircle,
      FiZap,
    };
    return icons[iconName] || FiZap;
  };

  if (loading) {
    return (
      <FeatureGuard featureKey="aiPoweredInsights">
        <div className={styles.aiInsights}>
          <div className={styles.loading}>Loading AI insights...</div>
        </div>
      </FeatureGuard>
    );
  }

  const insights = aiInsights?.insights || [];
  const recommendations = aiInsights?.recommendations || [];
  const predictions = aiInsights?.predictions || {};

  return (
    <FeatureGuard featureKey="aiPoweredInsights">
      <div className={styles.aiInsights}>
        <div className={styles.header}>
          <div>
            <h1><FiZap className={styles.headerIcon} /> AI-Powered Insights</h1>
            <p>Smart recommendations powered by machine learning</p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.insightsGrid}>
            {insights.map((insight) => {
              const Icon = getIconComponent(insight.icon);
              return (
                <div key={insight.id} className={`${styles.insightCard} ${styles[insight.type]}`}>
                  <div className={styles.insightHeader}>
                    <Icon className={styles.insightIcon} />
                    <span className={`${styles.impactBadge} ${styles[insight.impact]}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <h3>{insight.title}</h3>
                  <p>{insight.description}</p>
                  {insight.potentialRevenue && (
                    <div className={styles.revenue}>{insight.potentialRevenue}</div>
                  )}
                  {insight.action && (
                    <button className={styles.actionBtn}>{insight.action}</button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.section}>
            <h2>Smart Recommendations</h2>
            <div className={styles.recommendationsList}>
              {recommendations.map((rec, idx) => (
                <div key={idx} className={styles.recommendationItem}>
                  <FiZap className={styles.recIcon} />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2>Predictive Analytics</h2>
            <div className={styles.predictionsGrid}>
              <div className={styles.predictionCard}>
                <h4>Next Month Revenue</h4>
                <div className={styles.predictionValue}>${predictions.nextMonthRevenue || 0}</div>
                <div className={styles.confidence}>{predictions.confidence || 0}% confidence</div>
              </div>
              <div className={styles.predictionCard}>
                <h4>Expected Orders</h4>
                <div className={styles.predictionValue}>{predictions.nextMonthOrders || 0}</div>
                <div className={styles.confidence}>{predictions.confidence || 0}% confidence</div>
              </div>
              <div className={styles.predictionCard}>
                <h4>Churn Risk</h4>
                <div className={styles.predictionValue}>{predictions.churnRisk || 'N/A'}</div>
                <div className={styles.confidence}>Customer retention: {predictions.retentionRate || 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default AIInsights;
