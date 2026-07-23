import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import PaymentPanel from "../components/PaymentPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState("");
  const [showReport, setShowReport] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get(`/listings/${id}`);
    setListing(res.data.listing);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function fileReport() {
    if (!reportReason) return;
    await api.post("/reports", { listingId: id, targetUserId: listing.owner?.id, reason: reportReason });
    toast.success("Report filed - our team will review it.");
    setShowReport(false);
    setReportReason("");
  }

  if (loading) return <div className="p-8 text-center text-ink/50">Loading...</div>;
  if (!listing) return <div className="p-8 text-center text-ink/50">Listing not found.</div>;

  const isOwner = user && listing.owner?.id === user.id;
  const hasContact = !!listing.owner?.email;
  const isTraveller = listing.type === "TRAVELLER";

  return (
    <motion.div
      className="max-w-lg mx-auto px-4 py-10 pb-24 space-y-6"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
    >
      <div>
        <span className="text-xs uppercase tracking-wide text-ink/50">{isTraveller ? "Traveller" : "Sender"}</span>
        <h1 className="text-3xl font-bold font-mono">{listing.departureAirport} &rarr; {listing.destinationAirport}</h1>
        <p className="text-ink/60 mt-1">
          {new Date(listing.departureDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          {" -> "}
          {new Date(listing.arrivalDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="card p-4 space-y-2">
        <p className="text-sm">
          Posted by <strong>{listing.owner?.username}</strong>
          {listing.owner?.isVerifiedBadge && <span className="badge-verified ml-2">Verified</span>}
        </p>
        {isTraveller && listing.availableSpaceKg && <p className="text-sm">Space available: {listing.availableSpaceKg}kg</p>}
        {listing.incentiveOffer && <p className="text-sm">Incentive offered: {listing.incentiveOffer}</p>}
        {listing.notes && <p className="text-sm text-ink/70">{listing.notes}</p>}
        <div className="flex flex-wrap gap-1 pt-1">
          {(listing.categories || []).map((c) => (
            <span key={c} className="text-xs bg-ink/5 px-2 py-0.5 rounded-full">{c}</span>
          ))}
        </div>
      </div>

      {hasContact ? (
        <div className="card p-4 space-y-1 border-route/40 bg-route/5">
          <p className="text-sm font-semibold text-route">Contact details unlocked</p>
          <p className="text-sm">Full name: {listing.owner.fullName}</p>
          <p className="text-sm">Email: {listing.owner.email}</p>
          <p className="text-sm">Phone: {listing.owner.phone}</p>
          <p className="text-xs text-ink/50 pt-2">
            Meet in public, photograph items, exchange receipts, and use a written agreement.
          </p>
        </div>
      ) : (
        !isOwner && user && (
          <div>
            <p className="text-sm text-ink/60 mb-2">
              Unlock this listing owner's full name, phone number, and email for £1.75.
            </p>
            <PaymentPanel
              startEndpoint="/payments/unlock"
              listingId={id}
              amountLabel="£1.75"
              onDone={() => { toast.success("Contact details unlocked"); load(); }}
            />
          </div>
        )
      )}

      {!user && <p className="text-sm text-alert">Log in to unlock this listing's contact details.</p>}

      {isOwner && (
        <div className="card p-4">
          <p className="text-sm text-ink/60">
            This is your listing. Once someone unlocks your contact details it'll show here as
            "Secured" - accept the match once you've agreed together, or decline to reopen it to
            the feed for someone else.
          </p>
        </div>
      )}

      {user && !isOwner && (
        <button className="text-xs text-ink/40 underline" onClick={() => setShowReport((s) => !s)}>
          Report this listing
        </button>
      )}
      {showReport && (
        <div className="card p-4 space-y-2">
          <textarea className="input" placeholder="What's wrong with this listing?" value={reportReason}
            onChange={(e) => setReportReason(e.target.value)} />
          <button className="btn-secondary w-full" onClick={fileReport}>Submit report</button>
        </div>
      )}
    </motion.div>
  );
}
