import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["Georgia", "Lora", "serif"],
      },
      colors: {
        background: "#ffffff",
        foreground: "#1a1a1a",
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};
export default config;