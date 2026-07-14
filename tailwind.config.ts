import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        panel: "#0F0F0F",
        panelMuted: "#141414",
        line: "#262626",
        accent: "#D4D4D4",
        danger: "#737373",
        glow: "#E5E5E5",
        sand: "#FAFAFA",
        "bg-deep": "var(--bg-deep)",
        "bg-surface": "var(--bg-surface)",
        "bg-elevated": "var(--bg-elevated)",
        "glow-sky": "var(--glow-sky)",
        "signal-emerald": "var(--signal-emerald)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)"
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)"
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)"
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)"
        },
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.6)"
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 255, 255, 0.06), transparent 55%), linear-gradient(180deg, #050505 0%, #000000 100%)"
      }
    }
  },
  plugins: []
};

export default config;
