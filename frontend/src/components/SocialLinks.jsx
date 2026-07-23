import React from "react";
import { FaFacebook, FaInstagram, FaTiktok, FaXTwitter } from "react-icons/fa6";

// Update these to earnvoy's real handles once the accounts exist.
const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com/earnvoy", Icon: FaFacebook },
  { label: "Instagram", href: "https://instagram.com/earnvoy", Icon: FaInstagram },
  { label: "X", href: "https://x.com/earnvoy", Icon: FaXTwitter },
  { label: "TikTok", href: "https://tiktok.com/@earnvoy", Icon: FaTiktok },
];

export default function SocialLinks({ className = "" }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {SOCIALS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`earnvoy on ${label}`}
          className="text-ink/50 hover:text-signal transition"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}
