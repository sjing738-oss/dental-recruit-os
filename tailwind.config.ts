import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 医疗 HR SaaS 深色主题
        bg: { DEFAULT: "#0a0f1c", 2: "#0f1626" },
        card: { DEFAULT: "#141d30", 2: "#1a2440" },
        line: "#243154",
        ink: { DEFAULT: "#e6ecf7", 2: "#93a4c4", 3: "#5e6f90" },
        brand: { DEFAULT: "#22d3ee", 2: "#38bdf8" },
        teal: "#2dd4bf",
        purple: "#a78bfa",
        green: "#34d399",
        amber: "#fbbf24",
        red: "#f87171",
        blue: "#60a5fa",
      },
      fontFamily: {
        sans: ['-apple-system', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)",
      },
    },
  },
  plugins: [],
};

export default config;
