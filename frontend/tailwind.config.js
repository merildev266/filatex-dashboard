/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: 'var(--dark)',
        dark2: 'var(--dark2)',
        dark3: 'var(--dark3)',
        energy: 'var(--energy)',
        props: 'var(--props)',
        capex: 'var(--capex)',
        invest: 'var(--invest)',
        teal: 'var(--teal)',
        danger: 'var(--danger)',
        'dev-blue': 'var(--dev-blue)',
        csi: 'var(--csi)',
        filatex: 'var(--filatex)',
      },
      fontFamily: {
        sans: ['Aeonik', 'sans-serif'],
        serif: ['Aeonik', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
