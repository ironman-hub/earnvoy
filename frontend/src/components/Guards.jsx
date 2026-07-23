import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-ink/50">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-ink/50">Loading...</div>;
  if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}
