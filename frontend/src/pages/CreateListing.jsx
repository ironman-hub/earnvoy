import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import PaymentPanel from "../components/PaymentPanel.jsx";
import AirportSelect from "../components/AirportSelect.jsx";

const CATEGORIES = ["DOCUMENTS", "CLOTHING", "ELECTRONICS", "GIFTS", "FOOD", "MEDICINES", "FRAGILE", "OTHER"];

export default function CreateListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: "TRAVELLER",
    departureAirport: "", destinationAirport: "",
    departureDate: "", arrivalDate: "",
    availableSpaceKg: "", categories: [], incentiveOffer: "", notes: "",
    certifiedNoProhibitedGoods: false,
  });
  const [listingId, setListingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleCategory(c) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.departureAirport || !form.destinationAirport) {
      setError("Pick a departure and destination airport.");
      return;
    }
    if (!form.certifiedNoProhibitedGoods) {
      setError("You must certify that your package contains no prohibited or illegal goods.");
      return;
    }
    if (form.categories.length === 0) {
      setError("Select at least one item category.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, availableSpaceKg: form.availableSpaceKg ? Number(form.availableSpaceKg) : undefined };
      const res = await api.post("/listings", payload);
      setListingId(res.data.listing.id);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create listing.");
    }
    setLoading(false);
  }

  if (listingId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 pb-24 space-y-4">
        <h1 className="text-2xl font-bold">One more step</h1>
        <p className="text-sm text-ink/60">Pay the £1.75 listing fee to publish this on the live feed.</p>
        <PaymentPanel
          startEndpoint="/payments/listing-fee"
          listingId={listingId}
          amountLabel="£1.75"
          onDone={() => navigate(`/listing/${listingId}`)}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-lg mx-auto px-4 py-12 pb-24"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
    >
      <h1 className="text-2xl font-bold mb-1">Post a listing</h1>
      <p className="text-sm text-ink/60 mb-6">Limited to 2 listings per 30 days to keep the feed genuine.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          {["TRAVELLER", "SENDER"].map((t) => (
            <button type="button" key={t}
              className={`flex-1 py-2 rounded-md border transition ${form.type === t ? "bg-ink text-paper border-ink" : "border-line"}`}
              onClick={() => setForm({ ...form, type: t })}>
              {t === "TRAVELLER" ? "I'm travelling (have space)" : "I'm sending (need space)"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AirportSelect value={form.departureAirport} onChange={(v) => setForm({ ...form, departureAirport: v })} placeholder="Departure airport" />
          <AirportSelect value={form.destinationAirport} onChange={(v) => setForm({ ...form, destinationAirport: v })} placeholder="Destination airport" />

          <label className="text-xs text-ink/50 -mb-2">Departure date</label>
          <label className="text-xs text-ink/50 -mb-2">Arrival date</label>
          <input className="input" type="date" value={form.departureDate}
            onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
          <input className="input" type="date" value={form.arrivalDate}
            onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })} />
        </div>

        {form.type === "TRAVELLER" && (
          <input className="input" type="number" step="0.5" placeholder="Available space (kg)"
            value={form.availableSpaceKg} onChange={(e) => setForm({ ...form, availableSpaceKg: e.target.value })} />
        )}

        {form.type === "SENDER" && (
          <input className="input" placeholder="Incentive to offer a traveller (optional)"
            value={form.incentiveOffer} onChange={(e) => setForm({ ...form, incentiveOffer: e.target.value })} />
        )}

        <div>
          <p className="text-sm font-medium mb-2">
            {form.type === "TRAVELLER" ? "Categories you're willing to carry" : "What are you sending?"}
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button type="button" key={c}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${form.categories.includes(c) ? "bg-signal border-signal text-ink" : "border-line"}`}
                onClick={() => toggleCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <textarea className="input" placeholder="Notes (optional)" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input type="checkbox" className="mt-1" checked={form.certifiedNoProhibitedGoods}
            onChange={(e) => setForm({ ...form, certifiedNoProhibitedGoods: e.target.checked })} />
          I certify that my package contains no prohibited or illegal goods.
        </label>

        {error && <p className="text-alert text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Continue to £1.75 listing fee"}
        </button>
      </form>
    </motion.div>
  );
}
