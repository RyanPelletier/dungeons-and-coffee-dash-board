import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f3e6cf",
        ink: "#241611",
        ember: "#b5442e",
        emberDark: "#8f3322",
        moss: "#4c6b4a",
        gold: "#c9a13b",
        night: "#1b1410",
        nightSoft: "#2a201a",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
