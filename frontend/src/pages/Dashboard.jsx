import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_LABEL = { LIVE: "Live", PENDING: "Secured", MATCHED: "Matched", REMOVED: "Removed", EXPIRED: "Expired" };

function ListingsTab() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api.get("/listings/mine");
    setListings(res.data.listings);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(listingId, unlockId, accept) {
    try {
      await api.post(`/listings/${listingId}/decide`, { unlockId, accept });
      toast.success(accept ? "Match confirmed" : "Request declined");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't update.");
    }
  }

  async function remove(listingId) {
    if (!confirm("Delete this listing? Any pending buyers will be automatically refunded.")) return;
    await api.delete(`/listings/${listingId}`);
    toast.success("Listing removed.");
    load();
  }

  if (loading) return <p className="text-ink/50 text-sm">Loading...</p>;
  if (listings.length === 0) return <p className="text-ink/50 text-sm">You haven't posted anything yet.</p>;

  return (
    <div className="space-y-3">
      {listings.map((l) => {
        const pendingUnlock = l.unlocks?.find((u) => u.accepted === null);
        return (
          <div key={l.id} className="card p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono font-semibold">{l.departureAirport} &rarr; {l.destinationAirport}</p>
                <p className="text-xs text-ink/50">{new Date(l.departureDate).toLocaleDateString("en-GB")}</p>
              </div>
              <span className="text-xs bg-ink/5 px-2 py-1 rounded-full">{STATUS_LABEL[l.status] || l.status}</span>
            </div>
            {pendingUnlock && (
              <div className="mt-3 border-t border-line pt-3 flex items-center justify-between text-sm">
                <span><strong>{pendingUnlock.buyer.username}</strong> wants to connect</span>
                <div className="flex gap-2">
                  <button className="btn-secondary py-1 px-3 text-xs" onClick={() => decide(l.id, pendingUnlock.id, false)}>Decline</button>
                  <button className="btn-primary py-1 px-3 text-xs" onClick={() => decide(l.id, pendingUnlock.id, true)}>Accept</button>
                </div>
              </div>
            )}
            {l.status !== "REMOVED" && (
              <button className="text-xs text-alert underline mt-3" onClick={() => remove(l.id)}>Delete listing</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments").then((res) => { setPayments(res.data.payments); setLoading(false); });
  }, []);

  async function downloadReceipt(paymentId, receiptNumber) {
    const res = await api.get(`/payments/${paymentId}/receipt`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnvoy-receipt-${receiptNumber}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-ink/50 text-sm">Loading...</p>;
  if (payments.length === 0) return <p className="text-ink/50 text-sm">No transactions yet.</p>;

  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div key={p.id} className="card p-3 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{p.type === "LISTING_FEE" ? "Listing fee" : "Contact unlock fee"} - £{p.amount.toFixed(2)}</p>
            <p className="text-xs text-ink/50">{new Date(p.createdAt).toLocaleString("en-GB")} - {p.method} - {p.status}</p>
          </div>
          {p.status === "SUCCEEDED" && (
            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => downloadReceipt(p.id, p.receiptNumber)}>
              Receipt (PDF)
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const { user, logout } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");

  async function changePassword(e) {
    e.preventDefault();
    try {
      await api.post("/auth/change-password", passwords);
      setMessage("Password updated.");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setMessage(err.response?.data?.error || "Couldn't update password.");
    }
  }

  async function deleteAccount() {
    if (!confirm("This will permanently delete your account. Continue?")) return;
    await api.delete("/users/me");
    logout();
    window.location.href = "/";
  }

  return (
    <div className="space-y-6 max-w-sm">
      <div className="card p-4 space-y-1 text-sm">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Status:</strong> {user.isVerifiedBadge ? "Verified" : "Not fully verified yet"}</p>
      </div>

      <form onSubmit={changePassword} className="card p-4 space-y-2">
        <p className="font-medium text-sm">Change password</p>
        <input className="input" type="password" placeholder="Current password" value={passwords.currentPassword}
          onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
        <input className="input" type="password" placeholder="New password" value={passwords.newPassword}
          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
        <button className="btn-primary w-full">Update password</button>
        {message && <p className="text-xs text-ink/60">{message}</p>}
      </form>

      <button className="text-xs text-alert underline" onClick={deleteAccount}>Delete my account</button>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("listings");

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-10 pb-24"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
    >
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex gap-2 mb-6 no-scrollbar overflow-x-auto">
        {[["listings", "My listings"], ["payments", "History & receipts"], ["settings", "Account"]].map(([key, label]) => (
          <button key={key}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${tab === key ? "bg-ink text-paper" : "bg-ink/5"}`}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "listings" && <ListingsTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "settings" && <SettingsTab />}
    </motion.div>
  );
}
