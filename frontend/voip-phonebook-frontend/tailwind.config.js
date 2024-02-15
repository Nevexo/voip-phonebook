/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'phonebook-primary': '#00668A',
        'phonebook-secondary': '#004E71',
      },
      fontFamily: {
        'Roboto': ['Roboto, sans-serif']
      }
    },
    container: {
      center: true,
      padding: '0.1rem'
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

