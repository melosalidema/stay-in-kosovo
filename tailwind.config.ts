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
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        glow: "0 16px 56px rgba(23, 93, 88, 0.2)",
        glass: "0 16px 50px rgba(22, 31, 44, 0.13)",
        card: "0 10px 30px rgba(22, 31, 44, 0.08)",
        "card-hover": "0 18px 42px rgba(22, 31, 44, 0.14)",
        editorial: "0 8px 22px rgba(22, 31, 44, 0.055)",
        pulse: "0 20px 52px rgba(22, 31, 44, 0.18)"
      },
      backgroundImage: {
        "kosovo-hero":
          "linear-gradient(135deg, rgba(8, 23, 30, 0.82), rgba(24, 93, 88, 0.34), rgba(144, 82, 53, 0.16)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80')",
        "city-night":
          "linear-gradient(135deg, rgba(17, 24, 39, 0.76), rgba(31, 93, 87, 0.28), rgba(144, 82, 53, 0.16)), url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80')"
      }
    }
  },
  plugins: [animate]
};

export default config;
