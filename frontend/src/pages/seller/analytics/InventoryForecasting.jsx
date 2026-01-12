import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrendingUp, FiAlertCircle, FiPackage, FiActivity } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchInventoryForecast } from '../../../redux/slices/sellerSlice';
import styles from './InventoryForecasting.module.css';

const InventoryForecasting = () => {
  const dispatch = useDispatch();
  const { inventoryForecast, inventoryForecastSummary, loading } = useSelector((state) => state.seller);
  const [timeframe, setTimeframe] = useState('30days');

  useEffect(() => {
    dispatch(fetchInventoryForecast({ timeframe }));
  }, [dispatch, timeframe]);

  if (loading) {
    return (
      <FeatureGuard featureKey="inventoryForecasting">
        <div className={styles.inventoryForecasting}>
          <div className={styles.loading}>Loading inventory forecast...</div>
        </div>
      </FeatureGuard>
    );
  }

  const summary = inventoryForecastSummary || {
    criticalStock: 0,
    lowStock: 0,
    optimalStock: 0,
    totalProducts: 0
  };

  return (
    <FeatureGuard featureKey="inventoryForecasting">
      <div className={styles.inventoryForecasting}>
        <div className={styles.header}>
          <div>
            <h1>Inventory Forecasting</h1>
            <p>AI-powered inventory predictions and recommendations</p>
          </div>
          <div className={styles.timeframeSelector}>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="7days">Next 7 Days</option>
              <option value="30days">Next 30 Days</option>
              <option value="90days">Next 90 Days</option>
            </select>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#ef4444' }}>
                <FiAlertCircle />
              </div>
              <div className={styles.cardContent}>
                <h3>Critical Stock</h3>
                <div className={styles.cardValue}>{summary.criticalStock}</div>
                <p>Products need immediate restock</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#f59e0b' }}>
                <FiPackage />
              </div>
              <div className={styles.cardContent}>
                <h3>Low Stock</h3>
                <div className={styles.cardValue}>{summary.lowStock}</div>
                <p>Products running low</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#10b981' }}>
                <FiTrendingUp />
              </div>
              <div className={styles.cardContent}>
                <h3>Optimal Stock</h3>
                <div className={styles.cardValue}>{summary.optimalStock}</div>
                <p>Products well-stocked</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: '#3b82f6' }}>
                <FiActivity />
              </div>
              <div className={styles.cardContent}>
                <h3>Total Products</h3>
                <div className={styles.cardValue}>{summary.totalProducts}</div>
                <p>Being tracked</p>
              </div>
            </div>
          </div>

          <div className={styles.forecastTable}>
            <h2>Product Forecasts</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Product</div>
                <div>Current Stock</div>
                <div>Predicted Demand</div>
                <div>Recommended Restock</div>
                <div>Days Until Stockout</div>
                <div>Confidence</div>
              </div>
              {inventoryForecast && inventoryForecast.length > 0 ? inventoryForecast.map((forecast) => (
                <div key={forecast.id} className={styles.tableRow}>
                  <div className={styles.productName}>{forecast.productName}</div>
                  <div>{forecast.currentStock}</div>
                  <div>{forecast.predictedDemand}</div>
                  <div className={forecast.recommendedRestock > 0 ? styles.restockNeeded : ''}>
                    {forecast.recommendedRestock > 0 ? `+${forecast.recommendedRestock}` : 'OK'}
                  </div>
                  <div className={forecast.daysUntilStockout < 14 ? styles.urgent : ''}>
                    {forecast.daysUntilStockout} days
                  </div>
                  <div>
                    <div className={styles.confidenceBadge}>
                      {forecast.confidence}%
                    </div>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>
                  <FiPackage />
                  <p>No inventory data available</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.insights}>
            <h2>AI Insights</h2>
            <div className={styles.insightsList}>
              <div className={styles.insightCard}>
                <div className={styles.insightIcon}>🤖</div>
                <div>
                  <h3>Seasonal Trend Detected</h3>
                  <p>Electronics category shows 35% increase in demand during holiday season</p>
                </div>
              </div>
              <div className={styles.insightCard}>
                <div className={styles.insightIcon}>📊</div>
                <div>
                  <h3>Restock Recommendation</h3>
                  <p>Consider restocking Product A within 5 days to avoid stockout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default InventoryForecasting;
