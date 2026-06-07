/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        rice: {
          50: "#FAF7F0",
          100: "#F5F0E6",
          200: "#EDE5D3",
          300: "#E0D5BC",
          400: "#CFC0A0",
        },
        ink: {
          50: "#F5F3F0",
          100: "#5C5040",
          200: "#443A2B",
          300: "#2C2416",
          400: "#1A150D",
        },
        cinnabar: {
          50: "#FBECEA",
          100: "#E88A7F",
          200: "#D45547",
          300: "#C23A2B",
          400: "#A02E21",
        },
        ochre: {
          100: "#B8956A",
          200: "#9C7A4E",
          300: "#8B4513",
        },
      },
      fontFamily: {
        calligraphy: ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', 'serif'],
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
      },
      boxShadow: {
        'paper': '0 2px 8px rgba(44, 36, 22, 0.08), 0 1px 3px rgba(44, 36, 22, 0.06)',
        'paper-lg': '0 8px 24px rgba(44, 36, 22, 0.12), 0 2px 6px rgba(44, 36, 22, 0.08)',
        'seal': '0 1px 3px rgba(194, 58, 43, 0.4)',
      },
    },
  },
  plugins: [],
};
