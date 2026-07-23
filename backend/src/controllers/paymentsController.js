const prisma = require("../config/prisma");
const config = require("../config");
const stripeService = require("../services/stripeService");
const paynowService = require("../services/paynowService");
const pdfService = require("../services/pdfService");
const emailService = require("../services/emailService");
const { generateReceiptNumber } = require("../utils/tokens");
const { logEvent } = require("../services/auditService");

async function startListingFeePayment(req, res, next) {
  try {
    const { listingId, method, phone } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.ownerId !== req.user.id) return res.status(404).json({ error: "Listing not found." });
    if (listing.listingFeePaid) return res.status(409).json({ error: "This listing's fee has already been paid." });

    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        listingId: listing.id,
        type: "LISTING_FEE",
        method,
        amount: config.fees.listingFeeGbp,
        status: "PENDING",
      },
    });

    if (method === "STRIPE") {
      let customerId = req.user.stripeCustomerId;
      if (!customerId) {
        customerId = await stripeService.createCustomer(req.user);
        await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
      }
      const intent = await stripeService.createPaymentIntent({
        amountGbp: config.fees.listingFeeGbp,
        metadata: { paymentId: payment.id, kind: "LISTING_FEE" },
        customerId,
      });
      await prisma.payment.update({ where: { id: payment.id }, data: { stripePaymentIntentId: intent.id } });
      return res.json({ paymentId: payment.id, clientSecret: intent.client_secret });
    }

    if (method === "ECOCASH") {
      if (!phone) return res.status(400).json({ error: "Phone number required for EcoCash." });
      const result = await paynowService.initiateEcocashPayment({
        reference: payment.id,
        amountGbp: config.fees.listingFeeGbp,
        phone,
        description: "earnvoy listing fee",
        userEmail: req.user.email,
      });
      await prisma.payment.update({ where: { id: payment.id }, data: { paynowPollUrl: result.pollurl } });
      return res.json({ paymentId: payment.id, paynow: result });
    }

    res.status(400).json({ error: "Unsupported payment method." });
  } catch (err) {
    next(err);
  }
}

async function startUnlockPayment(req, res, next) {
  try {
    const { listingId, method, phone } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || !listing.listingFeePaid) return res.status(404).json({ error: "Listing not found." });
    if (listing.ownerId === req.user.id) return res.status(400).json({ error: "You can't unlock your own listing." });
    if (listing.status !== "LIVE") {
      return res.status(409).json({ error: "Someone else has already unlocked this listing - it's secured and no longer available." });
    }

    const existing = await prisma.contactUnlock.findFirst({ where: { listingId, buyerId: req.user.id } });
    if (existing) return res.status(409).json({ error: "You've already unlocked this listing's contact details." });

    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        listingId,
        type: "UNLOCK_FEE",
        method,
        amount: config.fees.unlockFeeGbp,
        status: "PENDING",
      },
    });

    if (method === "STRIPE") {
      let customerId = req.user.stripeCustomerId;
      if (!customerId) {
        customerId = await stripeService.createCustomer(req.user);
        await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
      }
      const intent = await stripeService.createPaymentIntent({
        amountGbp: config.fees.unlockFeeGbp,
        metadata: { paymentId: payment.id, kind: "UNLOCK_FEE" },
        customerId,
      });
      await prisma.payment.update({ where: { id: payment.id }, data: { stripePaymentIntentId: intent.id } });
      return res.json({ paymentId: payment.id, clientSecret: intent.client_secret });
    }

    if (method === "ECOCASH") {
      if (!phone) return res.status(400).json({ error: "Phone number required for EcoCash." });
      const result = await paynowService.initiateEcocashPayment({
        reference: payment.id,
        amountGbp: config.fees.unlockFeeGbp,
        phone,
        description: "earnvoy contact unlock fee",
        userEmail: req.user.email,
      });
      await prisma.payment.update({ where: { id: payment.id }, data: { paynowPollUrl: result.pollurl } });
      return res.json({ paymentId: payment.id, paynow: result });
    }

    res.status(400).json({ error: "Unsupported payment method." });
  } catch (err) {
    next(err);
  }
}

