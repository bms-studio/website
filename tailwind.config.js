/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050506",
        primary: "#e6e3dc",
        secondary: "#93ab9e",
      },
    },
  },
  plugins: [],
}
