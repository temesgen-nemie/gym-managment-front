import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1115",
        slate: "#0a0d12",
        panel: "#ffffff",
        accent: "#f4ab20",
        accentDark: "#cb8400",
        sand: "#f5f6f8",
        warning: "#c2410c",
        pine: "#1a1f27",
        line: "#e9ebef"
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        panel: "0 28px 70px -34px rgba(4, 8, 15, 0.24)",
        float: "0 34px 90px -36px rgba(244, 171, 32, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
