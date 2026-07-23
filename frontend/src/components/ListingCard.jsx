import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CATEGORY_LABEL = {
  DOCUMENTS: "Docs", CLOTHING: "Clothing", ELECTRONICS: "Electronics", GIFTS: "Gifts",
  FOOD: "Food", MEDICINES: "Medicines", FRAGILE: "Fragile", OTHER: "Other",
};

const STATUS_LABEL = { LIVE: "Live", PENDING: "Secured", MATCHED: "Matched", EXPIRED: "Expired" };

export default function ListingCard({ listing, index = 0 }) {
  const dep = new Date(listing.departureDate);
  const isTraveller = listing.type === "TRAVELLER";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link
        to={`/listing/${listing.id}`}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-ink text-paper font-mono px-4 py-3 rounded-md shadow-sm hover:shadow-md transition"
      >
        <div className="text-[10px] sm:text-xs uppercase tracking-wider px-2 py-1 rounded bg-paper/10">
          {isTraveller ? "Traveller" : "Sender"}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg overflow-hidden">
          <span className="font-semibold">{listing.departureAirport}</span>
          <span className="text-signal">&rarr;</span>
          <span className="font-semibold">{listing.destinationAirport}</span>
          <span className="text-paper/50 text-xs sm:text-sm whitespace-nowrap">
            {dep.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
          {listing.owner?.isVerifiedBadge && (
            <span className="hidden sm:inline text-route text-xs bg-route/20 px-2 py-0.5 rounded-full">Verified</span>
          )}
          {listing.status && listing.status !== "LIVE" && (
            <span className="text-signal text-xs bg-signal/20 px-2 py-0.5 rounded-full">
              {STATUS_LABEL[listing.status] || listing.status}
            </span>
          )}
        </div>

        <div className="text-[10px] sm:text-xs text-paper/70 text-right">
          {isTraveller && listing.availableSpaceKg ? `${listing.availableSpaceKg}kg free` : ""}
          <div className="hidden sm:flex gap-1 justify-end mt-1 flex-wrap max-w-[220px]">
            {(listing.categories || []).slice(0, 3).map((c) => (
              <span key={c} className="bg-paper/10 px-1.5 py-0.5 rounded text-[10px] uppercase">
                {CATEGORY_LABEL[c] || c}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
