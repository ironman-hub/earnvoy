import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", phone: "", password: "", acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.acceptedTerms) {
      setError("You must agree to the terms and conditions to continue.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/verify");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create your account.");
    }
    setLoading(false);
  }

  return (
    <motion.div
      className="max-w-sm mx-auto px-4 py-16"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
    >
      <h1 className="text-2xl font-bold mb-2">Create your account</h1>
      <p className="text-sm text-ink/60 mb-6">
        We need your real name for verification and safety - it's never shown publicly. Other users
        only ever see your username, and your full name and contact details stay hidden until
        someone pays to unlock them.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="input" placeholder="Full legal name (as on passport/ID)" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="input" placeholder="Username (shown publicly)" value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Phone number (with country code)" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" type="password" placeholder="Password (min 8 characters)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input type="checkbox" className="mt-1" checked={form.acceptedTerms}
            onChange={(e) => setForm({ ...form, acceptedTerms: e.target.checked })} />
          I agree to the <Link to="/terms" target="_blank" className="underline">Terms &amp; Conditions</Link>,
          including that earnvoy only connects users and is not responsible for lost, damaged, or
          prohibited items.
        </label>

        {error && <p className="text-alert text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        Already have an account? <Link to="/login" className="underline">Log in</Link>
      </p>
    </motion.div>
  );
}
