import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { stripeClient } from '../config/stripe.js';
import { getItemProductId } from '../utils/cartHelpers.js';
import { sendEmail } from '../utils/sendEmail.js';

const validateCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const guestId = req.guestId;
    const query = userId ? { user: userId } : { guestId };
    const cart = await Cart.findOne(query).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const unavailableItems = [];
    const updatedItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product || product.status !== 'active') {
        unavailableItems.push(item.product.name);
        continue;
      }

      if (product.stock < item.quantity) {
        unavailableItems.push(`${product.name} (only ${product.stock} available)`);
        continue;
      }

      const currentPrice = product.discountPrice || product.price;
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        updatedItems.push(product.name);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        message: 'Some items are unavailable',
        unavailableItems,
      });
    }

    if (updatedItems.length > 0) {
      cart.subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await cart.save();
    }

    res.json({
      valid: true,
      cart: {
        items: cart.items,
        subtotal: cart.subtotal,
      },
      updatedItems,
    });
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user?._id;
    const guestId = req.guestId;
    const query = userId ? { user: userId } : { guestId };
    const cart = await Cart.findOne(query);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    const minOrder = coupon.minOrderValue || coupon.minPurchase;
    if (minOrder && cart.subtotal < minOrder) {
      return res.status(400).json({
        message: `Minimum purchase of Rs. ${minOrder} required`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cart.subtotal * coupon.discountValue) / 100;
      const maxDiscount = coupon.maxDiscountValue ?? coupon.maxDiscount;
      if (maxDiscount) {
        discount = Math.min(discount, maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    cart.coupon = coupon._id;
    await cart.save();

    res.json({
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      newTotal: cart.subtotal - discount,
    });
  } catch (error) {
    next(error);
  }
};

const calculateCheckout = async (req, res, next) => {
  try {
    const { shippingMethod = 'standard' } = req.body;
    const userId = req.user?._id;
    const guestId = req.guestId;
    const query = userId ? { user: userId } : { guestId };
    const cart = await Cart.findOne(query).populate('coupon');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const subtotal = cart.subtotal;
    const tax = subtotal * 0.18;

    let shippingCost = 0;
    if (shippingMethod === 'standard') {
      shippingCost = subtotal >= 5000 ? 0 : 200;
    } else if (shippingMethod === 'express') {
      shippingCost = 500;
    }

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === 'percentage') {
        discount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount) {
          discount = Math.min(discount, cart.coupon.maxDiscount);
        }
      } else {
        discount = cart.coupon.discountValue;
      }
    }

    const total = subtotal + tax + shippingCost - discount;

    res.json({
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      shippingMethod,
      coupon: cart.coupon ? {
        code: cart.coupon.code,
        discount,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress = {},
      shippingMethod,
      paymentMethod,
      guestEmail,
      guestPhone,
      stripePaymentIntentId,
    } = req.body;

    console.log(`[Order] Creating order - Payment method: ${paymentMethod}, Intent ID: ${stripePaymentIntentId}`);

    const userId = req.user?._id;
    const guestId = req.guestId;
    const query = userId ? { user: userId } : { guestId };
    const cart = await Cart.findOne(query).populate('items.product coupon');

    if (!cart || cart.items.length === 0) {
      console.error('[Order] Cart is empty');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    console.log(`[Order] Cart found with ${cart.items.length} items, subtotal: ${cart.subtotal}`);

    const productCache = new Map();

    for (const item of cart.items) {
      const productId = getItemProductId(item);
      const product = productId ? await Product.findById(productId) : null;
      if (product) {
        productCache.set(productId, product);
      }

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product?.name || 'product'}`,
        });
      }
    }

    const subtotal = cart.subtotal;
    const tax = subtotal * 0.18;
    const shippingCost = shippingMethod === 'express' ? 500 : subtotal >= 5000 ? 0 : 200;

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === 'percentage') {
        discount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount) {
          discount = Math.min(discount, cart.coupon.maxDiscount);
        }
      } else {
        discount = cart.coupon.discountValue;
      }
    }

    const total = subtotal + tax + shippingCost - discount;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const orderItems = cart.items.map((item) => {
      const productId = getItemProductId(item);
      const productDoc = productCache.get(productId);

      return {
        product: productId,
        seller: productDoc?.seller || undefined,
        title: productDoc?.title || item.title,
        price: item.price,
        quantity: item.quantity,
        image: productDoc?.images?.[0]?.url || item.image,
        sku: productDoc?.sku || item.sku,
      };
    });

    const mappedAddress = {
      fullName: shippingAddress.fullName || shippingAddress.name || req.user?.fullName || 'Customer',
      phone: shippingAddress.phone || guestPhone || '',
      street: shippingAddress.addressLine1 || shippingAddress.street || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      country: shippingAddress.country || 'Pakistan',
      postalCode: shippingAddress.postalCode || '',
      notes: shippingAddress.notes || '',
    };

    let paymentIntent = null;
    let paymentCardBrand = null;
    let paymentCardLast4 = null;

    if (paymentMethod === 'stripe') {
      if (!stripeClient) {
        return res.status(500).json({ message: 'Stripe is not configured on the server.' });
      }
      if (!stripePaymentIntentId) {
        return res.status(400).json({ message: 'Stripe payment intent is required.' });
      }

      const existingOrder = await Order.findOne({ paymentIntentId: stripePaymentIntentId });
      if (existingOrder) {
        console.warn(`[security] Duplicate order attempt with payment intent: ${stripePaymentIntentId}`);
        return res.status(400).json({ message: 'This payment has already been used for an order.' });
      }

      paymentIntent = await stripeClient.paymentIntents.retrieve(stripePaymentIntentId, {
        expand: ['latest_charge', 'charges.data.payment_method_details'],
      });
      if (!paymentIntent) {
        return res.status(400).json({ message: 'Invalid Stripe payment intent.' });
      }
      if (paymentIntent.status !== 'succeeded') {
        console.warn(`[security] Payment intent not succeeded: ${stripePaymentIntentId}, status: ${paymentIntent.status}`);
        return res
          .status(400)
          .json({ message: 'Stripe payment is not completed. Please try again.' });
      }
      const expectedAmount = Math.round(total * 100);
      if (paymentIntent.amount_received !== expectedAmount) {
        console.error(
          `[security] Amount mismatch - Expected: ${expectedAmount}, Received: ${paymentIntent.amount_received}, Intent: ${stripePaymentIntentId}`
        );
        return res
          .status(400)
          .json({ message: 'Payment amount mismatch. Please contact support.' });
      }
      if (paymentIntent.metadata) {
        if (userId && paymentIntent.metadata.userId && paymentIntent.metadata.userId !== userId.toString()) {
          console.warn(`[security] User ID mismatch for payment intent: ${stripePaymentIntentId}`);
          return res.status(400).json({ message: 'Payment does not belong to this user.' });
        }
        if (
          !userId &&
          paymentIntent.metadata.guestId &&
          paymentIntent.metadata.guestId !== guestId
        ) {
          console.warn(`[security] Guest ID mismatch for payment intent: ${stripePaymentIntentId}`);
          return res.status(400).json({ message: 'Payment does not belong to this guest session.' });
        }
      }
      let charge = null;
      if (paymentIntent.latest_charge) {
        if (typeof paymentIntent.latest_charge === 'string') {
          charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge);
        } else {
          charge = paymentIntent.latest_charge;
        }
      } else if (paymentIntent.charges?.data?.length) {
        charge = paymentIntent.charges.data[0];
      }

      if (charge?.payment_method_details?.card) {
        paymentCardBrand = charge.payment_method_details.card.brand;
        paymentCardLast4 = charge.payment_method_details.card.last4;
      }

      console.log(`[security] Payment verification passed for intent: ${stripePaymentIntentId}`);
    }

    const orderData = {
      orderNumber,
      orderItems,
      shippingAddress: mappedAddress,
      billingAddress: mappedAddress,
      itemsPrice: subtotal,
      taxPrice: tax,
      shippingPrice: shippingCost,
      discount,
      totalPrice: total,
      paymentMethod,
      paymentCardBrand,
      paymentCardLast4,
      currency: 'USD',
      status: paymentMethod === 'cod' ? 'processing' : 'processing',
    };

    if (paymentMethod === 'stripe') {
      orderData.paymentIntentId = paymentIntent.id;
      orderData.isPaid = true;
      orderData.paidAt = new Date();
    } else {
      orderData.status = 'processing';
    }

    // Add user or guest identification
    if (userId) {
      orderData.user = userId;
    } else {
      orderData.guestId = guestId;
      orderData.guestEmail = guestEmail;
      orderData.guestPhone = guestPhone;
    }

    const order = await Order.create(orderData);
    console.log(`[Order] Order created successfully: ${order._id}, Order Number: ${order.orderNumber}`);

    for (const item of cart.items) {
      const productId = getItemProductId(item);
      if (!productId) continue;
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }
    console.log(`[Order] Product stock updated for ${cart.items.length} items`);

    if (cart.coupon) {
      await Coupon.findByIdAndUpdate(cart.coupon._id, {
        $inc: { usedCount: 1 },
      });
      console.log(`[Order] Coupon usage updated: ${cart.coupon._id}`);
    }

    cart.items = [];
    cart.coupon = null;
    cart.subtotal = 0;
    await cart.save();
    console.log(`[Order] Cart cleared`);

    const responsePayload = {
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalPrice,
        status: order.status,
      },
    };

    const recipientEmail = userId ? req.user.email : guestEmail;
    if (recipientEmail) {
      const currencySymbol =
        order.currency === 'USD' ? '$' : order.currency === 'PKR' ? 'Rs. ' : `${order.currency} `;
      const formatCurrency = (value = 0) => `${currencySymbol}${Number(value || 0).toFixed(2)}`;
      const itemsHtml = order.orderItems
        .map(
          (item) => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.title}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.price)}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(
                item.price * item.quantity
              )}</td>
            </tr>`
        )
        .join('');

      const copyHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
          <h2 style="color:#111827;">Thanks for your order, ${mappedAddress.fullName || 'Customer'}!</h2>
          <p>Your order <strong>${order.orderNumber}</strong> has been received. Below is a quick summary.</p>
          <div style="margin:24px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
            <p style="margin:4px 0;"><strong>Order Date:</strong> ${order.createdAt.toDateString()}</p>
            <p style="margin:4px 0;"><strong>Payment Method:</strong> ${
              order.paymentCardBrand
                ? `${order.paymentCardBrand.toUpperCase()}${order.paymentCardLast4 ? ` •••• ${order.paymentCardLast4}` : ''}`
                : order.paymentMethod?.toUpperCase()
            }</p>
            <p style="margin:4px 0;"><strong>Shipping Address:</strong> ${mappedAddress.street}, ${mappedAddress.city}, ${
        mappedAddress.state
      } ${mappedAddress.postalCode}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#111827;color:#fff;text-align:left;">
                <th style="padding:10px 12px;border-top-left-radius:6px;">Item</th>
                <th style="padding:10px 12px;text-align:center;">Qty</th>
                <th style="padding:10px 12px;text-align:right;">Price</th>
                <th style="padding:10px 12px;border-top-right-radius:6px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="text-align:right;margin-bottom:24px;">
            <p style="margin:4px 0;">Items Total: <strong>${formatCurrency(order.itemsPrice)}</strong></p>
            <p style="margin:4px 0;">Tax: <strong>${formatCurrency(order.taxPrice)}</strong></p>
            <p style="margin:4px 0;">Shipping: <strong>${formatCurrency(order.shippingPrice)}</strong></p>
            ${
              order.discount
                ? `<p style="margin:4px 0;">Discount: <strong>- ${formatCurrency(order.discount)}</strong></p>`
                : ''
            }
            <p style="margin:8px 0;font-size:1.1rem;">Grand Total: <strong>${formatCurrency(order.totalPrice)}</strong></p>
          </div>
          <p>You can download your invoice anytime from the order success page or dashboard.</p>
          <p style="margin-top:24px;color:#6b7280;">Team NovaMart</p>
        </div>
      `;

      sendEmail({
        to: recipientEmail,
        subject: `Your NovaMart Order ${order.orderNumber}`,
        html: copyHtml,
      }).catch((emailError) => {
        console.error('[Order] Failed to send confirmation email:', emailError.message);
      });
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export { validateCart, applyCoupon, calculateCheckout, createOrder };
