import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiCheck, FiX } from 'react-icons/fi';
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../redux/slices/userSlice';
import styles from '../../styles/AddressManager.module.css';

const AddressManager = () => {
  const dispatch = useDispatch();
  const { addresses } = useSelector((state) => state.user);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    isDefault: false,
  });

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      label: '',
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleOpenModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label || '',
        fullName: address.fullName || '',
        phone: address.phone || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'Pakistan',
        isDefault: address.isDefault || false,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAddress) {
      await dispatch(updateAddress({ id: editingAddress._id, updates: formData }));
    } else {
      await dispatch(addAddress(formData));
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      await dispatch(deleteAddress(id));
    }
  };

  const handleSetDefault = async (id) => {
    await dispatch(setDefaultAddress(id));
  };

  return (
    <div className={styles.addressManager}>
      <div className={styles.header}>
        <h2>
          <FiMapPin /> My Addresses
        </h2>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <FiPlus /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <FiMapPin size={48} />
          <h3>No addresses yet</h3>
          <p>Add your first address to make checkout faster</p>
          <button className={styles.addBtn} onClick={() => handleOpenModal()}>
            <FiPlus /> Add Address
          </button>
        </div>
      ) : (
        <div className={styles.addressGrid}>
          {addresses.map((address) => (
            <div key={address._id} className={styles.addressCard}>
              {address.isDefault && <span className={styles.defaultBadge}>Default</span>}
              <div className={styles.addressHeader}>
                {address.label && <h4>{address.label}</h4>}
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleOpenModal(address)}
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleDelete(address._id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <div className={styles.addressDetails}>
                <p className={styles.name}>{address.fullName}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p className={styles.phone}>{address.phone}</p>
              </div>
              {!address.isDefault && (
                <button
                  className={styles.setDefaultBtn}
                  onClick={() => handleSetDefault(address._id)}
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="label">Label (Optional)</label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g., Home, Office"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="addressLine1">Address Line 1 *</label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  required
                  placeholder="Street address, P.O. box"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="addressLine2">Address Line 2</label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="state">State/Province *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="postalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                />
                <label htmlFor="isDefault">Set as default address</label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  <FiCheck /> {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManager;
