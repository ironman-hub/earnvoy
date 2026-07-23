import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await api.post("/auth/request-password-reset", { email });
    setMessage(res.data.message);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16 space-y-3">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-ink/60">We'll email a reset link to the address you registered with.</p>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" type="email" placeholder="Your account email" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary w-full">Send reset link</button>
      </form>
      {message && <p className="text-sm text-ink/70">{message}</p>}
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token: params.get("token"), newPassword });
      setMessage("Password reset. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "Couldn't reset password.");
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16 space-y-3">
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" type="password" placeholder="New password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)} />
        <button className="btn-primary w-full">Update password</button>
      </form>
      {message && <p className="text-sm text-ink/70">{message}</p>}
    </div>
  );
}
