import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-line bg-white/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/"><Logo className="text-xl" /></Link>

        {/* Full nav on desktop - mobile relies on the bottom nav for primary actions */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-signal">Feed</Link>
          {user && <Link to="/dashboard" className="hover:text-signal">Dashboard</Link>}
          {user && user.role === "ADMIN" && <Link to="/admin" className="hover:text-signal">Admin</Link>}
          {user ? (
            <>
              <span className="text-ink/60 flex items-center gap-1">
                {user.username}
                {user.isVerifiedBadge && <span className="badge-verified">Verified</span>}
              </span>
              <button className="btn-secondary py-1.5 px-3" onClick={() => { logout(); navigate("/"); }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-1.5 px-3">Log in</Link>
              <Link to="/register" className="btn-primary py-1.5 px-3">Sign up</Link>
            </>
          )}
        </nav>

        {/* Mobile: just show verified badge + a compact auth CTA; nav lives in BottomNav */}
        <div className="flex md:hidden items-center gap-2 text-sm">
          {user ? (
            user.isVerifiedBadge && <span className="badge-verified">Verified</span>
          ) : (
            <Link to="/login" className="btn-primary py-1.5 px-3 text-sm">Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
