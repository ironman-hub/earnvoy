import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa6";

// Support number is only ever embedded in the href below - never rendered as visible text.
const SUPPORT_WHATSAPP_LINK =
  "https://wa.me/447377129015?text=" + encodeURIComponent("Hi earnvoy, I need help with...");

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fixed z-40 bottom-20 right-4 md:bottom-6 md:right-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-inkDeep text-paper text-xs font-medium px-3 py-1.5 rounded-md shadow-lg"
          >
            Chat with us
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={SUPPORT_WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onClick={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lift"
        style={{ backgroundColor: "#25D366" }}
      >
        {/* Gentle pulsing ring to draw the eye without being obnoxious */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: "#25D366" }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <FaWhatsapp className="w-7 h-7 relative" />
      </a>
    </div>
  );
}
