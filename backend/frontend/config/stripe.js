import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

const stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export { stripeClient };
