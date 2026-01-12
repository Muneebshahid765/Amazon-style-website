import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUpload, FiEdit, FiTrash2, FiDownload, FiAlertCircle } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { bulkUpdateStock, bulkUpdatePrices } from '../../../redux/slices/sellerSlice';
import styles from './BulkOperations.module.css';

const BulkOperations = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('stock');
  const [csvFile, setCsvFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        
        const data = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });

        setBulkData(data);
        toast.success(`Loaded ${data.length} products from CSV`);
      } catch (error) {
        toast.error('Failed to parse CSV file');
        console.error(error);
      }
    };
    
    reader.readAsText(file);
  };

  const handleBulkStockUpdate = async () => {
    if (bulkData.length === 0) {
      toast.error('No data to process');
      return;
    }

    setProcessing(true);
    try {
      const updates = bulkData.map(item => ({
        productId: item.productId || item.id,
        stock: parseInt(item.stock, 10),
      })).filter(u => u.productId && !isNaN(u.stock));

      await dispatch(bulkUpdateStock(updates)).unwrap();
      toast.success(`Updated stock for ${updates.length} products`);
      setBulkData([]);
      setCsvFile(null);
    } catch (error) {
      toast.error(error || 'Failed to update stock');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (bulkData.length === 0) {
      toast.error('No data to process');
      return;
    }

    setProcessing(true);
    try {
      const updates = bulkData.map(item => ({
        productId: item.productId || item.id,
        price: parseFloat(item.price),
      })).filter(u => u.productId && !isNaN(u.price));

      await dispatch(bulkUpdatePrices(updates)).unwrap();
      toast.success(`Updated prices for ${updates.length} products`);
      setBulkData([]);
      setCsvFile(null);
    } catch (error) {
      toast.error(error || 'Failed to update prices');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = (type) => {
    let csvContent = '';
    
    if (type === 'stock') {
      csvContent = 'productId,stock\n';
      csvContent += 'example-id-1,100\n';
      csvContent += 'example-id-2,50\n';
    } else if (type === 'price') {
      csvContent = 'productId,price\n';
      csvContent += 'example-id-1,29.99\n';
      csvContent += 'example-id-2,49.99\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-${type}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <FeatureGuard featureKey="bulkOperations">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Bulk Operations</h1>
            <p>Update multiple products at once using CSV files</p>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'stock' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <FiEdit /> Bulk Stock Update
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'price' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('price')}
          >
            <FiEdit /> Bulk Price Update
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.infoCard}>
            <FiAlertCircle />
            <div>
              <h3>How it works</h3>
              <ol>
                <li>Download the CSV template for your operation</li>
                <li>Fill in your product IDs and new values</li>
                <li>Upload the completed CSV file</li>
                <li>Review and confirm the changes</li>
              </ol>
            </div>
          </div>

          <div className={styles.actionCard}>
            <div className={styles.templateSection}>
              <h3>Step 1: Download Template</h3>
              <button
                className={styles.downloadBtn}
                onClick={() => downloadTemplate(activeTab)}
              >
                <FiDownload /> Download {activeTab === 'stock' ? 'Stock' : 'Price'} Template
              </button>
            </div>

            <div className={styles.uploadSection}>
              <h3>Step 2: Upload CSV</h3>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  id="csv-upload"
                  className={styles.fileInput}
                />
                <label htmlFor="csv-upload" className={styles.uploadLabel}>
                  <FiUpload />
                  <span>{csvFile ? csvFile.name : 'Choose CSV file'}</span>
                </label>
              </div>
            </div>

            {bulkData.length > 0 && (
              <div className={styles.previewSection}>
                <h3>Step 3: Preview & Confirm</h3>
                <div className={styles.previewTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>{activeTab === 'stock' ? 'New Stock' : 'New Price'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.productId || item.id}</td>
                          <td>{activeTab === 'stock' ? item.stock : `$${item.price}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkData.length > 10 && (
                    <p className={styles.moreRows}>
                      ...and {bulkData.length - 10} more products
                    </p>
                  )}
                </div>

                <button
                  className={styles.processBtn}
                  onClick={activeTab === 'stock' ? handleBulkStockUpdate : handleBulkPriceUpdate}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Update ${bulkData.length} Products`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default BulkOperations;
