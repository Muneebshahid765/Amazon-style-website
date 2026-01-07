import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSellerCoupons,
  createSellerCoupon,
  updateSellerCoupon,
  deleteSellerCoupon,
  fetchProducts,
} from '../../../redux/slices/sellerSlice';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiPercent, FiLayers } from 'react-icons/fi';
import styles from './Coupons.module.css';

const defaultForm = {
  id: null,
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  maxDiscountValue: '',
  minOrderValue: '',
  appliesScope: 'all',
  products: [],
  usageLimit: '',
  usageLimitPerUser: '',
  startsAt: new Date().toISOString().slice(0, 10),
  expiresAt: '',
  isActive: true,
};

const CouponForm = ({ onSubmit, onCancel, formState, setFormState, isSubmitting, products }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProductToggle = (productId) => {
    setFormState((prev) => {
      const exists = prev.products.includes(productId);
      return {
        ...prev,
        products: exists
          ? prev.products.filter((id) => id !== productId)
          : [...prev.products, productId],
      };
    });
  };

  return (
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className={styles.gridTwo}>
        <div className={styles.formGroup}>
          <label>Coupon Code *</label>
          <input
            name="code"
            value={formState.code}
            onChange={handleChange}
            placeholder="e.g. SPRING20"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Discount Type</label>
          <select name="discountType" value={formState.discountType} onChange={handleChange}>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount</option>
          </select>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.formGroup}>
          <label>Discount Value *</label>
          <input
            type="number"
            name="discountValue"
            min="1"
            value={formState.discountValue}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Max Discount</label>
          <input
            type="number"
            name="maxDiscountValue"
            min="0"
            value={formState.maxDiscountValue}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.formGroup}>
          <label>Minimum Order Value</label>
          <input
            type="number"
            name="minOrderValue"
            min="0"
            value={formState.minOrderValue}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Usage Limit</label>
          <input
            type="number"
            name="usageLimit"
            min="0"
            value={formState.usageLimit}
            onChange={handleChange}
            placeholder="0 = unlimited"
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.formGroup}>
          <label>Usage Limit Per Customer</label>
          <input
            type="number"
            name="usageLimitPerUser"
            min="0"
            value={formState.usageLimitPerUser}
            onChange={handleChange}
            placeholder="0 = unlimited"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Applies To</label>
          <select name="appliesScope" value={formState.appliesScope} onChange={handleChange}>
            <option value="all">All Products</option>
            <option value="product">Selected Products</option>
          </select>
        </div>
      </div>

      {formState.appliesScope === 'product' && (
        <div className={styles.formGroup}>
          <label>Select Products</label>
          <div className={styles.productChips}>
            {products.map((product) => (
              <button
                type="button"
                key={product._id}
                onClick={() => handleProductToggle(product._id)}
                className={`${styles.chip} ${formState.products.includes(product._id) ? styles.chipActive : ''}`}
              >
                {product.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.gridTwo}>
        <div className={styles.formGroup}>
          <label>Starts At</label>
          <input type="date" name="startsAt" value={formState.startsAt} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Expires At *</label>
          <input type="date" name="expiresAt" value={formState.expiresAt} onChange={handleChange} required />
        </div>
      </div>

      <div className={styles.switchRow}>
        <label className={styles.switchLabel}>
          <input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} />
          Active coupon
        </label>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : formState.id ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
};

const SellerCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, couponPagination, couponsLoading, couponsError, products } = useSelector((state) => state.seller);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const currentCoupons = useMemo(() => coupons || [], [coupons]);

  useEffect(() => {
    dispatch(fetchSellerCoupons({ page, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined }));
  }, [dispatch, page, statusFilter, search]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const openForm = (coupon = null) => {
    if (coupon) {
      setFormState({
        id: coupon._id,
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue,
        maxDiscountValue: coupon.maxDiscountValue || coupon.maxDiscount || '',
        minOrderValue: coupon.minOrderValue || '',
        appliesScope: coupon.appliesTo?.scope || 'all',
        products: coupon.appliesTo?.products?.map((p) => p.toString()) || [],
        usageLimit: coupon.usageLimit || '',
        usageLimitPerUser: coupon.usageLimitPerUser || '',
        startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
        isActive: coupon.isActive,
        submissionNotes: coupon.description || '',
      });
    } else {
      setFormState(defaultForm);
    }
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    await dispatch(deleteSellerCoupon(id));
    dispatch(fetchSellerCoupons({ page, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      code: formState.code,
      description: formState.description,
      discountType: formState.discountType,
      discountValue: Number(formState.discountValue),
      maxDiscountValue: formState.maxDiscountValue ? Number(formState.maxDiscountValue) : undefined,
      minOrderValue: formState.minOrderValue ? Number(formState.minOrderValue) : undefined,
      usageLimit: formState.usageLimit ? Number(formState.usageLimit) : undefined,
      usageLimitPerUser: formState.usageLimitPerUser ? Number(formState.usageLimitPerUser) : undefined,
      startsAt: formState.startsAt,
      expiresAt: formState.expiresAt,
      isActive: formState.isActive,
      appliesTo: {
        scope: formState.appliesScope,
        products: formState.appliesScope === 'product' ? formState.products : [],
      },
    };

    let result;
    if (formState.id) {
      result = await dispatch(updateSellerCoupon({ id: formState.id, ...payload }));
    } else {
      result = await dispatch(createSellerCoupon(payload));
    }

    setIsSubmitting(false);
    if (createSellerCoupon.fulfilled.match(result) || updateSellerCoupon.fulfilled.match(result)) {
      setShowForm(false);
      setFormState(defaultForm);
      dispatch(fetchSellerCoupons({ page, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Coupons</h1>
          <p>Create promotional coupons for your products</p>
        </div>
        <button className={styles.createBtn} onClick={() => openForm()}>
          <FiPlus /> New Coupon
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {couponsError && <div className={styles.error}>{couponsError}</div>}

      {couponsLoading ? (
        <div className={styles.loading}>Loading coupons...</div>
      ) : currentCoupons.length === 0 ? (
        <div className={styles.emptyState}>
          <FiPercent />
          <p>No coupons yet. Create one to boost sales.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Validity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentCoupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td>
                    <div className={styles.codeCell}>
                      <FiLayers />
                      <div>
                        <strong>{coupon.code}</strong>
                        <p>{coupon.description || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : `$${coupon.discountValue}`}
                  </td>
                  <td>{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</td>
                  <td>
                    <span>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : 'Now'}</span>
                    <span className={styles.small}>→ {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '—'}</span>
                  </td>
                  <td>
                    <span className={`${styles.status} ${coupon.isActive ? styles.active : styles.inactive}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button onClick={() => openForm(coupon)}><FiEdit2 /></button>
                      <button onClick={() => handleDelete(coupon._id)} className={styles.danger}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </button>
        <span>
          Page {couponPagination.currentPage} / {couponPagination.totalPages}
        </span>
        <button
          disabled={couponPagination.currentPage >= couponPagination.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{formState.id ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>
            <CouponForm
              formState={formState}
              setFormState={setFormState}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={isSubmitting}
              products={products || []}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCoupons;
