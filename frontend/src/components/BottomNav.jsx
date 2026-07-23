import React from "react";
import { NavLink } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import SocialLinks from "./SocialLinks.jsx";
import { SUPPORT_WHATSAPP_LINK } from "../constants/whatsapp.js";

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
        `flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 gap-0.5 text-[10px] leading-none font-medium transition ${
          isActive ? "text-signal" : "text-ink/50"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <IconCmp className={`w-5 h-5 shrink-0 transition ${isActive ? "scale-110" : ""}`} />
          <span className="truncate max-w-full">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const { user } = useAuth();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line flex flex-col"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-center gap-4 py-1 border-b border-line/60">
        <SocialLinks className="gap-1" iconClassName="w-[18px] h-[18px] p-1.5 -m-1.5" />
        <a
          href={SUPPORT_WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="flex items-center justify-center p-1.5 -m-1.5"
          style={{ color: "#25D366" }}
        >
          <FaWhatsapp className="w-[18px] h-[18px]" />
        </a>
      </div>
      <div className="flex">
        <Item to="/" label="Feed" IconCmp={Icon.feed} />
        <Item to="/create-listing" label="Post" IconCmp={Icon.post} />
        {user ? (
          <Item to="/dashboard" label="Dashboard" IconCmp={Icon.dashboard} />
        ) : (
          <Item to="/login" label="Login" IconCmp={Icon.account} />
        )}
        {user?.role === "ADMIN" && <Item to="/admin" label="Admin" IconCmp={Icon.admin} />}
      </div>
    </nav>
  );
}
