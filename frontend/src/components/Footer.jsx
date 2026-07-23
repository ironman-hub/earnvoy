import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import SocialLinks from "./SocialLinks.jsx";

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col items-center gap-3 text-center text-sm text-ink/50">
        <Logo className="text-lg" />
        <SocialLinks className="mt-1" />
        <div className="flex items-center gap-4 mt-2">
          <Link to="/terms" className="hover:text-ink">Terms &amp; conditions</Link>
        </div>
        <p className="max-w-xl text-xs text-ink/40 mt-1">
          earnvoy connects users only - not a courier, escrow, or insurance provider.
        </p>
      </div>
    </footer>
  );
}
