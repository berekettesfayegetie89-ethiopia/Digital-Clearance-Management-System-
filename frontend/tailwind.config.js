/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2B3A67",
          dark: "#1F2A4D",
          light: "#3D5089",
        },
        secondary: {
          DEFAULT: "#0F766E",
          light: "#14958A",
        },
        accent: {
          DEFAULT: "#F4B400",
          dark: "#D89C00",
        },
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        },
        success: { DEFAULT: "#16A34A", bg: "#F0FDF4" },
        warning: { DEFAULT: "#F59E0B", bg: "#FFFBEB" },
        error: { DEFAULT: "#DC2626", bg: "#FEF2F2" },
        info: { DEFAULT: "#2563EB", bg: "#EFF6FF" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(17, 24, 39, 0.04), 0 1px 3px 0 rgba(17, 24, 39, 0.06)",
        "card-hover": "0 4px 10px 0 rgba(17, 24, 39, 0.08)",
        modal: "0 20px 40px -8px rgba(17, 24, 39, 0.25)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};
