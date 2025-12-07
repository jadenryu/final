import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef0fc',
          100: '#dde1f9',
          200: '#bbc3f3',
          300: '#99a5ed',
          400: '#6678e3',
          500: '#3342d2',
          600: '#2935a8',
          700: '#1f287e',
          800: '#151b54',
          900: '#0a0e2a',
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;