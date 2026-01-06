import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiChevronRight, FiChevronLeft, FiPlus, FiX } from 'react-icons/fi';
import {
  validateCheckout,
  calculateCheckout,
  createOrder,
  setShippingAddress,
  setShippingMethod,
  setPaymentMethod,
  nextStep,
  previousStep,
  resetCheckout,
} from '../redux/slices/checkoutSlice';
import { fetchAddresses, addAddress } from '../redux/slices/userSlice';
import AddressManager from '../components/user/AddressManager';
import styles from '../styles/Checkout.module.css';

const STEPS = [
  { id: 1, title: 'Shipping Address' },
  { id: 2, title: 'Shipping Method' },
  { id: 3, title: 'Payment' },
  { id: 4, title: 'Review Order' },
];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal } = useSelector((state) => state.cart);
  const { addresses } = useSelector((state) => state.user);
  const { currentStep, shippingAddress, shippingMethod, paymentMethod, orderSummary } = useSelector(
    (state) => state.checkout
  );
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
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
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    dispatch(validateCheckout());
    dispatch(fetchAddresses());
    return () => {
      dispatch(resetCheckout());
    };
  }, [dispatch, items.length, navigate]);

  useEffect(() => {
    if (shippingMethod) {
      dispatch(calculateCheckout(shippingMethod));
    }
  }, [dispatch, shippingMethod]);

  const handleNext = () => {
    if (currentStep === 1 && !shippingAddress) {
      alert('Please select a shipping address');
      return;
    }
    dispatch(nextStep());
  };

  const handlePrevious = () => {
    dispatch(previousStep());
  };

  useEffect(() => {
    if (!selectedAddressId && addresses.length) {
      const fallback = addresses.find((addr) => addr.isDefault) || addresses[0];
      handleAddressSelect(fallback._id);
    }
  }, [addresses, selectedAddressId]);

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((addr) => addr._id === addressId);
    dispatch(setShippingAddress(address));
  };

  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNewAddressSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(addAddress(newAddress));
    if (addAddress.fulfilled.match(result)) {
      const created = result.payload[result.payload.length - 1];
      handleAddressSelect(created._id);
      setShowAddressForm(false);
      setNewAddress({
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
    }
  };

  const handleShippingMethodChange = (method) => {
    dispatch(setShippingMethod(method));
  };

  const handlePaymentMethodChange = (method) => {
    dispatch(setPaymentMethod(method));
  };

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      alert('Please accept terms and conditions');
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      createOrder({
        shippingAddress,
        shippingMethod,
        paymentMethod,
      })
    );

    if (createOrder.fulfilled.match(result)) {
      navigate(`/order-success/${result.payload.order._id}`);
    }
    setIsSubmitting(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.addressHeader}>
              <h2>Select Shipping Address</h2>
              <button
                type="button"
                className={styles.addAddressBtn}
                onClick={() => setShowAddressForm((prev) => !prev)}
              >
                {showAddressForm ? (
                  <>
                    <FiX /> Cancel
                  </>
                ) : (
                  <>
                    <FiPlus /> Add New
                  </>
                )}
              </button>
            </div>
            {addresses.length === 0 ? (
              <div className={styles.noAddresses}>
                <p>No saved addresses found</p>
                <AddressManager />
              </div>
            ) : (
              <div className={styles.addressList}>
                {addresses.map((address) => {
                  const isSelected = selectedAddressId === address._id;
                  const showDefaultBadge = address.isDefault && !isSelected;
                  return (
                    <label
                      key={address._id}
                      className={`${styles.addressCard} ${isSelected ? styles.selectedCard : ''}`}
                    >
                      <input
                        type="radio"
                        name="shippingAddress"
                        checked={isSelected}
                        onChange={() => handleAddressSelect(address._id)}
                      />
                      <div className={styles.addressDetails}>
                        <p>
                          <strong>{address.fullName}</strong>
                        </p>
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p>{address.phone}</p>
                        <div className={styles.badgeRow}>
                          {showDefaultBadge && <span className={styles.defaultBadge}>Default</span>}
                          {isSelected && <span className={styles.selectedBadge}>Selected</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            {showAddressForm && (
              <form className={styles.addressForm} onSubmit={handleNewAddressSubmit}>
                <div className={styles.formRow}>
                  <div>
                    <label>Label</label>
                    <input
                      type="text"
                      name="label"
                      value={newAddress.label}
                      onChange={handleNewAddressChange}
                      placeholder="Home / Office"
                    />
                  </div>
                  <div>
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={newAddress.fullName}
                      onChange={handleNewAddressChange}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div>
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newAddress.phone}
                      onChange={handleNewAddressChange}
                      required
                    />
                  </div>
                  <div>
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleNewAddressChange}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div>
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={newAddress.state}
                      onChange={handleNewAddressChange}
                      required
                    />
                  </div>
                  <div>
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={newAddress.postalCode}
                      onChange={handleNewAddressChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={newAddress.addressLine1}
                    onChange={handleNewAddressChange}
                    required
                  />
                </div>
                <div>
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={newAddress.addressLine2}
                    onChange={handleNewAddressChange}
                  />
                </div>
                <div className={styles.formActions}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleNewAddressChange}
                    />
                    Make this my default address
                  </label>
                  <button type="submit" className={styles.saveAddressBtn}>
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2>Select Shipping Method</h2>
            <div className={styles.shippingMethods}>
              <label className={styles.shippingCard}>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={(e) => handleShippingMethodChange(e.target.value)}
                />
                <div>
                  <strong>Standard Shipping</strong>
                  <p>Delivery in 3-5 business days</p>
                  <p className={styles.price}>
                    {subtotal >= 5000 ? 'FREE' : 'Rs. 200'}
                  </p>
                </div>
              </label>
              <label className={styles.shippingCard}>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={(e) => handleShippingMethodChange(e.target.value)}
                />
                <div>
                  <strong>Express Shipping</strong>
                  <p>Delivery in 1-2 business days</p>
                  <p className={styles.price}>Rs. 500</p>
                </div>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2>Select Payment Method</h2>
            <div className={styles.paymentMethods}>
              <label className={styles.paymentCard}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                />
                <div>
                  <strong>Cash on Delivery</strong>
                  <p>Pay when you receive your order</p>
                  {orderSummary.total > 20000 && (
                    <p className={styles.warning}>Not available for orders above Rs. 20,000</p>
                  )}
                </div>
              </label>
              <label className={styles.paymentCard}>
                <input
                  type="radio"
                  name="payment"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                />
                <div>
                  <strong>Credit/Debit Card</strong>
                  <p>Secure payment via Stripe</p>
                </div>
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <h2>Review Your Order</h2>
            <div className={styles.reviewSection}>
              <div className={styles.reviewItem}>
                <h3>Shipping Address</h3>
                {shippingAddress && (
                  <div>
                    <p>{shippingAddress.fullName}</p>
                    <p>{shippingAddress.addressLine1}</p>
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                    </p>
                    <p>{shippingAddress.phone}</p>
                  </div>
                )}
              </div>
              <div className={styles.reviewItem}>
                <h3>Shipping Method</h3>
                <p>{shippingMethod === 'standard' ? 'Standard Shipping (3-5 days)' : 'Express Shipping (1-2 days)'}</p>
              </div>
              <div className={styles.reviewItem}>
                <h3>Payment Method</h3>
                <p>{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</p>
              </div>
            </div>
            <label className={styles.termsCheckbox}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              I agree to the terms and conditions
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.progressBar}>
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`${styles.progressStep} ${
              currentStep >= step.id ? styles.active : ''
            } ${currentStep > step.id ? styles.completed : ''}`}
          >
            <div className={styles.stepCircle}>
              {currentStep > step.id ? <FiCheck /> : step.id}
            </div>
            <span>{step.title}</span>
          </div>
        ))}
      </div>

      <div className={styles.checkoutContent}>
        <div className={styles.checkoutMain}>
          {renderStepContent()}

          <div className={styles.navigationButtons}>
            {currentStep > 1 && (
              <button onClick={handlePrevious} className={styles.prevBtn}>
                <FiChevronLeft /> Previous
              </button>
            )}
            {currentStep < 4 ? (
              <button onClick={handleNext} className={styles.nextBtn}>
                Next <FiChevronRight />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !termsAccepted}
                className={styles.placeOrderBtn}
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>
            )}
          </div>
        </div>

        <aside className={styles.orderSummary}>
          <h3>Order Summary</h3>
          {items.map((item) => (
            <div key={item.productId} className={styles.summaryItem}>
              <img src={item.image} alt={item.name} />
              <div>
                <p>{item.name}</p>
                <p>Qty: {item.quantity}</p>
              </div>
              <span>Rs. {item.price * item.quantity}</span>
            </div>
          ))}
          <div className={styles.summaryBreakdown}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>Rs. {orderSummary.subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax (18%):</span>
              <span>Rs. {orderSummary.tax.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping:</span>
              <span>{orderSummary.shippingCost === 0 ? 'FREE' : `Rs. ${orderSummary.shippingCost}`}</span>
            </div>
            {orderSummary.discount > 0 && (
              <div className={styles.summaryRow}>
                <span>Discount:</span>
                <span className={styles.discount}>-Rs. {orderSummary.discount.toFixed(2)}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <strong>Total:</strong>
              <strong>Rs. {orderSummary.total.toFixed(2)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
