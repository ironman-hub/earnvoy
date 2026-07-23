import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Verifying...");
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    const token = params.get("token");
    if (!token) return setStatus("Missing verification token.");
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        setStatus("Email verified! You can close this tab or head back to earnvoy.");
        try { await refreshUser(); } catch {}
      })
      .catch((err) => setStatus(err.response?.data?.error || "Verification failed."));
  }, [params]); // eslint-disable-line

  return <div className="max-w-md mx-auto px-4 py-16 text-center">{status}</div>;
}

export function VerifyAccount() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-phone", { otp });
      await refreshUser();
      setMessage("Phone verified!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Incorrect code.");
    }
    setLoading(false);
  }

  async function resend() {
    await api.post("/auth/resend-phone-otp");
    setMessage("A new code has been sent by SMS.");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16 space-y-4">
      <h1 className="text-2xl font-bold">Verify your account</h1>
      <p className="text-sm text-ink/60">
        We've sent a confirmation link to your email and a 6-digit code by SMS. Verifying both
        earns you the green Verified badge.
      </p>

      <div className="card p-4 space-y-2">
        <p className="text-sm">Email: {user?.emailVerified ? "Verified" : "Check your inbox for a verification link."}</p>
      </div>

      {!user?.phoneVerified && (
        <form onSubmit={submitOtp} className="card p-4 space-y-2">
          <label className="text-sm font-medium">Enter the SMS code</label>
          <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
          <button className="btn-primary w-full" disabled={loading}>Verify phone</button>
          <button type="button" onClick={resend} className="text-sm underline text-ink/60">Resend code</button>
        </form>
      )}

      {message && <p className="text-sm">{message}</p>}
      <button className="btn-secondary w-full" onClick={() => navigate("/")}>Continue to earnvoy</button>
    </div>
  );
}
