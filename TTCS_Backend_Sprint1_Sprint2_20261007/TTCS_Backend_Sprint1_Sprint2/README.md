# Backend TTCS — gói chạy thử Sprint 1 + Sprint 2

Gói này dành cho bạn frontend chạy API trên máy mình. Có file Java đã build, mã nguồn, 14 migration PostgreSQL và tài liệu API. Mã của 40 subtask backend Sprint 2 được ghép từ 6 nhánh local; danh sách và commit nằm trong `MANIFEST.json`. Đây là bản bàn giao để tích hợp FE; xem kết quả kiểm tra và giới hạn tại `VERIFICATION.md` và `KNOWN_ISSUES.md`.

Giải nén toàn bộ ZIP trước khi chạy. Mở PowerShell trong thư mục có README này. Chọn **một** trong hai cách dưới đây. Gói không chứa frontend.

## Cách 1 — Docker Compose

Máy cần Docker Desktop đang chạy, dùng Linux containers. Lần đầu cần Internet để tải các image. Không cần cài riêng Java hay PostgreSQL.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Initialize-Environment.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-Docker.ps1
```

Lệnh đầu tạo `.env` và mật khẩu mới. Lệnh sau chạy PostgreSQL 16, hộp thư thử Mailpit và backend. Giữ cửa sổ mở, chờ dòng `Started RecruitmentApplication`, rồi thử đăng nhập. Backend tự tạo bảng khi kết nối CSDL lần đầu.

- Backend: http://localhost:8080/api/v1
- Kiểm tra server: http://localhost:8080/api/v1/health
- Đọc email kích hoạt/đặt lại mật khẩu: http://localhost:8025

Nhấn **Ctrl+C** để dừng. Nếu muốn gỡ các container sau đó, chạy `docker compose down` trong thư mục gói; dữ liệu vẫn ở volume. Không thêm `-v` nếu muốn giữ dữ liệu. Lần sau chỉ chạy `Run-Docker.ps1`.

Cấu hình dùng `service_healthy` để chờ PostgreSQL sẵn sàng theo [hướng dẫn Docker Compose](https://docs.docker.com/compose/how-tos/startup-order/). Image Java dùng [Eclipse Temurin](https://hub.docker.com/_/eclipse-temurin).

## Cách 2 — Java + PostgreSQL cài trực tiếp trên Windows

Máy cần Java 21 trở lên và PostgreSQL 16 đang chạy. Không cần IntelliJ, VS Code hoặc Maven để chạy JAR có sẵn. Có thể mở thư mục `source` trong IDE bất kỳ nếu muốn sửa code.

Kiểm tra Java:

```powershell
java -version
```

Thiết lập lần đầu:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Initialize-Environment.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\New-Database.ps1
```

`New-Database.ps1` hỏi mật khẩu tài khoản **postgres bạn đã đặt lúc cài PostgreSQL**. Script tạo CSDL và tài khoản ứng dụng mới tên `ttcs_handoff`, dùng mật khẩu riêng trong `.env`; không cần sao chép database từ máy Lập. Nếu database hoặc user đã tồn tại, script dừng và giữ nguyên dữ liệu. Nếu đã thiết lập thành công trước đó thì bỏ qua bước này.

Nếu PostgreSQL không nằm ở đường dẫn thông thường:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\New-Database.ps1 -PostgresBin 'D:\PostgreSQL\16\bin'
```

Chạy backend:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-Backend.ps1
```

Giữ cửa sổ mở. Nhấn **Ctrl+C** để dừng. Dữ liệu vẫn nằm trong PostgreSQL. Lần sau chỉ cần chạy lại `Run-Backend.ps1`.

