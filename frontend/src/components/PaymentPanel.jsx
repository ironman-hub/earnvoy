import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/client";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

function StripeInnerForm({ paymentId, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message);
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.get(`/payments/${paymentId}/confirm`);
      toast.success("Payment confirmed");
      onDone(res.data.payment);
    } catch (err) {
      setError("Payment may have succeeded, but we couldn't confirm it yet. Check your dashboard shortly.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      {error && <p className="text-alert text-sm">{error}</p>}
      <button className="btn-primary w-full" disabled={submitting || !stripe}>
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

/**
 * props:
 *  - startEndpoint: "/payments/listing-fee" or "/payments/unlock"
 *  - listingId
 *  - amountLabel: "£1.75"
 *  - onDone(payment)
 */
export default function PaymentPanel({ startEndpoint, listingId, amountLabel, onDone }) {
  const [method, setMethod] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [phone, setPhone] = useState("");
  const [ecocashStatus, setEcocashStatus] = useState(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const [error, setError] = useState("");

  async function startStripe() {
    setError("");
    setLoadingStart(true);
    try {
      const res = await api.post(startEndpoint, { listingId, method: "STRIPE" });
      setClientSecret(res.data.clientSecret);
      setPaymentId(res.data.paymentId);
      setMethod("STRIPE");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't start payment.");
    }
    setLoadingStart(false);
  }

  async function startEcocash() {
    if (!phone) { setError("Enter the EcoCash-registered phone number."); return; }
    setError("");
    setLoadingStart(true);
    try {
      const res = await api.post(startEndpoint, { listingId, method: "ECOCASH", phone });
      setPaymentId(res.data.paymentId);
      setMethod("ECOCASH");
      setEcocashStatus("A payment prompt has been sent to your phone. Approve it, then tap 'I've approved it'.");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't start EcoCash payment.");
    }
    setLoadingStart(false);
  }

  async function checkEcocash() {
    setLoadingStart(true);
    try {
      const res = await api.get(`/payments/${paymentId}/confirm`);
      if (res.data.payment.status === "SUCCEEDED") {
        toast.success("Payment confirmed");
        onDone(res.data.payment);
      } else {
        setEcocashStatus("Not confirmed yet - approve the USSD prompt on your phone, then try again.");
      }
    } catch (err) {
      setError("Couldn't check payment status.");
    }
    setLoadingStart(false);
  }

  if (!method) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 space-y-3">
        <p className="text-sm text-ink/70">Amount due: <strong>{amountLabel}</strong></p>
        {error && <p className="text-alert text-sm">{error}</p>}
        <button className="btn-primary w-full" onClick={startStripe} disabled={loadingStart}>
          Pay by card (Stripe)
        </button>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input" placeholder="EcoCash phone number, e.g. 0771234567"
            value={phone} onChange={(e) => setPhone(e.target.value)}
          />
          <button className="btn-secondary whitespace-nowrap" onClick={startEcocash} disabled={loadingStart}>
            Pay with EcoCash
          </button>
        </div>
      </motion.div>
    );
  }

  if (method === "STRIPE" && clientSecret) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeInnerForm paymentId={paymentId} onDone={onDone} />
        </Elements>
      </motion.div>
    );
  }

  if (method === "ECOCASH") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 space-y-3">
        <p className="text-sm">{ecocashStatus}</p>
        {error && <p className="text-alert text-sm">{error}</p>}
        <button className="btn-primary w-full" onClick={checkEcocash} disabled={loadingStart}>
          I've approved it - check status
        </button>
      </motion.div>
    );
  }

  return null;
}
