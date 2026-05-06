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
        ink: "#0B1220",
        panel: "#111A2B",
        panelMuted: "#18233A",
        line: "#22314D",
        accent: "#53E3A6",
        danger: "#FF6B6B",
        glow: "#7DD3FC",
        sand: "#DCE6F8"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(4, 10, 24, 0.38)"
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top, rgba(125, 211, 252, 0.16), transparent 32%), radial-gradient(circle at 80% 20%, rgba(83, 227, 166, 0.14), transparent 28%), linear-gradient(180deg, rgba(11, 18, 32, 0.96), rgba(11, 18, 32, 1))"
      }
    }
  },
  plugins: []
};

export default config;
