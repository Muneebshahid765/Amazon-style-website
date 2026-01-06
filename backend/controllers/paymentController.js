import Stripe from 'stripe';
import Order from '../models/Order.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'pkr',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    next(error);
  }
};

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: new Date(),
      status: 'processing',
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, {
      status: 'payment_failed',
    });
  }

  res.json({ received: true });
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
