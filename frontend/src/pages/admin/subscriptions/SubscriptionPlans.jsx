import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  togglePlanStatus,
  fetchSubscriptionStats,
  fetchUsersWithSubscriptions,
  assignPlanToUser,
  applyBulkDiscountToPlans,
  deleteSubscriptionPlansBulk,
} from '../../../redux/slices/adminSlice';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiDollarSign,
  FiUsers,
  FiPackage,
  FiPieChart,
  FiUserPlus,
  FiPercent,
  FiLayers,
  FiAlertTriangle,
} from 'react-icons/fi';
import styles from './SubscriptionPlans.module.css';

const planStatusOptions = ['inactive', 'trial', 'active', 'grace', 'expired', 'cancelled'];
const tierOptions = ['free', 'starter', 'growth', 'pro', 'enterprise'];

const defaultDiscountState = {
  isActive: false,
  type: 'percentage',
  value: 0,
  label: '',
  startsAt: '',
  endsAt: '',
  minPrice: 0,
};

const mapPlanDiscountToState = (plan) => ({
  isActive: plan?.discount?.isActive || false,
  type: plan?.discount?.type || 'percentage',
  value: plan?.discount?.value ?? 0,
  label: plan?.discount?.label || '',
  startsAt: plan?.discount?.startsAt ? plan.discount.startsAt.slice(0, 10) : '',
  endsAt: plan?.discount?.endsAt ? plan.discount.endsAt.slice(0, 10) : '',
  minPrice: plan?.discount?.minPrice ?? 0,
});

const isAdminDiscountActive = (discount) => {
  if (!discount || typeof discount !== 'object') return false;
  if (discount.isActive !== true) return false;
  if (!discount.value || Number(discount.value) <= 0) return false;
  return true;
};

const calculateDiscountedPrice = (price, discount) => {
  const basePrice = Number(price ?? 0);
  if (!Number.isFinite(basePrice)) return 0;
  if (!isAdminDiscountActive(discount)) return basePrice;

  let finalPrice =
    discount.type === 'flat'
      ? basePrice - Number(discount.value || 0)
      : basePrice - (basePrice * Number(discount.value || 0)) / 100;

  if (discount.minPrice) {
    finalPrice = Math.max(finalPrice, Number(discount.minPrice));
  }

  return Number(Math.max(finalPrice, 0).toFixed(2));
};

