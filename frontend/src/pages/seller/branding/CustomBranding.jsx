import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUpload, FiSave, FiEye, FiRefreshCw } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchStoreBranding, updateStoreBranding } from '../../../redux/slices/sellerSlice';
import styles from './CustomBranding.module.css';

const CustomBranding = () => {
  const dispatch = useDispatch();
  const { branding: storeBranding, loading } = useSelector((state) => state.seller);
  
  const [formData, setFormData] = useState({
    storeName: '',
    logo: null,
    logoPreview: '',
    banner: null,
    bannerPreview: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    tagline: '',
    description: '',
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchStoreBranding());
  }, [dispatch]);

  useEffect(() => {
    if (storeBranding) {
      setFormData(prev => ({
        ...prev,
        storeName: storeBranding.storeName || '',
        logoPreview: storeBranding.logo || '',
        bannerPreview: storeBranding.banner || '',
        primaryColor: storeBranding.primaryColor || '#3b82f6',
        secondaryColor: storeBranding.secondaryColor || '#8b5cf6',
        accentColor: storeBranding.accentColor || '#10b981',
        tagline: storeBranding.tagline || '',
        description: storeBranding.description || '',
      }));
    }
  }, [storeBranding]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setFormData({
          ...formData,
          logo: file,
          logoPreview: reader.result,
        });
      } else {
        setFormData({
          ...formData,
          banner: file,
          bannerPreview: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append('storeName', formData.storeName);
      data.append('primaryColor', formData.primaryColor);
      data.append('secondaryColor', formData.secondaryColor);
      data.append('accentColor', formData.accentColor);
      data.append('tagline', formData.tagline);
      data.append('description', formData.description);
      
      if (formData.logo) {
        data.append('logo', formData.logo);
      }
      if (formData.banner) {
        data.append('banner', formData.banner);
      }

      await dispatch(updateStoreBranding(data)).unwrap();
      toast.success('Branding settings saved successfully!');
    } catch (error) {
      toast.error(error || 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      storeName: '',
      logo: null,
      logoPreview: '',
      banner: null,
      bannerPreview: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      tagline: '',
      description: '',
    });
  };

  return (
    <FeatureGuard featureKey="customBranding">
      <div className={styles.customBranding}>
        <div className={styles.header}>
          <div>
            <h1>Custom Branding</h1>
            <p>Customize your store appearance with your brand identity</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.resetBtn} onClick={handleReset}>
              <FiRefreshCw /> Reset
            </button>
            <button className={styles.previewBtn}>
              <FiEye /> Preview
            </button>
            <button 
              className={styles.saveBtn} 
              onClick={handleSave}
              disabled={saving}
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Store Identity</h2>
            <div className={styles.formGroup}>
              <label>Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                placeholder="Enter your store name"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Your store tagline"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your store"
                rows={4}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Logo & Banner</h2>
            <div className={styles.uploadGrid}>
              <div className={styles.uploadCard}>
                <label>Store Logo</label>
                <div className={styles.uploadArea}>
                  {formData.logoPreview ? (
                    <img src={formData.logoPreview} alt="Logo preview" />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <FiUpload />
                      <span>Upload Logo</span>
                      <small>Recommended: 200x200px</small>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                  />
                </div>
              </div>

              <div className={styles.uploadCard}>
                <label>Store Banner</label>
                <div className={styles.uploadArea}>
                  {formData.bannerPreview ? (
                    <img src={formData.bannerPreview} alt="Banner preview" />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <FiUpload />
                      <span>Upload Banner</span>
                      <small>Recommended: 1200x400px</small>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Color Scheme</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorPicker}>
                <label>Primary Color</label>
                <div className={styles.colorInput}>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.colorPicker}>
                <label>Secondary Color</label>
                <div className={styles.colorInput}>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.colorPicker}>
                <label>Accent Color</label>
                <div className={styles.colorInput}>
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.colorPreview}>
              <h3>Preview</h3>
              <div className={styles.previewCard}>
                <div 
                  className={styles.previewHeader}
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <span>Header</span>
                </div>
                <div className={styles.previewBody}>
                  <button style={{ backgroundColor: formData.secondaryColor }}>
                    Secondary Button
                  </button>
                  <button style={{ backgroundColor: formData.accentColor }}>
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default CustomBranding;
