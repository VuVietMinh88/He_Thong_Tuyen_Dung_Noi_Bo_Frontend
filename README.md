# Hệ thống tuyển dụng nội bộ — Frontend

Team K3S4_N3. React + TypeScript + Vite.
Ứng dụng có màn hình đăng nhập, kiểm tra kết nối Backend và quản lý tài khoản nhân sự.

## Chạy cùng Backend

1. Dùng Node.js đáp ứng engines của dependencies, chạy `npm ci`.
2. Sao chép `.env.example` thành `.env`:
   `VITE_API_BASE_URL=http://localhost:8080/api/v1`.
3. Trong repository Backend, cấu hình PostgreSQL qua `.env`, đặt `SERVER_PORT=8080`, `CORS_ALLOWED_ORIGINS=http://localhost:5173`, chạy `./mvnw.cmd spring-boot:run` (Linux/macOS: `sh ./mvnw spring-boot:run`).
4. Chạy `npm run dev`, mở `http://localhost:5173/health` để kiểm tra kết nối Backend.
5. Trong Network của trình duyệt, kiểm tra GET `http://localhost:8080/api/v1/health`, HTTP 200 và JSON `{"status":"UP"}`.

Vite cố định port 5173 và báo lỗi nếu port bị chiếm để không vô tình lệch origin CORS.
Đổi `.env` cần khởi động lại Vite; build production cần cấu hình URL trước `npm run build`.
Biến `VITE_*` được đưa vào client, không đặt secret.

## Cách gọi API

`src/services/api.ts` là client fetch dùng chung, lấy base URL từ môi trường, timeout 10 giây và chuẩn hóa lỗi HTTP/network/JSON.
`src/services/healthService.ts` gọi `getJson('/health')` và kiểm tra contract `status: "UP"`.
`src/services/user.service.ts` gọi API tạo tài khoản và ánh xạ lỗi email trùng thành thông báo tiếng Việt.
`src/components/AccountList/CreateAccountModal.tsx` validate form, khóa nút khi gửi và hiển thị thông báo sau khi tạo tài khoản.
`src/utils/axiosClient.ts` dùng base URL `/api/v1` và đính kèm access token cho các request cần xác thực, ngoại trừ request đăng nhập.
`src/services/auth.service.ts` gọi `POST /auth/login`, xác thực response `accessToken` và thông tin người dùng.
`src/utils/axiosClient.ts` dùng chung base URL `/api/v1` và gửi access token dưới dạng Bearer cho các request cần xác thực.
`src/App.tsx` hiển thị trạng thái health check chờ/thành công/lỗi; các dashboard hiện là route giao diện tạm thời.

Nếu có lỗi kết nối: kiểm tra Backend/PostgreSQL, URL, port và origin CORS. Trình duyệt không luôn phân biệt được lỗi mạng với lỗi CORS; xem Network/Console để xác định.

## Kiểm tra

- `npm test`: Vitest kiểm tra URL/health, lỗi HTTP/network/timeout/JSON/configuration, contract login/accessToken và tạo tài khoản/email trùng bằng mock.
- `npm run build`: TypeScript và Vite production build.
- `npm run lint`: Oxlint.
- `npm run preview`: mặc định origin khác dev; nếu kiểm tra API qua preview cần cấu hình Backend cho origin đó.

Mock tests không chứng minh kết nối runtime hoặc CORS trong browser. Cần chạy hai ứng dụng và PostgreSQL để kiểm tra thực tế.

## Git Flow

Branch `feature/TKNHTTDNB1-584-integrate-api` được tạo từ develop.
Branch cá nhân feature/bugfix/refactor/chore → PR + review ít nhất một thành viên + CI/test → develop.
Develop ổn định → PR + review → main. Không push trực tiếp main/develop.
Conflict xử lý trên branch cá nhân, test/build lại trước merge.
