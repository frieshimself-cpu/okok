import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["'Instrument Serif'", "Georgia", "serif"],
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        landing: {
          surface: "rgba(255,255,255,0.10)",
          "surface-hover": "rgba(255,255,255,0.16)",
          border: "rgba(255,255,255,0.10)",
          "border-strong": "rgba(255,255,255,0.20)",
          text: "rgba(255,255,255,0.80)",
          "text-muted": "rgba(255,255,255,0.60)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
