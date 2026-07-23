import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../api/client";
import ListingCard from "../components/ListingCard.jsx";
import AirportSelect from "../components/AirportSelect.jsx";
import SocialLinks from "../components/SocialLinks.jsx";
import Logo from "../components/Logo.jsx";

export default function Feed() {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ type: "", departureAirport: "", destinationAirport: "", category: "", fromDate: "" });
  const [loading, setLoading] = useState(true);

  async function load(f = filters) {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    const res = await api.get("/listings/feed", { params });
    setListings(res.data.listings);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 md:pb-8">
      <motion.section
        className="relative overflow-hidden rounded-2xl bg-inkDeep text-paper px-6 py-10 md:py-14 mb-8"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-signal/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <h1 className="text-3xl md:text-5xl font-bold font-display max-w-xl relative">
          Spare kilos. Somewhere to send it. <span className="text-signal">Matched by route.</span>
        </h1>
        <p className="text-paper/70 mt-3 max-w-md relative">
          Travellers list their extra baggage space, senders list what they need carried -
          EarnVoy connects the two, verifies identities, and gets out of the way.
        </p>
        <div className="flex gap-3 mt-6 relative">
          <Link to="/create-listing" className="btn-primary">Post a listing</Link>
          <Link to="/terms" className="btn-secondary bg-transparent border-paper/30 text-paper hover:bg-paper/10">
            How it works
          </Link>
        </div>
      </motion.section>

      <div className="flex flex-wrap gap-2 mb-6 no-scrollbar">
        <select className="input w-auto" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All listing types</option>
          <option value="TRAVELLER">Travellers</option>
          <option value="SENDER">Senders</option>
        </select>
        <div className="w-44"><AirportSelect value={filters.departureAirport} onChange={(v) => setFilters({ ...filters, departureAirport: v })} placeholder="From" /></div>
        <div className="w-44"><AirportSelect value={filters.destinationAirport} onChange={(v) => setFilters({ ...filters, destinationAirport: v })} placeholder="To" /></div>
        <input className="input w-auto" type="date" value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
        <select className="input w-auto" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">Any category</option>
          {["DOCUMENTS","CLOTHING","ELECTRONICS","GIFTS","FOOD","MEDICINES","FRAGILE","OTHER"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn-secondary" onClick={() => load()}>Filter</button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-md bg-ink/5 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="card p-10 text-center text-ink/50">
          Nothing matches those filters yet. Be the first to post this route.
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
        </div>
      )}

      <div className="mt-10 text-xs text-ink/40 max-w-2xl">
        earnvoy connects travellers and senders only. We are not a courier, escrow service, payment
        guarantor, or insurance provider, and we don't inspect items or handle customs declarations.
        Meet in public places, photograph items, exchange receipts, and use a written agreement.
        Travellers are responsible for checking what they carry; senders remain legally responsible
        for their shipment. Read the full <Link to="/terms" className="underline">terms</Link>.
      </div>

      {/* Footer with these links is desktop-only, so mobile users get a compact version here */}
      <div className="md:hidden flex items-center justify-center gap-4 mt-10 pt-6 border-t border-line">
        <Logo className="text-base opacity-80" />
        <SocialLinks />
      </div>
    </div>
  );
}
