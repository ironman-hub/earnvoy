import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import SocialLinks from "./SocialLinks.jsx";

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col items-center gap-3 text-center text-sm text-ink/50">
        <div className="flex items-center gap-4">
          <Logo className="text-lg" />
          <SocialLinks />
        </div>
        <p className="text-xs font-semibold text-ink/60">Terms &amp; Conditions</p>
        <p className="max-w-xl text-xs text-ink/40">
          earnvoy connects travellers and senders only. We are not a courier, escrow service,
          payment guarantor, or insurance provider, and we don't inspect items or handle customs
          declarations. Meet in public places, photograph items, exchange receipts, and use a
          written agreement. Travellers are responsible for checking what they carry; senders
          remain legally responsible for their shipment. Read the full{" "}
          <Link to="/terms" className="underline">Terms &amp; Conditions</Link>.
        </p>
      </div>
    </footer>
  );
}
