import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { chai: { 50: "#fff7ed", 100: "#ffedd5", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 800: "#7c2d12", 900: "#431407" } },
      fontFamily: { display: ["Poppins", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
