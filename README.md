# Hệ Thống Thông Tin Bệnh Viện MedCare (HIS)

## Giới thiệu dự án

- **MedCare** là hệ thống HIS toàn diện hỗ trợ:
  - Đăng ký bệnh nhân
  - Đặt lịch khám và quản lý hàng đợi
  - Thu ngân, thanh toán
  - Phòng thí nghiệm
  - Kê đơn (có hỗ trợ AI nhưng không bắt buộc)
- Dự án được phát triển theo phong cách **Vibe Coding** – lập trình viên tập trung vào việc định hướng ý tưởng, thiết kế luồng nghiệp vụ và sử dụng trợ lý AI (AI Coding Assistant) để sinh và tối ưu hóa mã nguồn.

---

## Công nghệ sử dụng

- **Frontend**: React, Vite, Tailwind CSS, JavaScript, HTML/CSS
- **Backend**: Node.js, Express, Socket.io, Nodemon, dotenv
- **Database**: MySQL (schema trong `backend/database/schema.sql`)
- **AI (tùy chọn)**: Gemini API (Gemini-Pro) với cơ chế dự phòng (fallback) tự động
- **Integration Services**: Axios, Socket.io

---

## Tính năng chính

- **Quản lý bệnh nhân**: đăng ký, chỉnh sửa, xem danh sách (theo vai trò)
- **Lịch khám & hàng đợi**:
  - Bác sĩ chỉ thấy bệnh nhân của mình
  - Lễ tân check‑in và tạo lịch mới
  - Admin xem và chỉnh sửa mọi lịch
- **Thu ngân**: đăng ký thanh toán, chỉnh sửa thời gian khám, tạo biên lai
- **Phòng thí nghiệm**: tạo báo cáo lab tự động (AI) hoặc nhập thủ công
- **Kê đơn**: hỗ trợ gợi ý thuốc bằng AI, có chế độ dự phòng
- **Cập nhật thời gian thực**: Socket.io đồng bộ trạng thái hàng đợi, thanh toán, lịch khám
- **Quyền truy cập**: dựa trên vai trò (bác sĩ, lễ tân, admin)

---

## API – Endpoint chi tiết

> Tất cả API có tiền tố: `/api/v1`

- **Xác thực (`/auth`)**
  - `POST /auth/login` – Trả về JWT token cho người dùng
  - `POST /auth/register` – Đăng ký nhân viên mới (chỉ dành cho Admin)
- **Bệnh nhân (`/patients`)**
  - `GET /patients` – Xem danh sách bệnh nhân (tự động phân quyền hiển thị theo vai trò)
  - `POST /patients` – Tạo hồ sơ bệnh nhân mới (đăng ký nhanh)
  - `PUT /patients/:id` – Cập nhật thông tin bệnh nhân
  - `DELETE /patients/:id` – Xóa bệnh nhân khỏi hệ thống (chỉ dành cho Admin)
- **Lịch khám & hàng đợi (`/appointments`)**
  - `GET /appointments` – Lấy danh sách lịch khám (bác sĩ chỉ thấy của mình, admin thấy tất cả)
  - `POST /appointments` – Tạo lịch khám / check‑in bệnh nhân vào hàng đợi khám
  - `PUT /appointments/:id` – Chỉnh sửa thời gian khám, trạng thái lịch hoặc gán bác sĩ
  - `DELETE /appointments/:id` – Hủy lịch khám
- **Kê đơn & Viện phí (`/clinical`)**
  - `POST /clinical/prescribe` – Bác sĩ thực hiện kê đơn thuốc
  - `POST /clinical/ai-suggest` – Tạo gợi ý đơn thuốc tự động bằng Gemini AI
  - `GET /clinical/pending` – Danh sách đơn thuốc đang chờ dược sĩ phát
  - `POST /clinical/:id/dispense` – Dược sĩ xác nhận đã cấp phát thuốc thành công
  - `GET /clinical/invoices` – Thu ngân: Lấy danh sách hóa đơn viện phí chưa thanh toán
  - `POST /clinical/invoices/:id/pay` – Thu ngân: Ghi nhận thanh toán (đã thu tiền)
- **Phòng thí nghiệm / Cận lâm sàng (`/labs`)**
  - `GET /labs` – Lấy danh sách yêu cầu chỉ định xét nghiệm
  - `POST /labs/request` – Bác sĩ chỉ định cận lâm sàng (yêu cầu xét nghiệm/chụp chiếu)
  - `PUT /labs/:id/result` – Cập nhật kết quả xét nghiệm (hỗ trợ upload tệp kết quả đính kèm)
  - `POST /labs/ai-result` – Tự động phân tích và tạo kết quả cận lâm sàng gợi ý từ AI

---

## Cài đặt & chạy dự án

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/medcare-his.git
   cd medcare-his
   ```
2. **Thiết lập môi trường**
   - Backend: sao chép `backend/.env.example` → `backend/.env` và điền:
     ```text
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=YOUR_MYSQL_PASSWORD
     DB_NAME=hospital_db
     GEMINI_API_KEY=YOUR_GEMINI_API_KEY   # tùy chọn
     PORT=5000
     ```
   - Frontend: sao chép `frontend/.env.example` → `frontend/.env` (thông thường không cần sửa).
3. **Cài dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```
4. **Tạo cơ sở dữ liệu & nhập dữ liệu mẫu**
   ```bash
   # Tạo database và bảng
   mysql -u root -p < backend/database/schema.sql

   # Nhập dữ liệu mẫu (seed)
   cd backend
   npm run db:seed
   ```
5. **Chạy chế độ phát triển**
   ```bash
   # Backend
   cd backend
   npm run dev   # nodemon, http://localhost:5000

   # Frontend
   cd ../frontend
   npm run dev   # Vite, http://localhost:5173
   ```
6. **Build cho production** (tùy chọn)
   ```bash
   # Backend
   cd backend
   npm run build   # nếu có biên dịch

   # Frontend
   cd ../frontend
   npm run build   # tạo thư mục dist/
   ```
   Phục vụ `frontend/dist` bằng server tĩnh (NGINX, Apache, …).

---

## Đóng góp

- Fork repo
- Tạo nhánh tính năng: `git checkout -b feature/<tên>`
- Viết test cho endpoint mới
- Đảm bảo code tuân thủ ESLint & Prettier
- Gửi Pull Request kèm mô tả và (nếu muốn) video / GIF demo

---

## Giấy phép

Dự án được cấp phép **MIT License** – xem file `LICENSE` để biết chi tiết.

---

*README được tạo tự động bởi Antigravity – trợ lý lập trình AI.*
