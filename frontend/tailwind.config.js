module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["Inter Tight", "system-ui", "sans-serif"],
        display: ["Unbounded", "Inter Tight", "sans-serif"],
      },
    },
  },
  plugins: [],
};
