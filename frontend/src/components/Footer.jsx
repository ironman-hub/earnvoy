import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between text-sm text-ink/50">
        <Logo className="text-base opacity-70" />
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-ink">Terms &amp; conditions</Link>
          <span>EarnVoy connects users only - not a courier, escrow, or insurance provider.</span>
        </div>
      </div>
    </footer>
  );
}
