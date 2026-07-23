import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.emailOrUsername, form.password);
      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't log in.");
    }
    setLoading(false);
  }

  return (
    <motion.div
      className="max-w-sm mx-auto px-4 py-16"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
    >
      <h1 className="text-2xl font-bold mb-1">Log in</h1>
      <p className="text-sm text-ink/60 mb-6">Travellers, senders, and admins all sign in here - your account decides what you see.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="input" placeholder="Email or username" value={form.emailOrUsername}
          onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-alert text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        <Link to="/forgot-password" className="underline">Forgot your password?</Link>
      </p>
      <p className="text-sm text-ink/60 mt-2">
        No account yet? <Link to="/register" className="underline">Sign up</Link>
      </p>
    </motion.div>
  );
}
