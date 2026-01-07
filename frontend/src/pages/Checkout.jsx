import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiChevronRight, FiChevronLeft, FiPlus, FiX } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
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
import { clearCart } from '../redux/slices/cartSlice';
import { fetchAddresses, addAddress } from '../redux/slices/userSlice';
import AddressManager from '../components/user/AddressManager';
import api from '../services/api';
import styles from '../styles/Checkout.module.css';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const STEPS = [
  { id: 1, title: 'Shipping Address' },
  { id: 2, title: 'Shipping Method' },
  { id: 3, title: 'Payment' },
  { id: 4, title: 'Review Order' },
];

const CheckoutInner = ({ stripe, elements }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal } = useSelector((state) => state.cart);
  const { addresses } = useSelector((state) => state.user);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { currentStep, shippingAddress, shippingMethod, paymentMethod, orderSummary } = useSelector(
    (state) => state.checkout
  );
  const stripeEnabled = Boolean(publishableKey);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
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
  const [guestAddress, setGuestAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
  });
  const [cardError, setCardError] = useState('');
  const [cardCompletion, setCardCompletion] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });
  const cardComplete = cardCompletion.number && cardCompletion.expiry && cardCompletion.cvc;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    dispatch(validateCheckout()).catch(() => {
      // Ignore validation errors for guests
    });
    if (isAuthenticated) {
      dispatch(fetchAddresses()).catch(() => {
        // Ignore fetch errors
      });
    } else {
      setShowAddressForm(true);
    }
    return () => {
      dispatch(resetCheckout());
    };
  }, [dispatch, items.length, navigate, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setShippingAddress(guestAddress));
    }
  }, [guestAddress, dispatch, isAuthenticated]);

  useEffect(() => {
    if (shippingMethod) {
      dispatch(calculateCheckout(shippingMethod));
    }
  }, [dispatch, shippingMethod]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (isAuthenticated && !shippingAddress) {
        alert('Please select a shipping address');
        return;
      }
      if (!isAuthenticated) {
        const requiredFields = ['fullName', 'email', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
        const missing = requiredFields.filter((field) => !guestAddress[field]?.trim());
        if (missing.length > 0) {
          alert('Please fill out all required address fields.');
          return;
        }
      }
    }
    dispatch(nextStep());
  };

  const handlePrevious = () => {
    dispatch(previousStep());
  };

  const selectedAddress = addresses.find((addr) => addr._id === selectedAddressId) || null;
  const isDefaultSelected = Boolean(selectedAddress?.isDefault);

  useEffect(() => {
    if (selectedAddressId && !addresses.some((addr) => addr._id === selectedAddressId)) {
      setSelectedAddressId(null);
      dispatch(setShippingAddress(null));
    }
  }, [addresses, selectedAddressId, dispatch]);

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((addr) => addr._id === addressId);
    dispatch(setShippingAddress(address));
  };

  const handleAddressCardClick = (event, addressId) => {
    if (selectedAddressId === addressId) {
      event.preventDefault();
      setSelectedAddressId(null);
      dispatch(setShippingAddress(null));
    }
  };

  const toggleAddressForm = () => {
    setShowAddressForm((prev) => {
      const next = !prev;
      if (next) {
        setSelectedAddressId(null);
        dispatch(setShippingAddress(null));
      }
      return next;
    });
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

    if (paymentMethod === 'stripe') {
      if (!stripeEnabled) {
        alert('Online card payments are temporarily unavailable.');
        return;
      }
      if (!cardComplete) {
        alert('Please enter your card details.');
        return;
      }
    }

    setIsSubmitting(true);
    let stripePaymentIntentId = null;

    if (paymentMethod === 'stripe' && stripeEnabled) {
      if (!stripe || !elements) {
        alert('Payment form is not ready yet. Please wait a moment and try again.');
        setIsSubmitting(false);
        return;
      }
      setIsPaying(true);
      setCardError('');
      try {
        console.log('[Checkout] Creating payment intent...');
        const { data } = await api.post('/checkout/payment/stripe/create-intent', {
          shippingMethod,
        });
        console.log('[Checkout] Payment intent created:', data.paymentIntentId);
        
        const cardElement = elements.getElement(CardNumberElement);
        console.log('[Checkout] Card element retrieved:', !!cardElement);
        
        if (!cardElement) {
          setCardError('Unable to access card input. Please refresh the page and try again.');
          setIsPaying(false);
          setIsSubmitting(false);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        
        const billingDetails = {
          name: shippingAddress?.fullName || guestAddress.fullName || 'Customer',
          email: user?.email || guestAddress.email || '',
          phone: shippingAddress?.phone || guestAddress.phone || '',
        };
        console.log('[Checkout] Billing details:', billingDetails);
        console.log('[Checkout] Client secret received:', !!data.clientSecret);
        console.log('[Checkout] Stripe instance ready:', !!stripe);
        console.log('[Checkout] Elements instance ready:', !!elements);
        console.log('[Checkout] Starting card payment confirmation...');
        
        let confirmation;
        try {
          confirmation = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: billingDetails,
            },
          });
          console.log('[Checkout] Payment confirmation completed');
        } catch (err) {
          console.error('[Checkout] Stripe confirmCardPayment threw error:', err);
          setCardError(err.message || 'Payment confirmation failed');
          setIsPaying(false);
          setIsSubmitting(false);
          return;
        }
        
        console.log('[Checkout] Payment confirmation result:', confirmation);
        
        if (confirmation.error) {
          console.error('[Checkout] Payment error:', confirmation.error);
          setCardError(confirmation.error.message || 'Payment failed. Please try another card.');
          setIsPaying(false);
          setIsSubmitting(false);
          return;
        }
        if (confirmation.paymentIntent?.status !== 'succeeded') {
          console.error('[Checkout] Payment status not succeeded:', confirmation.paymentIntent?.status);
          setCardError('Payment was not completed. Please try again.');
          setIsPaying(false);
          setIsSubmitting(false);
          return;
        }
        stripePaymentIntentId = confirmation.paymentIntent.id;
        console.log('[Checkout] Payment succeeded! Intent ID:', stripePaymentIntentId);
        setIsPaying(false);
        cardElement.clear();
      } catch (error) {
        console.error('[Checkout] Payment exception:', error);
        console.error('[Checkout] Error details:', {
          message: error.message,
          response: error.response?.data,
          stack: error.stack
        });
        setCardError(error.response?.data?.message || error.message || 'Payment failed.');
        setIsPaying(false);
        setIsSubmitting(false);
        return;
      }
    }

    console.log('[Checkout] Creating order with payment intent:', stripePaymentIntentId);
    const result = await dispatch(
      createOrder({
        shippingAddress,
        shippingMethod,
        paymentMethod,
        guestEmail: !isAuthenticated ? guestAddress.email : undefined,
        guestPhone: !isAuthenticated ? guestAddress.phone : undefined,
        stripePaymentIntentId,
      })
    );

    console.log('[Checkout] Order creation result:', result);
    
    if (createOrder.fulfilled.match(result)) {
      const createdOrder = result.payload.order;
      dispatch(clearCart());
      console.log('[Checkout] Order created successfully:', createdOrder._id);
      navigate(`/order-success/${createdOrder._id}`);
    } else {
      console.error('[Checkout] Order creation failed:', result);
      setCardError('Order creation failed. Please contact support.');
    }
    setIsSubmitting(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        if (!isAuthenticated) {
          return (
            <div className={styles.stepContent}>
              <h2>Enter Shipping Details</h2>
              <form className={styles.addressForm}>
                <div className={styles.formRow}>
                  <div>
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={guestAddress.fullName}
                      onChange={(e) => setGuestAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={guestAddress.email}
                      onChange={(e) => setGuestAddress((prev) => ({ ...prev, email: e.target.value }))}
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
                      value={guestAddress.phone}
                      onChange={(e) => setGuestAddress((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={guestAddress.city}
                      onChange={(e) => setGuestAddress((prev) => ({ ...prev, city: e.target.value }))}
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
                      value={guestAddress.state}
                      onChange={(e) => setGuestAddress((prev) => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={guestAddress.postalCode}
                      onChange={(e) => setGuestAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={guestAddress.addressLine1}
                    onChange={(e) => setGuestAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label>Address Line 2 (optional)</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={guestAddress.addressLine2}
                    onChange={(e) => setGuestAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
                  />
                </div>
              </form>
            </div>
          );
        }
        return (
          <div className={styles.stepContent}>
            <div className={styles.addressHeader}>
              <h2>Select Shipping Address</h2>
              <div className={styles.addressHeaderActions}>
                {!showAddressForm && !isDefaultSelected && (
                  <button type="button" className={styles.addAddressBtn} onClick={toggleAddressForm}>
                    <FiPlus /> Add New
                  </button>
                )}
                {showAddressForm && (
                  <button
                    type="button"
                    className={`${styles.addAddressBtn} ${styles.cancelBtn}`}
                    onClick={toggleAddressForm}
                  >
                    <FiX /> Cancel
                  </button>
                )}
              </div>
            </div>
            {!showAddressForm && addresses.length === 0 ? (
              <div className={styles.noAddresses}>
                <p>No saved addresses found</p>
                <AddressManager />
              </div>
            ) : null}
            {!showAddressForm && addresses.length > 0 ? (
              <div className={styles.addressList}>
                {addresses.map((address, index) => {
                  const key = address._id || `address-${index}`;
                  const isSelected = selectedAddressId === address._id;
                  const showDefaultBadge = address.isDefault && !isSelected;
                  return (
                    <label
                      key={key}
                      className={`${styles.addressCard} ${isSelected ? styles.selectedCard : ''}`}
                      onClick={(event) => handleAddressCardClick(event, address._id)}
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
            ) : null}
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
                  disabled={orderSummary.total > 20000}
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
            {paymentMethod === 'stripe' && !stripeEnabled && (
              <div className={styles.cardPaymentSection}>
                <p className={styles.warning}>
                  Stripe publishable key is missing. Online payments are temporarily unavailable.
                </p>
              </div>
            )}
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
            {paymentMethod === 'stripe' && stripeEnabled && (
              <div className={styles.cardPaymentSection}>
                <h3>Card Details</h3>
                <div className={styles.cardGrid}>
                  <label className={styles.cardField}>
                    <span>Card Number</span>
                    <CardNumberElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#1f2937',
                            '::placeholder': { color: '#9ca3af' },
                          },
                          invalid: {
                            color: '#f87171',
                          },
                        },
                      }}
                      onChange={(event) => {
                        setCardCompletion((prev) => ({ ...prev, number: event.complete }));
                        setCardError(event.error?.message || '');
                      }}
                    />
                  </label>
                  <label className={styles.cardField}>
                    <span>Expiry</span>
                    <CardExpiryElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#1f2937',
                            '::placeholder': { color: '#9ca3af' },
                          },
                          invalid: {
                            color: '#f87171',
                          },
                        },
                      }}
                      onChange={(event) => {
                        setCardCompletion((prev) => ({ ...prev, expiry: event.complete }));
                        setCardError(event.error?.message || '');
                      }}
                    />
                  </label>
                  <label className={styles.cardField}>
                    <span>CVC</span>
                    <CardCvcElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#1f2937',
                            '::placeholder': { color: '#9ca3af' },
                          },
                          invalid: {
                            color: '#f87171',
                          },
                        },
                      }}
                      onChange={(event) => {
                        setCardCompletion((prev) => ({ ...prev, cvc: event.complete }));
                        setCardError(event.error?.message || '');
                      }}
                    />
                  </label>
                </div>
                {cardError && <p className={styles.errorText}>{cardError}</p>}
              </div>
            )}
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
                disabled={isSubmitting || isPaying || !termsAccepted || (paymentMethod === 'stripe' && !stripeEnabled)}
                className={styles.placeOrderBtn}
              >
                {isSubmitting || isPaying ? 'Processing...' : 'Place Order'}
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

const CheckoutWithElements = () => {
  const stripe = useStripe();
  const elements = useElements();
  return <CheckoutInner stripe={stripe} elements={elements} />;
};

const Checkout = () => {
  if (!stripePromise) {
    return <CheckoutInner stripe={null} elements={null} />;
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: 'en' }}>
      <CheckoutWithElements />
    </Elements>
  );
};

export default Checkout;
