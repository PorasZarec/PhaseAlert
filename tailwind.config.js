/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '.5',
          },
        },
      },
      animation: {
        "pulse-fast": "pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-faster": "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slower": "pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
