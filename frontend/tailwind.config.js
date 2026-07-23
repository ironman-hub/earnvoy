/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#162F6F",       // brand navy (from logo) - primary text / dark surfaces
        paper: "#F4F5F8",     // pale cool-grey background, complements navy
        signal: "#FE5E25",    // brand orange (from logo) - primary CTA
        route: "#3FB6A8",     // brand teal (from logo) - verified / success accent
        alert: "#D64545",     // errors / warnings
        line: "#DCE1EA",      // hairline borders
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        lift: "0 12px 30px -12px rgba(14,43,46,0.35)",
      },
      keyframes: {
        flip: {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        floatUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        flip: "flip 0.5s ease-in-out",
        floatUp: "floatUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
