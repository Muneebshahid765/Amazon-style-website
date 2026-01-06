import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  updateProduct,
  fetchProductDetails,
  clearSelectedProduct,
} from '../../../redux/slices/sellerSlice';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import styles from './AddProduct.module.css';

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { currentProduct, detailsLoading } = useSelector((state) => state.seller);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    comparePrice: '',
    sku: '',
    stock: '',
    category: '',
    brand: '',
    weight: '',
    dimensions: '',
  });

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchProductDetails(id));
    } else {
      dispatch(clearSelectedProduct());
      setFormData({
        title: '',
        description: '',
        price: '',
        comparePrice: '',
        sku: '',
        stock: '',
        category: '',
        brand: '',
        weight: '',
        dimensions: '',
      });
      setExistingImages([]);
      setImages([]);
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentProduct && currentProduct._id === id) {
      setFormData({
        title: currentProduct.title || '',
        description: currentProduct.description || '',
        price: currentProduct.price ?? '',
        comparePrice: currentProduct.discountPrice ?? '',
        sku: currentProduct.sku || '',
        stock: currentProduct.stock ?? '',
        category:
          currentProduct.category?.slug ||
          currentProduct.category?.name ||
          currentProduct.category?._id ||
          '',
        brand: currentProduct.brand || '',
        weight: currentProduct.weight || '',
        dimensions: currentProduct.dimensions || '',
      });
      setExistingImages((currentProduct.images || []).filter((img) => img && (img.url || img.preview)));
    }
  }, [currentProduct, id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setImages(prev => [...prev, { file, preview: reader.result }]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (publicId) => {
    setExistingImages(existingImages.filter((img) => img.public_id !== publicId));
  };

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Select category' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'fashion', label: 'Fashion' },
      { value: 'home', label: 'Home & Garden' },
      { value: 'sports', label: 'Sports' },
    ],
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = new FormData();
      Object.keys(formData).forEach(key => productData.append(key, formData[key]));
      if (existingImages.length) {
        productData.append('existingImages', JSON.stringify(existingImages));
      }
      images.forEach(img => productData.append('images', img.file));
      if (isEditMode) {
        await dispatch(updateProduct({ id, data: productData })).unwrap();
      } else {
        await dispatch(createProduct(productData)).unwrap();
      }
      navigate('/seller/products');
    } catch (error) {
      console.error('Failed to create product:', error);
    }
    setLoading(false);
  };

  if (isEditMode && detailsLoading && !currentProduct) {
    return <div className={styles.loading}>Loading product details...</div>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/seller/products')}><FiArrowLeft /> Back to Products</button>
      <div className={styles.header}>
        <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
        <p>{isEditMode ? 'Update your product details' : 'Fill in the details to add a new product'}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.mainSection}>
            <div className={styles.card}>
              <h3>Basic Information</h3>
              <div className={styles.formGroup}>
                <label>Product Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter product title" required />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter product description" rows="5" />
              </div>
            </div>

            <div className={styles.card}>
              <h3>Media</h3>
              <div className={styles.imageUpload}>
                <input type="file" id="images" multiple accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
                <label htmlFor="images" className={styles.uploadLabel}><FiUpload /> Upload Images</label>
              </div>
              {existingImages.length > 0 && (
                <div className={styles.imagePreview}>
                  {existingImages
                    .filter((img) => img && (img.url || img.preview))
                    .map((img) => (
                      <div key={img.public_id || img.url} className={styles.previewItem}>
                        <img src={img.url || img.preview} alt={img.alt || img.public_id || 'product image'} />
                        <button type="button" onClick={() => removeExistingImage(img.public_id)} className={styles.removeBtn}><FiX /></button>
                      </div>
                    ))}
                </div>
              )}
              {images.length > 0 && (
                <div className={styles.imagePreview}>
                  {images.map((img, index) => (
                    <div key={index} className={styles.previewItem}>
                      <img src={img.preview} alt={`Preview ${index}`} />
                      <button type="button" onClick={() => removeImage(index)} className={styles.removeBtn}><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3>Pricing</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Price *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Compare at Price</label>
                  <input type="number" name="comparePrice" value={formData.comparePrice} onChange={handleChange} placeholder="0.00" step="0.01" />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.card}>
              <h3>Organization</h3>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  {categoryOptions.map((option) => (
                    <option key={option.value || 'placeholder'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Enter brand name" />
              </div>
            </div>

            <div className={styles.card}>
              <h3>Inventory</h3>
              <div className={styles.formGroup}>
                <label>SKU</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="Stock keeping unit" />
              </div>
              <div className={styles.formGroup}>
                <label>Stock Quantity *</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" min="0" required />
              </div>
            </div>

            <div className={styles.card}>
              <h3>Shipping</h3>
              <div className={styles.formGroup}>
                <label>Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.0" step="0.1" />
              </div>
              <div className={styles.formGroup}>
                <label>Dimensions (L x W x H)</label>
                <input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="10 x 10 x 10 cm" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={() => navigate('/seller/products')} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
