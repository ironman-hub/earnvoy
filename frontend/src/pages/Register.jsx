import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PhoneInput from "../components/PhoneInput.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.phone) {
      setError("Enter a valid phone number for your country before continuing.");
      return;
    }
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
        We need your real name for verification and safety - it's never shown publicly. earnvoy
        assigns you a username automatically, and that's all other users see until someone pays to
        unlock your full contact details.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Full legal name (as on passport/ID)</label>
          <input className="input" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input className="input" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Phone number</label>
          <PhoneInput onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Password</label>
          <input className="input" type="password" placeholder="Min 8 characters" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

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
