/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
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
        ink: "#0E0E10",
        graphite: "#1D1D21",
        slate: "#6A6A70",
        cloud: "#F5F5F6",
        haze: "#ECECEE",
        carbon: {
          DEFAULT: "#0A0A0B",
          panel: "#141417",
          deep: "#060607",
        },
        blush: "#FFC2D4",
        lilac: "#C9BBFF",
        sky: "#9CD6FF",
        mint: "#B5F5D8",
        // Opportunity tiers for the mind map (color + non-color cue in UI)
        tier: {
          high: "#B5F5D8",
          med: "#C9BBFF",
          low: "#6A6A70",
        },
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