const SubscriptionPlans = () => {
  const dispatch = useDispatch();
  const {
    subscriptionPlans,
    subscriptionStats,
    usersWithSubscriptions,
    pagination,
    loading,
  } = useSelector((state) => state.admin);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'free',
    priceMonthly: 0,
    durationDays: 30,
    isActive: true,
    limits: {
      maxActiveProducts: 10,
      uploadsPerCycle: 10,
      editsPerCycle: 30,
      deletesPerCycle: 10,
    },
    features: [],
    badges: [],
    highlightColor: '#0ea5e9',
    discount: defaultDiscountState,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [userFilters, setUserFilters] = useState({
    search: '',
    planStatus: '',
    tier: '',
  });
  const [assignForm, setAssignForm] = useState({
    userId: '',
    planId: '',
  });
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState({
    ...defaultDiscountState,
    applyToAll: false,
  });
  const bulkModalClassName = `${styles.modal} ${styles.modalSmall}`;
  const selectedPlanDetails = useMemo(
    () => subscriptionPlans.filter((plan) => selectedPlans.includes(plan._id)),
    [subscriptionPlans, selectedPlans]
  );
  const hasSelectedPlans = selectedPlans.length > 0;

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
    dispatch(fetchSubscriptionStats());
  }, [dispatch]);

  useEffect(() => {
    const params = {};
    if (userFilters.search.trim()) params.search = userFilters.search.trim();
    if (userFilters.planStatus) params.planStatus = userFilters.planStatus;
    if (userFilters.tier) params.tier = userFilters.tier;
    dispatch(fetchUsersWithSubscriptions(params));
  }, [dispatch, userFilters]);

  const refreshUsers = () => {
    const params = {};
    if (userFilters.search.trim()) params.search = userFilters.search.trim();
    if (userFilters.planStatus) params.planStatus = userFilters.planStatus;
    if (userFilters.tier) params.tier = userFilters.tier;
    dispatch(fetchUsersWithSubscriptions(params));
  };

  const handlePlanSelection = (planId) => {
    setSelectedPlans((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleClearSelection = () => {
    setSelectedPlans([]);
  };

  const handleSelectAllPlans = () => {
    if (!subscriptionPlans.length) return;
    if (selectedPlans.length === subscriptionPlans.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(subscriptionPlans.map((plan) => plan._id));
    }
  };

  const handleOpenBulkDiscount = () => {
    setShowBulkModal(true);
  };

  const handleBulkDelete = () => {
    if (!selectedPlans.length) {
      toast.error('Select at least one plan to delete');
      return;
    }

    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await dispatch(deleteSubscriptionPlansBulk(selectedPlans)).unwrap();
      toast.success(`Deleted ${selectedPlans.length} plan${selectedPlans.length === 1 ? '' : 's'}`);
      setSelectedPlans([]);
      setShowBulkDeleteConfirm(false);
      dispatch(fetchSubscriptionPlans());
      dispatch(fetchSubscriptionStats());
    } catch (error) {
      const errMsg =
        error?.blockingPlans?.length
          ? `${error.message}: ${error.blockingPlans
              .map((p) => `${p.name} (${p.users} users)`)
              .join(', ')}`
          : error?.message || 'Failed to delete plans';
      toast.error(errMsg);
      setShowBulkDeleteConfirm(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
  };

  const handleCloseBulkDiscount = () => {
    setShowBulkModal(false);
    setBulkDiscount({ ...defaultDiscountState, applyToAll: false });
  };

  const handleBulkDiscountChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'applyToAll') {
      setBulkDiscount((prev) => ({ ...prev, applyToAll: checked }));
      if (checked) {
        setSelectedPlans([]);
      }
      return;
    }
    setBulkDiscount((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'value' || name === 'minPrice'
          ? Number(value)
          : value,
    }));
  };

  const handleBulkDiscountSubmit = async (e) => {
    e.preventDefault();
    const { applyToAll, ...discountPayload } = bulkDiscount;

    if (!applyToAll && selectedPlans.length === 0) {
      toast.error('Select at least one plan or enable Apply to all');
      return;
    }

    try {
      await dispatch(
        applyBulkDiscountToPlans({
          planIds: applyToAll ? [] : selectedPlans,
          applyToAll,
          discount: discountPayload,
        })
      ).unwrap();

      toast.success(
        applyToAll ? 'Discount applied to all plans' : 'Discount applied to selected plans'
      );
      setSelectedPlans([]);
      setBulkDiscount({ ...defaultDiscountState, applyToAll: false });
      setShowBulkModal(false);
      dispatch(fetchSubscriptionPlans());
      dispatch(fetchSubscriptionStats());
    } catch (error) {
      toast.error(error || 'Failed to apply discount');
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        tier: plan.tier,
        priceMonthly: plan.priceMonthly,
        durationDays: plan.durationDays,
        isActive: plan.isActive,
        limits: plan.limits,
        features: plan.features || [],
        badges: plan.badges || [],
        highlightColor: plan.highlightColor || '#0ea5e9',
        discount: mapPlanDiscountToState(plan),
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        tier: 'free',
        priceMonthly: 0,
        durationDays: 30,
        isActive: true,
        limits: {
          maxActiveProducts: 10,
          uploadsPerCycle: 10,
          editsPerCycle: 30,
          deletesPerCycle: 10,
        },
        features: [],
        badges: [],
        highlightColor: '#0ea5e9',
        discount: defaultDiscountState,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFeatureInput('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDiscountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      discount: {
        ...prev.discount,
        [name]: type === 'checkbox'
          ? checked
          : name === 'value' || name === 'minPrice'
          ? Number(value)
          : value,
      },
    }));
  };

  const handleLimitChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      limits: {
        ...prev.limits,
        [name]: parseInt(value, 10) || 0,
      },
    }));
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleUserFilterChange = (e) => {
    const { name, value } = e.target;
    setUserFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setUserFilters({ search: '', planStatus: '', tier: '' });
  };

  const handleAssignFormChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    if (!assignForm.userId || !assignForm.planId) {
      toast.error('Select both seller and subscription plan');
      return;
    }

    try {
      await dispatch(assignPlanToUser(assignForm)).unwrap();
      toast.success('Plan assigned successfully');
      setAssignForm({ userId: '', planId: '' });
      refreshUsers();
      dispatch(fetchSubscriptionStats());
    } catch (error) {
      toast.error(error || 'Failed to assign plan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await dispatch(updateSubscriptionPlan({ id: editingPlan._id, ...formData })).unwrap();
        toast.success('Subscription plan updated successfully');
      } else {
        await dispatch(createSubscriptionPlan(formData)).unwrap();
        toast.success('Subscription plan created successfully');
      }
      handleCloseModal();
      dispatch(fetchSubscriptionPlans());
    } catch (error) {
      toast.error(error || 'Failed to save subscription plan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await dispatch(deleteSubscriptionPlan(id)).unwrap();
        toast.success('Subscription plan deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete subscription plan');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await dispatch(togglePlanStatus(id)).unwrap();
      toast.success('Plan status updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update plan status');
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      free: '#6b7280',
      starter: '#3b82f6',
      growth: '#8b5cf6',
      pro: '#f59e0b',
      enterprise: '#ef4444',
    };
    return colors[tier] || '#6b7280';
  };

  const getPlanStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'trial':
        return '#3b82f6';
      case 'grace':
        return '#f59e0b';
      case 'expired':
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (value) => {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const planStats = subscriptionStats?.plans || {};
  const userStats = subscriptionStats?.users || {};
  const statusEntries = Object.entries(userStats.byStatus || {});
  const tierEntries = Object.entries(userStats.byTier || {});

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Subscription Plans</h1>
          <p>Manage tiers, quotas, and seller assignments from one place</p>
        </div>
        <button className={styles.addButton} onClick={() => handleOpenModal()}>
          <FiPlus /> Create Plan
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#0ea5e920' }}>
            <FiPackage />
          </div>
          <div>
            <p>Total Plans</p>
            <h3>{planStats.total ?? 0}</h3>
            <span>{planStats.active ?? 0} active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#14b8a620' }}>
            <FiUsers />
          </div>
          <div>
            <p>Subscribed Sellers</p>
            <h3>{userStats.total ?? 0}</h3>
            <span>{statusEntries.find(([status]) => status === 'active')?.[1] || 0} active now</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f9731620' }}>
            <FiPieChart />
          </div>
          <div>
            <p>Tier Mix</p>
            <div className={styles.badgeRow}>
              {tierEntries.length ? (
                tierEntries.map(([tier, count]) => (
                  <span
                    key={tier}
                    className={styles.tierChip}
                    style={{ backgroundColor: `${getTierColor(tier)}20`, color: getTierColor(tier) }}
                  >
                    {tier}: {count}
                  </span>
                ))
              ) : (
                <span className={styles.tierChip}>No data</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && !subscriptionPlans.length ? (
        <div className={styles.loading}>Loading plans...</div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Plan Library</h2>
                <p>Manage plan tiers, pricing and quotas</p>
              </div>
              <div className={styles.headingActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => handleOpenModal()}
                >
                  <FiPlus /> Create Plan
                </button>
                <button
                  type="button"
                  className={styles.bulkButton}
                  onClick={handleOpenBulkDiscount}
                >
                  <FiPercent /> Bulk Discount
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={handleBulkDelete}
                  disabled={!hasSelectedPlans}
                >
                  <FiTrash2 /> Delete Selected
                </button>
              </div>
            </div>

            {hasSelectedPlans && (
              <div className={styles.bulkToolbar}>
                <div className={styles.bulkInfo}>
                  <span className={styles.bulkCount}>
                    {selectedPlans.length} plan{selectedPlans.length === 1 ? '' : 's'} selected
                  </span>
                  <button type="button" className={styles.linkButton} onClick={handleSelectAllPlans}>
                    <FiLayers />{' '}
                    {selectedPlans.length === subscriptionPlans.length ? 'Unselect all' : 'Select all'}
                  </button>
                </div>
                <div className={styles.bulkActions}>
                  <button
                    type="button"
                    className={styles.applyButton}
                    onClick={handleOpenBulkDiscount}
                  >
                    <FiPercent /> Apply Discount
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButtonSolid}
                    onClick={handleBulkDelete}
                  >
                    <FiTrash2 /> Delete
                  </button>
                  <button type="button" className={styles.ghostButton} onClick={handleClearSelection}>
                    <FiX /> Clear
                  </button>
                </div>
              </div>
            )}

            {subscriptionPlans.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <div>
                  <h3>No subscription plans yet</h3>
                  <p>Create your first plan to start enforcing limits for sellers.</p>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => handleOpenModal()}
                >
                  <FiPlus /> Create Plan
                </button>
              </div>
            ) : (
              <div className={styles.plansGrid}>
                {subscriptionPlans.map((plan) => {
                  const isSelected = selectedPlans.includes(plan._id);
                  const planPrice = Number(plan.priceMonthly ?? 0);
                  const discountActive = isAdminDiscountActive(plan.discount);
                  const discountedPrice = calculateDiscountedPrice(planPrice, plan.discount);
                  const showDiscount = discountActive && discountedPrice !== planPrice;
                  const displayPrice = showDiscount ? discountedPrice.toFixed(2) : planPrice.toFixed(2);
                  return (
                    <div
                      key={plan._id}
                      className={`${styles.planCard} ${isSelected ? styles.planSelected : ''}`}
                      onClick={() => {
                        if (!bulkDiscount.applyToAll) handlePlanSelection(plan._id);
                      }}
                    >
                      {!bulkDiscount.applyToAll && (
                        <label
                          className={styles.planSelectControl}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePlanSelection(plan._id)}
                          />
                          <span></span>
                        </label>
                      )}
                      <div className={styles.planHeader} style={{ borderColor: getTierColor(plan.tier) }}>
                      <div className={styles.planTitleRow}>
                        <h3>{plan.name}</h3>
                        <span
                          className={styles.tierBadge}
                          style={{ backgroundColor: getTierColor(plan.tier) }}
                        >
                          {plan.tier}
                        </span>
                      </div>
                      <p className={styles.planDescription}>{plan.description}</p>
                      <div className={styles.planPrice}>
                        <FiDollarSign />
                        <span className={styles.price}>
                          {displayPrice}
                        </span>
                        <span className={styles.period}>/month</span>
                      </div>
                      {showDiscount && (
                        <div className={styles.discountMeta}>
                          <span className={styles.originalPrice}>${planPrice.toFixed(2)}</span>
                          <span className={styles.discountLabel}>
                            {plan.discount.label || (plan.discount.type === 'flat'
                              ? `Save $${Number(plan.discount.value).toFixed(0)}`
                              : `Save ${Number(plan.discount.value).toFixed(0)}%`)}
                          </span>
                          {plan.discount.startsAt && plan.discount.endsAt && (
                            <span className={styles.discountDates}>
                              {new Date(plan.discount.startsAt).toLocaleDateString()} - {new Date(plan.discount.endsAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={styles.planLimits}>
                      <h4>Limits</h4>
                      <div className={styles.limitItem}>
                        <FiPackage />
                        <span>Max Active Products: {plan.limits.maxActiveProducts}</span>
                      </div>
                      <div className={styles.limitItem}>
                        <FiUsers />
                        <span>Uploads/Cycle: {plan.limits.uploadsPerCycle}</span>
                      </div>
                      <div className={styles.limitItem}>
                        <FiUsers />
                        <span>Edits/Cycle: {plan.limits.editsPerCycle}</span>
                      </div>
                      <div className={styles.limitItem}>
                        <FiUsers />
                        <span>Deletes/Cycle: {plan.limits.deletesPerCycle}</span>
                      </div>
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className={styles.planFeatures}>
                        <h4>Features</h4>
                        <ul>
                          {plan.features.map((feature, idx) => (
                            <li key={idx}>
                              <FiCheck /> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={styles.planActions}>
                      <button
                        className={`${styles.statusBtn} ${
                          plan.isActive ? styles.active : styles.inactive
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(plan._id);
                        }}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(plan);
                        }}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan._id);
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.assignmentSection}>
              <div className={styles.assignCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>Assign Plan to Seller</h3>
                    <p>Quickly move sellers between tiers</p>
                  </div>
                </div>
                <form className={styles.assignForm} onSubmit={handleAssignPlan}>
                  <div className={styles.formGroup}>
                    <label>Select Seller</label>
                    <select
                      name="userId"
                      value={assignForm.userId}
                      onChange={handleAssignFormChange}
                    >
                      <option value="">Choose seller</option>
                      {usersWithSubscriptions.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Select Plan</label>
                    <select
                      name="planId"
                      value={assignForm.planId}
                      onChange={handleAssignFormChange}
                    >
                      <option value="">Choose plan</option>
                      {subscriptionPlans.map((plan) => (
                        <option key={plan._id} value={plan._id}>
                          {plan.name} ({plan.tier})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className={styles.assignButton}>
                    <FiUserPlus /> Assign Plan
                  </button>
                </form>
              </div>

              <div className={styles.userListCard}>
                <div className={styles.userListHeader}>
                  <div>
                    <h3>Seller Subscription Status</h3>
                    <p>
                      {pagination?.total || usersWithSubscriptions.length} seller
                      {((pagination?.total || usersWithSubscriptions.length) ?? 0) !== 1 && 's'} found
                    </p>
                  </div>
                  <div className={styles.filterRow}>
                    <input
                      type="text"
                      name="search"
                      placeholder="Search name or email"
                      value={userFilters.search}
                      onChange={handleUserFilterChange}
                    />
                    <select
                      name="planStatus"
                      value={userFilters.planStatus}
                      onChange={handleUserFilterChange}
                    >
                      <option value="">All statuses</option>
                      {planStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <select
                      name="tier"
                      value={userFilters.tier}
                      onChange={handleUserFilterChange}
                    >
                      <option value="">All tiers</option>
                      {tierOptions.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                    <button type="button" className={styles.resetBtn} onClick={handleResetFilters}>
                      Clear
                    </button>
                  </div>
                </div>

                <div className={styles.userTableWrapper}>
                  <table className={styles.userTable}>
                    <thead>
                      <tr>
                        <th>Seller</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Renews</th>
                        <th>Usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersWithSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className={styles.emptyState}>
                            No sellers matching the current filters.
                          </td>
                        </tr>
                      ) : (
                        usersWithSubscriptions.map((user) => (
                          <tr key={user._id}>
                            <td>
                              <div className={styles.userCell}>
                                <span className={styles.userName}>
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className={styles.userEmail}>{user.email}</span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.planCell}>
                                <span className={styles.planName}>
                                  {user.currentPlan?.name || 'No plan'}
                                </span>
                                {user.currentPlan?.tier && (
                                  <span
                                    className={styles.tierChip}
                                    style={{
                                      backgroundColor: `${getTierColor(
                                        user.currentPlan.tier
                                      )}20`,
                                      color: getTierColor(user.currentPlan.tier),
                                    }}
                                  >
                                    {user.currentPlan.tier}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={styles.statusChip}
                                style={{ backgroundColor: getPlanStatusColor(user.planStatus) }}
                              >
                                {user.planStatus || 'inactive'}
                              </span>
                            </td>
                            <td>{formatDate(user.planRenewsAt)}</td>
                            <td>
                              <div className={styles.usagePills}>
                                <span className={styles.usagePill}>
                                  U {user.planUsage?.uploadsUsed || 0}/
                                  {user.currentPlan?.limits?.uploadsPerCycle ?? '∞'}
                                </span>
                                <span className={styles.usagePill}>
                                  E {user.planUsage?.editsUsed || 0}/
                                  {user.currentPlan?.limits?.editsPerCycle ?? '∞'}
                                </span>
                                <span className={styles.usagePill}>
                                  D {user.planUsage?.deletesUsed || 0}/
                                  {user.currentPlan?.limits?.deletesPerCycle ?? '∞'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>

            <div className={styles.formWrapper}>
              <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Plan Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tier *</label>
                  <select name="tier" value={formData.tier} onChange={handleInputChange} required>
                    {tierOptions.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (Monthly) *</label>
                  <input
                    type="number"
                    name="priceMonthly"
                    value={formData.priceMonthly}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>

                  <div className={styles.formGroup}>
                    <label>Duration (Days) *</label>
                    <input
                      type="number"
                      name="durationDays"
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
              </div>

              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h3>Plan Discount</h3>
                  <p>Optional promotional pricing for this plan</p>
                </div>
                <div className={styles.discountToggle}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.discount.isActive}
                      onChange={handleDiscountChange}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span>{formData.discount.isActive ? 'Discount Active' : 'No Active Discount'}</span>
                </div>
                {formData.discount.isActive && (
                  <div className={styles.discountGrid}>
                    <div className={styles.formGroup}>
                      <label>Discount Type</label>
                      <select
                        name="type"
                        value={formData.discount.type}
                        onChange={handleDiscountChange}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount ($)</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Discount Value</label>
                      <input
                        type="number"
                        name="value"
                        min="0"
                        value={formData.discount.value}
                        onChange={handleDiscountChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Minimum Final Price (optional)</label>
                      <input
                        type="number"
                        name="minPrice"
                        min="0"
                        value={formData.discount.minPrice}
                        onChange={handleDiscountChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Discount Label</label>
                      <input
                        type="text"
                        name="label"
                        value={formData.discount.label}
                        onChange={handleDiscountChange}
                        placeholder="e.g. New Year Offer"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Starts At</label>
                      <input
                        type="date"
                        name="startsAt"
                        value={formData.discount.startsAt}
                        onChange={handleDiscountChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Ends At</label>
                      <input
                        type="date"
                        name="endsAt"
                        value={formData.discount.endsAt}
                        onChange={handleDiscountChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.limitsSection}>
                <h3>Limits</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Max Active Products</label>
                    <input
                      type="number"
                      name="maxActiveProducts"
                      value={formData.limits.maxActiveProducts}
                      onChange={handleLimitChange}
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Uploads Per Cycle</label>
                    <input
                      type="number"
                      name="uploadsPerCycle"
                      value={formData.limits.uploadsPerCycle}
                      onChange={handleLimitChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Edits Per Cycle</label>
                    <input
                      type="number"
                      name="editsPerCycle"
                      value={formData.limits.editsPerCycle}
                      onChange={handleLimitChange}
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Deletes Per Cycle</label>
                    <input
                      type="number"
                      name="deletesPerCycle"
                      value={formData.limits.deletesPerCycle}
                      onChange={handleLimitChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.featuresSection}>
                <h3>Features</h3>
                <div className={styles.featureInput}>
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddFeature}>
                    <FiPlus /> Add
                  </button>
                </div>
                <ul className={styles.featureList}>
                  {formData.features.map((feature, idx) => (
                    <li key={idx}>
                      {feature}
                      <button type="button" onClick={() => handleRemoveFeature(idx)}>
                        <FiX />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Active Plan</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showBulkModal && (
        <div className={styles.modalOverlay} onClick={handleCloseBulkDiscount}>
          <div className={`${styles.modal} ${styles.modalSmall}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Apply Discount</h2>
              <button className={styles.closeBtn} onClick={handleCloseBulkDiscount}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleBulkDiscountSubmit} className={styles.bulkForm}>
              <div className={styles.bulkScope}>
                <label>
                  <input
                    type="checkbox"
                    name="applyToAll"
                    checked={bulkDiscount.applyToAll}
                    onChange={handleBulkDiscountChange}
                  />
                  Apply to all plans
                </label>
                {!bulkDiscount.applyToAll && (
                  <p className={styles.scopeHint}>
                    {selectedPlans.length
                      ? `${selectedPlans.length} plan${selectedPlans.length === 1 ? '' : 's'} selected`
                      : 'Select plans from the grid to include in this update'}
                  </p>
                )}
              </div>

              <div className={styles.formSection}>
                <div className={styles.discountToggle}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={bulkDiscount.isActive}
                      onChange={handleBulkDiscountChange}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span>{bulkDiscount.isActive ? 'Discount Active' : 'No Active Discount'}</span>
                </div>

                {bulkDiscount.isActive && (
                  <div className={styles.discountGrid}>
                    <div className={styles.formGroup}>
                      <label>Type</label>
                      <select
                        name="type"
                        value={bulkDiscount.type}
                        onChange={handleBulkDiscountChange}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount ($)</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Value</label>
                      <input
                        type="number"
                        name="value"
                        min="0"
                        value={bulkDiscount.value}
                        onChange={handleBulkDiscountChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Min Price</label>
                      <input
                        type="number"
                        name="minPrice"
                        min="0"
                        value={bulkDiscount.minPrice}
                        onChange={handleBulkDiscountChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Label</label>
                      <input
                        type="text"
                        name="label"
                        value={bulkDiscount.label}
                        onChange={handleBulkDiscountChange}
                        placeholder="e.g. New Year Offer"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Starts At</label>
                      <input
                        type="date"
                        name="startsAt"
                        value={bulkDiscount.startsAt}
                        onChange={handleBulkDiscountChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Ends At</label>
                      <input
                        type="date"
                        name="endsAt"
                        value={bulkDiscount.endsAt}
                        onChange={handleBulkDiscountChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseBulkDiscount}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Apply Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showBulkDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={cancelBulkDelete}>
          <div className={`${styles.modal} ${styles.confirmModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Delete {selectedPlans.length} plan{selectedPlans.length === 1 ? '' : 's'}?</h2>
              <button className={styles.closeBtn} onClick={cancelBulkDelete}>
                <FiX />
              </button>
            </div>
            <div className={styles.confirmBody}>
              <div className={styles.confirmIcon}>
                <FiAlertTriangle />
              </div>
              <p>
                This action will permanently delete the selected subscription plan
                {selectedPlans.length === 1 ? '' : 's'}. Sellers currently assigned to these plans prevent deletion automatically.
              </p>
              {selectedPlanDetails.length > 0 && (
                <ul className={styles.selectedPlanList}>
                  {selectedPlanDetails.slice(0, 4).map((plan) => (
                    <li key={plan._id}>{plan.name}</li>
                  ))}
                  {selectedPlans.length > 4 && (
                    <li className={styles.morePlans}>+{selectedPlans.length - 4} more</li>
                  )}
                </ul>
              )}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={cancelBulkDelete}>
                Cancel
              </button>
              <button type="button" className={styles.dangerButtonSolid} onClick={confirmBulkDelete}>
                <FiTrash2 /> Delete Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
