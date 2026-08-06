/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep background colors for the glassmorphic dark mode
        background: "#0B1120",
        surface: "#1E293B",

        // Brand accents (Vibrant indigo and cyan)
        primary: {
          DEFAULT: "#6366F1", // Indigo 500
          hover: "#4F46E5", // Indigo 600
          light: "#818CF8", // Indigo 400
        },
        secondary: {
          DEFAULT: "#06B6D4", // Cyan 500
          hover: "#0891B2", // Cyan 600
        },

        // Semantic colors for loan status
        success: "#10B981", // Emerald 500
        warning: "#F59E0B", // Amber 500
        danger: "#EF4444", // Red 500
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
