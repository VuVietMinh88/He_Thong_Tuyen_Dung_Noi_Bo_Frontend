# Hệ thống tuyển dụng nội bộ — Frontend

Team K3S4_N3. React + TypeScript + Vite.
Ứng dụng kết nối API xác thực, hồ sơ cá nhân, quản lý tài khoản, yêu cầu tuyển dụng,
chức danh, khung năng lực, ngân hàng câu hỏi phỏng vấn và danh mục tuyển dụng.

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
`src/services/user.service.ts` tạo tài khoản qua `POST /accounts` với `fullName`, `email` và danh sách `roles`.
`src/services/userService.ts` ánh xạ `AccountPage`/`AccountView`, lọc theo đúng enum Backend, cập nhật hồ sơ,
khóa/mở khóa và đồng bộ thêm/thu hồi vai trò qua các endpoint `/accounts`.
`src/components/AccountList/CreateAccountModal.tsx` validate form, khóa nút khi gửi và hiển thị thông báo sau khi tạo tài khoản.
`src/utils/axiosClient.ts` dùng base URL `/api/v1` và đính kèm access token cho các request cần xác thực, ngoại trừ request đăng nhập.
`src/services/auth.service.ts` gọi `POST /auth/login`, xác thực response `accessToken` và thông tin người dùng.
`src/services/permission.service.ts` lấy permission codes hiện hành từ `GET /auth/permissions`; menu, route và thao tác tài khoản đối chiếu quyền Backend trả về thay vì suy quyền từ role phía client.
Khi phiên hết hạn, `src/services/sessionDraft.service.ts` lưu bản nháp trong `sessionStorage`, loại trừ mật khẩu/token/secret và khôi phục trang hoặc modal sau khi đăng nhập lại.
`src/components/AccountList/EditAccountModal.tsx` cập nhật họ tên, số điện thoại, chức danh và phòng ban theo các trường Backend hỗ trợ.
`src/utils/axiosClient.ts` dùng chung base URL `/api/v1` và gửi access token dưới dạng Bearer cho các request cần xác thực.
`src/services/business.service.ts` kết nối API hồ sơ, chức danh/phòng ban, yêu cầu tuyển dụng,
liên kết khung năng lực theo chức danh và tiêu chí đánh giá, câu hỏi phỏng vấn, danh mục tuyển dụng. Các trang tại `src/pages/Profile/` và
`src/pages/Recruitment/` chỉ hiển thị thao tác mà permission Backend cho phép; dải lương yêu cầu quyền
SALARY_RANGES tương ứng. Yêu cầu tuyển dụng chỉ tạo/cập nhật bản nháp vì Backend hiện chỉ hỗ trợ trạng thái DRAFT.
Dashboard tổng hợp, quản lý CV/ứng viên và lịch phỏng vấn vẫn là placeholder: Backend hiện chưa có API tương ứng.

Backend `AccountView` không trả danh sách vị trí tuyển dụng đang phụ trách; khi dữ liệu phân công không có,
modal khóa yêu cầu Admin xác nhận đã rà soát bàn giao thay vì giả định tài khoản không có công việc.

Nếu có lỗi kết nối: kiểm tra Backend/PostgreSQL, URL, port và origin CORS. Trình duyệt không luôn phân biệt được lỗi mạng với lỗi CORS; xem Network/Console để xác định.

## Kiểm tra

- `npm test`: Vitest kiểm tra URL/health, lỗi HTTP/network/timeout/JSON/configuration, contract login/accessToken và tạo tài khoản/email trùng bằng mock.
- `npm run build`: TypeScript và Vite production build.
- `npm run lint`: Oxlint.
- `npm run preview`: mặc định origin khác dev; nếu kiểm tra API qua preview cần cấu hình Backend cho origin đó.

Mock tests không chứng minh kết nối runtime hoặc CORS trong browser. Cần chạy hai ứng dụng, PostgreSQL và đăng nhập
bằng tài khoản có permission phù hợp để kiểm tra thực tế. Người chỉ có quyền REQUISITIONS nhưng không có
ORGANIZATION_READ_ALL vẫn xem được yêu cầu; cần quyền tổ chức để tải danh mục chọn chức danh/phòng ban hoặc
quản lý các cấu hình tuyển dụng.

## Git Flow

Branch `feature/TKNHTTDNB1-584-integrate-api` được tạo từ develop.
Branch cá nhân feature/bugfix/refactor/chore → PR + review ít nhất một thành viên + CI/test → develop.
Develop ổn định → PR + review → main. Không push trực tiếp main/develop.
Conflict xử lý trên branch cá nhân, test/build lại trước merge.