Để thử gửi email ở cách Java, cần thêm SMTP. Có thể tải Mailpit cho Windows theo [hướng dẫn chính thức](https://mailpit.axllent.org/docs/install/), giải nén và chạy `mailpit.exe` ở cửa sổ riêng. Mailpit mặc định nhận SMTP tại `127.0.0.1:1025`, đọc thư ở http://localhost:8025, khớp `.env` của gói. Không cần hộp thư thật. Nếu chưa chạy SMTP, đăng nhập admin vẫn dùng được, nhưng luồng gửi email kích hoạt/khôi phục mật khẩu chưa dùng được.

## Tài khoản đăng nhập và thử API

Sau lần khởi động đầu tiên, mở `.env` bằng trình soạn thảo và xem:

```text
BOOTSTRAP_ADMIN_EMAIL=admin@ttcs.test
BOOTSTRAP_ADMIN_PASSWORD=...mật khẩu được sinh trên máy người nhận...
```

Đây là tài khoản đăng nhập giao diện/API. `DB_USERNAME` và `DB_PASSWORD` là tài khoản kết nối PostgreSQL, không dùng để đăng nhập giao diện. Mật khẩu ở máy Lập không đi kèm gói này.

Mở PowerShell thứ hai tại thư mục gói và chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-Api.ps1
```

Script thử health, đăng nhập và API có xác thực, chỉ in trạng thái/email/vai trò. Sau khi bạn đổi mật khẩu admin qua API, script dùng mật khẩu khởi tạo sẽ không còn đăng nhập được; dùng mật khẩu mới để kiểm tra thủ công.

Đổi `BOOTSTRAP_ADMIN_PASSWORD` trong `.env` **không** đổi mật khẩu tài khoản đã tồn tại. Bootstrap chỉ tạo admin khi bảng tài khoản trống. Có thể đặt `BOOTSTRAP_ADMIN_ENABLED=false` sau khi khởi tạo.

## Frontend kết nối như thế nào?

Đặt API base URL trong cấu hình frontend thành `http://localhost:8080/api/v1`. Tên biến cấu hình phụ thuộc frontend của bạn. Mặc định cho phép hai origin `http://localhost:5173` và `http://localhost:3000`; sửa `CORS_ALLOWED_ORIGINS` trong `.env` nếu dùng origin khác và khởi động lại backend.

Đăng nhập: `POST /auth/login`, body JSON gồm `email` và `password`. Đọc đúng các field response:

```javascript
const accessToken = response.accessToken;
const roles = response.user.roles; // mảng, ví dụ ["ADMIN"]
// Gửi khi gọi API cần quyền:
// Authorization: Bearer <accessToken>
```

Nếu dùng Axios thì `response` ở ví dụ trên là `axiosResponse.data`. Không đọc `token` hoặc `user.role`. Quyền/vai trò và body từng API được mô tả trong `docs/api`. Các ID tài khoản/phòng ban/chức danh là UUID của database máy bạn; không dùng ID trên máy Lập.

| Nhóm API | Tài liệu |
|---|---|
| Đăng nhập, token, đặt lại mật khẩu | `docs/api/auth.md`, `password-reset.md` |
| Tài khoản, vai trò, khóa/mở khóa, import Excel | `accounts.md`, `account-roles.md`, `account-locking.md`, `account-import.md` |
| Hồ sơ và avatar | `profile.md`, `avatars.md` |
| Phòng ban và chức danh | `departments.md`, `positions.md` |
| Khung năng lực, tiêu chí đánh giá, câu hỏi phỏng vấn | `competency-frameworks.md`, `evaluation-criteria.md`, `interview-questions.md` |
| Danh mục tuyển dụng, trang công ty và ảnh | `recruitment-catalogs.md`, `company-profile.md` |
| Yêu cầu tuyển dụng | `requisitions.md` |

Mọi tên file trong bảng nằm dưới `docs/api/`. Database mới có admin, vai trò và quyền theo migration; dữ liệu phòng ban/chức danh/yêu cầu tuyển dụng do bạn tạo qua API. Không có dữ liệu cá nhân hoặc bản sao database đang làm việc.

Vai trò ADMIN không tự có mọi quyền nghiệp vụ. Theo seed hiện tại, tạo/sửa chức danh có dải lương cần HR_MANAGER. Admin có thể cấp vai trò bằng API quản lý vai trò; xem `docs/api/account-roles.md`. Phản hồi 403 ở trường hợp này là quy tắc quyền của dự án, không phải sai mật khẩu.

## Khi cần đổi cổng hoặc sửa mã nguồn

Nếu cổng 8080 đã có chương trình khác, sửa `SERVER_PORT=8081` trong `.env`, chạy lại backend và đổi base URL frontend. Nếu PostgreSQL cài trực tiếp không dùng cổng 5432, sửa cả `DB_PORT` và cổng trong `DB_URL`. Với Docker, backend dùng mạng nội bộ của Compose và PostgreSQL không mở cổng ra máy chủ.

Thư mục `source` chứa Maven Wrapper, pom, src và migration. Để tự build, cần **JDK 21+**; lần đầu Maven cần Internet tải dependency:

```powershell
cd .\source
.\mvnw.cmd clean verify
```

JAR mới nằm ở `source/target/ttcs-backend-0.0.1-SNAPSHOT.jar`. Sao chép nó đè `backend/ttcs-backend.jar` khi muốn chạy bản bạn vừa sửa. `source/database/migrations` được Maven đóng vào JAR; không cần chạy SQL tạo bảng bằng tay. Các file `database/migrations` bên ngoài là bản tham khảo cùng phiên bản.

Để chạy/debug trực tiếp trong IntelliJ, Eclipse hoặc VS Code có hỗ trợ Java, mở `source/pom.xml` dưới dạng dự án Maven và chọn JDK 21+. Đặt **working directory** của cấu hình chạy thành thư mục gốc gói (nơi có `.env`), để ứng dụng đọc đúng cấu hình. Các script chạy JAR có sẵn tự đặt thư mục này, nên có thể dùng mà không cần cấu hình IDE.

Gói này dùng CSDL **mới**. Không trỏ nó vào database demo cũ của Lập: các nhánh Sprint 2 từng có lịch sử migration khác nhau. Nếu muốn nâng cấp một CSDL đang có dữ liệu, phải kiểm tra Flyway history và backup riêng.

Thư mục gói không có `.git`, `.env` thật, dữ liệu PostgreSQL vật lý hay thư mục cache. Giữ `.env` được tạo trên máy người nhận ở máy đó; nếu gửi tiếp gói, gửi ZIP gốc.
