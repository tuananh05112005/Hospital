/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a", // Navy Blue-900 (Quyền lực, chuyên nghiệp)
        secondary: "#0f766e", // Teal-700 (Lâm sàng, Y tế)
        accent: "#be123c", // Rose-700 (Khẩn cấp, đỏ máu/chữ thập)
        background: "#f1f5f9", // Slate-100 (Nhấn trầm trang nghiêm)
        surface: "#ffffff",
      }
    },
  },
  plugins: [],
}
