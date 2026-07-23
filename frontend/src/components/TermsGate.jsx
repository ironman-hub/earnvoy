import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

// Keep this in sync with TERMS_VERSION in the backend .env
export const CURRENT_TERMS_VERSION = "2026-07-23";

export default function TermsGate() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const needsAcceptance = user && (!user.termsAcceptedAt || user.termsVersion !== CURRENT_TERMS_VERSION);

  async function agree() {
    setLoading(true);
    try {
      await api.post("/users/accept-terms");
      await refreshUser();
    } finally {
      setLoading(false);
    }
  }

  function decline() {
    logout();
    navigate("/login");
  }

  return (
    <AnimatePresence>
      {needsAcceptance && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-t-2xl md:rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            <h2 className="text-xl font-bold mb-2">Terms &amp; disclaimer</h2>
            <p className="text-sm text-ink/70 mb-3">
              EarnVoy only connects travellers and senders. We are not a courier, escrow service,
              payment guarantor, or insurance provider, and we take no part in customs declarations
              or inspections.
            </p>
            <p className="text-sm text-ink/70 mb-3">
              Travellers accept responsibility for checking what they carry. Senders remain legally
              responsible for their shipment. Please meet in public places, photograph items,
              exchange receipts, and use a written agreement between yourselves.
            </p>
            <p className="text-sm text-ink/70 mb-5">
              By continuing, you confirm you'll act with due diligence and follow all applicable
              flight, customs, and postal regulations.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={decline}>Decline &amp; close</button>
              <button className="btn-primary flex-1" onClick={agree} disabled={loading}>
                {loading ? "..." : "Agree & continue"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
