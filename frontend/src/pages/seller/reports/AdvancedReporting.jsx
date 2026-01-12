import { useState } from 'react';
import { FiDownload, FiCalendar, FiFileText, FiTrendingUp, FiDollarSign, FiPackage } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import styles from './AdvancedReporting.module.css';

const AdvancedReporting = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [reportType, setReportType] = useState('sales');

  const reportTypes = [
    { key: 'sales', label: 'Sales Report', icon: FiDollarSign },
    { key: 'products', label: 'Product Performance', icon: FiPackage },
    { key: 'customers', label: 'Customer Analytics', icon: FiTrendingUp },
    { key: 'inventory', label: 'Inventory Report', icon: FiFileText },
  ];

  const handleExport = (format) => {
    // Export logic
    console.log(`Exporting ${reportType} report as ${format}`);
  };

  return (
    <FeatureGuard featureKey="advancedReporting">
      <div className={styles.advancedReporting}>
        <div className={styles.header}>
          <div>
            <h1>Advanced Reporting</h1>
            <p>Generate custom reports with export capabilities</p>
          </div>
          <div className={styles.exportActions}>
            <button onClick={() => handleExport('pdf')} className={styles.exportBtn}>
              <FiDownload /> Export PDF
            </button>
            <button onClick={() => handleExport('excel')} className={styles.exportBtn}>
              <FiDownload /> Export Excel
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                {reportTypes.map((type) => (
                  <option key={type.key} value={type.key}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <div className={styles.reportGrid}>
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div 
                  key={type.key} 
                  className={`${styles.reportCard} ${reportType === type.key ? styles.active : ''}`}
                  onClick={() => setReportType(type.key)}
                >
                  <div className={styles.reportIcon}>
                    <Icon />
                  </div>
                  <h3>{type.label}</h3>
                  <p>Detailed {type.label.toLowerCase()} with insights</p>
                </div>
              );
            })}
          </div>

          <div className={styles.reportPreview}>
            <div className={styles.previewHeader}>
              <h2>{reportTypes.find(t => t.key === reportType)?.label}</h2>
              <span className={styles.dateInfo}>
                <FiCalendar /> {dateRange === '30days' ? 'Last 30 Days' : dateRange}
              </span>
            </div>
            <div className={styles.previewContent}>
              <p>Report preview will be displayed here with charts and tables</p>
              <div className={styles.placeholder}>
                <FiFileText />
                <span>Generate report to view data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default AdvancedReporting;
