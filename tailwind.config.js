/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        ghost: "#F0EFF4",
        graphite: "#1A1A1A",
        deepvoid: "#0A0A14",
        plasma: "#7B61FF",
      },
      fontFamily: {
        instrument: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
}
