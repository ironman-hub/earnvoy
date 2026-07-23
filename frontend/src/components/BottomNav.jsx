import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Icon = {
  feed: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  ),
  post: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  dashboard: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  admin: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
    </svg>
  ),
  account: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="3.2" /><path d="M5 20c1.5-4 5-5.5 7-5.5S17.5 16 19 20" strokeLinecap="round" />
    </svg>
  ),
};

function Item({ to, label, IconCmp }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-[11px] font-medium transition ${
          isActive ? "text-signal" : "text-ink/50"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <IconCmp className={`w-6 h-6 transition ${isActive ? "scale-110" : ""}`} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const { user } = useAuth();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Item to="/" label="Feed" IconCmp={Icon.feed} />
      <Item to="/create-listing" label="Post" IconCmp={Icon.post} />
      <Item to="/dashboard" label="Dashboard" IconCmp={Icon.dashboard} />
      {user?.role === "ADMIN" && <Item to="/admin" label="Admin" IconCmp={Icon.admin} />}
      <Item to={user ? "/dashboard" : "/login"} label="Account" IconCmp={Icon.account} />
    </nav>
  );
}
