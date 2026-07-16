/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Nimbus Sans TW01'",
          "'Helvetica Neue'",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        serif: ["'Instrument Serif'", "Georgia", "serif"],
      },
      colors: {
        // Monochrome system with a single iridescent accent (see index.css)
        ink: "#0E0E10", // near-black text + buttons on light
        graphite: "#1D1D21", // hover state for ink surfaces
        slate: "#6A6A70", // muted text on light surfaces
        cloud: "#F5F5F6", // light neutral surface
        haze: "#ECECEE", // slightly deeper light neutral
        carbon: {
          DEFAULT: "#0A0A0B", // dark section background
          panel: "#141417", // raised panel on carbon
          deep: "#060607", // mockup chrome
        },
        // Pastel stops of the iridescent gradient, for solid accents
        blush: "#FFC2D4",
        lilac: "#C9BBFF",
        sky: "#9CD6FF",
        mint: "#B5F5D8",
      },
      boxShadow: {
        lift: "0 24px 48px -24px rgba(10, 10, 11, 0.35)",
        card: "0 16px 40px -20px rgba(10, 10, 11, 0.45)",
        glow: "0 12px 48px -12px rgba(201, 187, 255, 0.55)",
      },
    },
  },
  plugins: [],
};
