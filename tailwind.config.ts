import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        /* Warm earth accent used sparingly for "tonight" / activity cues. */
        clay: {
          DEFAULT: "hsl(20 42% 46%)",
          soft: "hsl(24 42% 94%)",
          deep: "hsl(20 42% 30%)"
        },
        stone: {
          DEFAULT: "hsl(45 20% 94%)",
          deep: "hsl(45 16% 88%)"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "Cambria", "serif"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        /* Deliberately restrained: the interface should feel grounded, not floating. */
        soft: "0 1px 2px rgba(38, 38, 38, 0.04), 0 2px 8px rgba(38, 38, 38, 0.035)",
        lift: "0 4px 14px rgba(38, 38, 38, 0.07), 0 1px 3px rgba(38, 38, 38, 0.04)",
        overlay: "0 -8px 30px rgba(38, 38, 38, 0.1)",
        /* Legacy aliases retained so existing markup inherits the calmer elevation. */
        glow: "0 1px 2px rgba(38, 38, 38, 0.05), 0 2px 10px rgba(38, 38, 38, 0.06)",
        glass: "0 1px 2px rgba(38, 38, 38, 0.04), 0 2px 8px rgba(38, 38, 38, 0.035)",
        card: "0 1px 2px rgba(38, 38, 38, 0.04), 0 2px 8px rgba(38, 38, 38, 0.035)",
        "card-hover": "0 4px 14px rgba(38, 38, 38, 0.07), 0 1px 3px rgba(38, 38, 38, 0.04)",
        editorial: "0 1px 2px rgba(38, 38, 38, 0.04), 0 2px 8px rgba(38, 38, 38, 0.035)",
        pulse: "0 4px 14px rgba(38, 38, 38, 0.07), 0 1px 3px rgba(38, 38, 38, 0.04)"
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease-out both"
      }
    }
  },
  plugins: [animate]
};

export default config;
