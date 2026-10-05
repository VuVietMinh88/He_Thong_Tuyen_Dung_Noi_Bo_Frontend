# Hệ thống tuyển dụng nội bộ — Frontend

Team K3S4_N3. Skeleton React + TypeScript + Vite; chưa có trang nghiệp vụ.

## Chạy

Node.js đáp ứng engines của dependency và npm.
`npm ci` → `npm run dev`. Build: `npm run build`; lint: `npm run lint`; preview: `npm run preview`.
Chưa cấu hình test runner; tests/ dành cho test bổ sung theo Subtask.
Sao chép .env.example thành .env nếu cần. VITE_API_BASE_URL chuẩn bị cho API client sau này, hiện skeleton chưa gọi API. Biến VITE_* được đưa vào client, không đặt secret.

## Git Flow

main ổn định, develop tích hợp, được tạo từ main khi initialization.
Mỗi Jira Subtask có branch riêng chứa Subtask ID: feature/, bugfix/, refactor/, chore/.
Branch cá nhân → PR → review ít nhất một thành viên + CI/test → develop.
Develop ổn định → PR + review → main. Không push trực tiếp main/develop.
Conflict xử lý trên branch cá nhân, test/build lại trước merge.
