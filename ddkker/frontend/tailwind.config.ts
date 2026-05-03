import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas:    "#faf9f5",
        primary:   "#5B4FD9",
        "primary-active":   "#4338CA",
        "primary-disabled": "#E5E4F5",
        ink:       "#141413",
        body:      "#3d3d3a",
        muted:     "#6c6a64",
        "muted-soft": "#8e8b82",
        hairline:  "#e6dfd8",
        "hairline-soft": "#ebe6df",
        "surface-soft":  "#f5f0e8",
        "surface-card":  "#efe9de",
        "surface-cream-strong": "#e8e0d2",
        "surface-dark":  "#181715",
        "surface-dark-elevated": "#252320",
        "surface-dark-soft": "#1f1e1b",
        "on-primary": "#ffffff",
        "on-dark":    "#faf9f5",
        "on-dark-soft": "#a09d96",
        success:      "#5db872",
        warning:      "#d4a017",
        error:        "#c64545",
        "accent-teal":  "#5db8a6",
        "accent-amber": "#e8a55a",
        "youtube-red":  "#FF0000",
        "body-strong":  "#252523",
      },
      fontFamily: {
        sans:    ["HakgyoanSimAllimjang", "-apple-system", "sans-serif"],
        serif:   ["HakgyoanSimAllimjang", "-apple-system", "sans-serif"],
        display: ["HakgyoanSimAllimjang", "-apple-system", "sans-serif"],
        mono:    ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        "display-xl": ["56px", { lineHeight: "1.1",  letterSpacing: "-1.2px" }],
        "display-lg": ["44px", { lineHeight: "1.15", letterSpacing: "-0.8px" }],
        "display-md": ["34px", { lineHeight: "1.2",  letterSpacing: "-0.4px" }],
        "display-sm": ["26px", { lineHeight: "1.25", letterSpacing: "-0.2px" }],
        "title-lg":   ["20px", { lineHeight: "1.35" }],
        "title-md":   ["17px", { lineHeight: "1.4"  }],
        "title-sm":   ["15px", { lineHeight: "1.4"  }],
      },
      spacing: { section: "96px" },
      borderRadius: { pill: "9999px" },
    },
  },
  plugins: [typography],
};
export default config;