async function finalizePayment(paymentId) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: true, listing: true } });
  if (!payment || payment.status === "SUCCEEDED") return payment; // idempotent

  const receiptNumber = generateReceiptNumber();
  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "SUCCEEDED", receiptNumber },
  });

  if (payment.type === "LISTING_FEE") {
    await prisma.listing.update({ where: { id: payment.listingId }, data: { listingFeePaid: true } });
  }

  if (payment.type === "UNLOCK_FEE") {
    await prisma.$transaction([
      prisma.contactUnlock.create({
        data: { listingId: payment.listingId, buyerId: payment.userId, paymentId: payment.id },
      }),
      prisma.listing.update({ where: { id: payment.listingId }, data: { status: "PENDING" } }), // shown to users as "Secured"
    ]);
  }

  const pdfBuffer = await pdfService.generateReceiptPdf({
    receiptNumber,
    user: payment.user,
    payment: updated,
    listing: payment.listing,
  });
  await emailService.sendReceiptEmail(payment.user, updated, pdfBuffer);
  await prisma.payment.update({ where: { id: paymentId }, data: { receiptEmailedAt: new Date() } });

  await logEvent({
    actorId: payment.userId,
    action: "PAYMENT_SUCCEEDED",
    targetType: "Payment",
    targetId: payment.id,
    metadata: { type: payment.type, amount: payment.amount, method: payment.method },
  });

  return updated;
}

async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const paymentId = intent.metadata && intent.metadata.paymentId;
    if (paymentId) await finalizePayment(paymentId);
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const paymentId = intent.metadata && intent.metadata.paymentId;
    if (paymentId) await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } }).catch(() => {});
  }

  res.json({ received: true });
}

async function paynowWebhook(req, res) {
  try {
    const valid = paynowService.verifyWebhookHash(req.body);
    if (!valid) return res.status(400).send("Invalid hash.");

    const payment = await prisma.payment.findUnique({ where: { id: req.body.reference } });
    if (!payment) return res.status(404).send("Unknown payment reference.");

    if (req.body.status && req.body.status.toLowerCase() === "paid") {
      await finalizePayment(payment.id);
    } else if (["cancelled", "failed"].includes((req.body.status || "").toLowerCase())) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
    res.send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing webhook.");
  }
}

async function confirmPayment(req, res, next) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment || payment.userId !== req.user.id) return res.status(404).json({ error: "Payment not found." });

    if (payment.status === "SUCCEEDED") return res.json({ payment });

    if (payment.method === "STRIPE" && payment.stripePaymentIntentId) {
      const intent = await stripeService.getPaymentIntent(payment.stripePaymentIntentId);
      if (intent.status === "succeeded") {
        const updated = await finalizePayment(payment.id);
        return res.json({ payment: updated });
      }
    }

    if (payment.method === "ECOCASH" && payment.paynowPollUrl) {
      const status = await paynowService.pollPaymentStatus(payment.paynowPollUrl);
      if ((status.status || "").toLowerCase() === "paid") {
        const updated = await finalizePayment(payment.id);
        return res.json({ payment: updated });
      }
    }

    res.json({ payment, message: "Still awaiting confirmation." });
  } catch (err) {
    next(err);
  }
}

async function myPayments(req, res, next) {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

async function downloadReceipt(req, res, next) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { user: true, listing: true },
    });
    if (!payment || payment.userId !== req.user.id) return res.status(404).json({ error: "Receipt not found." });
    if (payment.status !== "SUCCEEDED") return res.status(400).json({ error: "This payment hasn't succeeded yet." });

    const pdfBuffer = await pdfService.generateReceiptPdf({
      receiptNumber: payment.receiptNumber,
      user: payment.user,
      payment,
      listing: payment.listing,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="earnvoy-receipt-${payment.receiptNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

async function processAutoRefunds(unlockIds) {
  for (const unlockId of unlockIds) {
    const unlock = await prisma.contactUnlock.findUnique({ where: { id: unlockId }, include: { payment: true } });
    if (!unlock || !unlock.payment) continue;
    try {
      if (unlock.payment.method === "STRIPE" && unlock.payment.stripePaymentIntentId) {
        await stripeService.refundPaymentIntent(unlock.payment.stripePaymentIntentId);
      }
      // Paynow/EcoCash refunds currently require manual processing via the Paynow
      // merchant dashboard - there is no public refund API endpoint.
      await prisma.payment.update({ where: { id: unlock.payment.id }, data: { status: "REFUNDED" } });
      await logEvent({ action: "AUTO_REFUND_ISSUED", targetType: "Payment", targetId: unlock.payment.id });
    } catch (err) {
      console.error(`Failed to auto-refund payment ${unlock.payment.id}:`, err);
    }
  }
}

module.exports = {
  startListingFeePayment, startUnlockPayment, stripeWebhook, paynowWebhook,
  confirmPayment, myPayments, downloadReceipt, processAutoRefunds, finalizePayment,
};
