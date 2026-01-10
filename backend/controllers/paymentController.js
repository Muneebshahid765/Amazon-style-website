import Stripe from 'stripe';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured. Set it in your environment variables.');
}

const stripe = new Stripe(stripeSecretKey);
const SUBSCRIPTION_BILLING_CYCLES = ['monthly', 'yearly'];

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

      const metadata = paymentIntent.metadata || {};
      const isSubscriptionIntent = metadata.intentType === 'subscription';

      if (isSubscriptionIntent) {
        const billingCycle = SUBSCRIPTION_BILLING_CYCLES.includes(metadata.billingCycle)
          ? metadata.billingCycle
          : 'monthly';

        let transaction = await SubscriptionTransaction.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!transaction) {
          if (!metadata.userId || !metadata.planId) {
            console.error(
              `[stripe] Subscription intent missing userId/planId metadata for payment intent ${paymentIntent.id}`
            );
            return res.status(400).json({ error: 'Invalid subscription metadata' });
          }

          transaction = await SubscriptionTransaction.create({
            user: metadata.userId,
            plan: metadata.planId,
            amount: Number(((paymentIntent.amount_received || paymentIntent.amount || 0) / 100).toFixed(2)),
            currency: (paymentIntent.currency || 'pkr').toUpperCase(),
            billingCycle,
            paymentMethod: 'stripe',
            status: 'processing',
            stripePaymentIntentId: paymentIntent.id,
            paymentDetails: {
              receiptEmail: paymentIntent.receipt_email || metadata.email,
            },
          });
        }

        if (transaction.status === 'succeeded') {
          console.log(`[stripe] Transaction ${transaction._id} already processed.`);
          return res.json({ received: true, message: 'Already processed' });
        }

        const user = await User.findById(transaction.user);
        const plan = await SubscriptionPlan.findById(transaction.plan);

        if (!user || !plan) {
          console.error(
            `[stripe] Unable to activate subscription, user or plan missing for transaction ${transaction._id}`
          );
          return res.status(404).json({ error: 'Subscription target not found' });
        }

        let durationDays = plan.durationDays || 30;
        if (transaction.billingCycle === 'yearly') {
          durationDays *= 12;
        }

        const now = new Date();
        const renewDate = new Date(now);
        renewDate.setDate(renewDate.getDate() + durationDays);

        user.currentPlan = plan._id;
        user.planStatus = 'active';
        user.planAssignedAt = now;
        user.planCycleStartedAt = now;
        user.planRenewsAt = renewDate;
        user.planUsage = { uploadsUsed: 0, editsUsed: 0, deletesUsed: 0 };
        await user.save();

        transaction.status = 'succeeded';
        transaction.amount =
          transaction.amount ||
          Number(((paymentIntent.amount_received || paymentIntent.amount || 0) / 100).toFixed(2));
        transaction.stripeChargeId = paymentIntent.latest_charge;
        if (paymentIntent.charges?.data?.[0]) {
          const charge = paymentIntent.charges.data[0];
          transaction.paymentDetails = {
            cardLast4: charge.payment_method_details?.card?.last4,
            cardBrand: charge.payment_method_details?.card?.brand,
            receiptEmail: charge.receipt_email || user.email,
          };
        }
        await transaction.save();

        await sendEmail({
          to: user.email,
          subject: `Your ${plan.name} plan is active`,
          html: `
            <h2>Thanks for upgrading!</h2>
            <p>Hello ${user.firstName || user.email},</p>
            <p>Your <strong>${plan.name}</strong> plan is now active.</p>
            <ul>
              <li>Billing cycle: <strong>${transaction.billingCycle}</strong></li>
              <li>Total paid today: <strong>PKR ${transaction.amount.toFixed(2)}</strong></li>
              <li>Renews on: <strong>${renewDate.toLocaleDateString()}</strong></li>
            </ul>
            <p>You can cancel or change your plan anytime from your dashboard.</p>
          `,
        });

        console.log(`[stripe] Subscription activated for user ${user._id}`);
        return res.json({ received: true });
      }

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

      const transaction = await SubscriptionTransaction.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (transaction) {
        transaction.status = 'failed';
        transaction.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
        await transaction.save();
        console.log(`[stripe] Subscription transaction ${transaction._id} marked as failed.`);
        return res.json({ received: true });
      }

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
