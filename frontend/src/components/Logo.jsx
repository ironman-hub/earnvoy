import React from "react";
import { motion } from "framer-motion";
import logoMark from "../assets/logo-mark.png";

export default function Logo({ className = "", showMark = true }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      {showMark && (
        <motion.img
          src={logoMark}
          alt="earnvoy"
          className="h-6 w-6 object-contain"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <span className="lowercase">
        earn<span style={{ color: "#FE5E25" }}>voy</span>
      </span>
    </span>
  );
}
