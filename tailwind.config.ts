import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#004ac6",
        "primary-container": "#2563eb",
        "on-primary": "#ffffff",
        "on-primary-container": "#eeefff",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "inverse-primary": "#b4c5ff",

        "secondary": "#006d30",
        "secondary-container": "#80f89a",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#007233",
        "secondary-fixed": "#83fb9d",
        "secondary-fixed-dim": "#66de83",

        "tertiary": "#4d556b",
        "tertiary-container": "#656d84",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#eef0ff",
        "tertiary-fixed": "#dae2fd",

        "surface": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface-bright": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-variant": "#e0e3e5",
        "on-surface": "#191c1e",
        "on-surface-variant": "#434655",

        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "outline": "#737686",
        "outline-variant": "#c3c6d7",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "brand-navy": "#10257d",
        "brand-green": "#009645",
        "brand-red": "#E31E24",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;