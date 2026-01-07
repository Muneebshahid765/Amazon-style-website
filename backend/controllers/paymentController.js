import Stripe from 'stripe';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured. Set it in your environment variables.');
}

const stripe = new Stripe(stripeSecretKey);

const createPaymentIntent = async (req, res, next) => {
  try {
    const { shippingMethod = 'standard' } = req.body;

    const userId = req.user?._id;
    const guestId = req.guestId;

    console.log(`[Payment] Creating intent for ${userId ? 'user: ' + userId : 'guest: ' + guestId}`);

    const query = userId ? { user: userId } : { guestId };
    const cart = await Cart.findOne(query).populate('coupon');

    if (!cart || cart.items.length === 0) {
      console.error('[Payment] Cart is empty');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const subtotal = cart.subtotal;
    const tax = subtotal * 0.18;

    const shippingCost =
      shippingMethod === 'express' ? 500 : subtotal >= 5000 ? 0 : 200;

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

    console.log(`[Payment] Calculated total: PKR ${total} (subtotal: ${subtotal}, tax: ${tax}, shipping: ${shippingCost}, discount: ${discount})`);

    if (total <= 0) {
      console.error('[Payment] Total is zero or negative');
      return res
        .status(400)
        .json({ message: 'Calculated total must be greater than zero' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'pkr',
      metadata: {
        guestId: guestId || '',
        userId: userId?.toString() || '',
      },
    });

    console.log(`[Payment] Payment intent created: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });
  } catch (error) {
    console.error('[Payment] Error creating payment intent:', error);
    next(error);
  }
};

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[stripe] Missing STRIPE_WEBHOOK_SECRET env variable.');
    return res.status(500).send('Stripe webhook secret is not configured on the server.');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[stripe] Webhook event received: ${event.type}`);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log(`[stripe] Payment succeeded: ${paymentIntent.id}`);

      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

      if (!order) {
        console.error(`[stripe] Order not found for payment intent: ${paymentIntent.id}`);
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.isPaid) {
        console.log(`[stripe] Order ${order._id} already marked as paid. Skipping update.`);
        return res.json({ received: true, message: 'Already processed' });
      }

      const expectedAmount = Math.round(order.totalPrice * 100);
      if (paymentIntent.amount_received !== expectedAmount) {
        console.error(
          `[stripe] Amount mismatch for order ${order._id}: expected ${expectedAmount}, received ${paymentIntent.amount_received}`
        );
        return res.status(400).json({ error: 'Amount mismatch' });
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'processing';
      await order.save();

      console.log(`[stripe] Order ${order._id} marked as paid and processing.`);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      console.log(`[stripe] Payment failed: ${paymentIntent.id}`);

      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

      if (order) {
        order.status = 'payment_failed';
        await order.save();
        console.log(`[stripe] Order ${order._id} marked as payment_failed.`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[stripe] Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

const processCOD = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      paymentMethod: 'cod',
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.totalAmount > 20000) {
      return res.status(400).json({
        message: 'COD not available for orders above Rs. 20,000',
      });
    }

    order.status = 'processing';
    await order.save();

    res.json({
      message: 'Order confirmed with Cash on Delivery',
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { createPaymentIntent, handleStripeWebhook, processCOD };
