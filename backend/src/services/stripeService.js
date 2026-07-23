const Stripe = require("stripe");
const config = require("../config");

const stripe = new Stripe(config.stripe.secretKey || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

async function createPaymentIntent({ amountGbp, currency = "gbp", metadata = {}, customerId }) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountGbp * 100),
    currency,
    customer: customerId || undefined,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

async function getPaymentIntent(id) {
  return stripe.paymentIntents.retrieve(id);
}

async function createCustomer(user) {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.username,
    metadata: { userId: user.id },
  });
  return customer.id;
}

function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

async function refundPaymentIntent(paymentIntentId) {
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}

module.exports = {
  stripe,
  createPaymentIntent,
  getPaymentIntent,
  createCustomer,
  constructWebhookEvent,
  refundPaymentIntent,
};
