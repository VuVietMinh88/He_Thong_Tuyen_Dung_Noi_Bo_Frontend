# Tài liệu API — Backend hệ thống tuyển dụng nội bộ

Ngày tổng hợp: 08/10/2026. Nguồn: repo `He_Thong_Tuyen_Dung_Noi_Bo_Backend`. Tiền tố chung khi gọi từ frontend: `http://localhost:8080` (frontend đặt `VITE_API_BASE_URL=http://localhost:8080/api/v1`).

> **Trạng thái:** API Sprint 1 đã có trong chuỗi PR #3–#23 (chờ review). API Sprint 2 (chức danh, khung năng lực, câu hỏi, yêu cầu tuyển dụng, danh mục, trang công ty, ảnh đại diện, nhập Excel, xóa phòng ban) **mới ở máy, chưa push**; tài liệu có thể còn chỉnh nhỏ khi sửa theo review và gộp chuỗi.

Quy ước chung: gửi `Authorization: Bearer <accessToken>` (trừ API công khai). Thiếu/sai/hết hạn phiên → **401** `UNAUTHORIZED`; đủ phiên nhưng thiếu quyền → **403** `FORBIDDEN`; lỗi dữ liệu → **400** `VALIDATION_ERROR` kèm `fieldErrors`. Danh sách có phân trang trả `{items, page, size, totalElements, totalPages}`. Cột "Quyền" là điều kiện server kiểm thật (lấy từ bảng `ENDPOINTS` của test phân quyền); vai trò nào có quyền nào xem `docs/architecture/role-permission-matrix.md`.

## Xác thực và phiên

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| POST | `/api/v1/auth/activate-account` | Công khai | [xem chi tiết](#api-accounts) |
| POST | `/api/v1/auth/change-password` | `SELF_SECURITY_WRITE` | [xem chi tiết](#api-auth) |
| POST | `/api/v1/auth/forgot-password` | Công khai | [xem chi tiết](#api-password-reset) |
| POST | `/api/v1/auth/login` | Công khai | [xem chi tiết](#api-auth) |
| POST | `/api/v1/auth/logout` | `SELF_SECURITY_WRITE` | [xem chi tiết](#api-auth) |
| GET | `/api/v1/auth/me` | `SELF_PROFILE_READ` | [xem chi tiết](#api-auth) |
| GET | `/api/v1/auth/permissions` | `SELF_PROFILE_READ` | [xem chi tiết](#api-auth) |
| POST | `/api/v1/auth/refresh` | Công khai | [xem chi tiết](#api-auth) |
| POST | `/api/v1/auth/reset-password` | Công khai | [xem chi tiết](#api-password-reset) |

## Tài khoản

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/accounts` | `USER_ADMIN_READ_ALL` | [xem chi tiết](#api-accounts) |
| POST | `/api/v1/accounts` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-accounts) |
| POST | `/api/v1/accounts/import` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-import) |
| POST | `/api/v1/accounts/import/preview` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-import) |
| GET | `/api/v1/accounts/import/template` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-import) |
| GET | `/api/v1/accounts/{id}` | `USER_ADMIN_READ_ALL` | [xem chi tiết](#api-accounts) |
| PUT | `/api/v1/accounts/{id}` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-accounts) |
| GET | `/api/v1/accounts/{id}/avatar` | `SELF_PROFILE_READ` | [xem chi tiết](#api-avatars) |
| PUT | `/api/v1/accounts/{id}/lock` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-locking) |
| DELETE | `/api/v1/accounts/{id}/lock` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-locking) |
| PUT | `/api/v1/accounts/{id}/roles/{role}` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-roles) |
| DELETE | `/api/v1/accounts/{id}/roles/{role}` | Vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL` | [xem chi tiết](#api-account-roles) |

## Hồ sơ cá nhân

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/profile` | `SELF_PROFILE_READ` | [xem chi tiết](#api-profile) |
| PUT | `/api/v1/profile` | `SELF_PROFILE_WRITE` | [xem chi tiết](#api-profile) |
| GET | `/api/v1/profile/avatar` | `SELF_PROFILE_READ` | [xem chi tiết](#api-avatars) |
| PUT | `/api/v1/profile/avatar` | `SELF_PROFILE_WRITE` | [xem chi tiết](#api-avatars) |
| DELETE | `/api/v1/profile/avatar` | `SELF_PROFILE_WRITE` | [xem chi tiết](#api-avatars) |

## Phòng ban

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/departments` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-departments) |
| POST | `/api/v1/departments` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-departments) |
| GET | `/api/v1/departments/tree` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-departments) |
| GET | `/api/v1/departments/{id}` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-departments) |
| PUT | `/api/v1/departments/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-departments) |
| DELETE | `/api/v1/departments/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-departments) |

## Chức danh và dải lương

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/positions` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-positions) |
| POST | `/api/v1/positions` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-positions) |
| GET | `/api/v1/positions/{id}` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-positions) |
| PUT | `/api/v1/positions/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-positions) |
| PUT | `/api/v1/positions/{id}/competency-framework` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-positions) |
| DELETE | `/api/v1/positions/{id}/competency-framework` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-positions) |
| GET | `/api/v1/positions/{id}/evaluation-criteria` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-evaluation-criteria) |

## Khung năng lực

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/competency-frameworks` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-competency-frameworks) |
| POST | `/api/v1/competency-frameworks` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-competency-frameworks) |
| GET | `/api/v1/competency-frameworks/{id}` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-competency-frameworks) |
| PUT | `/api/v1/competency-frameworks/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-competency-frameworks) |

## Câu hỏi phỏng vấn

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/interview-questions` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-interview-questions) |
| POST | `/api/v1/interview-questions` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-interview-questions) |
| GET | `/api/v1/interview-questions/{id}` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-interview-questions) |
| PUT | `/api/v1/interview-questions/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-interview-questions) |

## Yêu cầu tuyển dụng

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/requisitions` | `REQUISITIONS_READ_ALL` **hoặc** `REQUISITIONS_READ_SCOPED` | [xem chi tiết](#api-requisitions) |
| POST | `/api/v1/requisitions` | `REQUISITIONS_WRITE_ALL` **hoặc** `REQUISITIONS_WRITE_SCOPED` | [xem chi tiết](#api-requisitions) |
| GET | `/api/v1/requisitions/{id}` | `REQUISITIONS_READ_ALL` **hoặc** `REQUISITIONS_READ_SCOPED` | [xem chi tiết](#api-requisitions) |
| PUT | `/api/v1/requisitions/{id}` | `REQUISITIONS_WRITE_ALL` **hoặc** `REQUISITIONS_WRITE_SCOPED` | [xem chi tiết](#api-requisitions) |

## Danh mục tuyển dụng dùng chung

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/recruitment-catalogs/{type}/items` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-recruitment-catalogs) |
| POST | `/api/v1/recruitment-catalogs/{type}/items` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-recruitment-catalogs) |
| GET | `/api/v1/recruitment-catalogs/{type}/items/{id}` | `ORGANIZATION_READ_ALL` | [xem chi tiết](#api-recruitment-catalogs) |
| PUT | `/api/v1/recruitment-catalogs/{type}/items/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-recruitment-catalogs) |
| DELETE | `/api/v1/recruitment-catalogs/{type}/items/{id}` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-recruitment-catalogs) |
| PUT | `/api/v1/recruitment-catalogs/{type}/order` | `ORGANIZATION_WRITE_ALL` | [xem chi tiết](#api-recruitment-catalogs) |

## Trang giới thiệu công ty

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/company-profile` | `JOB_POSTINGS_WRITE_ALL` | [xem chi tiết](#api-company-profile) |
| PUT | `/api/v1/company-profile` | `JOB_POSTINGS_WRITE_ALL` | [xem chi tiết](#api-company-profile) |
| POST | `/api/v1/company-profile/media` | `JOB_POSTINGS_WRITE_ALL` | [xem chi tiết](#api-company-profile) |
| GET | `/api/v1/company-profile/media/{id}` | `JOB_POSTINGS_WRITE_ALL` | [xem chi tiết](#api-company-profile) |
| POST | `/api/v1/company-profile/preview` | `JOB_POSTINGS_WRITE_ALL` | [xem chi tiết](#api-company-profile) |

## Công khai cho cổng tuyển dụng

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/v1/public/company-media/{id}` | Công khai | [xem chi tiết](#api-company-profile) |
| GET | `/api/v1/public/company-profile` | Công khai | [xem chi tiết](#api-company-profile) |

## Kiểm tra hệ thống

| Method | Đường dẫn | Quyền | Chi tiết |
|---|---|---|---|
| GET | `/api/health` | Công khai | — |
| GET | `/api/v1/health` | Công khai | — |

Tổng cộng **66 endpoint**.

## Mục lục chi tiết theo module

1. [API đăng nhập và cách đọc code](#api-auth) — Sprint 1
2. [API đặt lại mật khẩu — TKNHTTDNB1-106–110](#api-password-reset) — Sprint 1
3. [Quản trị tài khoản nội bộ](#api-accounts) — Sprint 1
4. [Hồ sơ cá nhân — TKNHTTDNB1-179–181](#api-profile) — Sprint 1–2
5. [Gán và thu hồi vai trò tài khoản](#api-account-roles) — Sprint 1
6. [Khóa và mở khóa tài khoản](#api-account-locking) — Sprint 1
7. [API phòng ban và sơ đồ tổ chức](#api-departments) — Sprint 2
8. [API danh mục chức danh](#api-positions) — Sprint 2
9. [API khung năng lực](#api-competency-frameworks) — Sprint 2
10. [API tiêu chí đánh giá theo chức danh](#api-evaluation-criteria) — Sprint 2
11. [API câu hỏi phỏng vấn](#api-interview-questions) — Sprint 2
12. [API yêu cầu tuyển dụng](#api-requisitions) — Sprint 2
13. [API danh mục tuyển dụng dùng chung](#api-recruitment-catalogs) — Sprint 2
14. [API trang giới thiệu công ty](#api-company-profile) — Sprint 2
15. [API ảnh đại diện](#api-avatars) — Sprint 2
16. [Nhập danh sách nhân sự từ Excel](#api-account-import) — Sprint 2



---

<a id="api-auth"></a>

## API đăng nhập và cách đọc code

Luồng quên mật khẩu của các task106–110: [API đặt lại mật khẩu](#api-password-reset).

[Khóa hành chính](#api-account-locking) của162–166 chặn login/refresh/JWT và thu hồi các phiên tài khoản đích. Mở khóa không khôi phục token cũ; người dùng đăng nhập lại. Khóa hành chính độc lập với khóa15phút do nhập sai và trạng thái chờ kích hoạt.

TKNHTTDNB1-90 đăng nhập nhân sự nội bộ bằng email/mật khẩu. Backend trả vai trò; frontend dùng vai trò mở trang phù hợp trong subtask giao diện riêng. Ứng viên bên ngoài không có tài khoản nội bộ.

TKNHTTDNB1-93 hoàn thiện kiểm tra Access Token trên luồng đăng nhập này. API và cấu trúc JSON giữ tương thích với phần giao diện.

### Đăng nhập

**POST** `http://localhost:8080/api/v1/auth/login`, header `Content-Type: application/json`.

```json
{
  "email": "admin@congty.test",
  "password": "MatKhauDemo123!"
}
```

Dữ liệu trên là minh họa; dùng email/password bạn cấu hình để tạo Admin, không dùng tài khoản PostgreSQL.

Thành công trả **200**:

```json
{
  "accessToken": "<JWT>",
  "refreshToken": "<token ngẫu nhiên>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshExpiresAt": "<thời điểm ISO 8601 UTC>",
  "user": {
    "id": "<UUID>",
    "email": "admin@congty.test",
    "fullName": "Quản trị viên",
    "roles": ["ADMIN"]
  }
}
```

Access token giống vé truy cập có thời hạn 15 phút (`900` giây), được ký để server phát hiện sửa đổi. Refresh token cấp vé mới, hết hạn sau 7 ngày nếu không gia hạn. Gia hạn thành công cấp refresh token mới và kéo dài phiên thêm 7 ngày. Không đưa token vào URL hoặc log.

#### Quy tắc Access Token

Backend chỉ cấp token sau khi xác thực thành công. JWT được ký bằng **HS256**, với các trường sau:

| Trường trong JWT | Ý nghĩa |
|---|---|
| `iss` | Nơi cấp token: `ttcs-backend` |
| `aud` | API nhận token: `ttcs-api` |
| `sub` | UUID tài khoản đã đăng nhập |
| `jti` | UUID phiên đăng nhập trong `auth_sessions` |
| `iat` | Thời điểm cấp token |
| `exp` | Thời điểm hết hạn, sau thời điểm cấp 900 giây |

JWT được ký, không được mã hóa nội dung. Không đưa mật khẩu hoặc dữ liệu hồ sơ vào token. Vai trò hiện tại được đọc từ database khi gọi API cần xác thực.

Client gửi `Authorization: Bearer <accessToken>` khi gọi `/me` hoặc `/logout`. Backend kiểm chữ ký, nơi cấp, API nhận, thời hạn và phiên đăng nhập còn hoạt động, sau đó kiểm tài khoản còn được bật. Token thiếu `exp`, hết hạn, bị sửa hoặc không thuộc phiên hợp lệ đều trả **401** với `code=UNAUTHORIZED`. Nếu token có `nbf` (thời điểm bắt đầu được dùng), backend cũng kiểm tra thời điểm đó.

Token chỉ có hiệu lực khi thời gian hiện tại **nhỏ hơn** `exp`: ví dụ cấp lúc 10:00:00 thì hết hạn từ 10:15:00. `expiresIn` trong response là thời hạn lúc cấp, không phải bộ đếm tự cập nhật. Thời hạn 15 phút là cấu hình hiện có của dự án; subtask Jira 93 không quy định thời hạn riêng.

Email lạ, sai password, tài khoản vô hiệu hóa và bị khóa đều trả **401**, cùng nội dung:

```json
{
  "code": "LOGIN_FAILED",
  "message": "Không thể đăng nhập bằng thông tin đã cung cấp.",
  "fieldErrors": {}
}
```

Sau 5 lần sai liên tiếp cho tài khoản có thật, khóa 15 phút từ lần sai thứ 5. Trong lúc khóa, password đúng vẫn bị từ chối; lần thử tiếp theo không kéo dài khóa. Đúng thời điểm hết khóa có thể thử lại. Đăng nhập thành công xóa bộ đếm sai. Email bỏ khoảng trắng hai đầu và chuyển chữ thường; password giữ nguyên.

Thiếu email/password, email sai định dạng hoặc JSON sai trả **400**. Response validation có `code=VALIDATION_ERROR`, `message=Vui lòng kiểm tra dữ liệu đã nhập.`, `fieldErrors` gồm lỗi từng trường. JSON sai có `code=INVALID_JSON`.

Giới hạn đầu vào password là 200 ký tự. Password quá 72 byte UTF-8 bị từ chối với 401 vì BCrypt chỉ nhận tối đa 72 byte; quá cả 200 ký tự thì validation trả 400 trước. Response không có password hoặc password hash.

### Thử bằng PowerShell hoặc Postman

Sau khi API đang chạy, nhập password qua prompt để không lưu trực tiếp trong lịch sử terminal:

```powershell
$loginCredential = Get-Credential -UserName 'admin@congty.test' -Message 'Tài khoản API'
$loginJson = @{
    email = $loginCredential.UserName
    password = $loginCredential.GetNetworkCredential().Password
} | ConvertTo-Json
$login = Invoke-RestMethod -Method Post `
    -Uri 'http://localhost:8080/api/v1/auth/login' `
    -ContentType 'application/json' -Body $loginJson
$login.user
```

Thay email bằng Admin của bạn. Không in `$login` khi chia sẻ màn hình vì chứa token. Với Postman, chọn POST, **Body → raw → JSON**, gửi body cùng cấu trúc.

### API hỗ trợ phiên

| Method/path | Đầu vào | Thành công |
|---|---|---|
| `GET /api/v1/health` | Không cần đăng nhập | 200, server đang chạy |
| `POST /api/v1/auth/login` | Body `email`, `password` | 200, token và tài khoản |
| `GET /api/v1/auth/me` | `Authorization: Bearer <accessToken>` | 200, tài khoản hiện tại |
| `POST /api/v1/auth/refresh` | Body `{"refreshToken":"<token>"}` | 200, token mới |
| `POST /api/v1/auth/logout` | `Authorization: Bearer <accessToken>` | 204, không body |
| `POST /api/v1/auth/change-password` | Bearer token; body `currentPassword`, `newPassword` | 200, giữ phiên hiện tại và thu hồi phiên khác |
| `GET /api/v1/auth/permissions` | Bearer token | 200, danh sách quyền hiện hành |

Đổi mật khẩu khi đang đăng nhập:

```json
{"currentPassword":"<mật khẩu hiện tại>","newPassword":"<mật khẩu mới>"}
```

Mật khẩu mới cần ít nhất 8 ký tự, có chữ và số, tối đa 72 byte UTF-8 để BCrypt xử lý đầy đủ. Mật khẩu hiện tại sai trả 400 `CURRENT_PASSWORD_INCORRECT`; dữ liệu không đạt yêu cầu trả 400 `VALIDATION_ERROR`; thiếu/hết hạn Access Token trả 401. Thành công trả `{"message":"Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi."}` với `Cache-Control: no-store`. Refresh token của phiên hiện tại tiếp tục dùng được; các phiên khác bị từ chối ngay. Liên kết đặt lại mật khẩu đang còn hiệu lực của tài khoản cũng bị vô hiệu hóa.

`GET /api/v1/auth/permissions` trả `{"permissions":["..."]}` với `Cache-Control: no-store`. Mỗi quyền có mã gồm module, thao tác `READ`/`WRITE` và phạm vi `ALL`/`SCOPED`, ví dụ `CANDIDATES_READ_SCOPED`. Quyền được đọc lại từ PostgreSQL ở mỗi yêu cầu đã xác thực; frontend dùng danh sách này để hiển thị, còn backend quyết định quyền truy cập thực tế. Xem thiết kế phân quyền (`docs/architecture/authorization.md` trong repo Backend).

Xem người vừa đăng nhập:

```powershell
$authHeaders = @{ Authorization = "Bearer $($login.accessToken)" }
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/me' -Headers $authHeaders
```

Gia hạn khi access token sắp hết hoặc hết hạn:

```powershell
$refreshJson = @{ refreshToken = $login.refreshToken } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post `
    -Uri 'http://localhost:8080/api/v1/auth/refresh' `
    -ContentType 'application/json' -Body $refreshJson
$authHeaders = @{ Authorization = "Bearer $($login.accessToken)" }
```

Refresh token cũ dùng một lần; thay cả hai token bằng response mới. Logout hủy phiên hiện tại ngay trên server, kể cả access token chưa hết hạn; phiên trên thiết bị khác còn hoạt động. Access token đã hết hạn thì gia hạn trước logout. Refresh token hết hạn thì đăng nhập lại.

#### Hợp đồng Refresh Token — TKNHTTDNB1-98

`POST /api/v1/auth/refresh` xác thực bằng `refreshToken` trong JSON. Không cần gửi access token; nếu interceptor vẫn gắn header `Authorization` cũ/hết hạn thì endpoint bỏ qua header này và kiểm tra refresh token. JWT gắn kèm không thể thay thế refresh token bị thiếu hoặc không hợp lệ.

Token đúng định dạng gồm43 ký tự Base64URL. Thiếu/null/sai định dạng trả 400 (`VALIDATION_ERROR`; JSON sai trả `INVALID_JSON`). Token đúng định dạng nhưng không tồn tại, bị thay thế, thu hồi, hết hạn hoặc tài khoản bị vô hiệu hóa trả 401 `SESSION_INVALID`, không gia hạn phiên. Lỗi không trả lại giá trị token.

Thành công trả 200 cùng cấu trúc JSON như login, có `Cache-Control: no-store`, không tạo cookie. Database lưu hash của refresh mới và thời hạn7 ngày tính từ lần gia hạn. Hai request đồng thời dùng cùng token chỉ một request thành công; frontend cần điều phối một request refresh tại một thời điểm và cập nhật đồng thời cả hai token. Xem thiết kế phiên (`docs/architecture/auth-sessions.md` trong repo Backend).

#### Hợp đồng Logout — TKNHTTDNB1-99

`POST /api/v1/auth/logout` cần bearer access token còn hạn, không cần body. Thành công trả 204, body rỗng và `Cache-Control: no-store`. Backend khóa phiên, kiểm lại chủ sở hữu và trạng thái còn hoạt động rồi thu hồi. Logout không xóa tài khoản hoặc dữ liệu nghiệp vụ.

Thiếu JWT, JWT sai/hết hạn hoặc phiên đã bị thu hồi trả 401 `UNAUTHORIZED`; nếu phiên đổi trạng thái trong lúc request chờ khóa thì trả 401 `SESSION_INVALID`. Client xóa cặp token khi logout thành công hoặc nhận401; lỗi mạng/5xx cần được xử lý riêng vì chưa xác nhận server đã thu hồi phiên.

Logout thu hồi mọi access/refresh token của đúng phiên đó, kể cả token mới được cấp bởi một request refresh chạy đồng thời. Các phiên đăng nhập khác vẫn hoạt động. Gọi logout lần nữa bằng cùng phiên trả 401; không tạo hoặc phục hồi phiên.

#### Hết hạn và khôi phục phiên — TKNHTTDNB1-100

- Access JWT hết hạn đúng sau 900 giây. Khi JWT vẫn còn hạn nhưng phiên database đã hết hạn/thu hồi, `/me` và `/logout` vẫn trả 401. JWT hợp lệ không bỏ qua trạng thái phiên.
- Refresh/phiên hết hạn đúng thời điểm `refreshExpiresAt`. Gọi `/me` không kéo dài thời hạn; chỉ refresh thành công mới đặt mốc 7 ngày mới. Refresh được gửi trước hạn nhưng phải chờ khóa tới sau hạn cũng bị từ chối.
- Header bearer cũ/sai/hết hạn không chặn `POST /login`; endpoint vẫn bắt buộc email/password hợp lệ. Login lại tạo phiên mới, không phục hồi phiên đã hết hạn.
- Với API cần đăng nhập: khi nhận401 `UNAUTHORIZED`, client refresh một lần, thay cặp token và retry request ban đầu tối đa một lần. Refresh401 `SESSION_INVALID` thì dừng và yêu cầu login lại. Không chạy vòng lặp refresh khi chính `/login` hoặc `/refresh` báo lỗi.
- Refresh400 là request sai;403 là thiếu quyền;5xx/mất mạng xử lý như lỗi dịch vụ/kết nối. Không xóa dữ liệu biểu mẫu chỉ vì một lỗi mạng.

Backend giữ nguyên các mã lỗi/JSON đã công bố. Phần bảo toàn dữ liệu đang nhập, điều phối các tab và giao diện đăng nhập lại thuộc các task frontend 97/101/102; client chịu trách nhiệm lưu bản nháp theo thiết kế của phần đó.

```powershell
Invoke-RestMethod -Method Post `
    -Uri 'http://localhost:8080/api/v1/auth/logout' -Headers $authHeaders
```

Response đăng nhập đặt `Cache-Control: no-store`. Luồng dùng Bearer header/body, không dùng cookie tự gửi của trình duyệt. CORS mặc định cho localhost 5173/3000 và các origin cấu hình rõ; CORS không thay thế xác thực hoặc phân quyền.

### Code hoạt động như thế nào

```text
Frontend / Postman gửi JSON
    → AuthController nhận và kiểm tra dữ liệu
    → AuthService kiểm tra tài khoản, password và khóa
    → AccountRepository đọc PostgreSQL
    → TokenService tạo token, AuthSessionRepository lưu phiên
    → AuthController trả JSON
```

1. **`auth/LoginRequest.java`** định nghĩa dữ liệu vào bằng Java `record` (một cấu trúc chứa dữ liệu gọn). `@NotBlank`, `@Email`, `@Size` là điều kiện Spring kiểm tra trước service. `toString()` che thông tin đăng nhập.
2. **`auth/AuthController.java`** định nghĩa URL/method. `@RestController` yêu cầu trả JSON. Controller gọi service và chọn HTTP response.
3. **`auth/AuthService.java`** tìm tài khoản, so sánh BCrypt, từ chối khóa/vô hiệu hóa, tăng bộ đếm sai, tạo phiên khi đúng. Email lạ cũng được so với hash giả để giảm chênh lệch thời gian giữa email có thật và không có thật.
4. **`account/AccountRepository.java`** giao tiếp database qua Spring Data JPA. `findByEmailForUpdate()` khóa hàng trong transaction để 5 request sai đồng thời không ghi đè bộ đếm của nhau.
5. **`account/Account.java`** ánh xạ bảng `user_accounts`, chứa quy tắc khóa 5 lần/15 phút. `@Transactional(noRollbackFor = AuthenticationFailureException.class)` trên login giữ bộ đếm sai khi ném lỗi 401; rollback mặc định sẽ làm mất bộ đếm.
6. **`security/AuthConfiguration.java`** cấp BCrypt, khóa ký và bộ kiểm JWT. BCrypt băm một chiều; `matches()` so sánh password, không giải mã. Xem [PasswordEncoder của Spring Security](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html).
7. **`auth/TokenService.java`** tạo JWT 15 phút, refresh token ngẫu nhiên. Database chỉ lưu SHA-256 refresh token; client giữ token gốc. Access token gắn với một phiên database.
8. **`security/SecurityConfiguration.java`** bảo vệ trước controller: kiểm chữ ký/thời hạn JWT và phiên/tài khoản. Endpoint chưa khai báo quyền bị chặn. Vai trò được đọc từ database, không tin dữ liệu client tự gửi.
9. **`common/ApiExceptionHandler.java`** đổi lỗi nghiệp vụ/validation thành JSON chung, không trả password.
10. **`database/migrations/V1__create_accounts_and_sessions.sql`** tạo bảng. Maven sao chép SQL vào JAR; Flyway chạy migration, Hibernate chỉ kiểm schema.

Muốn đổi thời gian khóa, đọc `Account`; đổi JSON response, đọc `TokenResponse`/`CurrentUserResponse`; thêm API, khai báo quyền tại `SecurityConfiguration` và thêm test. Quyền theo module/dữ liệu, quên/đổi mật khẩu và quản trị tài khoản thuộc các subtask riêng.

*Nguồn: `docs/api/auth.md` (Sprint 1).*


---

<a id="api-password-reset"></a>

## API đặt lại mật khẩu — TKNHTTDNB1-106–110

Story TKNHTTDNB1-12: gửi liên kết qua email, hiệu lực **30 phút**, **dùng một lần**, cùng thông báo cho email có thật và không có thật. API thuộc backend Java; frontend dùng trang `/reset-password?token=...`.

Tài khoản bị [Admin khóa](#api-account-locking) không được gửi email reset hoặc dùng link để vượt khóa. Endpoint forgot vẫn trả thông báo202 chung; khóa vô hiệu hóa các reset link chưa dùng. Sau khi mở khóa, cần yêu cầu link mới nếu quên mật khẩu; link cũ không hồi phục.

### 1. Yêu cầu liên kết

`POST /api/v1/auth/forgot-password`, `Content-Type: application/json`:

```json
{"email":"admin@example.com"}
```

Email chỉ là ví dụ, cần dùng tài khoản đã có trong ứng dụng. Bỏ khoảng trắng hai đầu và chuyển chữ thường; kiểm email hợp lệ, tối đa 254 ký tự.

Trả **202 Accepted**, `Cache-Control: no-store`:

```json
{"message":"Nếu email thuộc tài khoản đang hoạt động, bạn sẽ nhận được liên kết đặt lại mật khẩu."}
```

202 nghĩa là yêu cầu đã được xếp hàng xử lý. Không xác nhận email tồn tại hoặc thư đã tới inbox. Tài khoản vô hiệu hóa, email lạ và yêu cầu lặp trong60 giây đều có cùng response. Không trả token, địa chỉ email hay thời gian hết hạn trong response.

Thiếu/sai email hoặc JSON trả 400 theo `VALIDATION_ERROR`/`INVALID_JSON` hiện có. Khi hàng đợi đầy trả 503 với `code=PASSWORD_RESET_BUSY`; thử lại sau. Hàng đợi tối đa100 yêu cầu, một worker, chung cho mọi email. Thời gian đợi SMTP không nằm trên luồng trả HTTP.

### 2. Cập nhật mật khẩu

`POST /api/v1/auth/reset-password`:

```json
{"token":"<43 ký tự lấy từ liên kết email>","newPassword":"<mật khẩu mới>"}
```

Mật khẩu dùng quy tắc đang có ở bootstrap: ít nhất8 ký tự, có chữ và số, tối đa 72 byte UTF-8 để phù hợp BCrypt. Giữ nguyên khoảng trắng và hoa/thường của mật khẩu. Frontend xác nhận nhập lại mật khẩu trước khi gửi.

Trả **200**, `Cache-Control: no-store`:

```json
{"message":"Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."}
```

Một transaction đổi BCrypt hash, xóa bộ đếm sai/khóa đăng nhập, vô hiệu hóa mọi reset token còn lại và thu hồi mọi phiên của đúng tài khoản đó. Các tài khoản khác không bị ảnh hưởng. Response không tự cấp access/refresh token: client quay về đăng nhập.

Token sai, đã dùng, hết hạn hoặc tài khoản bị vô hiệu hóa trả **400**:

```json
{"code":"RESET_TOKEN_INVALID","message":"Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.","fieldErrors":{}}
```

Sai định dạng token hoặc mật khẩu trả 400 `VALIDATION_ERROR` trước khi dùng token. Link cấp lúc10:00:00 bị từ chối từ10:30:00. Yêu cầu mới không kéo dài hạn của link cũ. Các link cũ vẫn có thể dùng đến hạn, nhưng một lần đặt lại thành công vô hiệu hóa toàn bộ link của tài khoản.

Cả hai endpoint công khai, không cần Bearer. Nếu client còn gửi Bearer cũ, backend bỏ qua header đó tại đúng hai endpoint này; mật khẩu mới vẫn chỉ được lưu khi reset token trong body hợp lệ. Các API cần xác thực vẫn giữ kiểm Bearer.

### SMTP local và cấu hình

Mặc định gửi tới SMTP tại 127.0.0.1:1025. Không cần sửa `.env` cũ để chạy với mail catcher ở cổng này. Cấu hình mẫu bổ sung trong `.env.example`; không sao chép đè toàn bộ `.env` đang dùng.

Nếu có Docker, tại root dự án:

```powershell
docker compose -f devops/docker/compose.mail.yaml up -d
```

Mở [Mailpit local](http://localhost:8025) để đọc thư. Compose mail tách riêng PostgreSQL, chỉ bind loopback. Mailpit là hộp thư thử, không chuyển thư ra email thật. Cách cài Windows và các tùy chọn nằm trong [tài liệu Mailpit](https://mailpit.axllent.org/docs/install/).

| Biến .env | Ý nghĩa/mặc định |
|---|---|
| `MAIL_HOST`, `MAIL_PORT` | SMTP server, mặc định 127.0.0.1/1025 |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Thông tin SMTP, local để trống |
| `MAIL_SMTP_AUTH` | Xác thực SMTP, local false |
| `MAIL_SMTP_STARTTLS` | Bật và bắt buộc STARTTLS, local false |
| `MAIL_FROM` | Người gửi, mặc định no-reply@ttcs.test |
| `RESET_PASSWORD_PAGE_URL` | URL frontend cố định; mặc định http://localhost:5173/reset-password |

Với SMTP thật dùng cấu hình được nhà cung cấp cấp, thường587 + AUTH/STARTTLS; giữ bí mật trong `.env`. URL frontend phải HTTPS, chỉ cho HTTP với localhost. Không dùng URL do request gửi lên để tạo link. Timeout kết nối/đọc/ghi SMTP là5 giây. Spring Mail được cấu hình theo [tài liệu Spring Boot](https://docs.spring.io/spring-boot/reference/io/email.html).

Nếu SMTP lỗi, token mới bị rollback và API vẫn trả thông báo chung; backend chỉ log loại lỗi. Người dùng có thể yêu cầu lại. Hàng đợi nằm trong bộ nhớ, chưa có retry bền vững qua restart. SMTP và DB không commit chung: hiếm khi thư đã được SMTP nhận nhưng DB commit thất bại thì link không dùng được, cần yêu cầu lại.

### Nối với frontend

- `/auth/forgot-password` trả một trường `message`, tương thích kiểu ApiMessageResponse đang có.
- Sau 202, hiển thị thông báo chung và hướng dẫn xem email. Không chuyển sang form đặt mật khẩu chỉ từ email.
- Đọc `token` ở query URL email, gửi cùng `newPassword` tới API trên; bỏ giả lập thành công và bỏ log payload chứa mật khẩu/token.
- Đồng bộ validation frontend về8 ký tự/chữ/số/giới hạn72 byte; màn hình hiện kiểm6 ký tự.
- Sau200 xóa token phiên cũ phía client và về trang đăng nhập. Đặt `Referrer-Policy: no-referrer` trên trang reset; tránh analytics/log ghi URL chứa token.

Những thay đổi giao diện này thuộc frontend, chưa thực hiện trong các subtask BE106–110.

*Nguồn: `docs/api/password-reset.md` (Sprint 1).*


---

<a id="api-accounts"></a>

## Quản trị tài khoản nội bộ

Jira TKNHTTDNB1-145–149, story17; dữ liệu phòng ban dùng schema194. Backend dùng `/api/v1`. Tạo/sửa yêu cầu `ADMIN` và `USER_ADMIN_WRITE_ALL`; đọc yêu cầu `USER_ADMIN_READ_ALL` (hiện Admin và HR_MANAGER). Quyền được kiểm trên server mỗi yêu cầu. Gán/thu hồi vai trò dùng [API riêng](#api-account-roles); khóa quản trị dùng [API khóa tài khoản](#api-account-locking).

### GET /accounts

Gửi Bearer của tài khoản có quyền đọc. Các tham số có thể kết hợp bằng AND:

| Tham số | Ý nghĩa |
|---|---|
| `q` | Tối đa255 ký tự; tìm chứa tên, email hoặc tên phòng ban, không phân biệt hoa/thường; không bỏ dấu tiếng Việt |
| `role` | Một vai trò nội bộ, ví dụ `INTERVIEWER` |
| `status` | Một trong năm trạng thái bên dưới |
| `departmentId` | UUID phòng ban; chỉ phòng ban đó, không tự gồm các phòng con |
| `page` | Bắt đầu từ0, mặc định0 |
| `size` | Từ1–100, mặc định20 |

Ví dụ `/api/v1/accounts?q=nh%C3%A2n%20s%E1%BB%B1&role=INTERVIEWER&page=0&size=20`. Ký tự `%`, `_`, `!` trong từ khóa được tìm theo nghĩa đen; SQL bind tham số. Thứ tự cố định `createdAt` giảm dần rồi `id` tăng dần; tài khoản nhiều vai trò chỉ xuất hiện một lần. Count và danh sách đọc cùng snapshot PostgreSQL trong mỗi yêu cầu; các lần gọi riêng có thể phản ánh dữ liệu vừa đổi.

Trả **200**, `Cache-Control: no-store`:

```json
{
  "items": [{
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "interviewer@example.com",
    "fullName": "Nguyễn Văn An",
    "phone": "0912345678",
    "displayTitle": "Chuyên viên",
    "departmentId": null,
    "departmentName": null,
    "roles": ["INTERVIEWER"],
    "status": "ACTIVE",
    "createdAt": "2026-10-05T00:00:00Z"
  }],
  "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
}
```

Trạng thái là dữ liệu suy ra tại thời điểm đọc:

- `ADMINISTRATIVELY_LOCKED`: đang bị Admin khóa; ưu tiên hơn các trạng thái còn lại.
- `ACTIVE`: tài khoản enabled, không bị Admin khóa và không đang bị khóa đăng nhập tạm.
- `TEMPORARILY_LOCKED`: enabled nhưng `locked_until` còn trong tương lai do đăng nhập sai.
- `PENDING_ACTIVATION`: disabled và có token kích hoạt chưa tiêu thụ; token hết hạn vẫn thuộc trạng thái chờ kích hoạt.
- `DISABLED`: disabled và không có token kích hoạt chưa tiêu thụ; khác khóa hành chính do Admin.

Không trả mật khẩu, hash, token, thông tin phiên. Bộ lọc sai/UUID sai/page-size sai trả **400 `VALIDATION_ERROR`**; thiếu/phiên không hợp lệ **401**; thiếu quyền **403**. Không tìm thấy trả trang rỗng, `totalPages=0`. Trang vượt cuối cũng rỗng nhưng giữ tổng số phù hợp bộ lọc.

### GET /accounts/{id}

Cùng quyền đọc, trả **200** với một object như phần tử `items`. UUID hợp lệ nhưng không có tài khoản trả **404 `ACCOUNT_NOT_FOUND`**; UUID sai định dạng trả400.

### PUT /accounts/{id}

Admin gửi đầy đủ trạng thái mới của các trường được phép:

```json
{
  "fullName": "Nguyễn Văn An",
  "phone": "+84912345678",
  "displayTitle": "Chuyên viên tuyển dụng",
  "departmentId": null
}
```

`fullName` bắt buộc, trim/tối đa255; `phone` và `displayTitle` là tùy chọn (chuỗi trắng/null/bỏ trường sẽ xóa dữ liệu đó), chức danh tối đa120. Điện thoại theo quy tắc ở [hồ sơ cá nhân](#api-profile); `+84` được lưu thành số bắt đầu bằng0. `departmentId=null` hoặc bỏ trường sẽ gỡ phòng ban, nên frontend cần gửi lại phòng ban hiện tại nếu muốn giữ nguyên. Đây là PUT thay thế các trường được phép, không phải PATCH.

Phòng ban mới phải tồn tại và `active=true`. Có thể giữ nguyên phòng ban cũ đã ngừng áp dụng khi chỉ sửa thông tin khác; gán mới vào phòng ngừng áp dụng hoặc UUID không tồn tại trả **400 `INVALID_DEPARTMENT`**. [API phòng ban 195–196](#api-departments) cung cấp danh sách/cây, tạo/sửa và ngừng áp dụng trên schema của 194. Không tự tạo phòng ban từ tên do người dùng nhập.

Email là định danh đăng nhập, giữ nguyên trong API này; đổi email cần luồng xác minh riêng. `email`, `roles`, `enabled`, mật khẩu, `id` và mọi trường lạ đều trả **400 `INVALID_JSON`** thay vì bị bỏ qua. API không thay mật khẩu, vai trò, phiên hoặc token kích hoạt. Thu hồi/gán vai trò dùng [API riêng](#api-account-roles).

Thành công **200** với `AccountView`, no-store. Dữ liệu không hợp lệ **400**, tài khoản đích không tồn tại **404**, thiếu quyền **403**. Server khóa tài khoản theo thứ tự UUID rồi kiểm lại phiên và quyền Admin; quyền bị thu hồi trong lúc chờ khóa sẽ bị từ chối, không ghi tài khoản đích. CORS cho phépPUT từ các origin đã cấu hình.

### POST /accounts

Gửi `Authorization: Bearer <accessToken>` của Admin và JSON:

```json
{
  "email": "interviewer@example.com",
  "fullName": "Nguyễn Văn An",
  "roles": ["INTERVIEWER", "HIRING_MANAGER"]
}
```

Email được trim/chuyển chữ thường, tối đa254 ký tự; họ tên không trống/tối đa255 ký tự; ít nhất một trong sáu vai trò nội bộ. Không nhận mật khẩu từ Admin. Server tạo mật khẩu tạm ngẫu nhiên24 ký tự bằng SecureRandom và lưu BCrypt. Candidate không phải tài khoản nội bộ.

Thành công **201**, `Cache-Control: no-store`:

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "email": "interviewer@example.com",
  "fullName": "Nguyễn Văn An",
  "roles": ["INTERVIEWER", "HIRING_MANAGER"],
  "status": "PENDING_ACTIVATION"
}
```

Tài khoản chưa được đăng nhập cho đến khi kích hoạt. SMTP gửi email UTF8 gồm liên kết kích hoạt và mật khẩu tạm. Response không trả mật khẩu, token hoặc hash. Email trùng, kể cả khác chữ hoa/khoảng trắng hay hai Admin tạo đồng thời, trả **409 `EMAIL_ALREADY_EXISTS`** với thông báo tiếng Việt và không ghi đè tài khoản/gửi email lần hai. DB unique constraint xử lý trường hợp cạnh tranh sau precheck.

Các lỗi: **400** dữ liệu sai/role không hợp lệ; **401** thiếu/hết phiên; **403** thiếu quyền Admin; **503 `ACCOUNT_EMAIL_UNAVAILABLE`** gửi email thất bại. Khi503, transaction rollback tài khoản/vai trò/token để có thể thử tạo lại.

### POST /auth/activate-account

Trang frontend lấy `token` từ liên kết rồi gửi POST khi người dùng xác nhận:

```json
{"token": "<token-trong-email>"}
```

API này không cần Bearer. Thành công **200** với thông báo kích hoạt, không cấp phiên. Sau đó đăng nhập bằng email/mật khẩu tạm, dùng API đổi mật khẩu hiện có. GET liên kết không tự kích hoạt để tránh trình quét email tiêu thụ token. Trang frontend `/activate-account` chưa được triển khai trong nhóm BE này.

Token32byte ngẫu nhiên, DB chỉ lưu SHA256; dùng đúng một lần. Lỗi **400 `ACTIVATION_TOKEN_INVALID`** khi không tồn tại, đã dùng hoặc hết hạn. Token reset/refresh không dùng để kích hoạt; token kích hoạt không dùng để reset mật khẩu. Hai yêu cầu kích hoạt đồng thời chỉ một yêu cầu thành công.

### SMTP và thời hạn

Dùng cấu hình SMTP hiện có trong [đặt lại mật khẩu](#api-password-reset), mặc định mail catcher `127.0.0.1:1025`, `MAIL_FROM` dùng chung. Các cấu hình mới có mặc định nên không cần thay private `.env`:

```properties
ACCOUNT_ACTIVATION_PAGE_URL=http://localhost:5173/activate-account
ACCOUNT_ACTIVATION_TTL=24h
```

URL cố định do server cấu hình, HTTPS ngoại trừ localhost; không có credentials/query/fragment. Không lấy Host header từ request.24h là chính sách khởi tạo, Jira chưa quy định; cấu hình cho phép1h–7d. Tại đúng thời điểm hết hạn token bị từ chối. Chưa có API gửi lại email kích hoạt; hết hạn cần xử lý quản trị ở bước tiếp theo.

V4 thêm `account_activation_tokens`, giữ nguyênV1/V2/V3 và dữ liệu tài khoản/phiên hiện tại. Sao lưu DB trước khi nâng cấp. SMTP và commitSQL không phải một transaction phân tán: nếu SMTP đã nhận nhưng DB commit sau đó thất bại thì email có thể chứa liên kết không dùng được. SMTP gửi đồng bộ, timeout hiện có5s; chưa có hàng đợi bền vững/retry tự động. TừV6, khóa hành chính có trạng thái riêng: activate luôn từ chối khi đang bị Admin khóa, không tiêu thụ link. Sau khi Admin mở khóa, tài khoản pending có thể dùng link còn hạn; mở khóa không tự kích hoạt.

*Nguồn: `docs/api/accounts.md` (Sprint 1).*


---

<a id="api-profile"></a>

## Hồ sơ cá nhân — TKNHTTDNB1-179–181

Hai API dưới `/api/v1/profile` lấy chủ tài khoản từ Access Token, không nhận ID người cần sửa. Dùng `Authorization: Bearer <accessToken>`. `GET /auth/me` cũ giữ nguyên để tương thích frontend đăng nhập.

### GET /api/v1/profile

Yêu cầu `SELF_PROFILE_READ`, trả **200**, `Cache-Control: no-store`:

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "email": "interviewer@example.com",
  "fullName": "Nguyễn Văn An",
  "phone": "0912345678",
  "displayTitle": "Chuyên viên tuyển dụng",
  "departmentId": null,
  "departmentName": null,
  "roles": ["INTERVIEWER"],
  "hasAvatar": true,
  "avatarUpdatedAt": "2026-10-07T08:00:00Z"
}
```

`hasAvatar` và `avatarUpdatedAt` được thêm cùng [API ảnh đại diện](#api-avatars) (TKNHTTDNB1-188); chưa có ảnh thì `hasAvatar` là false và `avatarUpdatedAt` là null. Ảnh không nằm trong JSON này mà đọc qua `GET /profile/avatar`. `PUT /profile` cũng trả hai trường này nhưng không nhận chúng trong body.

Email/phòng ban/vai trò chỉ để hiển thị. Tài khoản cũ có phone/displayTitle/departmentId lànull cho đến khi cập nhật. Không có password/hash/token trong response. Thêm `?userId=...` không đổi chủ hồ sơ; server vẫn dùng JWT. Không có route sửa `/profile/{id}`.

### PUT /api/v1/profile

Yêu cầu `SELF_PROFILE_WRITE`, được V5 cấp cho sáu vai trò nội bộ. JSON chỉ có:

```json
{
  "fullName": "Nguyễn Văn An",
  "phone": "+84912345678",
  "displayTitle": "Chuyên viên tuyển dụng"
}
```

- Họ tên bắt buộc, trim và tối đa255 ký tự.
- Điện thoại tùy chọn; chấp nhận di động10 số bắt đầu03/05/07/08/09 hoặc cố định11 số bắt đầu02, và dạng quốc tế tương ứng `+84`. Trim khoảng trắng đầu/cuối, lưu dạng0; không chấp nhận khoảng trắng/dấu gạch ở giữa. Đây là kiểm tra định dạng, không xác minh số đang được cấp hay quyền sở hữu. Quy tắc tham khảo thông báo của Bộ TT&TT qua [ITU về số di động](https://www.ituob.org/issues/1150-en/) và [mã vùng cố định](https://www.ituob.org/issues/1114-en/).
- Chức danh tùy chọn, trim và tối đa120 ký tự.
- PUT thay thế ba trường: bỏ phone/displayTitle hoặc gửinull/chuỗi trắng sẽ xóa chúng. Frontend gửi đầy đủ ba trường khi lưu form.

Thành công **200** trả hồ sơ đã cập nhật, no-store. Email, phòng ban, vai trò, mật khẩu và các phiên đăng nhập được giữ nguyên. Field ngoài ba trường trên (`email`, `departmentId`, `roles`, `userId`, `enabled`...) trả **400 `INVALID_JSON`**; dữ liệu sai trả **400 `VALIDATION_ERROR`**. Không nhận ID từ body để sửa tài khoản khác.

Thiếu/hết hạn Access Token, phiên hết hạn/thu hồi hoặc tài khoản disabled trả **401**. Grant bị thu hồi trả **403** dù JWT còn hạn. Khi ghi, khóa tài khoản trước rồi phiên, kiểm lại chủ phiên/hiệu lực/quyền trước cập nhật. CORS PUT dùng danh sách origin hiện có.

### Dữ liệu và phạm vi

V5 bổ sung trường nullable và quyền mới, giữ mật khẩu/phiên/vai trò cũ. Backend khởi động sẽ áp dụng migration chưa chạy; sao lưu DB trước nâng cấp. Trong kiểm thử chỉ dùng PostgreSQL tạm, không sửa private.env hoặc database làm việc. Phòng ban được Admin gán qua [API quản trị tài khoản](#api-accounts); CRUD/cây phòng ban thuộc195–198, chưa thuộc API hồ sơ.

*Nguồn: `docs/api/profile.md` (Sprint 1–2).*


---

<a id="api-account-roles"></a>

## Gán và thu hồi vai trò tài khoản

Jira TKNHTTDNB1-154–158, story18. API danh mục vai trò153 thuộc phần việc riêng. Các đường dẫn dưới đây dùng tiền tố `/api/v1`.

### Yêu cầu chung

Gửi `Authorization: Bearer <accessToken>` của tài khoản có cả vai trò `ADMIN` và quyền `USER_ADMIN_WRITE_ALL`. HR_MANAGER có quyền xem danh sách tài khoản nhưng không được thay vai trò. Server kiểm lại quyền hiện tại ngay trước khi ghi; không dựa vào menu frontend hoặc danh sách vai trò cũ trong token.

`id` là UUID của tài khoản cần thay đổi. `role` phân biệt hoa/thường, là một trong: `ADMIN`, `HR_MANAGER`, `RECRUITER`, `HIRING_MANAGER`, `INTERVIEWER`, `APPROVER`. `CANDIDATE` là vai trò bên ngoài, không gán vào tài khoản nội bộ.

### PUT /accounts/{id}/roles/{role}

Thêm **một** vai trò, giữ mọi vai trò đang có. Không cần JSON body. Ví dụ thêm quyền phỏng vấn cho trưởng bộ phận:

```http
PUT /api/v1/accounts/00000000-0000-0000-0000-000000000001/roles/INTERVIEWER
Authorization: Bearer <accessToken>
```

Nếu tài khoản đã có vai trò đó, vẫn trả200; không tạo bản ghi trùng.

### DELETE /accounts/{id}/roles/{role}

Chỉ bỏ vai trò nêu trên đường dẫn; giữ các vai trò khác. Không cần body. Vai trò đã vắng mặt vẫn trả200. **Không được tự thu hồi ADMIN của chính mình**: trả409 kể cả khi còn các vai trò khác.

### Kết quả và lỗi

Cả hai thao tác thành công trả **200**, `Cache-Control: no-store`:

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "roles": ["HIRING_MANAGER", "INTERVIEWER"]
}
```

Danh sách role sắp xếp theo tên. Response không chứa mật khẩu, token, hash hoặc phiên. Có thể gán/thu hồi role của tài khoản đang chờ kích hoạt hoặc disabled; việc này không kích hoạt/mở khóa tài khoản, không đổi thông tin hồ sơ/mật khẩu và không cấp hay thu hồi phiên.

| HTTP | Mã | Ý nghĩa |
|---|---|---|
|400|VALIDATION_ERROR|UUID hoặc tên role không hợp lệ|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token/phiên hoặc tài khoản thực hiện không hoạt động|
|403|FORBIDDEN|Không còn ADMIN hoặc thiếu quyền quản trị|
|404|ACCOUNT_NOT_FOUND|UUID hợp lệ nhưng không có tài khoản đích|
|409|SELF_ADMIN_REVOCATION|Admin tự thu hồi ADMIN|

Ví dụ409:

```json
{
  "code": "SELF_ADMIN_REVOCATION",
  "message": "Bạn không thể thu hồi vai trò ADMIN của chính mình.",
  "fieldErrors": {}
}
```

Frontend nên dựa vào HTTP/mã lỗi thay vì so khớp nội dung tiếng Việt. CORS cho phépPUT/DELETE từ các origin đã cấu hình.

### Hiệu lực quyền

Sau khi request thay đổi thành công, lần gọi API kế tiếp dùng **cùng access token** sẽ được kiểm bằng vai trò/quyền mới trong DB. Không cần đăng nhập lại, chờ JWT hết hạn hoặc cấp JWT mới. Nếu người đó giữ nhiều vai trò, quyền là hợp các quyền của những vai trò còn lại. Frontend cần gọi lại `/auth/permissions` để cập nhật menu và xử lý403 của API.

Cho phép thu hồi vai trò cuối của người khác. Khi danh sách rỗng và tài khoản còn được truy cập, người đó vẫn có thể đăng nhập/refresh nhưng không gọi được API cần quyền, kể cả `/auth/me`, `/auth/permissions`, `/auth/logout` hiện dùng SELF_* theo vai trò. Admin có thể gán lại vai trò. Để chặn cả đăng nhập và thu hồi phiên, dùng [API khóa tài khoản](#api-account-locking).

### Dữ liệu và chạy local

Dùng `user_roles` từV1 cùng danh mục/quyềnV3, không có migration mới, không cần đổi `.env`. Khóa actor/target theoUUID rồi khóa phiên để kiểm lại quyền trước khi thay đổi; transaction bảo vệ các thao tác đồng thời. PK(user_id,role) giữ mỗi cặp duy nhất. Backend phải được khởi động lại bằng bản code mới để có hai endpoint; database hiện có được giữ nguyên.

*Nguồn: `docs/api/account-roles.md` (Sprint 1).*


---

<a id="api-account-locking"></a>

## Khóa và mở khóa tài khoản

Jira TKNHTTDNB1-162–166, story 19. Admin khóa tài khoản để chặn truy cập và thu hồi mọi phiên của người đó. Các URL dưới đây dùng tiền tố `/api/v1`.

Người gọi phải có **ADMIN và USER_ADMIN_WRITE_ALL**, gửi Bearer access token. Backend kiểm lại quyền, trạng thái tài khoản và phiên sau khi khóa bản ghi để tránh sử dụng quyền cũ khi phải chờ request khác.

### PUT /accounts/{id}/lock

`id` là UUID tài khoản đích. JSON bắt buộc:

```json
{"reason": "Nhân sự đã nghỉ việc, cần bàn giao công việc."}
```

`reason` bỏ khoảng trắng đầu/cuối, không trống, tối đa 500 ký tự. Trường JSON lạ như `enabled` hoặc `lockedBy` bị từ chối với HTTP 400, không cho client chọn người/thời điểm khóa. Admin không được tự khóa tài khoản của mình: HTTP 409 `SELF_ACCOUNT_LOCK`.

Thành công trả HTTP 200, `Cache-Control: no-store`:

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "status": "ADMINISTRATIVELY_LOCKED",
  "lockReason": "Nhân sự đã nghỉ việc, cần bàn giao công việc.",
  "lockedAt": "2026-10-06T08:00:00Z",
  "lockedBy": "00000000-0000-0000-0000-000000000002",
  "handoverWarning": "Vui lòng rà soát và bàn giao các vị trí tuyển dụng do tài khoản này phụ trách (nếu có)."
}
```

PUT lặp lại trên tài khoản đang khóa giữ người, thời điểm và lý do của lần khóa đầu; vẫn bảo đảm các phiên và reset link bị thu hồi. Đây không phải API sửa lý do khóa. Metadata mô tả lần khóa đang có, chưa phải lịch sử audit.

Sau khi transaction thành công, login bị từ chối; các access token và refresh token cũ không còn dùng được. Mọi phiên chưa bị thu hồi của **tài khoản đích** được thu hồi; phiên người khác giữ nguyên. Reset link chưa dùng bị vô hiệu hóa. API không đổi mật khẩu, vai trò, thông tin hồ sơ, trạng thái kích hoạt hay khóa 15 phút do nhập sai.

`handoverWarning` là lời nhắc luôn trả khi khóa. Backend chưa có module vị trí tuyển dụng nên chưa truy vấn số lượng/danh sách vị trí thực tế hoặc thực hiện bàn giao. Frontend hiển thị lời nhắc; nghiệp vụ xác định vị trí cần bàn giao còn phụ thuộc module đó.

### DELETE /accounts/{id}/lock

Không cần body. Chỉ bỏ khóa hành chính, trả HTTP 200 cùng cấu trúc trên: `lockReason`, `lockedAt`, `lockedBy`, `handoverWarning` là `null`. `status` thể hiện trạng thái còn lại: ACTIVE/PENDING_ACTIVATION/DISABLED/TEMPORARILY_LOCKED. Gọi lại trên tài khoản không bị khóa vẫn trả HTTP 200.

Mở khóa không phục hồi phiên/reset link đã thu hồi: người dùng cần đăng nhập lại hoặc yêu cầu reset link mới. Không tự kích hoạt tài khoản pending, không bỏ khóa 15 phút và không thay password/roles/profile.

Với tài khoản chưa kích hoạt, link kích hoạt được giữ. Khi đang khóa, gọi activate bị từ chối với HTTP 400 mà không tiêu thụ link; sau mở khóa, link còn hạn và chưa dùng có thể kích hoạt bình thường. Link hết hạn vẫn bị từ chối theo chính sách 24 giờ hiện có; API gửi lại lời mời chưa có trong nhóm này.

### Trạng thái và lỗi

GET `/accounts`, GET `/accounts/{id}` và bộ lọc `status` hỗ trợ thêm `ADMINISTRATIVELY_LOCKED`. Trạng thái này ưu tiên hơn các trạng thái khác khi `admin_locked_at` khác `NULL`; response AccountView hiện có giữ cấu trúc cũ, không chứa lý do khóa. Thông tin lý do/người/thời điểm có trong response của API khóa.

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Lý do trống/quá dài hoặc UUID sai|
|400|INVALID_JSON|Body sai định dạng hoặc có trường không hỗ trợ|
|401|Lỗi xác thực/phiên|Thiếu/sai/hết token hoặc người gọi bị khóa/phiên thu hồi|
|403|FORBIDDEN|Thiếu ADMIN hoặc quyền ghi quản trị|
|404|ACCOUNT_NOT_FOUND|Tài khoản đích không tồn tại|
|409|SELF_ACCOUNT_LOCK|Admin tự khóa tài khoản mình|

Lỗi login khi bị khóa vẫn dùng thông báo xác thực chung; không tiết lộ lý do khóa qua endpoint công khai. CORS dùng PUT/DELETE hiện có cho các origin được cấu hình.

### Migration và vận hành local

V6 thêm ba cột nullable: `admin_locked_at`, `admin_lock_reason` kiểu VARCHAR(500), `admin_locked_by` kiểu UUID tham chiếu tài khoản người khóa. Cả ba phải cùng `NULL` hoặc cùng có giá trị; DB kiểm lý do không trống. Tài khoản cũ mặc định không bị khóa hành chính. Không sửa V1–V5, không cần tạo database hay sao chép lại `.env`.

Sao lưu trước khi khởi động backend mới; Flyway tự áp dụng V6 và các migration còn thiếu. Kiểm thử tự động dùng PostgreSQL tạm. Không hạ về bản backend cũ bỏ qua trạng thái khóa mới khi còn tài khoản đang khóa; cần kế hoạch tương thích và kiểm tra dữ liệu trước rollback.

*Nguồn: `docs/api/account-locking.md` (Sprint 1).*


---

<a id="api-departments"></a>

## API phòng ban và sơ đồ tổ chức

Phạm vi TKNHTTDNB1-195–198. URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; mọi response thành công dùng `Cache-Control: no-store`.

Đọc cần `ORGANIZATION_READ_ALL`; ghi cần `ORGANIZATION_WRITE_ALL`. Ma trận hiện tại cấp quyền đọc cho cả sáu vai trò nội bộ, ghi cho ADMIN và HR_MANAGER. Backend kiểm quyền hiện tại trong database và kiểm lại phiên/quyền khi thao tác ghi phải chờ khóa (chi tiết ở mục "Quyền quản lý" bên dưới).

### Tạo và sửa

`POST /departments` tạo phòng ban, trả **201**. `PUT /departments/{id}` cập nhật phòng ban có UUID tương ứng, trả **200**.

```json
{
  "code": "HR",
  "name": "Phòng Nhân sự",
  "parentId": null,
  "managerUserId": "00000000-0000-0000-0000-000000000001",
  "active": true
}
```

| Trường | Quy tắc |
|---|---|
|code|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 50 ký tự; duy nhất và phân biệt hoa/thường theo schema V5|
|name|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 255 ký tự|
|parentId|UUID phòng ban cha; null hoặc bỏ trường nghĩa là phòng ban gốc|
|managerUserId|UUID người phụ trách, bắt buộc|
|active|Boolean bắt buộc; false nghĩa là ngừng áp dụng|

PUT thay thế toàn bộ các trường trên. Frontend phải gửi lại parentId hiện tại nếu muốn giữ phòng ban cha. Trường ngoài hợp đồng như id, createdAt, children hoặc roles bị từ chối với HTTP 400.

Response của tạo/sửa và `GET /departments/{id}`:

```json
{
  "id": "00000000-0000-0000-0000-000000000002",
  "code": "HR",
  "name": "Phòng Nhân sự",
  "parentId": null,
  "managerUserId": "00000000-0000-0000-0000-000000000001",
  "managerFullName": "Nguyễn Văn A",
  "active": true,
  "createdAt": "2026-10-06T08:00:00Z"
}
```

UUID trong ví dụ chỉ minh họa; managerUserId phải là tài khoản có thật. Đổi người phụ trách không tự đổi phòng ban hoặc vai trò của người đó.

Khi tạo, đổi người phụ trách hoặc bật lại một phòng ban, người được chọn phải tồn tại, đã bật tài khoản và không bị Admin khóa. Không bắt buộc một vai trò riêng cho người phụ trách. Có thể giữ người phụ trách hiện tại đã bị khóa khi sửa tên/mã/phòng cha hoặc ngừng áp dụng; bật lại phải chọn người đủ điều kiện.

Parent phải tồn tại, không được là chính phòng ban hoặc hậu duệ của nó. Phòng cha có thể đã ngừng áp dụng. Hai người đổi quan hệ cha đồng thời vẫn phải giữ cây không có chu trình.

### Danh sách

`GET /departments?q=nhân%20sự&active=true&page=0&size=20`

| Tham số | Ý nghĩa |
|---|---|
|q|Tìm một phần code/name, không phân biệt hoa/thường, tối đa 255 ký tự; %, _ được hiểu là ký tự thật|
|active|true/false; bỏ qua để lấy cả hai trạng thái|
|page|Từ 0, mặc định 0|
|size|Từ 1 đến 100, mặc định 20|

Response: `{items, page, size, totalElements, totalPages}`. Mỗi item có cấu trúc chi tiết ở trên. Sắp xếp theo code rồi UUID để phân trang ổn định; trang ngoài phạm vi có items rỗng. Không có lọc tự động theo phòng ban của người gọi vì quyền hiện tại là READ_ALL.

### Cây tổ chức

`GET /departments/tree` trả mảng các node gốc. Mỗi node có toàn bộ trường của chi tiết và thêm `children` là mảng các phòng con; node lá có children rỗng. Thứ tự node cùng cấp theo code rồi UUID. Chưa có dữ liệu trả `[]`.

Cây chứa cả node active và inactive, không phân trang hoặc lọc để tránh làm đứt quan hệ cha–con. Dữ liệu cây có chu trình do sửa SQL ngoài API sẽ trả HTTP 409 `DEPARTMENT_TREE_INVALID`; backend không bỏ qua âm thầm các node lỗi.

Ngừng áp dụng một phòng không xóa phòng, không tự ngừng phòng con hoặc gỡ thành viên. API quản trị tài khoản hiện có từ chối gán mới vào phòng inactive nhưng cho giữ liên kết cũ. [API yêu cầu tuyển dụng](#api-requisitions) (task 246) không cho tạo hoặc lưu lại bản nháp với phòng inactive (`REQUISITION_DEPARTMENT_INACTIVE`); nháp đã có vẫn xem được. Trong lúc một yêu cầu tuyển dụng đang được lưu, PUT sửa phòng đó (kể cả ngừng áp dụng) phải chờ yêu cầu lưu xong.

### Xóa (task 197)

`DELETE /departments/{id}` xóa hẳn một phòng ban **không còn được dùng**, ví dụ phòng tạo nhầm. Cần `ORGANIZATION_WRITE_ALL` như tạo/sửa (ADMIN, HR_MANAGER); người phụ trách phòng ban không vì thế mà được xóa. Không có body. Thành công trả **204**, body rỗng, `Cache-Control: no-store`.

Phòng ban còn được dùng thì **không xóa được, chỉ ngừng áp dụng** bằng PUT `active=false` (giữ lại lịch sử). Backend kiểm theo thứ tự sau và trả 409 cho lý do đầu tiên gặp phải:

| Thứ tự | Điều kiện | HTTP | Mã | Cách xử lý gợi ý |
|---|---|---|---|---|
|1|Phòng ban có yêu cầu tuyển dụng **chưa đóng** của chính nó|409|DEPARTMENT_HAS_OPEN_REQUISITIONS|Ngừng áp dụng phòng ban thay vì xóa|
|2|Còn phòng ban con (`parentId` trỏ tới phòng này)|409|DEPARTMENT_HAS_CHILDREN|Chuyển hoặc xóa phòng con trước, hoặc ngừng áp dụng|
|3|Còn tài khoản thuộc phòng ban (kể cả tài khoản chưa kích hoạt hoặc bị khóa)|409|DEPARTMENT_HAS_MEMBERS|Chuyển tài khoản sang phòng khác qua `PUT /accounts/{id}`, hoặc ngừng áp dụng|
|4|Một dòng dữ liệu khác vẫn tham chiếu phòng ban (khóa ngoại)|409|DEPARTMENT_IN_USE|Ngừng áp dụng phòng ban thay vì xóa|

- "Chưa đóng": V13 chỉ có trạng thái `DRAFT` và bản nháp được coi là chưa đóng, nên **hiện nay mọi yêu cầu tuyển dụng của phòng ban đều chặn việc xóa**. Khi luồng duyệt thêm trạng thái mới, trạng thái nào chưa đóng/chưa hủy phải được thêm vào danh sách `OPEN_REQUISITION_STATUSES` của `DepartmentRepository`. Yêu cầu đã đóng vẫn tham chiếu phòng ban (khóa ngoại V13 `ON DELETE RESTRICT` giữ lịch sử), nên vẫn chặn xóa nhưng với mã 4 `DEPARTMENT_IN_USE`.
- Chỉ tính yêu cầu tuyển dụng của chính phòng ban: yêu cầu của phòng con chặn xóa phòng con, còn phòng cha bị chặn vì còn phòng con (mã 2).
- Phòng ban đã ngừng áp dụng vẫn bị kiểm như trên; ngừng áp dụng không làm phòng "xóa được".
- Mã 4 là lớp chặn cuối khi các bước 1–3 không biết tới dòng tham chiếu (ví dụ yêu cầu đã đóng sau này hoặc bảng mới), để không trả 500.
- Lỗi 409 có `fieldErrors` rỗng; frontend nên dựa vào `code`, có thể hiện `message` tiếng Việt.

Thứ tự lỗi đầy đủ: 401 (token/phiên), 403 (thiếu quyền, kể cả với UUID không tồn tại), 404 `DEPARTMENT_NOT_FOUND`, rồi 409 như bảng trên. UUID sai định dạng trả 400 `VALIDATION_ERROR`. Gọi lại DELETE cho phòng đã xóa trả 404.

**Đồng thời:** service khóa tài khoản người gọi, phiên, advisory lock của cây (giống tạo/sửa), kiểm lại quyền, rồi khóa dòng phòng ban (`SELECT ... FOR UPDATE`) và kiểm lại quyền thêm một lần (task 198) trước khi kiểm các điều kiện trên. Lưu yêu cầu tuyển dụng và gán tài khoản vào phòng ban đọc dòng này bằng `FOR SHARE`, nên:

- yêu cầu tuyển dụng hoặc việc gán tài khoản đang lưu dở: DELETE chờ; nếu bên kia commit thì DELETE thấy dữ liệu mới và trả 409 tương ứng, nếu bên kia hủy thì DELETE xóa bình thường;
- DELETE đang chạy: việc lưu yêu cầu tuyển dụng/gán tài khoản vào phòng đó chờ, rồi nhận lỗi phòng ban không tồn tại (`INVALID_REQUISITION_DEPARTMENT`, `INVALID_DEPARTMENT`);
- PUT đổi phòng cha sang phòng đang bị xóa chờ advisory lock của cây, rồi nhận `INVALID_DEPARTMENT_PARENT`.

Xóa không đổi tài khoản người phụ trách, phòng cha hay dữ liệu nào khác.

### Quyền quản lý (task 198)

| Người gọi (theo seed V3) | Đọc (`GET`) | Tạo, sửa, xóa (`POST`, `PUT`, `DELETE`) |
|---|---|---|
|ADMIN, HR_MANAGER|200|Được phép|
|RECRUITER, HIRING_MANAGER, INTERVIEWER, APPROVER|200|403 `FORBIDDEN`, không ghi gì|
|Tài khoản không còn vai trò nào|403|403 `FORBIDDEN`, không ghi gì|

- Backend kiểm theo **mã quyền** `ORGANIZATION_WRITE_ALL` của các vai trò người gọi, đọc lại từ `role_permissions` ở mỗi yêu cầu, không theo tên vai trò. Cấp/gỡ quyền bằng migration mới, hoặc gán/gỡ vai trò qua [API vai trò tài khoản](#api-account-roles), có hiệu lực ngay ở yêu cầu kế tiếp với cùng access token, không cần đăng nhập lại.
- Là người phụ trách (`managerUserId`) của một phòng ban không cho thêm quyền sửa hay xóa phòng ban đó.
- Lớp 1: `SecurityConfiguration` kiểm quyền ở URL trước khi đọc body, nên người thiếu quyền nhận 403 kể cả khi body sai hoặc UUID không tồn tại (không lộ 400/404).
- Lớp 2: `DepartmentService` khóa tài khoản người gọi (và người phụ trách trong body), phiên, advisory lock của cây, rồi kiểm lại token, phiên và quyền.
- Lớp 3 (task 198): `PUT` và `DELETE` còn khóa dòng phòng ban (`SELECT ... FOR UPDATE`). Bước này có thể phải chờ, vì việc gán tài khoản vào phòng hoặc lưu yêu cầu tuyển dụng của phòng giữ dòng `FOR SHARE` tới khi commit. Sau khi chờ, service kiểm lại lần nữa: quyền bị gỡ trong lúc chờ trả 403 `FORBIDDEN`, access token hết hạn trong lúc chờ trả 401 `SESSION_INVALID`, và không có gì được ghi. Lần kiểm này đứng trước 404, nên người đã mất quyền không biết phòng ban có tồn tại hay không. `POST` không khóa phòng ban có sẵn nên không có lớp 3.
- Admin gỡ vai trò qua API đúng lúc người đó đang ghi phòng ban: API vai trò khóa cùng dòng tài khoản nên chờ thao tác ghi xong. Thao tác đang chạy hoàn tất (lúc kiểm, người đó còn quyền); yêu cầu kế tiếp nhận 403.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu/sai trường, UUID, page/size hoặc bộ lọc|
|400|INVALID_JSON|JSON sai hoặc có trường ngoài hợp đồng|
|400|INVALID_DEPARTMENT_PARENT|Phòng ban cha không tồn tại|
|400|INVALID_DEPARTMENT_MANAGER|Người phụ trách không tồn tại/không đủ điều kiện cho thao tác|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Thiếu quyền tổ chức tương ứng|
|404|DEPARTMENT_NOT_FOUND|Không tìm thấy phòng ban đích|
|409|DEPARTMENT_CODE_EXISTS|Mã đã dùng|
|409|DEPARTMENT_CYCLE|Quan hệ cha mới tạo chu trình|
|409|DEPARTMENT_TREE_INVALID|Cây đã lưu có dữ liệu không hợp lệ|
|409|DEPARTMENT_HAS_OPEN_REQUISITIONS|DELETE: phòng ban có yêu cầu tuyển dụng chưa đóng (task 197)|
|409|DEPARTMENT_HAS_CHILDREN|DELETE: phòng ban còn phòng ban con|
|409|DEPARTMENT_HAS_MEMBERS|DELETE: phòng ban còn tài khoản thuộc phòng ban|
|409|DEPARTMENT_IN_USE|DELETE: dữ liệu khác vẫn tham chiếu phòng ban (khóa ngoại)|

### Database và phạm vi

Dùng bảng departments của V5 và quyền ORGANIZATION của V3, không thêm migration hoặc thay .env. Task 197 thêm DELETE, đọc thêm bảng `recruitment_requisitions` của V13 và `user_accounts.department_id` của V5; cũng không thêm migration hay quyền mới. Task 198 chỉ thêm lần kiểm quyền sau khi khóa dòng phòng ban; không thêm endpoint, migration hay quyền. Chưa nghiệm thu toàn bộ story 23 qua giao diện.

Service kiểm chu trình và phối hợp khóa trong PostgreSQL cho các API ghi. V5 chỉ có CHECK chống tự làm cha và các FK, không có ràng buộc chống mọi chu trình khi sửa SQL thủ công. Không tự cascade trạng thái hoặc chuyển giao người phụ trách.

*Nguồn: `docs/api/departments.md` (Sprint 2).*


---

<a id="api-positions"></a>

## API danh mục chức danh

Phạm vi TKNHTTDNB1-203 (API), TKNHTTDNB1-204 (kiểm tra dữ liệu, giới hạn dải lương), TKNHTTDNB1-205 (phân quyền xem dải lương) và TKNHTTDNB1-206 (dữ liệu dải lương chuẩn cho kiểm tra hạn mức offer, không có API mới), story TKNHTTDNB1-24; cùng TKNHTTDNB1-214 (gán khung năng lực dùng chung cho chức danh, story TKNHTTDNB1-25), xem mục [Khung năng lực của chức danh](#khung-năng-lực-của-chức-danh-task-214). URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; mọi response thành công và các lỗi `POSITION_*` dùng `Cache-Control: no-store`.

Backend đọc quyền hiện tại trong database ở mỗi yêu cầu và kiểm lại phiên/quyền sau khi khóa tài khoản người gọi khi ghi.

| Thao tác | Quyền cần có | Vai trò được phép theo seed hiện tại |
|---|---|---|
|`GET /positions`, `GET /positions/{id}`|`ORGANIZATION_READ_ALL`|6 vai trò nội bộ|
|Thấy `salaryMin`/`salaryMax` trong response|Thêm `SALARY_RANGES_READ_ALL`|Chỉ HR_MANAGER|
|`POST /positions`, `PUT /positions/{id}`|`ORGANIZATION_WRITE_ALL` **và** `SALARY_RANGES_WRITE_ALL`|Chỉ HR_MANAGER|
|`PUT /positions/{id}/competency-framework`, `DELETE /positions/{id}/competency-framework`|`ORGANIZATION_WRITE_ALL` (không cần quyền dải lương)|ADMIN, HR_MANAGER|

### Ai được xem dải lương

Tiêu chí của story 24: "chỉ Trưởng phòng Nhân sự xem được dải lương". Migration V7_1 thêm module quyền `SALARY_RANGES` và chỉ cấp `SALARY_RANGES_READ_ALL`, `SALARY_RANGES_WRITE_ALL` cho HR_MANAGER. ADMIN cố ý **không** được cấp, chờ BA/PO trả lời câu hỏi 4 trong ma trận vai trò và quyền (`docs/architecture/role-permission-matrix.md` trong repo Backend).

Dải lương bị loại ngay trên server, không chỉ ẩn trên giao diện:

- Người gọi có `SALARY_RANGES_READ_ALL`: mỗi chức danh có đủ 10 trường như ví dụ bên dưới.
- Người gọi không có quyền này: response **không có hai khóa** `salaryMin` và `salaryMax` (không phải giá trị `null` hay `0`), chỉ còn 8 trường `id`, `code`, `name`, `level`, `active`, `competencyFrameworkId`, `createdAt`, `updatedAt`. Áp dụng cho `GET /positions/{id}`, từng phần tử `items` của `GET /positions` và response của POST/PUT, kể cả hai API gán/bỏ khung năng lực.
- `SALARY_RANGES_READ_SCOPED` chưa có ý nghĩa nghiệp vụ và chưa vai trò nào được cấp, nên server coi như không có quyền xem.
- Quyền ghi không bao gồm quyền xem: nếu một vai trò chỉ có `SALARY_RANGES_WRITE_ALL`, POST/PUT vẫn lưu dải lương nhưng response không trả lại hai khóa trên.

Quyền được đọc lại ở mỗi yêu cầu, nên khi cấp hoặc thu hồi `SALARY_RANGES_READ_ALL`, cùng access token sẽ thấy hoặc mất dải lương ngay ở yêu cầu kế tiếp. Frontend nên hiện cột lương khi `GET /auth/permissions` có `SALARY_RANGES_READ_ALL` và hiện nút tạo/sửa chức danh khi có cả `ORGANIZATION_WRITE_ALL` lẫn `SALARY_RANGES_WRITE_ALL`; dù vậy, server vẫn tự kiểm tra.

Ví dụ một chức danh trả cho người không có quyền xem dải lương:

```json
{
  "id": "00000000-0000-0000-0000-000000000003",
  "code": "DEV_JUNIOR",
  "name": "Lập trình viên",
  "level": "Junior",
  "active": true,
  "competencyFrameworkId": null,
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T08:00:00Z"
}
```

### Tạo và sửa

`POST /positions` tạo chức danh, trả **201**. `PUT /positions/{id}` thay thế toàn bộ trường của chức danh có UUID tương ứng, trả **200**. Vì lương tối thiểu/tối đa là trường bắt buộc, cả hai thao tác cần đồng thời `ORGANIZATION_WRITE_ALL` và `SALARY_RANGES_WRITE_ALL`. Với seed hiện tại chỉ HR_MANAGER làm được; ADMIN có `ORGANIZATION_WRITE_ALL` nhưng vẫn nhận 403.

```json
{
  "code": "DEV_JUNIOR",
  "name": "Lập trình viên",
  "level": "Junior",
  "salaryMin": 15000000,
  "salaryMax": 25000000,
  "active": true
}
```

| Trường | Quy tắc |
|---|---|
|code|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 50 ký tự; duy nhất và phân biệt hoa/thường (`HR` khác `hr`), giống mã phòng ban|
|name|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 255 ký tự|
|level|Cấp bậc dạng chữ tự do, ví dụ `Junior`; bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 50 ký tự|
|salaryMin|Lương tối thiểu, số nguyên đồng VND, bắt buộc, từ 0 đến 1.000.000.000.000|
|salaryMax|Lương tối đa, số nguyên đồng VND, bắt buộc, từ 0 đến 1.000.000.000.000, không nhỏ hơn `salaryMin` (được phép bằng)|
|active|Boolean bắt buộc; false nghĩa là ngừng áp dụng|

Code/name/level được bỏ khoảng trắng đầu/cuối (kể cả tab, xuống dòng) trước khi kiểm tra độ dài, nên `"  DEV  "` được lưu là `DEV` và khoảng trắng thừa không bị tính vào giới hạn.

Lương là số nguyên đồng (database `BIGINT`, Java `long`), có thể vượt 2.147.483.647. Phải gửi số nguyên JSON như `15000000`; số có phần thập phân (`1.9`, kể cả `1.0`), dạng mũ (`1e3`), chuỗi (`"15000000"`) hoặc số vượt giới hạn `long` bị từ chối với `INVALID_JSON`, không bị cắt phần lẻ hay tự đổi kiểu. Mỗi mức lương phải nằm trong 0 đến 1.000.000.000.000 đồng (1.000 tỷ): trần này cao hơn mọi mức lương thực tế, chỉ để chặn lỗi gõ thừa số 0 và giữ các phép tính offer về sau xa giới hạn `long`. Trần chỉ được kiểm tra ở API; V7 không có CHECK cho trần nên dữ liệu ghi thẳng bằng SQL không bị chặn.

Thứ tự kiểm tra: trước hết từng trường riêng lẻ (bắt buộc, độ dài, lương không âm, không vượt trần), mọi trường sai được trả cùng lúc trong `fieldErrors` với mã `VALIDATION_ERROR`. Chỉ khi từng trường đều hợp lệ, backend mới so hai mức lương: `salaryMin` lớn hơn `salaryMax` trả `POSITION_SALARY_RANGE_INVALID` kèm lỗi ở trường `salaryMax`. `salaryMin` bằng `salaryMax` là dải lương cố định, hợp lệ. Sau đó mới kiểm tra chức danh tồn tại (PUT) và mã trùng. Ràng buộc CHECK của V7 (`0 <= salary_min <= salary_max`) vẫn là lớp chặn cuối trong database.

PUT phải gửi đủ sáu trường; nên GET chi tiết trước rồi gửi lại các giá trị muốn giữ. Giữ nguyên mã của chính chức danh đang sửa không bị coi là trùng. Trường ngoài hợp đồng như `id`, `createdAt` hay `competencyFrameworkId` bị từ chối với HTTP 400 `INVALID_JSON`. PUT này **giữ nguyên** khung năng lực đang gán; muốn đổi khung thì dùng API ở mục [Khung năng lực của chức danh](#khung-năng-lực-của-chức-danh-task-214).

Response của tạo/sửa và `GET /positions/{id}` cho người có `SALARY_RANGES_READ_ALL`:

```json
{
  "id": "00000000-0000-0000-0000-000000000003",
  "code": "DEV_JUNIOR",
  "name": "Lập trình viên",
  "level": "Junior",
  "salaryMin": 15000000,
  "salaryMax": 25000000,
  "active": true,
  "competencyFrameworkId": "00000000-0000-0000-0000-000000000010",
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T08:00:00Z"
}
```

UUID trong ví dụ chỉ minh họa. `competencyFrameworkId` là UUID của khung năng lực mà chức danh đang dùng, hoặc `null` khi chưa gán; khóa này luôn có mặt, khác với hai khóa lương. `createdAt` giữ nguyên khi sửa; `updatedAt` là thời điểm ghi gần nhất (UTC, độ chính xác micro giây như PostgreSQL lưu).

### Danh sách

`GET /positions?q=dev&active=true&page=0&size=20`

| Tham số | Ý nghĩa |
|---|---|
|q|Tìm một phần code/name, không phân biệt hoa/thường, tối đa 255 ký tự; %, _ và ! được hiểu là ký tự thật; không tìm theo level|
|active|true/false; bỏ qua để lấy cả hai trạng thái|
|page|Từ 0, mặc định 0|
|size|Từ 1 đến 100, mặc định 20|

Response: `{items, page, size, totalElements, totalPages}`; mỗi item có cấu trúc chi tiết ở trên, và cũng không có `salaryMin`/`salaryMax` nếu người gọi thiếu `SALARY_RANGES_READ_ALL`. Danh sách không lọc hay sắp xếp theo lương. Sắp xếp theo code rồi UUID để phân trang ổn định; trang ngoài phạm vi có items rỗng.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu/sai trường, lương âm hoặc vượt 1.000.000.000.000, UUID, page/size, active hoặc q quá dài; lỗi theo trường nằm trong `fieldErrors`|
|400|INVALID_JSON|JSON sai, lương không phải số nguyên JSON trong giới hạn `long`, hoặc có trường ngoài hợp đồng|
|400|POSITION_SALARY_RANGE_INVALID|`salaryMin` lớn hơn `salaryMax`; `fieldErrors.salaryMax` có lời nhắn để form hiển thị; dữ liệu không thay đổi|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Đọc thiếu `ORGANIZATION_READ_ALL`; ghi thiếu `ORGANIZATION_WRITE_ALL` hoặc `SALARY_RANGES_WRITE_ALL` (kể cả ADMIN)|
|404|POSITION_NOT_FOUND|Không tìm thấy chức danh đích|
|409|POSITION_CODE_EXISTS|Mã đã được chức danh khác dùng, kể cả khi hai yêu cầu ghi cùng mã đồng thời|

Lỗi riêng của hai API gán/bỏ khung năng lực nằm ở mục [Khung năng lực của chức danh](#khung-năng-lực-của-chức-danh-task-214).

Ví dụ lỗi dải lương ngược:

```json
{
  "code": "POSITION_SALARY_RANGE_INVALID",
  "message": "Lương tối thiểu không được lớn hơn lương tối đa.",
  "fieldErrors": {
    "salaryMax": "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu."
  }
}
```

Người không có quyền ghi luôn nhận 403, kể cả khi body sai, vì quyền được kiểm tra trước dữ liệu.

### Khung năng lực của chức danh (task 214)

Story 25: "khung năng lực dùng lại được cho nhiều chức danh". Mỗi chức danh **trỏ tới** một khung năng lực qua cột `positions.competency_framework_id` (V8); tiêu chí chỉ nằm trong khung và **không bị sao chép** sang từng chức danh. Các chức danh dùng chung một khung cùng đọc một bộ dòng `competency_criteria`, nên sửa khung (`PUT /competency-frameworks/{id}`) là áp dụng ngay cho mọi chức danh đang dùng nó. Danh sách chức danh đang dùng một khung nằm ở trường `positions` của `GET /competency-frameworks/{id}` ([API khung năng lực](#api-competency-frameworks)). Tiêu chí và trọng số mà một chức danh được chấm theo (task 215) đọc bằng `GET /positions/{id}/evaluation-criteria` ([API tiêu chí đánh giá theo chức danh](#api-evaluation-criteria)).

Hai API dưới đây chỉ đổi liên kết, không đụng tới dải lương, nên chỉ cần `ORGANIZATION_WRITE_ALL`: ADMIN cũng làm được (khác với tạo/sửa chức danh), dù response gửi cho ADMIN vẫn không có `salaryMin`/`salaryMax`.

#### Gán hoặc đổi khung: `PUT /positions/{id}/competency-framework`

```json
{ "frameworkId": "00000000-0000-0000-0000-000000000010" }
```

- `frameworkId` bắt buộc, là UUID của khung năng lực. Thiếu hoặc `null` trả 400 `VALIDATION_ERROR` (`fieldErrors.frameworkId`); không phải UUID hoặc có trường khác trả 400 `INVALID_JSON`. Muốn bỏ khung thì dùng DELETE bên dưới, không gửi `null`.
- Chỉ gán được khung **hoàn chỉnh** (`ACTIVE`, tổng trọng số đúng 100%), vì phiếu đánh giá phỏng vấn sẽ chấm theo khung này. Khung `DRAFT` trả 409 `COMPETENCY_FRAMEWORK_NOT_ACTIVE`, kể cả khi trọng số của bản nháp đã đủ 100%.
- Chức danh đang có khung khác thì được đổi sang khung mới; gán lại đúng khung đang dùng vẫn trả 200. Chức danh ngừng áp dụng (`active=false`) vẫn được gán.
- Trả **200** với chức danh sau khi đổi (cấu trúc như `GET /positions/{id}`); `updatedAt` là thời điểm gán.

#### Bỏ khung: `DELETE /positions/{id}/competency-framework`

Không có body. Đặt `competencyFrameworkId` của chức danh về `null` và trả **200** với chức danh sau khi đổi. Khung và tiêu chí vẫn giữ nguyên cho các chức danh khác. Gọi khi chức danh chưa có khung vẫn trả 200.

#### Khung đang được dùng luôn hoàn chỉnh

Theo task 213, khung `ACTIVE` không chuyển lại `DRAFT` (409 `COMPETENCY_FRAMEWORK_ALREADY_ACTIVE`) và mọi lần sửa phải giữ tổng trọng số đúng 100% (400 `COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID`). Vì chỉ khung `ACTIVE` được gán, chức danh nào có khung cũng luôn trỏ tới một khung hoàn chỉnh. Khung đang được chức danh dùng cũng không xóa được (khóa ngoại `ON DELETE RESTRICT`; hiện chưa có API xóa khung).

#### Thứ tự kiểm tra và ghi đồng thời

1. Quyền (403) và body (`VALIDATION_ERROR`, `INVALID_JSON`); người không có `ORGANIZATION_WRITE_ALL` luôn nhận 403, kể cả khi body sai.
2. Service khóa tài khoản người gọi rồi phiên, kiểm lại trạng thái, phiên, hạn JWT và quyền (giống tạo/sửa chức danh).
3. Khóa dòng chức danh (`SELECT ... FOR UPDATE`, như `PUT /positions/{id}`); không có thì 404 `POSITION_NOT_FOUND`. Đường dẫn được kiểm trước, nên chức danh và khung cùng không tồn tại thì trả 404.
4. PUT: đọc khung bằng `SELECT ... FOR SHARE`; không có thì 400 `INVALID_COMPETENCY_FRAMEWORK`; khung `DRAFT` thì 409 `COMPETENCY_FRAMEWORK_NOT_ACTIVE`.

Khóa `FOR SHARE` giữ trạng thái khung không đổi cho tới khi lần gán commit. Nếu một lần sửa khung đang chạy (khóa `FOR UPDATE`), lần gán chờ rồi đọc trạng thái đã commit: khung vừa được chuyển sang `ACTIVE` thì gán thành công. Nhiều lần gán cùng một khung cho các chức danh khác nhau không chờ nhau. Sửa danh mục (`PUT /positions/{id}`) và gán khung cho cùng chức danh chạy lần lượt nhờ khóa dòng chức danh, nên lần sửa danh mục chạy sau vẫn giữ khung vừa được gán.

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu hoặc `null` `frameworkId` (`fieldErrors.frameworkId`), UUID trên đường dẫn sai|
|400|INVALID_JSON|JSON sai hoặc rỗng, `frameworkId` không phải UUID, có trường ngoài `frameworkId`|
|400|INVALID_COMPETENCY_FRAMEWORK|Không có khung năng lực với `frameworkId` này; `fieldErrors.frameworkId`|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Thiếu `ORGANIZATION_WRITE_ALL`|
|404|POSITION_NOT_FOUND|Không tìm thấy chức danh trên đường dẫn|
|409|COMPETENCY_FRAMEWORK_NOT_ACTIVE|Khung còn là bản nháp (`DRAFT`); `fieldErrors.frameworkId`|

Ví dụ gán khung bản nháp:

```json
{
  "code": "COMPETENCY_FRAMEWORK_NOT_ACTIVE",
  "message": "Chỉ gán được khung năng lực đã hoàn chỉnh (ACTIVE) cho chức danh.",
  "fieldErrors": {
    "frameworkId": "Khung năng lực này còn là bản nháp (DRAFT)."
  }
}
```

Mọi lỗi đều không thay đổi chức danh.

### Dải lương chuẩn cho kiểm tra hạn mức offer (task 206)

Task 206 không thêm endpoint, không đổi request/response ở trên và không thêm migration. Backend có thêm dịch vụ nội bộ `SalaryBandService` (gói `vn.ttcs.recruitment.position`) để các chức năng làm sau, như duyệt offer và kiểm tra yêu cầu tuyển dụng, lấy dải lương chuẩn của một chức danh và so với mức lương đề xuất. HR_MANAGER vẫn xem dải lương qua `GET /positions/{id}` như trước.

| Phương thức Java | Kết quả |
|---|---|
|`standardBand(positionId)`|`SalaryBand(positionId, salaryMin, salaryMax)`: hai mức lương là số nguyên đồng VND (`long`), đọc từ bảng `positions`|
|`compare(positionId, proposedSalary)`|`BELOW` nếu thấp hơn `salaryMin`; `WITHIN` nếu từ `salaryMin` đến `salaryMax`; `ABOVE` nếu cao hơn `salaryMax`, tức vượt hạn mức|
|`SalaryBand.compare(proposedSalary)`|Như dòng trên, dùng khi đã có `SalaryBand`|

Quy tắc:

- Cả hai đầu đều nằm trong dải: với dải 15.000.000–25.000.000, mức 15.000.000 và 25.000.000 là `WITHIN`, 25.000.001 là `ABOVE`. Dải cố định (`salaryMin = salaryMax`) chỉ nhận đúng một mức.
- Lương đề xuất âm bị từ chối bằng `IllegalArgumentException` thay vì trả `BELOW`: module gọi phải kiểm request của mình trước (ví dụ `@PositiveOrZero`), nên giá trị âm đến được đây là lỗi lập trình.
- Chức danh không tồn tại: `ApiException` 404 `POSITION_NOT_FOUND`, giống API ở trên.
- **Quyết định với chức danh ngừng áp dụng:** chỉ chức danh `active=true` có dải lương chuẩn. Chức danh `active=false` trả `ApiException` 409 `POSITION_INACTIVE` ("Chức danh đã ngừng áp dụng nên không dùng dải lương của chức danh này để kiểm tra."), áp dụng cho cả yêu cầu/offer mới lẫn offer đang chờ duyệt. Lý do: "ngừng áp dụng" nghĩa là dải lương đó không còn là khung công ty đang duyệt, nên không âm thầm so với nó. Muốn tiếp tục, HR_MANAGER bật lại chức danh bằng PUT `active=true`. Quyết định này chờ BA/PO xác nhận cùng câu hỏi 5 trong ma trận vai trò và quyền (`docs/architecture/role-permission-matrix.md` trong repo Backend).
- **Không kiểm quyền người gọi:** dịch vụ không nhận token và không phải API, nên trả dải lương cho mọi service gọi nó. Module gọi tự kiểm quyền nghiệp vụ của mình (ví dụ quyền `OFFERS_*`) và chỉ được đưa `salaryMin`/`salaryMax` vào response cho người có `SALARY_RANGES_READ_ALL`, giống `PositionView`. Khi chỉ cần biết có vượt hạn mức không, nên gọi `compare(positionId, proposedSalary)` để không phải cầm con số. Lưu ý: kết quả `BELOW`/`WITHIN`/`ABOVE` vẫn hé lộ một phần dải lương; nếu sau này trả kết quả này cho người không có quyền xem, thử nhiều mức lương có thể đoán ra dải, nên module offer cần cân nhắc khi thiết kế response.
- **Đồng thời:** khi được gọi trong transaction ghi của module gọi, dịch vụ đọc bằng `SELECT ... FOR SHARE` nên giữ khóa chia sẻ trên dòng chức danh đến khi transaction đó commit hoặc rollback. Trong thời gian này, PUT của HR_MANAGER (sửa lương hoặc ngừng áp dụng) phải chờ, nên offer không bị duyệt theo một dải lương vừa bị đổi; nhiều lần kiểm tra cùng chức danh vẫn chạy song song. Ngược lại, nếu PUT đang ghi dở, lần kiểm tra chờ PUT commit rồi dùng giá trị mới (hoặc trả `POSITION_INACTIVE` nếu chức danh vừa bị ngừng áp dụng). Điều này chỉ đúng khi transaction ghi của module gọi dùng mức cô lập mặc định READ COMMITTED: với `REPEATABLE_READ` hoặc `SERIALIZABLE`, nếu HR đổi dòng chức danh sau khi transaction của module gọi đã chụp snapshot, PostgreSQL từ chối `FOR SHARE` bằng lỗi serialization (SQLSTATE 40001) thay vì trả giá trị mới, và lỗi này hiện chưa được xử lý nên sẽ thành 500. Vì vậy module gọi nên gọi dịch vụ từ transaction ghi dùng mức cô lập mặc định. Module gọi nên lấy dải lương sau khi đã khóa tài khoản và phiên của người gọi, cùng thứ tự với `PositionService`, để tránh deadlock. Gọi ngoài transaction chỉ là một lần đọc, không giữ khóa. Trong transaction chỉ đọc (`readOnly`), PostgreSQL không cho `FOR SHARE`, nên dịch vụ đọc không khóa; transaction chỉ đọc không lưu gì dựa trên kết quả nên không cần khóa.

### Database và phạm vi

Dùng bảng `positions` của V7, quyền ORGANIZATION của V3 và quyền SALARY_RANGES của V7_1. Task 203 và 204 không thêm migration; task 205 chỉ thêm V7_1 (4 mã quyền, 2 dòng cấp quyền cho HR_MANAGER), không đổi bảng `positions` và không cần sửa `.env`. Task 206 chỉ đọc bảng `positions`, không thêm migration hay quyền. Task 214 không thêm migration hay mã quyền: dùng cột `competency_framework_id` có sẵn từ V8 và quyền ORGANIZATION của V3. Không có DELETE chức danh: muốn ngừng dùng thì PUT `active=false` (`DELETE /positions/{id}/competency-framework` chỉ bỏ liên kết khung năng lực). Chưa có liên kết chức danh với phòng ban, yêu cầu tuyển dụng hay offer; task 206 mới chuẩn bị dải lương chuẩn và phép so sánh, còn quy tắc duyệt offer (ví dụ `ABOVE` thì cần Approver duyệt) sẽ làm ở các task offer sau.

*Nguồn: `docs/api/positions.md` (Sprint 2).*


---

<a id="api-competency-frameworks"></a>

## API khung năng lực

Phạm vi TKNHTTDNB1-212 "Xây dựng API quản lý khung năng lực" (tạo, sửa và đọc khung cùng bộ tiêu chí đánh giá), TKNHTTDNB1-213 "Kiểm tra tổng trọng số khung năng lực bằng 100%" và TKNHTTDNB1-214 "Xử lý dùng lại khung năng lực cho nhiều chức danh" (trường `positions` của chi tiết khung), story TKNHTTDNB1-25 (S2-06). TKNHTTDNB1-220 (story S2-07, bảng câu hỏi phỏng vấn V9) bổ sung quy tắc giữ tiêu chí đang có câu hỏi phỏng vấn khi PUT. URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; mọi response thành công và các lỗi nghiệp vụ của nhóm này (`COMPETENCY_*`, `INVALID_COMPETENCY_CRITERION`) dùng `Cache-Control: no-store`.

Backend đọc quyền hiện tại trong database ở mỗi yêu cầu. Khi ghi, service khóa tài khoản người gọi rồi phiên, kiểm lại trạng thái tài khoản, phiên, hạn JWT và quyền, sau đó mới khóa khung năng lực.

| Thao tác | Quyền cần có | Vai trò được phép theo seed hiện tại |
|---|---|---|
|`GET /competency-frameworks`, `GET /competency-frameworks/{id}`|`ORGANIZATION_READ_ALL`|6 vai trò nội bộ (kể cả INTERVIEWER, vì người phỏng vấn chấm theo các tiêu chí này)|
|`POST /competency-frameworks`, `PUT /competency-frameworks/{id}`|`ORGANIZATION_WRITE_ALL`|ADMIN, HR_MANAGER|

Người không có quyền ghi luôn nhận 403, kể cả khi body sai, vì quyền được kiểm tra trước dữ liệu.

### Khái niệm

- **Khung năng lực** là một bộ tiêu chí đánh giá dùng lại được: nhiều chức danh trỏ tới cùng một khung qua cột `positions.competency_framework_id` (V8), tiêu chí chỉ lưu một lần và không bị sao chép theo từng chức danh. Sửa khung là sửa cho mọi chức danh đang dùng khung đó. Gán hoặc bỏ khung của một chức danh bằng `PUT`/`DELETE /positions/{id}/competency-framework` (task 214, chỉ gán được khung `ACTIVE`), mô tả ở [API chức danh](#api-positions); chi tiết khung liệt kê các chức danh đang dùng nó trong trường `positions`.
- **Tiêu chí** có tên, mô tả tùy chọn, trọng số phần trăm và thứ tự hiển thị. Đây là bộ tiêu chí sẽ sinh phiếu đánh giá phỏng vấn ở Sprint 6.
- **Trạng thái** `DRAFT` (bản nháp đang soạn: tổng trọng số có thể chưa đủ hoặc vượt 100) hoặc `ACTIVE` (khung hoàn chỉnh: tổng trọng số **đúng 100%**). Request có trường `status` tùy chọn; gửi `"ACTIVE"` để lưu khung hoàn chỉnh. Quy tắc nằm ở mục [Khung hoàn chỉnh và tổng trọng số 100%](#khung-hoàn-chỉnh-và-tổng-trọng-số-100) (task 213).

### Tạo và sửa

`POST /competency-frameworks` tạo khung, trả **201**. `PUT /competency-frameworks/{id}` thay thế toàn bộ khung có UUID tương ứng, **kể cả toàn bộ danh sách tiêu chí**, trả **200**.

```json
{
  "code": "DEV_CORE",
  "name": "Năng lực lập trình viên",
  "description": "Dùng cho mọi cấp lập trình viên",
  "criteria": [
    { "name": "Kỹ năng lập trình", "description": "Viết mã đúng và dễ đọc", "weight": 40 },
    { "name": "Thiết kế hệ thống", "weight": 35.5 },
    { "name": "Làm việc nhóm", "weight": 24.5 }
  ]
}
```

| Trường của khung | Quy tắc |
|---|---|
|code|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 50 ký tự; duy nhất và phân biệt hoa/thường (`HR` khác `hr`), giống mã chức danh|
|name|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 255 ký tự|
|description|Tùy chọn, tối đa 1000 ký tự sau khi bỏ khoảng trắng đầu/cuối (kể cả tab, xuống dòng); xuống dòng ở giữa được giữ. Bỏ trường, `null`, chuỗi rỗng hoặc chỉ có khoảng trắng đều được lưu là `null`|
|status|Tùy chọn, là chuỗi JSON `"DRAFT"` hoặc `"ACTIVE"` (viết hoa đúng như vậy). Bỏ trường hoặc `null`: POST tạo `DRAFT`, PUT giữ trạng thái hiện có. Giá trị khác như `"active"`, `""`, số `1`, `true` trả `INVALID_JSON`. `ACTIVE` bắt buộc tổng trọng số đúng 100% (xem bên dưới)|
|criteria|Bắt buộc, là mảng; `[]` hợp lệ (khung `DRAFT` có thể chưa có tiêu chí); tối đa 50 tiêu chí; phần tử không được là `null`|

| Trường của một tiêu chí | Quy tắc |
|---|---|
|id|Bỏ trống với tiêu chí mới. Gửi `id` của tiêu chí đang có trong **chính khung này** để giữ tiêu chí đó (xem bên dưới). POST không nhận `id` nào, vì khung mới chưa có tiêu chí|
|name|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 255 ký tự; không trùng tên tiêu chí khác trong cùng khung (so chính xác, phân biệt hoa/thường như ràng buộc database: `Giao tiếp` khác `giao tiếp`). Hai khung khác nhau được có tiêu chí cùng tên|
|description|Như mô tả của khung|
|weight|Trọng số phần trăm, bắt buộc, phải là **số JSON**, lớn hơn 0 và không quá 100, tối đa 2 chữ số thập phân|

Không có trường `sortOrder` trong request: **thứ tự trong mảng chính là thứ tự tiêu chí** (phần tử đầu có `sortOrder` 1, tiếp theo 2, 3...). Muốn đổi thứ tự thì gửi mảng theo thứ tự mới. Trường ngoài hợp đồng, như `id` hay `createdAt` của khung hoặc `sortOrder` của tiêu chí, bị từ chối với HTTP 400 `INVALID_JSON`.

#### Trọng số

Trọng số lưu `NUMERIC(5,2)` và Java dùng `BigDecimal`, không dùng số thực, nên `33.33` được lưu và trả về đúng `33.33`.

- Hợp lệ: `0.01` đến `100`. Số không thừa chữ số thập phân có nghĩa như `40.000` (= 40) hoặc dạng mũ `1e1` (= 10) được chấp nhận.
- Không hợp lệ (`VALIDATION_ERROR`, lỗi ở trường `criteria[i].weight`): thiếu hoặc `null`, `0`, số âm, lớn hơn `100`, có chữ số thập phân thứ ba khác 0 như `33.335` hoặc `0.001`. Backend từ chối thay vì để PostgreSQL tự làm tròn `33.335` thành `33.34`.
- Không phải số JSON (`"40"`, `true`, `{}`, `[40]`) trả `INVALID_JSON`.
- Response luôn trả đúng 2 chữ số thập phân như database lưu: gửi `40` nhận `40.00`, gửi `35.5` nhận `35.50`.

#### Khung hoàn chỉnh và tổng trọng số 100%

Task 213: một khung là **hoàn chỉnh** khi có trạng thái `ACTIVE`. Phiếu đánh giá phỏng vấn (Sprint 6) chấm theo khung hoàn chỉnh, nên backend **từ chối lưu khung `ACTIVE` khi tổng trọng số các tiêu chí khác 100%**. Khung `DRAFT` không bị kiểm tổng.

Tổng được tính trên **mảng `criteria` trong request** (chính là danh sách sau khi lưu), cộng bằng `BigDecimal` nên chính xác tới 2 chữ số thập phân, và phải bằng đúng 100 (`100`, `100.0`, `100.00` như nhau):

| Trọng số gửi lên | Tổng | Khung `ACTIVE` |
|---|---|---|
|`33.33`, `33.33`, `33.34`|100.00|Hợp lệ|
|`100`|100.00|Hợp lệ (một tiêu chí)|
|`5e1`, `50.000`|100.00|Hợp lệ|
|`33.33`, `33.33`, `33.33`|99.99|400 `COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID`|
|`60`, `40.01`|100.01|400 `COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID`|
|`[]` (không có tiêu chí)|0.00|400 `COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID`|
|`33.335`, `66.665`|Không tính|400 `VALIDATION_ERROR` ở từng dòng, vì chữ số thập phân thứ ba bị từ chối trước khi cộng|

Vì mỗi trọng số lớn hơn 0 và tổng phải là 100, khung hoàn chỉnh luôn có ít nhất một tiêu chí.

Trạng thái sau khi lưu:

| Yêu cầu | `status` trong request | Kết quả |
|---|---|---|
|POST|bỏ trống, `null` hoặc `"DRAFT"`|Tạo khung `DRAFT`, không kiểm tổng|
|POST|`"ACTIVE"`|Tạo khung `ACTIVE` nếu tổng đúng 100|
|PUT khung đang `DRAFT`|bỏ trống, `null` hoặc `"DRAFT"`|Vẫn `DRAFT`, không kiểm tổng|
|PUT khung đang `DRAFT`|`"ACTIVE"`|Chuyển sang `ACTIVE` nếu tổng đúng 100|
|PUT khung đang `ACTIVE`|bỏ trống, `null` hoặc `"ACTIVE"`|Vẫn `ACTIVE`; **mọi lần sửa phải giữ tổng đúng 100**|
|PUT khung đang `ACTIVE`|`"DRAFT"`|409 `COMPETENCY_FRAMEWORK_ALREADY_ACTIVE`, không thay đổi gì|

Muốn thêm, bỏ hoặc đổi trọng số của khung `ACTIVE` thì gửi một PUT có cả danh sách tiêu chí mới đã cân lại đủ 100%; không cần (và không thể) chuyển về `DRAFT` trước. **Quyết định tạm thời của task 213:** khung `ACTIVE` không quay lại `DRAFT`, vì chức danh (task 214) và phiếu đánh giá sau này dựa vào khung luôn hoàn chỉnh. Nhờ quy tắc này, khung đang được chức danh dùng (chỉ khung `ACTIVE` mới gán được) không bao giờ trở lại trạng thái thiếu trọng số. Nếu nghiệp vụ cần "ngừng dùng" một khung, BA/PO cần bổ sung yêu cầu riêng.

Ví dụ kích hoạt khung đang có hai tiêu chí (gửi lại `id` của cả hai để giữ chúng):

```json
{
  "code": "DEV_CORE",
  "name": "Năng lực lập trình viên",
  "status": "ACTIVE",
  "criteria": [
    { "id": "00000000-0000-0000-0000-000000000011", "name": "Kỹ năng lập trình", "weight": 50.5 },
    { "id": "00000000-0000-0000-0000-000000000012", "name": "Thiết kế hệ thống", "weight": 49.5 }
  ]
}
```

Lỗi khi tổng khác 100 (ví dụ 99.99); `message` và `fieldErrors.criteria` đều nêu tổng hiện tại với 2 chữ số thập phân:

```json
{
  "code": "COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID",
  "message": "Khung năng lực hoàn chỉnh (ACTIVE) cần tổng trọng số các tiêu chí đúng 100%; tổng hiện tại là 99.99%.",
  "fieldErrors": {
    "criteria": "Tổng trọng số hiện tại là 99.99%, cần đúng 100%."
  }
}
```

Database không có CHECK cho tổng trọng số (V8 giữ nguyên); quy tắc chỉ nằm ở `CompetencyFrameworkService`. Dữ liệu sửa trực tiếp bằng SQL không đi qua quy tắc này.

#### PUT thay thế danh sách tiêu chí như thế nào

PUT làm cho danh sách tiêu chí đã lưu **giống hệt** mảng `criteria` trong request:

1. Phần tử có `id`: cập nhật tiêu chí đó (tên, mô tả, trọng số, thứ tự) và **giữ nguyên `id`**.
2. Phần tử không có `id`: tạo tiêu chí mới với `id` mới.
3. Tiêu chí đang có nhưng không xuất hiện trong mảng: **bị xóa**.

Vì câu hỏi phỏng vấn (bảng `interview_questions` của V9) và phiếu đánh giá sau này trỏ tới tiêu chí theo `id`, frontend phải gửi lại `id` của mọi tiêu chí muốn giữ. Gửi lại cùng tên nhưng không kèm `id` nghĩa là xóa tiêu chí cũ và tạo tiêu chí mới có `id` khác.

**Tiêu chí đang có câu hỏi phỏng vấn không được xóa (task 220).** Task 212 ban đầu chưa chặn việc này; từ task 220, khóa ngoại V9 `ON DELETE RESTRICT` cấm xóa tiêu chí còn câu hỏi, kể cả câu hỏi đã ngừng dùng (`active = false`). Vì vậy PUT bỏ một tiêu chí như thế khỏi mảng, hoặc gửi lại cùng tên nhưng không kèm `id`, bị từ chối với 409 `COMPETENCY_CRITERION_IN_USE` và không có gì thay đổi. Gửi kèm `id` thì vẫn đổi được tên, mô tả, trọng số và thứ tự của tiêu chí đó; câu hỏi đi theo tiêu chí. Muốn bỏ hẳn tiêu chí thì trước hết không được còn câu hỏi nào trỏ tới nó: chuyển từng câu hỏi sang tiêu chí khác bằng `PUT /interview-questions/{id}` ([API câu hỏi phỏng vấn](#api-interview-questions), task 221). Chưa có API xóa câu hỏi; câu hỏi ngừng dùng (`active = false`) vẫn giữ tiêu chí của nó.

```json
{
  "code": "COMPETENCY_CRITERION_IN_USE",
  "message": "Không thể xóa tiêu chí đang có câu hỏi phỏng vấn khỏi khung năng lực.",
  "fieldErrors": {
    "criteria": "Hãy giữ lại (gửi kèm id) các tiêu chí đang có câu hỏi phỏng vấn: Giao tiếp, Tư duy."
  }
}
```

Tên tiêu chí được liệt kê theo thứ tự hiện có trong khung.

Cách làm an toàn ở frontend: `GET /competency-frameworks/{id}`, sửa trên dữ liệu vừa đọc, rồi PUT đủ mọi trường. Một lần PUT có thể đổi chỗ tên hoặc thứ tự của hai tiêu chí (ví dụ đổi tên A thành B và B thành A) vì database chỉ kiểm trùng trên kết quả cuối cùng. Đổi `code`, `name`, `description` của khung không làm đổi `id` của khung hay `createdAt`.

#### Thứ tự kiểm tra và ghi đồng thời

1. Quyền (403) và từng trường riêng lẻ (`VALIDATION_ERROR`, mọi trường sai được trả cùng lúc trong `fieldErrors`, ví dụ `criteria[2].name`).
2. PUT: khung phải tồn tại (404). Service khóa dòng khung (`SELECT ... FOR UPDATE`) rồi mới đọc các tiêu chí hiện có.
3. `id` của tiêu chí phải thuộc khung và chỉ xuất hiện một lần (400 `INVALID_COMPETENCY_CRITERION`).
4. Tên tiêu chí không trùng trong danh sách (409 `COMPETENCY_CRITERION_NAME_DUPLICATE`).
5. PUT: tiêu chí bị bỏ khỏi mảng không còn câu hỏi phỏng vấn (409 `COMPETENCY_CRITERION_IN_USE`, task 220).
6. PUT: khung đang `ACTIVE` không chuyển về `DRAFT` (409 `COMPETENCY_FRAMEWORK_ALREADY_ACTIVE`).
7. Nếu trạng thái sau khi lưu là `ACTIVE`: tổng trọng số đúng 100 (400 `COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID`).
8. Mã khung không trùng khung khác (409 `COMPETENCY_FRAMEWORK_CODE_EXISTS`).
9. Ghi, rồi kiểm ngay hai ràng buộc UNIQUE "kiểm lúc COMMIT" của V8 (`checkUniqueConstraintsNow`) để lỗi trùng còn sót vẫn thành 409 thay vì 500. Lệnh này cũng chạy các lệnh xóa tiêu chí; nếu khóa ngoại V9 từ chối xóa thì kết quả là 409 `COMPETENCY_CRITERION_IN_USE`, không phải 500.

Một lần gán khung cho chức danh (task 214) đọc khung bằng `SELECT ... FOR SHARE`, nên PUT khung chờ lần gán đang chạy commit, và lần gán đến trong lúc PUT khung đang chạy cũng chờ rồi đọc trạng thái mới nhất. Hai người sửa cùng một khung cùng lúc sẽ được xử lý lần lượt: người sau chờ người trước commit, rồi kiểm và ghi trên dữ liệu mới nhất. Không có kiểm tra phiên bản (optimistic lock), nên người lưu sau ghi đè thay đổi của người lưu trước; nếu người sau vẫn gửi `id` của tiêu chí người trước vừa xóa, yêu cầu bị từ chối với 400 `INVALID_COMPETENCY_CRITERION` và không có gì thay đổi. Trạng thái cũng được đọc sau khi khóa: nếu người trước vừa chuyển khung sang `ACTIVE`, PUT không gửi `status` của người sau sẽ giữ `ACTIVE` nên phải có tổng đúng 100, nếu không nhận 400 `COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID`. Hai yêu cầu tạo/sửa cùng một mã khung đồng thời: một yêu cầu thành công, yêu cầu còn lại nhận 409. Nếu trong lúc PUT đang xóa một tiêu chí, một transaction khác thêm câu hỏi cho tiêu chí đó nhưng chưa commit, lệnh xóa chờ transaction kia; khi nó commit, PUT nhận 409 `COMPETENCY_CRITERION_IN_USE` (lúc này `fieldErrors.criteria` không nêu tên tiêu chí, vì PostgreSQL chỉ báo `id`) và không có gì thay đổi.

Response của tạo/sửa và `GET /competency-frameworks/{id}`:

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "code": "DEV_CORE",
  "name": "Năng lực lập trình viên",
  "description": "Dùng cho mọi cấp lập trình viên",
  "status": "DRAFT",
  "criteria": [
    {
      "id": "00000000-0000-0000-0000-000000000011",
      "name": "Kỹ năng lập trình",
      "description": "Viết mã đúng và dễ đọc",
      "weight": 40.00,
      "sortOrder": 1
    },
    {
      "id": "00000000-0000-0000-0000-000000000012",
      "name": "Thiết kế hệ thống",
      "description": null,
      "weight": 35.50,
      "sortOrder": 2
    },
    {
      "id": "00000000-0000-0000-0000-000000000013",
      "name": "Làm việc nhóm",
      "description": null,
      "weight": 24.50,
      "sortOrder": 3
    }
  ],
  "positions": [
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "code": "DEV_JUNIOR",
      "name": "Lập trình viên",
      "level": "Junior",
      "active": true
    },
    {
      "id": "00000000-0000-0000-0000-000000000004",
      "code": "DEV_SENIOR",
      "name": "Lập trình viên",
      "level": "Senior",
      "active": true
    }
  ],
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T08:00:00Z"
}
```

UUID trong ví dụ chỉ minh họa. `criteria` sắp theo `sortOrder`. `positions` (task 214) là các chức danh đang trỏ tới khung này, sắp theo code rồi UUID; mọi chức danh trong danh sách dùng chung đúng các tiêu chí ở `criteria` (cùng `id`), không có bản sao. Mỗi phần tử chỉ có `id`, `code`, `name`, `level`, `active`, **không có dải lương**, vì mọi người có quyền đọc khung đều thấy danh sách này; dải lương xem ở `GET /positions/{id}` theo quyền riêng. Khung chưa được chức danh nào dùng (kể cả khung vừa tạo) có `positions: []`. Danh sách khung (`GET /competency-frameworks`) không có trường này. `createdAt` giữ nguyên khi sửa; `updatedAt` là thời điểm ghi gần nhất (UTC, độ chính xác micro giây như PostgreSQL lưu).

### Danh sách

`GET /competency-frameworks?q=dev&status=DRAFT&page=0&size=20`

| Tham số | Ý nghĩa |
|---|---|
|q|Tìm một phần code/name, không phân biệt hoa/thường, tối đa 255 ký tự; %, _ và ! được hiểu là ký tự thật; không tìm theo mô tả hay tên tiêu chí|
|status|`DRAFT` hoặc `ACTIVE` (viết hoa đúng như vậy); bỏ qua để lấy cả hai|
|page|Từ 0, mặc định 0|
|size|Từ 1 đến 100, mặc định 20|

Response: `{items, page, size, totalElements, totalPages}`. Mỗi item là khung **không kèm danh sách tiêu chí**, chỉ có số tiêu chí; muốn xem tiêu chí thì gọi chi tiết.

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "code": "DEV_CORE",
  "name": "Năng lực lập trình viên",
  "description": "Dùng cho mọi cấp lập trình viên",
  "status": "DRAFT",
  "criterionCount": 3,
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T08:00:00Z"
}
```

Sắp xếp theo code rồi UUID để phân trang ổn định; trang ngoài phạm vi có `items` rỗng.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu/sai trường, trọng số ngoài (0, 100] hoặc quá 2 chữ số thập phân, quá 50 tiêu chí, UUID trên đường dẫn, page/size, status hoặc q quá dài; lỗi theo trường nằm trong `fieldErrors`|
|400|INVALID_JSON|JSON sai, trọng số không phải số JSON, `status` không phải chuỗi `"DRAFT"`/`"ACTIVE"`, hoặc có trường ngoài hợp đồng|
|400|INVALID_COMPETENCY_CRITERION|`id` tiêu chí không thuộc khung này (kể cả mọi `id` khi POST) hoặc một `id` được gửi hai lần; `fieldErrors` chỉ ra dòng, ví dụ `criteria[1].id`|
|400|COMPETENCY_FRAMEWORK_WEIGHT_TOTAL_INVALID|Khung có trạng thái `ACTIVE` sau lần ghi nhưng tổng trọng số khác 100 (kể cả khi không có tiêu chí); `message` và `fieldErrors.criteria` nêu tổng hiện tại|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Đọc thiếu `ORGANIZATION_READ_ALL`; ghi thiếu `ORGANIZATION_WRITE_ALL`|
|404|COMPETENCY_FRAMEWORK_NOT_FOUND|Không tìm thấy khung đích|
|409|COMPETENCY_FRAMEWORK_CODE_EXISTS|Mã đã được khung khác dùng, kể cả khi hai yêu cầu ghi cùng mã đồng thời|
|409|COMPETENCY_CRITERION_NAME_DUPLICATE|Hai tiêu chí trong cùng khung trùng tên (sau khi bỏ khoảng trắng đầu/cuối); `fieldErrors` chỉ ra từng dòng bị trùng|
|409|COMPETENCY_FRAMEWORK_ALREADY_ACTIVE|PUT gửi `"status": "DRAFT"` cho khung đang `ACTIVE`; `fieldErrors.status`|
|409|COMPETENCY_CRITERION_IN_USE|PUT bỏ khỏi mảng (hoặc gửi lại không kèm `id`) một tiêu chí đang có câu hỏi phỏng vấn, kể cả câu hỏi đã ngừng dùng; `fieldErrors.criteria` nêu tên các tiêu chí đó khi biết|

Ví dụ lỗi trùng tên tiêu chí:

```json
{
  "code": "COMPETENCY_CRITERION_NAME_DUPLICATE",
  "message": "Tên tiêu chí trong một khung năng lực không được trùng nhau.",
  "fieldErrors": {
    "criteria[2].name": "Tên tiêu chí đã có ở dòng khác trong khung."
  }
}
```

Mọi lỗi đều không thay đổi dữ liệu: cả khung lẫn danh sách tiêu chí được ghi trong một transaction.

### Database và phạm vi

Dùng bảng `competency_frameworks`, `competency_criteria` của V8 (task 211) và quyền ORGANIZATION của V3; task 212 và 213 không thêm migration, không thêm mã quyền, không thêm endpoint và không cần sửa `.env`. Task 214 cũng không thêm migration hay mã quyền: chi tiết khung đọc thêm cột `positions.competency_framework_id` của V8, còn hai endpoint gán/bỏ khung nằm ở [API chức danh](#api-positions). Service làm đủ ba bước ghi tiêu chí mà tài liệu database (`docs/database/README.md` trong repo Backend) yêu cầu: khóa dòng khung, kiểm trùng trên danh sách cuối cùng, rồi gọi `checkUniqueConstraintsNow()` và đổi lỗi trùng thành 409. Task 220 thêm migration V9 (bảng `interview_questions`) nhưng không thêm endpoint hay mã quyền; PUT đọc thêm bảng này bằng SQL thuần để biết tiêu chí nào còn câu hỏi.

Tiêu chí và trọng số theo từng chức danh cho phiếu đánh giá phỏng vấn (task 215) đọc qua `GET /positions/{id}/evaluation-criteria`, xem [API tiêu chí đánh giá theo chức danh](#api-evaluation-criteria).

Chưa có: DELETE khung (khung đang được chức danh dùng cũng không xóa được nhờ khóa ngoại `ON DELETE RESTRICT`), ngừng dùng khung `ACTIVE` và phiếu đánh giá (Sprint 6). Tạo, sửa, đọc từng câu hỏi theo tiêu chí (task 221) và tìm kiếm/lọc câu hỏi theo chức danh, tiêu chí (task 223) xem [API câu hỏi phỏng vấn](#api-interview-questions).

*Nguồn: `docs/api/competency-frameworks.md` (Sprint 2).*


---

<a id="api-evaluation-criteria"></a>

## API tiêu chí đánh giá theo chức danh

Phạm vi TKNHTTDNB1-215 "Chuẩn bị dữ liệu khung năng lực cho phiếu đánh giá", story TKNHTTDNB1-25 (S2-06). Kết quả mong đợi: cung cấp tiêu chí và trọng số theo chức danh để Sprint 6 sinh phiếu đánh giá phỏng vấn. URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; response thành công và các lỗi nghiệp vụ của API này (`POSITION_*`, `COMPETENCY_*`) dùng `Cache-Control: no-store`.

Tiêu chí không được lưu riêng cho chức danh. Chức danh chỉ trỏ tới một khung năng lực (cột `positions.competency_framework_id`, gán bằng `PUT /positions/{id}/competency-framework`, xem [API chức danh](#api-positions)); API này đọc tiêu chí của chính khung đó. Vì vậy các chức danh dùng chung một khung nhận cùng một bộ tiêu chí (cùng `id`), và HR sửa khung ([API khung năng lực](#api-competency-frameworks)) thì lần đọc kế tiếp thấy ngay.

| Thao tác | Quyền cần có | Vai trò được phép theo seed hiện tại |
|---|---|---|
|`GET /positions/{id}/evaluation-criteria`|`ORGANIZATION_READ_ALL`|6 vai trò nội bộ (kể cả INTERVIEWER, vì người phỏng vấn chấm theo các tiêu chí này)|

Backend đọc quyền hiện tại trong database ở mỗi yêu cầu: thu hồi `ORGANIZATION_READ_ALL` có hiệu lực ngay ở yêu cầu kế tiếp, kể cả với cùng access token. API chỉ đọc: `POST`, `PUT`, `DELETE` trên URL này đều bị từ chối 403 với mọi vai trò; muốn đổi tiêu chí thì sửa khung năng lực.

### Đọc tiêu chí đánh giá của một chức danh

`GET /positions/{id}/evaluation-criteria`, trong đó `{id}` là UUID của chức danh. Không có body hay tham số. Trả **200**:

```json
{
  "position": {
    "id": "00000000-0000-0000-0000-000000000003",
    "code": "DEV_JUNIOR",
    "name": "Lập trình viên",
    "level": "Junior",
    "active": true
  },
  "framework": {
    "id": "00000000-0000-0000-0000-000000000010",
    "code": "DEV_CORE",
    "name": "Năng lực lập trình viên"
  },
  "criteria": [
    {
      "id": "00000000-0000-0000-0000-000000000011",
      "name": "Kỹ năng lập trình",
      "description": "Viết mã đúng và dễ đọc",
      "weight": 33.33,
      "sortOrder": 1
    },
    {
      "id": "00000000-0000-0000-0000-000000000012",
      "name": "Thiết kế hệ thống",
      "description": null,
      "weight": 33.33,
      "sortOrder": 2
    },
    {
      "id": "00000000-0000-0000-0000-000000000013",
      "name": "Làm việc nhóm",
      "description": null,
      "weight": 33.34,
      "sortOrder": 3
    }
  ]
}
```

UUID trong ví dụ chỉ minh họa.

| Trường | Ý nghĩa |
|---|---|
|position|Chức danh được hỏi: `id`, `code`, `name`, `level`, `active`. **Không bao giờ có `salaryMin`/`salaryMax`**, kể cả với HR_MANAGER: người phỏng vấn cũng đọc API này. Dải lương xem ở `GET /positions/{id}` theo quyền `SALARY_RANGES_READ_ALL`|
|framework|Khung năng lực chức danh đang dùng: `id`, `code`, `name`|
|criteria|Các tiêu chí của khung, sắp theo `sortOrder` tăng dần (1, 2, 3...). Mỗi tiêu chí có `id`, `name`, `description` (`null` nếu không có), `weight`, `sortOrder` giống phần tử `criteria` của `GET /competency-frameworks/{id}`|

Quy tắc:

- `weight` là phần trăm với đúng 2 chữ số thập phân như database lưu (`NUMERIC(5,2)`), ví dụ `33.33`, `100.00`. Chỉ khung hoàn chỉnh (`ACTIVE`) mới được gán cho chức danh, và khung `ACTIVE` luôn có tổng trọng số đúng 100 (task 213, 214), nên tổng `weight` trong `criteria` luôn là 100.00 và luôn có ít nhất một tiêu chí.
- `id` của tiêu chí giữ nguyên khi HR sửa khung mà gửi lại `id` đó (xem [PUT thay thế danh sách tiêu chí](#api-competency-frameworks)). Phiếu đánh giá ở Sprint 6 nên tham chiếu tiêu chí theo `id`.
- **Quyết định tạm thời của task 215:** chức danh đã ngừng áp dụng (`active=false`) vẫn trả tiêu chí, với `position.active = false`. Lý do: các vòng phỏng vấn đang diễn ra của chức danh đó vẫn cần phiếu để chấm; việc có cho tạo phiếu mới cho chức danh ngừng áp dụng hay không do module phiếu đánh giá (Sprint 6) quyết định dựa trên trường này. Khác với dải lương chuẩn (task 206), nơi chức danh ngừng áp dụng trả `POSITION_INACTIVE`. Cần BA/PO xác nhận.
- Lần đọc dùng một snapshot nhất quán (`REPEATABLE_READ`, chỉ đọc), nên chức danh, khung và tiêu chí luôn khớp nhau. API không chờ khi HR đang sửa dở khung: nó trả bản đã commit gần nhất.

### Thứ tự kiểm tra và lỗi

1. Token và quyền: thiếu hoặc sai token trả 401; thiếu `ORGANIZATION_READ_ALL` trả 403. Service kiểm lại quyền này, không chỉ dựa vào `SecurityConfiguration`.
2. `{id}` phải là UUID (400 `VALIDATION_ERROR`).
3. Chức danh phải tồn tại (404 `POSITION_NOT_FOUND`).
4. Chức danh phải đã được gán khung (409 `POSITION_COMPETENCY_FRAMEWORK_NOT_ASSIGNED`).
5. Khung phải đang `ACTIVE` (409 `COMPETENCY_FRAMEWORK_NOT_ACTIVE`). Qua API không thể xảy ra (không gán được khung `DRAFT`, khung `ACTIVE` không quay lại `DRAFT`); bước này chặn trường hợp dữ liệu bị sửa trực tiếp bằng SQL, để phiếu đánh giá không bao giờ chấm theo trọng số có thể chưa đủ 100%.

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|`{id}` trên đường dẫn không phải UUID|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Thiếu `ORGANIZATION_READ_ALL`; hoặc gọi `POST`/`PUT`/`DELETE` trên URL này|
|404|POSITION_NOT_FOUND|Không tìm thấy chức danh|
|409|POSITION_COMPETENCY_FRAMEWORK_NOT_ASSIGNED|Chức danh chưa được gán khung năng lực; HR_MANAGER hoặc ADMIN gán bằng `PUT /positions/{id}/competency-framework`|
|409|COMPETENCY_FRAMEWORK_NOT_ACTIVE|Khung của chức danh không ở trạng thái `ACTIVE` (chỉ khi dữ liệu bị sửa ngoài API)|

Ví dụ chức danh chưa có khung:

```json
{
  "code": "POSITION_COMPETENCY_FRAMEWORK_NOT_ASSIGNED",
  "message": "Chức danh chưa được gán khung năng lực nên chưa có tiêu chí đánh giá.",
  "fieldErrors": {}
}
```

Gợi ý cho frontend: gặp 409 `POSITION_COMPETENCY_FRAMEWORK_NOT_ASSIGNED` thì hiển thị "chức danh chưa có khung năng lực" (và nút gán khung nếu người dùng có `ORGANIZATION_WRITE_ALL`), không coi là lỗi hệ thống.

### Dịch vụ nội bộ cho phiếu đánh giá (Sprint 6)

Ngoài API, backend có `EvaluationCriteriaService.forPosition(positionId)` (gói `vn.ttcs.recruitment.competency`) để module phiếu đánh giá phỏng vấn gọi trực tiếp khi sinh phiếu.

| Phương thức Java | Kết quả |
|---|---|
|`forPosition(positionId)`|`EvaluationCriteria(position, framework, criteria)`, cùng nội dung với response API ở trên; `weight` là `BigDecimal` có đúng 2 chữ số thập phân|

Quy tắc:

- **Không kiểm quyền người gọi:** dịch vụ không nhận token và không phải API. Module gọi phải tự kiểm quyền của mình trước (ví dụ quyền `EVALUATIONS_*`). Kết quả không chứa dải lương nên trả lại cho người dùng không làm lộ lương.
- Lỗi giống bảng trên, dưới dạng `ApiException`: 404 `POSITION_NOT_FOUND`, 409 `POSITION_COMPETENCY_FRAMEWORK_NOT_ASSIGNED`, 409 `COMPETENCY_FRAMEWORK_NOT_ACTIVE`. Truyền `null` là lỗi lập trình (`NullPointerException`).
- **Đồng thời:** khi được gọi trong transaction ghi của module gọi, dịch vụ đọc dòng chức danh rồi dòng khung bằng `SELECT ... FOR SHARE` và giữ khóa chia sẻ đến khi transaction đó commit hoặc rollback. Trong thời gian này, HR đổi hoặc bỏ khung của chức danh (`PUT`/`DELETE /positions/{id}/competency-framework`) và sửa khung (`PUT /competency-frameworks/{id}`) phải chờ, nên tiêu chí module gọi vừa đọc (ví dụ lưu vào phiếu theo `id`) vẫn đúng lúc commit. Nhiều lần đọc cùng chức danh không chờ nhau. Ngược lại, nếu HR đang sửa dở khung, dịch vụ chờ HR commit rồi trả tiêu chí mới. Thứ tự khóa (chức danh trước, khung sau) giống API gán khung, nên hai bên không khóa chéo nhau (deadlock).
- Điều trên chỉ đúng khi transaction ghi của module gọi dùng mức cô lập mặc định READ COMMITTED. Với `REPEATABLE_READ` hoặc `SERIALIZABLE`, nếu HR đổi dòng chức danh/khung sau khi transaction của module gọi đã chụp snapshot, PostgreSQL từ chối `FOR SHARE` bằng lỗi serialization (SQLSTATE 40001); lỗi này chưa được xử lý nên sẽ thành 500 (giống `SalaryBandService`). Module gọi nên lấy tiêu chí sau khi đã khóa tài khoản và phiên của người gọi, cùng thứ tự với các service ghi hiện có.
- Trong transaction chỉ đọc (`readOnly`), PostgreSQL không cho `FOR SHARE`, nên dịch vụ đọc không khóa; transaction chỉ đọc không lưu gì dựa trên kết quả. Gọi ngoài transaction thì dịch vụ tự mở một transaction ngắn, nên chức danh, khung và tiêu chí vẫn được đọc cùng nhau.

### Database và phạm vi

Task 215 không thêm migration, mã quyền hay dòng cấp quyền: chỉ đọc bảng `positions` (V7, cột `competency_framework_id` của V8), `competency_frameworks` và `competency_criteria` (V8), dùng quyền ORGANIZATION của V3. Không cần sửa `.env`. Chưa có: bảng và API phiếu đánh giá (Sprint 6). Câu hỏi phỏng vấn gắn với tiêu chí (bảng `interview_questions` của V9) được tạo, sửa và đọc (task 221), tìm kiếm và lọc theo chức danh, tiêu chí (task 223) qua [API câu hỏi phỏng vấn](#api-interview-questions).

*Nguồn: `docs/api/evaluation-criteria.md` (Sprint 2).*


---

<a id="api-interview-questions"></a>

## API câu hỏi phỏng vấn

Phạm vi TKNHTTDNB1-221 "Xây dựng API quản lý câu hỏi phỏng vấn", TKNHTTDNB1-222 "Kiểm tra tiêu chí và dữ liệu câu hỏi phỏng vấn" và TKNHTTDNB1-223 "Xây dựng API tìm kiếm và lọc câu hỏi phỏng vấn", story TKNHTTDNB1-26 (S2-07). Kết quả mong đợi: tạo, sửa và đọc câu hỏi gắn với tiêu chí hợp lệ trong khung năng lực (221); kiểm tra tiêu chí được tham chiếu, mức độ khó và các trường của câu hỏi (222); trả câu hỏi theo nội dung tìm kiếm, chức danh và tiêu chí được chọn (223). URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; mọi response thành công và các lỗi nghiệp vụ của nhóm này (`INTERVIEW_QUESTION_*`, `INVALID_COMPETENCY_CRITERION`, `INVALID_POSITION`, lỗi tham số tìm kiếm) dùng `Cache-Control: no-store`.

Backend đọc quyền hiện tại trong database ở mỗi yêu cầu. Khi ghi, service khóa tài khoản người gọi rồi phiên, kiểm lại trạng thái tài khoản, phiên, hạn JWT và quyền, sau đó mới khóa câu hỏi (khi sửa), khung năng lực chứa tiêu chí và dòng tiêu chí.

| Thao tác | Quyền cần có | Vai trò được phép theo seed hiện tại |
|---|---|---|
|`GET /interview-questions`, `GET /interview-questions/{id}`|`ORGANIZATION_READ_ALL`|6 vai trò nội bộ (kể cả INTERVIEWER, vì người phỏng vấn dùng các câu hỏi này)|
|`POST /interview-questions`, `PUT /interview-questions/{id}`|`ORGANIZATION_WRITE_ALL`|ADMIN, HR_MANAGER|

Câu hỏi thuộc khung năng lực nên dùng chung quyền ORGANIZATION với [API khung năng lực](#api-competency-frameworks); không có mã quyền riêng. Người không có quyền ghi luôn nhận 403, kể cả khi body sai, vì quyền được kiểm tra trước dữ liệu.

### Khái niệm

- **Ngân hàng câu hỏi**: mỗi câu hỏi gắn với **đúng một tiêu chí** (`criterionId`) của một khung năng lực. Câu hỏi không gắn trực tiếp với chức danh: chức danh trỏ tới khung (`positions.competency_framework_id`), khung có các tiêu chí, tiêu chí có các câu hỏi. Vì vậy các chức danh dùng chung một khung thấy cùng một bộ câu hỏi, không có bản sao. Tìm kiếm và lọc câu hỏi theo chức danh, tiêu chí xem [Tìm kiếm và lọc](#tìm-kiếm-và-lọc-task-223).
- **Mức độ khó** (`difficulty`): `EASY`, `MEDIUM` hoặc `HARD`.
- **Gợi ý câu trả lời tốt** (`answerHint`): điều người phỏng vấn nên nghe thấy trong một câu trả lời tốt; tùy chọn.
- **Đang dùng** (`active`): câu hỏi không dùng nữa được chuyển `active = false` thay vì xóa, để giữ lịch sử. Không có API xóa câu hỏi.

### Tạo và sửa

`POST /interview-questions` tạo câu hỏi, trả **201**. `PUT /interview-questions/{id}` thay thế toàn bộ câu hỏi có UUID tương ứng, trả **200**.

```json
{
  "criterionId": "00000000-0000-0000-0000-000000000011",
  "content": "Kể về một lần bạn bất đồng với đồng nghiệp.\nBạn đã xử lý thế nào?",
  "difficulty": "MEDIUM",
  "answerHint": "Nêu tình huống cụ thể, cách lắng nghe và kết quả."
}
```

| Trường | Quy tắc |
|---|---|
|criterionId|Bắt buộc, UUID của một tiêu chí đang có trong một khung năng lực (khung `DRAFT` hay `ACTIVE` đều được). Không phải UUID trả `INVALID_JSON`; UUID không phải tiêu chí nào (kể cả UUID của khung) trả 400 `INVALID_COMPETENCY_CRITERION`|
|content|Bắt buộc, tối đa **2000** ký tự sau khi bỏ khoảng trắng ở đầu/cuối (xem ghi chú dưới bảng); xuống dòng ở giữa được giữ, nên câu hỏi viết được nhiều dòng. Không được chứa ký tự điều khiển, trừ tab và xuống dòng (task 222). Trong cùng một tiêu chí không được trùng nội dung với câu hỏi khác (409, xem [Câu hỏi trùng nội dung](#câu-hỏi-trùng-nội-dung))|
|difficulty|Bắt buộc, chuỗi `"EASY"` (dễ), `"MEDIUM"` (trung bình) hoặc `"HARD"` (khó), viết hoa đúng như vậy, không có khoảng trắng. Giá trị khác như `"easy"`, `"VERY_HARD"`, `""`, `" EASY"`, số hay `true` trả `VALIDATION_ERROR` với `fieldErrors.difficulty` nêu ba giá trị hợp lệ (task 222); mảng hoặc đối tượng JSON trả `INVALID_JSON`|
|answerHint|Tùy chọn, tối đa **4000** ký tự sau khi bỏ khoảng trắng đầu/cuối như `content`; xuống dòng ở giữa được giữ; không được chứa ký tự điều khiển trừ tab và xuống dòng. Bỏ trường, `null`, chuỗi rỗng hoặc chỉ có khoảng trắng đều được lưu là `null`|
|active|Tùy chọn, `true` hoặc `false`. Bỏ trường hoặc `null`: POST tạo câu hỏi đang dùng (`true`), PUT giữ giá trị hiện có. Gửi `false` để ngừng dùng câu hỏi mà vẫn giữ lại; gửi `true` để dùng lại|

"Khoảng trắng" ở đây là mọi ký tự PostgreSQL coi là `[[:space:]]` trong CHECK của V9: dấu cách, tab, xuống dòng và cả các khoảng trắng Unicode như khoảng trắng không ngắt (U+00A0, U+2007, U+202F) hay gặp khi dán chữ từ Word hoặc trang web. `String.strip()` của Java không bỏ các ký tự không ngắt này, nên `InterviewQuestionRequest` dùng hàm riêng. Khoảng trắng không ngắt nằm giữa câu được giữ nguyên. Nội dung chỉ gồm các ký tự này bị coi là rỗng (`VALIDATION_ERROR`).

**Ký tự điều khiển** (task 222) là nhóm `Cc` của Unicode: U+0000–U+001F và U+007F–U+009F, ví dụ NUL, chuông (U+0007), ESC (U+001B), DEL (U+007F). Chúng không nhìn thấy được khi hiển thị, và PostgreSQL không lưu được NUL (trước task 222 NUL làm request lỗi 500). Tab (U+0009), xuống dòng (U+000A) và về đầu dòng (U+000D) vẫn được dùng để trình bày câu hỏi dài. Lỗi trả `VALIDATION_ERROR`; `fieldErrors.content` là "Nội dung câu hỏi không được chứa ký tự điều khiển; chỉ dùng được xuống dòng và tab." (với `answerHint` là "Gợi ý câu trả lời không được chứa ký tự điều khiển; ...").

**Dạng chuẩn NFC** (task 222): một số trình soạn thảo gửi chữ có dấu như "ệ" thành chữ gốc cộng các dấu kết hợp (dạng NFD, 2–3 ký tự Java), số khác gửi thành một ký tự duy nhất (dạng NFC). Hai cách nhìn giống hệt nhau nhưng là hai chuỗi khác nhau. Backend chuyển `content` và `answerHint` sang NFC trước khi kiểm tra và lưu, nên cùng một câu luôn được lưu giống nhau và giới hạn 2000/4000 ký tự đếm theo chữ người dùng nhìn thấy. Response trả văn bản ở dạng NFC; nội dung hiển thị không đổi.

Trường ngoài hợp đồng, như `id`, `createdAt` hay `criterion`, bị từ chối với HTTP 400 `INVALID_JSON`.

PUT thay thế toàn bộ câu hỏi: gửi đủ `criterionId`, `content`, `difficulty`; bỏ `answerHint` hoặc gửi `null` nghĩa là xóa gợi ý cũ. Riêng `active` được giữ nguyên khi không gửi. PUT có thể **chuyển câu hỏi sang tiêu chí khác**, kể cả tiêu chí của khung khác; `id` và `createdAt` của câu hỏi giữ nguyên, `updatedAt` là thời điểm sửa. Đây cũng là cách gỡ câu hỏi khỏi một tiêu chí trước khi bỏ tiêu chí đó khỏi khung, vì [PUT khung](#api-competency-frameworks) không xóa tiêu chí còn câu hỏi (409 `COMPETENCY_CRITERION_IN_USE`, kể cả câu hỏi `active = false`).

Response của tạo/sửa và `GET /interview-questions/{id}`:

```json
{
  "id": "00000000-0000-0000-0000-000000000021",
  "criterion": {
    "id": "00000000-0000-0000-0000-000000000011",
    "name": "Giao tiếp"
  },
  "framework": {
    "id": "00000000-0000-0000-0000-000000000010",
    "code": "DEV_CORE",
    "name": "Năng lực lập trình viên"
  },
  "content": "Kể về một lần bạn bất đồng với đồng nghiệp.\nBạn đã xử lý thế nào?",
  "difficulty": "MEDIUM",
  "answerHint": "Nêu tình huống cụ thể, cách lắng nghe và kết quả.",
  "active": true,
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T08:00:00Z"
}
```

UUID trong ví dụ chỉ minh họa.

| Trường | Ý nghĩa |
|---|---|
|criterion|Tiêu chí câu hỏi gắn với: `id` và **tên hiện tại**. HR đổi tên tiêu chí bằng PUT khung (giữ `id`) thì lần đọc sau thấy tên mới, câu hỏi vẫn đi theo tiêu chí|
|framework|Khung năng lực chứa tiêu chí: `id`, `code`, `name`|
|answerHint|`null` khi không có gợi ý|
|createdAt, updatedAt|UTC, độ chính xác micro giây như PostgreSQL lưu; `createdAt` giữ nguyên khi sửa|

### Câu hỏi trùng nội dung

Task 222: một tiêu chí không được có hai câu hỏi cùng nội dung, kể cả khi câu hỏi cũ đang `active = false`. POST hoặc PUT tạo ra câu hỏi trùng trả **409** `INTERVIEW_QUESTION_DUPLICATE` và không thay đổi dữ liệu.

- **Thế nào là trùng**: hai nội dung được so sánh sau khi đổi về NFC, gộp mọi chuỗi khoảng trắng/tab/xuống dòng liền nhau thành một dấu cách và đổi về chữ thường. Vì vậy `Bạn xử lý xung đột trong nhóm thế nào?`, `BẠN XỬ LÝ xung đột` + xuống dòng + `trong   nhóm thế nào?` và cùng câu đó gửi ở dạng NFD là một câu. Khác dấu câu (thiếu `?`) hay khác chữ là câu khác.
- **Chỉ trong cùng tiêu chí**: cùng nội dung ở tiêu chí khác (kể cả cùng khung) vẫn được, vì một câu hỏi có thể dùng để đánh giá nhiều tiêu chí.
- **Câu hỏi đang ngừng dùng**: nếu chỉ có câu hỏi `active = false` trùng nội dung, `fieldErrors.content` gợi ý dùng lại câu hỏi đó (PUT với `"active": true`) thay vì tạo câu mới.
- **PUT câu hỏi của chính nó**: câu hỏi không bị coi là trùng với chính nó, nên sửa độ khó, gợi ý, `active` hoặc chỉ đổi chữ hoa/thường, khoảng trắng của nội dung đều được. PUT giữ nguyên tiêu chí và nội dung (theo cách so sánh trên) thì không kiểm tra trùng: dữ liệu trùng có từ trước task 222 (hoặc thêm bằng SQL) vẫn sửa được hoặc chuyển `active = false` được. Khi đã đổi sang nội dung khác, câu hỏi không lấy lại được nội dung đang có ở câu khác.
- **Chuyển tiêu chí**: PUT chuyển câu hỏi sang tiêu chí đã có câu cùng nội dung cũng trả 409.

```json
{
  "code": "INTERVIEW_QUESTION_DUPLICATE",
  "message": "Tiêu chí này đã có câu hỏi phỏng vấn cùng nội dung.",
  "fieldErrors": {
    "content": "Câu hỏi này đã có trong tiêu chí đã chọn."
  }
}
```

Khi chỉ trùng với câu hỏi đang ngừng dùng, `fieldErrors.content` là "Câu hỏi này đã có trong tiêu chí đã chọn nhưng đang ngừng dùng; hãy dùng lại câu hỏi đó (active = true)."

Database không có ràng buộc UNIQUE cho việc này (V9 cố ý không đặt, và cách so sánh trên khó viết thành chỉ mục); kiểm tra nằm ở `InterviewQuestionService`. Để hai request cùng lúc không cùng vượt qua kiểm tra, service khóa dòng tiêu chí (xem [Thứ tự kiểm tra và đồng thời](#thứ-tự-kiểm-tra-và-đồng-thời)).

### Đọc một câu hỏi

`GET /interview-questions/{id}`, trong đó `{id}` là UUID của câu hỏi. Không có body hay tham số. Trả **200** với response như trên, kể cả câu hỏi `active = false`. Câu hỏi, tiêu chí và khung được đọc trong cùng một snapshot (`REPEATABLE_READ`, chỉ đọc), nên luôn khớp nhau; lần đọc không chờ khi HR đang sửa dở mà trả bản đã commit gần nhất.

### Tìm kiếm và lọc (task 223)

`GET /interview-questions?q=xung%20đột&positionId=<uuid>&criterionId=<uuid>&difficulty=MEDIUM&active=true&page=0&size=20`

Mọi tham số đều tùy chọn. Không gửi tham số nào thì trả cả ngân hàng câu hỏi theo trang, kể cả câu hỏi đang ngừng dùng. Các bộ lọc gửi cùng lúc được kết hợp bằng "và": câu hỏi phải thỏa tất cả. Tham số có giá trị rỗng (ví dụ `difficulty=`) được coi như không gửi.

| Tham số | Ý nghĩa |
|---|---|
|q|Tìm một phần **nội dung câu hỏi** (`content`), không phân biệt chữ hoa/thường, kể cả chữ tiếng Việt có dấu (`BẠN ĐÃ XỬ LÝ` tìm thấy `bạn đã xử lý`). Không tìm trong gợi ý câu trả lời, tên tiêu chí hay tên/mã khung. `%`, `_` và `!` được hiểu là ký tự thật. Tối đa **255** ký tự sau khi chuẩn hóa (xem dưới bảng); không được chứa ký tự điều khiển. `q` rỗng hoặc chỉ có khoảng trắng nghĩa là không tìm theo nội dung|
|positionId|UUID chức danh. Chỉ trả câu hỏi thuộc các tiêu chí của khung năng lực mà chức danh **đang dùng** (`positions.competency_framework_id`), nên các chức danh dùng chung một khung nhận cùng kết quả và đổi khung của chức danh thì kết quả đổi ngay. Chức danh chưa gán khung trả trang rỗng (không phải lỗi). Chức danh đã ngừng dùng (`active = false`) vẫn lọc được. UUID không phải chức danh nào trả 400 `INVALID_POSITION`|
|criterionId|UUID tiêu chí. Chỉ trả câu hỏi gắn với tiêu chí này. UUID không phải tiêu chí nào (kể cả UUID của khung) trả 400 `INVALID_COMPETENCY_CRITERION`. Gửi cùng `positionId` mà tiêu chí không thuộc khung của chức danh thì trả trang rỗng|
|difficulty|`EASY`, `MEDIUM` hoặc `HARD`, viết hoa đúng như vậy; bỏ qua để lấy mọi mức|
|active|`true` chỉ lấy câu hỏi đang dùng, `false` chỉ lấy câu hỏi đã ngừng dùng; bỏ qua để lấy cả hai. Màn hình chọn câu hỏi để phỏng vấn nên gửi `active=true`|
|page|Từ 0, mặc định 0|
|size|Từ 1 đến 100, mặc định 20|

**Chuẩn hóa `q`.** Trước khi so sánh, backend đổi `q` sang dạng NFC (giống khi lưu câu hỏi, task 222), gộp mọi chuỗi khoảng trắng, tab, xuống dòng liền nhau thành một dấu cách và bỏ khoảng trắng ở đầu/cuối. Nội dung câu hỏi cũng được gộp khoảng trắng như vậy khi so sánh, nên `xử lý xung đột` tìm thấy câu hỏi xuống dòng giữa "xử lý" và "xung đột", và chữ có dấu gửi ở dạng NFD vẫn tìm thấy câu hỏi đã lưu ở dạng NFC. Giới hạn 255 ký tự được đếm sau bước này. Ký tự điều khiển (nhóm `Cc` của Unicode như NUL, ESC, DEL) bị từ chối; tab và xuống dòng không bị từ chối vì đã thành dấu cách.

Response **200**: `{items, page, size, totalElements, totalPages}`. Mỗi phần tử của `items` có đúng dạng response của `GET /interview-questions/{id}`, nên màn hình hiển thị được tiêu chí, khung, gợi ý câu trả lời mà không cần gọi thêm.

```json
{
  "items": [
    {
      "id": "00000000-0000-0000-0000-000000000021",
      "criterion": {
        "id": "00000000-0000-0000-0000-000000000011",
        "name": "Giao tiếp"
      },
      "framework": {
        "id": "00000000-0000-0000-0000-000000000010",
        "code": "DEV_CORE",
        "name": "Năng lực lập trình viên"
      },
      "content": "Bạn đã xử lý\nxung đột trong nhóm thế nào?",
      "difficulty": "MEDIUM",
      "answerHint": "Nêu rõ cách lắng nghe.",
      "active": true,
      "createdAt": "2026-10-07T08:00:00Z",
      "updatedAt": "2026-10-07T08:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

**Sắp xếp.** Theo mã khung (`framework.code`), rồi thứ tự tiêu chí trong khung (`sortOrder` do HR đặt), rồi câu hỏi tạo trước đứng trước (`createdAt`), cuối cùng theo UUID để hai câu hỏi tạo cùng lúc vẫn có thứ tự cố định. Câu hỏi của cùng một tiêu chí vì vậy nằm cạnh nhau, và khi dữ liệu không đổi thì các trang không trùng, không sót câu hỏi. HR đổi thứ tự tiêu chí trong khung (PUT khung) thì thứ tự danh sách đổi theo. Trang vượt quá số trang có `items` rỗng nhưng vẫn trả đúng `totalElements`, `totalPages`.

**Thứ tự kiểm tra.**

1. Token và quyền `ORGANIZATION_READ_ALL` (401/403). Người thiếu quyền luôn nhận 403, kể cả khi tham số sai.
2. Giá trị không đổi được sang kiểu cần có: `positionId`/`criterionId` không phải UUID, `difficulty` không phải `EASY`/`MEDIUM`/`HARD` (kể cả `easy`), `active` không phải `true`/`false`, `page`/`size` không phải số nguyên. Trả 400 `VALIDATION_ERROR` với message "Tham số đường dẫn hoặc bộ lọc không hợp lệ." và `fieldErrors` là đối tượng rỗng `{}` (khóa vẫn có, chỉ không nêu tham số nào sai).
3. `q`, `page`, `size` ngoài giới hạn: 400 `VALIDATION_ERROR`, mọi tham số sai được nêu cùng lúc trong `fieldErrors` (khóa `q`, `page`, `size`).
4. `positionId` không phải chức danh nào: 400 `INVALID_POSITION`.
5. `criterionId` không phải tiêu chí nào: 400 `INVALID_COMPETENCY_CRITERION`.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Trang, số lượng hoặc từ khóa tìm kiếm câu hỏi phỏng vấn không hợp lệ.",
  "fieldErrors": {
    "q": "Từ khóa tìm kiếm tối đa 255 ký tự.",
    "page": "Số trang phải từ 0 trở lên.",
    "size": "Số câu hỏi mỗi trang phải từ 1 đến 100."
  }
}
```

`q` có ký tự điều khiển cho `fieldErrors.q` là "Từ khóa tìm kiếm không được chứa ký tự điều khiển.". Chức danh không tồn tại:

```json
{
  "code": "INVALID_POSITION",
  "message": "Chức danh không tồn tại.",
  "fieldErrors": {
    "positionId": "Không tìm thấy chức danh này."
  }
}
```

**Đồng thời.** Lần tìm chạy trong transaction chỉ đọc `REPEATABLE_READ`: kiểm tra chức danh/tiêu chí, đếm tổng và lấy trang đều từ cùng một snapshot, nên `totalElements` luôn khớp với các trang. Lần tìm không khóa dòng nào và không chờ người đang sửa khung, chức danh hay câu hỏi: nó trả bản đã commit gần nhất và không thấy thay đổi chưa lưu.

**Giới hạn đã biết.** Tìm theo `q` dùng `LIKE '%...%'` trên nội dung đã gộp khoảng trắng, nên PostgreSQL phải đọc lần lượt các câu hỏi còn lại sau các bộ lọc khác (không dùng được index); chấp nhận được với ngân hàng vài nghìn câu hỏi. Không phân biệt hoa/thường dựa vào hàm `lower()` của PostgreSQL, phụ thuộc locale của database: image `postgres:17` trong `devops/docker/compose.yaml` mặc định dùng `en_US.utf8` và PostgreSQL nhúng của test đều đổi đúng chữ tiếng Việt có dấu; một database tạo với locale `C` chỉ đổi được chữ ASCII.

### Thứ tự kiểm tra và đồng thời

1. Token và quyền (401/403), rồi từng trường riêng lẻ (`VALIDATION_ERROR`, mọi trường sai được trả cùng lúc trong `fieldErrors`) hoặc JSON sai (`INVALID_JSON`).
2. PUT: câu hỏi phải tồn tại (404 `INTERVIEW_QUESTION_NOT_FOUND`). Service khóa dòng câu hỏi (`SELECT ... FOR UPDATE`), nên hai người sửa cùng một câu hỏi được xử lý lần lượt. Không có kiểm tra phiên bản (optimistic lock): người lưu sau ghi đè thay đổi của người lưu trước.
3. Tiêu chí phải tồn tại (400 `INVALID_COMPETENCY_CRITERION`). Service tìm khung của tiêu chí, khóa dòng khung bằng `SELECT ... FOR SHARE`, rồi đọc lại tiêu chí và khóa dòng tiêu chí bằng `SELECT ... FOR UPDATE` (task 222).
4. Tiêu chí chưa có câu hỏi khác cùng nội dung (409 `INTERVIEW_QUESTION_DUPLICATE`, task 222).
5. Ghi câu hỏi trong cùng transaction.

Khóa `FOR SHARE` trên dòng khung (giống khi gán khung cho chức danh, task 214) giữ cho tiêu chí không bị xóa giữa lúc kiểm và lúc lưu:

- Nếu HR đang sửa khung (PUT khung giữ khóa `FOR UPDATE`), lần ghi câu hỏi chờ PUT khung commit rồi mới đọc lại tiêu chí. Tiêu chí vừa bị PUT khung xóa trả 400 `INVALID_COMPETENCY_CRITERION`, không phải 500.
- Nếu một lần ghi câu hỏi đang chạy, PUT khung chờ nó commit; sau đó PUT khung thấy câu hỏi mới và không xóa tiêu chí của nó (409 `COMPETENCY_CRITERION_IN_USE`).
- Nhiều lần ghi câu hỏi trên cùng một khung dùng chung khóa khung nên không chờ nhau, miễn là khác tiêu chí.
- Hai lần ghi câu hỏi trên **cùng một tiêu chí** chạy lần lượt nhờ khóa dòng tiêu chí (task 222). Lần ghi sau chờ lần trước commit rồi mới kiểm tra trùng, nên thấy câu hỏi vừa lưu: hai người cùng thêm một câu vào cùng tiêu chí thì người sau nhận 409, không có hai bản.
- Tiêu chí bị xóa bằng cách khác (sửa trực tiếp bằng SQL, không khóa khung): khóa dòng tiêu chí chờ lệnh xóa commit rồi không tìm thấy tiêu chí, trả cùng mã 400. Khóa ngoại V9 vẫn là lớp chặn cuối; nếu nó từ chối thì service cũng đổi thành 400.

Mọi lỗi đều không thay đổi dữ liệu.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu `criterionId`, `content` hoặc `difficulty`; `content` rỗng/chỉ khoảng trắng; `content` quá 2000 hoặc `answerHint` quá 4000 ký tự; `content`/`answerHint` có ký tự điều khiển (trừ tab, xuống dòng); `difficulty` không phải `"EASY"`/`"MEDIUM"`/`"HARD"`; UUID trên đường dẫn sai. Hiếm hơn: database dùng locale coi thêm một ký tự khác là khoảng trắng nên CHECK của V9 vẫn từ chối `content`/`answerHint` (`23514`); khi đó `fieldErrors` nêu đúng trường đó thay vì trả 500. Tìm kiếm (task 223): `q` quá 255 ký tự hoặc có ký tự điều khiển, `page` âm, `size` ngoài 1–100 (`fieldErrors.q`/`page`/`size`); `positionId`/`criterionId` không phải UUID, `difficulty`/`active`/`page`/`size` sai kiểu|
|400|INVALID_JSON|JSON sai, `criterionId` không phải UUID, `difficulty` là mảng hoặc đối tượng JSON, `active` không phải true/false, hoặc có trường ngoài hợp đồng|
|400|INVALID_COMPETENCY_CRITERION|`criterionId` không phải tiêu chí nào đang có (kể cả tiêu chí vừa bị xóa trong lúc chờ), ở body của POST/PUT hoặc ở tham số tìm kiếm (task 223); `fieldErrors.criterionId`|
|400|INVALID_POSITION|Tìm kiếm (task 223): `positionId` không phải chức danh nào; `fieldErrors.positionId`|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Đọc thiếu `ORGANIZATION_READ_ALL`; ghi thiếu `ORGANIZATION_WRITE_ALL`; hoặc gọi URL chưa có như `DELETE /interview-questions/{id}`|
|404|INTERVIEW_QUESTION_NOT_FOUND|Không tìm thấy câu hỏi (GET, PUT)|
|409|INTERVIEW_QUESTION_DUPLICATE|Tiêu chí đã có câu hỏi khác cùng nội dung (kể cả câu đang ngừng dùng); `fieldErrors.content`|

Ví dụ tiêu chí không tồn tại:

```json
{
  "code": "INVALID_COMPETENCY_CRITERION",
  "message": "Tiêu chí đánh giá không tồn tại.",
  "fieldErrors": {
    "criterionId": "Không tìm thấy tiêu chí này trong khung năng lực nào."
  }
}
```

### Quyết định cần BA/PO xác nhận

Task 221:

- Database (V9) lưu `content` và `answerHint` bằng `TEXT` không giới hạn; API đặt giới hạn 2000 và 4000 ký tự để chặn dữ liệu quá lớn.
- Câu hỏi gắn được với tiêu chí của khung `DRAFT`, để HR soạn câu hỏi trong lúc khung còn là bản nháp. Task 222 giữ quyết định này: chỉ khi gán khung cho chức danh (task 214) khung mới phải `ACTIVE`.

Task 222:

- Không cho hai câu hỏi trùng nội dung trong cùng một tiêu chí (409); cùng nội dung ở tiêu chí khác vẫn được. Không phân biệt chữ hoa/thường, khoảng trắng giữa các từ và cách mã hóa dấu tiếng Việt; có phân biệt dấu câu.
- Câu hỏi `active = false` vẫn được tính khi kiểm tra trùng.
- Sai mức độ khó là lỗi theo trường (`VALIDATION_ERROR`) thay vì `INVALID_JSON` như task 221, để form biết đúng ô cần sửa.
- Từ chối ký tự điều khiển trừ tab và xuống dòng; lưu văn bản ở dạng NFC.

Task 223:

- `q` chỉ tìm trong nội dung câu hỏi, không tìm trong gợi ý câu trả lời, tên tiêu chí hay tên khung.
- Không gửi `active` thì trả cả câu hỏi đang ngừng dùng, giống danh sách phòng ban, chức danh; người phỏng vấn cũng thấy các câu hỏi này. Màn hình chọn câu hỏi để phỏng vấn cần gửi `active=true`.
- `positionId` hoặc `criterionId` không tồn tại trả 400 thay vì trang rỗng, để màn hình phân biệt "chức danh/tiêu chí không còn" với "chưa có câu hỏi". Chức danh chưa gán khung năng lực trả trang rỗng.
- Sắp xếp theo khung, thứ tự tiêu chí rồi thời điểm tạo câu hỏi; chưa có tùy chọn sắp xếp khác.
- `q` tối đa 255 ký tự như các danh sách khác.

### Database và phạm vi

Dùng bảng `interview_questions` của V9 (task 220), `competency_criteria` và `competency_frameworks` của V8, quyền ORGANIZATION của V3. Task 221, 222 và 223 không thêm migration, mã quyền hay dòng cấp quyền và không cần sửa `.env`. Mã nguồn ở gói `vn.ttcs.recruitment.interviewquestion` (`InterviewQuestionController`, `InterviewQuestionService`, `InterviewQuestionRequest`, `InterviewQuestionView`); task 222 thêm `CompetencyCriterionRepository.findByIdForUpdate` để khóa dòng tiêu chí. Task 223 thêm `InterviewQuestionSearchRepository` (SQL thuần qua `NamedParameterJdbcTemplate`, đọc thêm cột `positions.competency_framework_id`), `InterviewQuestionPage` và phương thức `list` của controller/service.

Chưa có: xóa câu hỏi, phiếu đánh giá phỏng vấn (Sprint 6).

*Nguồn: `docs/api/interview-questions.md` (Sprint 2).*


---

<a id="api-requisitions"></a>

## API yêu cầu tuyển dụng

Phạm vi TKNHTTDNB1-244 (tạo và lưu nháp), TKNHTTDNB1-245 (xem và cập nhật bản nháp), TKNHTTDNB1-246 (kiểm tra trường bắt buộc và lý do tuyển), TKNHTTDNB1-247 (bắt buộc giải trình khi dải lương đề xuất ngoài chuẩn), TKNHTTDNB1-248 (ngày cần người không ở quá khứ) và TKNHTTDNB1-249 (kiểm tra quyền và phòng ban của người tạo yêu cầu), story TKNHTTDNB1-29 (S2-10). URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; response thành công và các lỗi nghiệp vụ `REQUISITION_*`, `INVALID_REQUISITION_*`, `SALARY_JUSTIFICATION_REQUIRED`, `NEEDED_BY_IN_PAST` dùng `Cache-Control: no-store`.

Hiện có `POST /requisitions`, `GET /requisitions`, `GET /requisitions/{id}` và `PUT /requisitions/{id}`. Task 246 đã thêm kiểm tra trường bắt buộc, lý do tuyển, giới hạn số lượng và chức danh/phòng ban đang áp dụng (mục "Kiểm tra trường bắt buộc và lý do tuyển"). Task 247 bắt buộc nhập giải trình khi dải lương đề xuất nằm ngoài dải lương chuẩn của chức danh (mục "Giải trình khi dải lương đề xuất ngoài chuẩn"). Task 248 từ chối ngày cần người trước ngày hôm nay theo múi giờ nghiệp vụ (mục "Ngày cần người không ở quá khứ"). Task 249 bắt phòng ban ghi vào yêu cầu (khi tạo, và khi sửa) phải thuộc phạm vi người gọi (mục "Phạm vi dữ liệu"). Sau task 249, phần backend cho các tiêu chí của story S2-10 đã có; trong story còn task 250 (kết nối giao diện, phía frontend) và 251 (test tạo và lưu nháp).

| Thao tác | Quyền cần có | Vai trò được phép theo seed hiện tại |
|---|---|---|
|`POST /requisitions`|`REQUISITIONS_WRITE_ALL` **hoặc** `REQUISITIONS_WRITE_SCOPED`|ADMIN, HR_MANAGER (`ALL`); HIRING_MANAGER, RECRUITER, APPROVER (`SCOPED`)|
|`GET /requisitions`|`REQUISITIONS_READ_ALL` **hoặc** `REQUISITIONS_READ_SCOPED`|ADMIN, HR_MANAGER (`ALL`); HIRING_MANAGER, RECRUITER, APPROVER (`SCOPED`)|
|`GET /requisitions/{id}`|`REQUISITIONS_READ_ALL` **hoặc** `REQUISITIONS_READ_SCOPED`|Như dòng trên|
|`PUT /requisitions/{id}`|`REQUISITIONS_WRITE_ALL` **hoặc** `REQUISITIONS_WRITE_SCOPED`|Như dòng `POST`|

INTERVIEWER và tài khoản không có vai trò nhận 403 `FORBIDDEN` ở cả bốn API. Backend đọc quyền hiện tại trong database ở mỗi yêu cầu. Khi ghi (`POST`, `PUT`), backend khóa tài khoản người gọi rồi phiên, sau đó kiểm lại trạng thái tài khoản, phiên, hạn JWT và quyền trước khi ghi, giống API chức danh. Quyền đọc và quyền ghi được kiểm riêng: `REQUISITIONS_READ_*` không cho phép tạo/sửa, `REQUISITIONS_WRITE_*` không cho phép gọi hai API `GET`.

### Phạm vi dữ liệu (task 245, 249)

- Người có `ALL` (ADMIN, HR_MANAGER) xem, tạo và sửa yêu cầu của **mọi** phòng ban, và chuyển nháp giữa mọi phòng ban.
- Người chỉ có `SCOPED` chỉ xem, tạo và sửa yêu cầu thuộc **phòng ban mình phụ trách** (`departments.manager_user_id` là người gọi), tính cả mọi phòng ban con, cháu bên dưới trong cây. Ví dụ cây `IT > IT_DEV > IT_QA`: trưởng IT thấy và tạo được yêu cầu cho cả ba phòng; trưởng IT_DEV thấy và tạo được cho IT_DEV và IT_QA nhưng không cho IT.
- Người tạo yêu cầu không quyết định quyền xem: khi HR đổi người phụ trách phòng ban, bản nháp của phòng ban đó chuyển sang người phụ trách mới, người phụ trách cũ không xem/sửa được nữa (nhưng `createdBy` vẫn giữ người tạo).
- Trạng thái `active` của phòng ban không ảnh hưởng phạm vi: phòng ban ngừng áp dụng vẫn do người phụ trách của nó xem. Riêng việc **lưu** nháp vào phòng ban ngừng áp dụng bị chặn từ task 246 (xem mục kiểm tra bên dưới).
- Theo cách hiểu này RECRUITER và APPROVER thường không phụ trách phòng ban nào nên nhận danh sách rỗng và 403 khi mở, sửa hay tạo một yêu cầu. Cách hiểu này cần BA/PO xác nhận (câu hỏi 2 trong ma trận vai trò và quyền (`docs/architecture/role-permission-matrix.md` trong repo Backend)); khi có luồng phân công recruiter/duyệt, phạm vi của hai vai trò này sẽ được mở rộng.
- Yêu cầu tồn tại nhưng ngoài phạm vi trả 403 `FORBIDDEN` theo quy ước chung của thiết kế phân quyền (`docs/architecture/authorization.md` trong repo Backend), không trả 404. UUID không tồn tại trả 404 `REQUISITION_NOT_FOUND` cho mọi người gọi; vì vậy người `SCOPED` phân biệt được "không tồn tại" và "không được phép", nhưng UUID là ngẫu nhiên nên không đoán được mã của phòng ban khác.

Task 245 giới hạn **yêu cầu đã có** mà người gọi được xem/sửa. Task 249 (kết quả Jira: "Bảo đảm Trưởng bộ phận tạo và cập nhật yêu cầu thuộc phạm vi phòng ban được phép") giới hạn thêm **phòng ban ghi vào body** (`departmentId`):

- `POST`: người `SCOPED` chỉ tạo được yêu cầu cho phòng ban thuộc phạm vi trên. Phòng ban khác, kể cả phòng ban **cha** của phòng mình phụ trách, trả 403 `FORBIDDEN` và không lưu gì.
- `PUT`: phải qua **hai** lần kiểm. Phòng ban hiện tại của nháp phải thuộc phạm vi (task 245), và phòng ban mới trong body cũng phải thuộc phạm vi. Vì vậy trưởng bộ phận chuyển được nháp giữa các phòng mình phụ trách (ví dụ IT sang IT_QA), nhưng không chuyển được ra ngoài (IT sang SALES), cũng không "kéo" nháp của phòng khác về phòng mình. Lần kiểm nào không qua cũng trả 403 `FORBIDDEN` và dòng giữ nguyên.
- Người `ALL` không bị giới hạn phòng ban; tài khoản có nhiều vai trò được `ALL` nếu một vai trò có `REQUISITIONS_WRITE_ALL` (ví dụ HIRING_MANAGER kiêm HR_MANAGER).
- Phạm vi chỉ phụ thuộc cây phòng ban, không phụ thuộc vai trò cụ thể: RECRUITER hay APPROVER được đặt làm người phụ trách một phòng ban cũng tạo được yêu cầu cho phòng ban đó; ai không phụ trách phòng ban nào thì nhận 403 với mọi `departmentId` (chờ BA/PO, câu hỏi 2 như trên).
- `active` của phòng ban chọn trong body vẫn phải là `true` (task 246), nhưng không ảnh hưởng phạm vi: phòng ban con đang áp dụng nằm dưới một phòng ban đã ngừng vẫn thuộc phạm vi của người phụ trách phòng ban đã ngừng đó.

Thứ tự: kiểm phạm vi của phòng ban trong body **sau** khi phòng ban đó được xác nhận tồn tại và đang áp dụng, và **trước** khi so dải lương chuẩn (bước 7 của tạo, trong bước 7 của sửa ở dưới). Hệ quả:

- `departmentId` không tồn tại vẫn là 400 `INVALID_REQUISITION_DEPARTMENT` với mọi người gọi, không phải 403, giống "UUID không tồn tại là 404 trước 403" ở trên. Phòng ban đã ngừng là 400 `REQUISITION_DEPARTMENT_INACTIVE`. Cây phòng ban vốn đọc được bởi mọi vai trò nội bộ (`ORGANIZATION_READ_ALL`), nên thứ tự này không làm lộ thêm thông tin.
- Lỗi chỉ dựa trên body (từng trường, `REQUISITION_SALARY_RANGE_INVALID`, `NEEDED_BY_IN_PAST`) và lỗi chức danh được trả trước 403 này.
- Lương ngoài dải chuẩn mà chưa có giải trình nhưng phòng ban ngoài phạm vi trả 403, không trả `SALARY_JUSTIFICATION_REQUIRED`: dải chuẩn không được so cho yêu cầu không được phép lưu.

**Đồng thời:** phạm vi được đọc **sau** khi dòng phòng ban trong body bị khóa `SELECT ... FOR SHARE` (bước 6 của tạo). Nếu HR đang đổi người phụ trách hoặc phòng ban cha của chính phòng ban đó, request chờ HR xong rồi dùng cây mới: ví dụ HR chuyển IT_DEV từ dưới IT sang dưới SALES và commit trong lúc trưởng IT đang tạo nháp cho IT_DEV thì trưởng IT nhận 403, HR hủy thì lưu bình thường. Sau khi kiểm, khóa giữ đến khi lưu xong nên HR không đổi được người phụ trách hay phòng ban cha của phòng ban đó trước khi nháp được lưu. Thay đổi ở phòng ban **cha** (ví dụ đổi người phụ trách IT khi nháp chọn IT_DEV) không bị chặn: nếu nó commit sau lúc kiểm thì được tính như xảy ra ngay sau khi nháp được lưu, và nháp đi theo người phụ trách mới như mọi nháp khác.

Quyết định của backend (chờ BA/PO xác nhận):

- Phòng ban ngoài phạm vi trả 403 `FORBIDDEN` theo quy ước chung, không trả lỗi form 400 riêng cho `departmentId`. Giao diện nên chỉ cho chọn các phòng ban người dùng phụ trách (tính được từ `GET /departments/tree`: node có `managerUserId` là người đang đăng nhập cùng toàn bộ `children` bên dưới), nên 403 này chỉ xảy ra khi dữ liệu trên form đã cũ hoặc request bị sửa tay.
- Không thêm quyền hay cột "phòng ban được phép" riêng: phạm vi tính từ `departments.manager_user_id` và `parent_id` ở mỗi lần lưu.

### Tạo bản nháp

`POST /requisitions` tạo một yêu cầu tuyển dụng ở trạng thái `DRAFT`, người tạo là người gọi (lấy từ token), trả **201**. Mỗi lần gọi tạo một bản nháp mới, kể cả khi nội dung giống hệt bản đã có; chưa có kiểm tra trùng.

```json
{
  "positionId": "00000000-0000-0000-0000-000000000003",
  "departmentId": "00000000-0000-0000-0000-000000000002",
  "headcount": 2,
  "reason": "NEW_HEADCOUNT",
  "proposedSalaryMin": 15000000,
  "proposedSalaryMax": 25000000,
  "salaryJustification": null,
  "neededBy": "2026-12-31",
  "jobDescription": "Phát triển API tuyển dụng.\n\n- Spring Boot\n- PostgreSQL",
  "candidateRequirements": "Tối thiểu 2 năm kinh nghiệm Java."
}
```

| Trường | Quy tắc |
|---|---|
|positionId|Bắt buộc, UUID của chức danh có trong bảng `positions` và đang áp dụng (`active = true`)|
|departmentId|Bắt buộc, UUID của phòng ban có trong bảng `departments` và đang áp dụng (`active = true`)|
|headcount|Bắt buộc, số nguyên JSON từ 1 đến 999|
|reason|Bắt buộc, chuỗi đúng một trong hai mã `REPLACEMENT` (tuyển thay thế) hoặc `NEW_HEADCOUNT` (tăng mới): đúng chữ hoa, không có khoảng trắng đầu/cuối|
|proposedSalaryMin|Không bắt buộc. Lương đề xuất tối thiểu, số nguyên đồng VND từ 0 đến 1.000.000.000.000|
|proposedSalaryMax|Không bắt buộc. Lương đề xuất tối đa, cùng quy tắc; khi có cả hai mức thì không nhỏ hơn `proposedSalaryMin` (được phép bằng)|
|salaryJustification|Tối đa 2.000 ký tự, không chứa ký tự NUL. **Bắt buộc** khi một mức lương đề xuất đã nhập nằm ngoài dải lương chuẩn của chức danh (task 247); ngoài trường hợp đó thì không bắt buộc|
|neededBy|Không bắt buộc. Ngày cần người dạng `yyyy-MM-dd`, không có giờ. Nếu có thì không được **trước ngày hôm nay** theo múi giờ nghiệp vụ, mặc định giờ Việt Nam (task 248); hôm nay được phép|
|jobDescription|Không bắt buộc, tối đa 10.000 ký tự, không chứa ký tự NUL|
|candidateRequirements|Không bắt buộc, tối đa 10.000 ký tự, không chứa ký tự NUL|

Bản nháp được lưu dù chưa viết xong: chỉ bốn trường đầu là bắt buộc. Trường không gửi, gửi `null`, hoặc văn bản rỗng/chỉ có khoảng trắng được lưu là `null` (V13 lưu phần chưa viết là `NULL`). Văn bản có nội dung được giữ nguyên như người dùng nhập, kể cả xuống dòng, thụt đầu dòng và khoảng trắng đầu/cuối. Có thể nhập một đầu của dải lương đề xuất. Lương phải là số nguyên JSON: `1.5`, `1e3` hoặc chuỗi `"15000000"` bị từ chối với `INVALID_JSON`, giống [API chức danh](#api-positions). `headcount` cũng vậy: `1.5`, `0.9`, `2.0`, `1e1`, chuỗi `"2"` hoặc `true` bị từ chối với `INVALID_JSON`, không bị làm tròn thành `1`/`0` hay tự đổi thành số; số vượt 2.147.483.647 (giới hạn của cột `INTEGER`) cũng là `INVALID_JSON`. Số nguyên từ 1.000 đến 2.147.483.647 là `VALIDATION_ERROR` "Số lượng cần tuyển tối đa 999 người." (task 246).

Ký tự NUL (mã 0, trong JSON viết là `\u0000`, đôi khi dính vào khi dán từ tệp khác) không lưu được vào cột `TEXT` của PostgreSQL, nên `salaryJustification`, `jobDescription`, `candidateRequirements` chứa ký tự này bị từ chối với `VALIDATION_ERROR` (ví dụ `fieldErrors.jobDescription` là "Mô tả công việc chứa ký tự không hợp lệ."). Mọi ký tự khác, kể cả tab và xuống dòng kiểu Windows `\r\n`, được giữ nguyên.

Trường ngoài hợp đồng, kể cả `id`, `status`, `createdBy`, `createdAt`, bị từ chối với 400 `INVALID_JSON`: trạng thái và người tạo do server quyết định.

Thứ tự kiểm tra:

1. Quyền ở `SecurityConfiguration` (thiếu quyền thì 403 trước khi đọc body).
2. Từng trường riêng lẻ: thiếu trường bắt buộc, số lượng ngoài 1–999, lý do tuyển không phải một trong hai mã, lương âm hoặc vượt trần, văn bản quá dài hoặc chứa ký tự NUL. Mọi trường sai được trả cùng lúc trong `fieldErrors` với mã `VALIDATION_ERROR`.
3. Khóa tài khoản và phiên, kiểm lại quyền (403 nếu vừa mất quyền, 401 `SESSION_INVALID` nếu phiên/tài khoản/token không còn hợp lệ).
4. So hai mức lương đề xuất: tối thiểu lớn hơn tối đa trả `REQUISITION_SALARY_RANGE_INVALID`.
5. Ngày cần người trước ngày hôm nay theo múi giờ nghiệp vụ: `NEEDED_BY_IN_PAST` (task 248).
6. Chức danh tồn tại (`INVALID_REQUISITION_POSITION`) và đang áp dụng (`REQUISITION_POSITION_INACTIVE`), rồi phòng ban tồn tại (`INVALID_REQUISITION_DEPARTMENT`) và đang áp dụng (`REQUISITION_DEPARTMENT_INACTIVE`).
7. Phòng ban trong body thuộc phạm vi người gọi (chỉ kiểm với người `SCOPED`): nếu không thì 403 `FORBIDDEN` (task 249, mục "Phạm vi dữ liệu").
8. Mức lương đề xuất ngoài dải lương chuẩn của chức danh mà không có giải trình: `SALARY_JUSTIFICATION_REQUIRED` (task 247).

Mỗi lần chỉ trả lỗi đầu tiên gặp từ bước 4 trở đi.

### Kiểm tra trường bắt buộc và lý do tuyển (task 246)

Kết quả Jira: xác thực chức danh, phòng ban, số lượng và lý do tuyển là thay thế hoặc tăng mới. Các quy tắc áp dụng **giống nhau** cho `POST` (tạo) và `PUT` (lưu lại nháp).

| Trường | Sai thế nào | HTTP / mã | Lời nhắn (`fieldErrors.<trường>`) |
|---|---|---|---|
|positionId|Thiếu hoặc `null`|400 `VALIDATION_ERROR`|Chức danh không được để trống.|
|positionId|Không có chức danh này|400 `INVALID_REQUISITION_POSITION`|Chức danh không tồn tại.|
|positionId|Chức danh `active = false`|400 `REQUISITION_POSITION_INACTIVE`|Chức danh đã ngừng áp dụng, hãy chọn chức danh khác.|
|departmentId|Thiếu hoặc `null`|400 `VALIDATION_ERROR`|Phòng ban không được để trống.|
|departmentId|Không có phòng ban này|400 `INVALID_REQUISITION_DEPARTMENT`|Phòng ban không tồn tại.|
|departmentId|Phòng ban `active = false`|400 `REQUISITION_DEPARTMENT_INACTIVE`|Phòng ban đã ngừng áp dụng, hãy chọn phòng ban khác.|
|headcount|Thiếu hoặc `null`|400 `VALIDATION_ERROR`|Số lượng cần tuyển không được để trống.|
|headcount|0 hoặc số âm|400 `VALIDATION_ERROR`|Số lượng cần tuyển phải lớn hơn 0.|
|headcount|Từ 1.000 trở lên|400 `VALIDATION_ERROR`|Số lượng cần tuyển tối đa 999 người.|
|reason|Thiếu hoặc `null`|400 `VALIDATION_ERROR`|Lý do tuyển không được để trống.|
|reason|Chuỗi khác hai mã, kể cả chữ thường (`replacement`), có khoảng trắng (`" REPLACEMENT"`) hoặc chuỗi rỗng|400 `VALIDATION_ERROR`|Lý do tuyển chỉ được là REPLACEMENT (tuyển thay thế) hoặc NEW_HEADCOUNT (tăng mới).|

Với bốn lỗi `INVALID_REQUISITION_*` và `REQUISITION_*_INACTIVE` của chức danh và phòng ban, `message` và lời nhắn trong `fieldErrors` là cùng một câu; response có `Cache-Control: no-store`.

Lý do tuyển sai (trước task 246 là `INVALID_JSON` chung chung, không nói trường nào sai) nay là lỗi của đúng trường `reason`, và được trả **cùng lúc** với các trường sai khác. Ví dụ body thiếu `positionId`, `headcount` là 1000 và `reason` là `"OTHER"`:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Vui lòng kiểm tra dữ liệu đã nhập.",
  "fieldErrors": {
    "positionId": "Chức danh không được để trống.",
    "headcount": "Số lượng cần tuyển tối đa 999 người.",
    "reason": "Lý do tuyển chỉ được là REPLACEMENT (tuyển thay thế) hoặc NEW_HEADCOUNT (tăng mới)."
  }
}
```

Thứ tự các khóa trong `fieldErrors` không cố định. `reason` gửi dạng số hoặc `true`/`false` được đọc thành chuỗi (`"1"`, `"true"`) nên cũng nhận lời nhắn trên; gửi object hoặc mảng (`{}`, `["REPLACEMENT"]`) thì cả JSON không đúng hợp đồng và trả `INVALID_JSON`.

Quyết định của backend (chờ BA/PO xác nhận):

- **Tối đa 999 người mỗi yêu cầu.** Mục đích là chặn gõ nhầm (ví dụ 10000 thay vì 10); nhu cầu lớn hơn thì tách thành nhiều yêu cầu. Giới hạn này chỉ nằm ở API; CHECK của V13 vẫn chỉ là `headcount > 0` vì task không được sửa migration đã có.
- **Chức danh và phòng ban phải đang áp dụng, kể cả khi sửa.** HR đặt `active = false` để ngừng tuyển cho chức danh/phòng ban đó, nên nháp mới không chọn được. Nháp tạo trước khi chức danh/phòng ban bị ngừng vẫn **xem được** như cũ, nhưng muốn lưu lại thì phải chọn chức danh/phòng ban khác đang áp dụng (hoặc HR bật lại). Điểm này khác API quản trị tài khoản (cho giữ phòng ban cũ đã ngừng): yêu cầu tuyển dụng xin người cho hiện tại, không chỉ ghi nhận quá khứ.
- **Chỉ xét cờ của chính phòng ban được chọn.** Phòng ban đang áp dụng nằm dưới một phòng cha đã ngừng vẫn chọn được, khớp với [API phòng ban](#api-departments): ngừng phòng cha không tự ngừng phòng con.
- Người `SCOPED` sửa nháp ngoài phạm vi nhận 403 trước bước kiểm chức danh/phòng ban (bước 5 trước bước 7 trong thứ tự kiểm tra của mục "Cập nhật bản nháp"). Lỗi từng trường (bước 2) vẫn trả trước bước phạm vi như mọi API ghi khác.

**Đồng thời:** dòng chức danh và dòng phòng ban được đọc bằng `SELECT active ... FOR SHARE` trong transaction ghi (mức cô lập mặc định READ COMMITTED). Khóa chia sẻ giữ đến khi tạo/sửa xong, nên `PUT /positions/{id}` hoặc `PUT /departments/{id}` của HR (ví dụ ngừng áp dụng) phải chờ, không thể chen vào giữa lúc kiểm và lúc lưu. Ngược lại, nếu HR đang ngừng áp dụng dở dang, yêu cầu tạo/sửa chờ HR xong rồi dùng giá trị mới: HR commit thì trả `*_INACTIVE`, HR hủy thì lưu bình thường. Nhiều yêu cầu dùng cùng chức danh/phòng ban vẫn chạy song song vì khóa chia sẻ không chặn nhau. `DELETE /departments/{id}` (task 197) khóa dòng phòng ban `FOR UPDATE`: đang có yêu cầu tạo/sửa chọn phòng đó thì lệnh xóa chờ rồi trả 409 `DEPARTMENT_HAS_OPEN_REQUISITIONS`; lệnh xóa chạy trước thì yêu cầu tạo/sửa chờ xóa xong rồi nhận 400 `INVALID_REQUISITION_DEPARTMENT`.

Response của tạo (cũng là cấu trúc của chi tiết, mỗi item trong danh sách và response của sửa):

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "positionId": "00000000-0000-0000-0000-000000000003",
  "departmentId": "00000000-0000-0000-0000-000000000002",
  "headcount": 2,
  "reason": "NEW_HEADCOUNT",
  "proposedSalaryMin": 15000000,
  "proposedSalaryMax": 25000000,
  "salaryJustification": null,
  "neededBy": "2026-12-31",
  "jobDescription": "Phát triển API tuyển dụng.\n\n- Spring Boot\n- PostgreSQL",
  "candidateRequirements": "Tối thiểu 2 năm kinh nghiệm Java.",
  "status": "DRAFT",
  "createdBy": "00000000-0000-0000-0000-000000000001",
  "createdAt": "2026-10-07T08:00:00.123456Z",
  "updatedAt": "2026-10-07T08:00:00.123456Z"
}
```

UUID trong ví dụ chỉ minh họa. Trường chưa nhập có giá trị `null` (khóa vẫn có trong JSON). `createdAt`/`updatedAt` là UTC, độ chính xác micro giây như PostgreSQL lưu; lúc tạo hai giá trị bằng nhau. `proposedSalaryMin`/`proposedSalaryMax` là mức người tạo đề xuất, không phải dải lương chuẩn của chức danh; response không chứa dải chuẩn, nên người không có `SALARY_RANGES_READ_ALL` không thấy được con số của dải chuẩn qua API này (lỗi giải trình của task 247 cũng không chứa con số, xem mục "Giải trình khi dải lương đề xuất ngoài chuẩn").

### Danh sách

`GET /requisitions?status=DRAFT&page=0&size=20` trả các yêu cầu người gọi được xem theo mục "Phạm vi dữ liệu", trả **200**.

| Tham số | Ý nghĩa |
|---|---|
|status|Không bắt buộc. Mã trạng thái đúng chữ hoa; hiện chỉ có `DRAFT`. Bỏ qua (hoặc để rỗng) để lấy mọi trạng thái|
|page|Từ 0, mặc định 0; `page × size` (số dòng bỏ qua) không được vượt 2.147.483.647|
|size|Từ 1 đến 100, mặc định 20|

Response: `{items, page, size, totalElements, totalPages}`; mỗi item có đúng cấu trúc của response tạo ở trên. Sắp xếp yêu cầu tạo sau lên trước (`createdAt` giảm dần, rồi UUID) để phân trang ổn định; sửa bản nháp không đổi vị trí của nó. Trang ngoài phạm vi có `items` rỗng. Người `SCOPED` không phụ trách phòng ban nào nhận `items` rỗng với `totalElements` và `totalPages` bằng 0. Điều kiện phòng ban nằm trong câu truy vấn SQL, nên yêu cầu của phòng ban khác không được đọc ra khỏi database.

`status` sai (ví dụ `draft` chữ thường hoặc `SUBMITTED`), `page`/`size` không phải số nguyên trả 400 `VALIDATION_ERROR` "Tham số đường dẫn hoặc bộ lọc không hợp lệ."; `page` âm, `size` nhỏ hơn 1 hoặc lớn hơn 100, hoặc `page × size` lớn hơn 2.147.483.647 (ví dụ `page=21474837&size=100`) trả 400 `VALIDATION_ERROR` "Trang hoặc số lượng yêu cầu tuyển dụng không hợp lệ.".

### Chi tiết

`GET /requisitions/{id}` trả **200** với cấu trúc như response tạo. UUID không tồn tại trả 404 `REQUISITION_NOT_FOUND`; yêu cầu ngoài phạm vi trả 403 `FORBIDDEN`; `{id}` không phải UUID trả 400 `VALIDATION_ERROR`.

### Cập nhật bản nháp

`PUT /requisitions/{id}` lưu lại bản nháp với nội dung mới, trả **200** cùng yêu cầu sau khi sửa. Body có đúng các trường và quy tắc của `POST` ở trên. `PUT` **thay toàn bộ** nội dung: trường không gửi, gửi `null` hoặc văn bản rỗng/chỉ có khoảng trắng trở thành `null`, nên giao diện phải gửi lại mọi trường đang có trên form. `id`, `status`, `createdBy`, `createdAt` không sửa được (gửi lên là `INVALID_JSON`); `createdBy` và `createdAt` giữ nguyên kể cả khi người sửa không phải người tạo, `updatedAt` là thời điểm sửa (UTC, micro giây).

Chỉ yêu cầu ở trạng thái `DRAFT` được sửa; trạng thái khác trả 409 `REQUISITION_NOT_DRAFT`. Hiện V13 chỉ cho phép `DRAFT` nên lỗi này chưa xảy ra được; nó có hiệu lực khi luồng duyệt thêm trạng thái mới.

Thứ tự kiểm tra:

1. Quyền ở `SecurityConfiguration` (thiếu quyền ghi thì 403 trước khi đọc body); `{id}` không phải UUID trả 400 `VALIDATION_ERROR`.
2. Từng trường riêng lẻ, giống bước 2 của tạo.
3. Khóa tài khoản rồi phiên, kiểm lại quyền (403 nếu vừa mất quyền, 401 `SESSION_INVALID` nếu phiên/tài khoản/token không còn hợp lệ).
4. Khóa dòng yêu cầu (`SELECT ... FOR UPDATE`): không có thì 404 `REQUISITION_NOT_FOUND`.
5. Phạm vi: người `SCOPED` không phụ trách phòng ban hiện tại của yêu cầu thì 403 `FORBIDDEN`. Bước này chạy sau khi đã khóa dòng, nên nếu HR đổi người phụ trách phòng ban trong lúc yêu cầu đang chờ khóa, kết quả dùng người phụ trách mới.
6. Còn là `DRAFT`, nếu không thì 409 `REQUISITION_NOT_DRAFT`.
7. So hai mức lương đề xuất (`REQUISITION_SALARY_RANGE_INVALID`), rồi ngày cần người (`NEEDED_BY_IN_PAST`), rồi chức danh và phòng ban trong body tồn tại và đang áp dụng (`INVALID_REQUISITION_POSITION`, `REQUISITION_POSITION_INACTIVE`, `INVALID_REQUISITION_DEPARTMENT`, `REQUISITION_DEPARTMENT_INACTIVE`), rồi phòng ban trong body thuộc phạm vi người gọi (403 `FORBIDDEN`, task 249), rồi giải trình khi lương đề xuất ngoài dải chuẩn (`SALARY_JUSTIFICATION_REQUIRED`), giống tạo. Kể cả khi body giữ nguyên chức danh/phòng ban của nháp, chúng vẫn phải đang áp dụng, và phòng ban vẫn được kiểm phạm vi lần nữa sau khi bị khóa `FOR SHARE`.

Hai người sửa cùng một bản nháp cùng lúc được xếp hàng nhờ khóa dòng: người đến sau chờ người trước commit rồi ghi đè toàn bộ (người lưu sau cùng thắng). Chưa có kiểm tra phiên bản (optimistic locking), nên giao diện nên tải lại chi tiết trước khi sửa. Mọi lỗi đều không đổi dòng nào.

### Giải trình khi dải lương đề xuất ngoài chuẩn (task 247)

Kết quả Jira: so sánh với dải chuẩn của chức danh và yêu cầu nhập giải trình nếu đề xuất nằm ngoài chuẩn. Quy tắc áp dụng **giống nhau** cho `POST` (tạo) và `PUT` (lưu lại nháp), cho mọi vai trò được ghi (ADMIN, HR_MANAGER và người `SCOPED`).

- **Dải chuẩn** là `salary_min`–`salary_max` hiện tại của chức danh `positionId` trong body (bảng `positions` của V7), lấy qua `SalaryBandService` của task 206. **Hai đầu dải tính là trong chuẩn.** Ví dụ dải chuẩn 15.000.000–25.000.000: đề xuất 15.000.000–25.000.000 không cần giải trình; 14.999.999 hoặc 25.000.001 là ngoài chuẩn. Dải cố định (`salary_min = salary_max`) chỉ nhận đúng một mức đó.
- **Mỗi mức đã nhập được so riêng.** `proposedSalaryMin` hoặc `proposedSalaryMax` thấp hơn `salary_min` hoặc cao hơn `salary_max` là ngoài chuẩn, tính cả phía **thấp hơn** lẫn phía **cao hơn**. Dải đề xuất rộng hơn dải chuẩn (ví dụ 10.000.000–30.000.000) cũng là ngoài chuẩn.
- **Nháp vẫn được nhập một đầu** như task 244: chỉ đầu đã nhập được so. Chưa nhập mức lương nào thì không cần giải trình.
- Ngoài chuẩn mà `salaryJustification` không gửi, `null`, rỗng hoặc chỉ có khoảng trắng: 400 `SALARY_JUSTIFICATION_REQUIRED`, không lưu gì.
- Có giải trình (tối đa 2.000 ký tự, không chứa NUL như trước) thì lưu bình thường, văn bản giữ nguyên như người dùng nhập. Đề xuất trong chuẩn vẫn được nhập giải trình; giải trình đó được lưu, không bị xóa.
- **So ở mỗi lần lưu với dải hiện tại.** Nếu HR thu hẹp dải sau khi nháp đã lưu, `GET` vẫn trả nháp như cũ, nhưng lần `PUT` sau (kể cả gửi nội dung y hệt) phải có giải trình. `PUT` đổi sang chức danh khác thì so với dải của chức danh mới.
- Vì `PUT` thay toàn bộ nội dung, gửi giải trình rỗng trong khi lương vẫn ngoài chuẩn bị từ chối và giải trình đã lưu được giữ nguyên. Đưa lương về trong chuẩn thì xóa được giải trình.

```json
{
  "code": "SALARY_JUSTIFICATION_REQUIRED",
  "message": "Dải lương đề xuất nằm ngoài dải lương chuẩn của chức danh, vui lòng nhập giải trình.",
  "fieldErrors": {
    "salaryJustification": "Dải lương đề xuất nằm ngoài dải lương chuẩn của chức danh, vui lòng nhập giải trình."
  }
}
```

**Không lộ dải chuẩn.** Lời nhắn chỉ nói đề xuất nằm ngoài dải chuẩn: không có con số, không nói thấp hơn hay cao hơn. Response thành công giữ đúng 15 trường như trên, không có `salaryMin`/`salaryMax` của chức danh và không có cờ "ngoài chuẩn". Điều này áp dụng cho mọi người gọi, kể cả HR_MANAGER (người có `SALARY_RANGES_READ_ALL` xem dải chuẩn ở [API chức danh](#api-positions)). Trong code, `RequisitionService` chỉ nhận `BELOW`/`WITHIN`/`ABOVE` từ `SalaryBandService.compare`, không cầm con số của dải. Giới hạn còn lại: chính quy tắc này cho người gọi biết một mức lương cụ thể nằm trong hay ngoài dải (lưu được hay bị đòi giải trình), nên thử nhiều mức có thể dò ra hai đầu dải. Mỗi lần thử lưu được đều tạo hoặc sửa một bản nháp có ghi người tạo và thời điểm, nên việc dò để lại dấu vết. Nếu BA/PO cần chặn hẳn việc này thì phải đổi yêu cầu nghiệp vụ (ví dụ luôn bắt giải trình).

Thứ tự: đây là bước 8 của tạo và phần cuối bước 7 của sửa ở trên, chạy sau mọi bước kiểm khác. Chức danh không tồn tại hoặc đã ngừng áp dụng trả `INVALID_REQUISITION_POSITION`/`REQUISITION_POSITION_INACTIVE` trước, không bao giờ trả 404 `POSITION_NOT_FOUND` hay 409 `POSITION_INACTIVE` của `SalaryBandService`. Giải trình dài hơn 2.000 ký tự là `VALIDATION_ERROR` ở bước 2, không phải `SALARY_JUSTIFICATION_REQUIRED`. Người thiếu quyền, sửa nháp ngoài phạm vi hoặc chọn phòng ban ngoài phạm vi (task 249) nhận 403 trước khi lương được so.

**Đồng thời:** dải chuẩn được đọc sau khi dòng chức danh đã bị khóa `FOR SHARE` (bước 6 của tạo), trong cùng transaction ghi. `PUT /positions/{id}` của HR đổi dải lương phải chờ tạo/sửa nháp xong; ngược lại, nếu HR đang đổi dải dở dang, yêu cầu tạo/sửa chờ HR xong rồi so với dải HR đã commit (HR hủy thì so với dải cũ).

Quyết định của backend (chờ BA/PO xác nhận):

- Ngoài chuẩn tính cả **thấp hơn** dải, không chỉ cao hơn: tiêu chí story ghi "nằm ngoài dải chuẩn".
- Không bắt nhập đủ hai mức lương khi một mức đã có: nháp được lưu dở (task 244). Việc bắt đủ thông tin trước khi gửi duyệt thuộc luồng duyệt sau này.
- Không thêm cờ kiểu `salaryOutsideStandardBand` vào response: giao diện biết qua lỗi 400; cờ phải tính lại ở mỗi `GET`/danh sách vì HR có thể đổi dải sau khi lưu. Nháp đã lưu không được kiểm lại khi HR đổi dải; nó chỉ được kiểm ở lần lưu sau (luồng gửi duyệt sau này nên kiểm lại).

### Ngày cần người không ở quá khứ (task 248)

Kết quả Jira: từ chối ngày cần người trước ngày hiện tại theo múi giờ nghiệp vụ. Quy tắc áp dụng **giống nhau** cho `POST` (tạo) và `PUT` (lưu lại nháp), cho mọi vai trò được ghi (ADMIN, HR_MANAGER và người `SCOPED`).

- **Hôm nay** là ngày hiện tại theo **múi giờ nghiệp vụ** `app.business-zone` (trong `src/main/resources/application.properties`, mặc định `Asia/Ho_Chi_Minh`, tức UTC+7), không phải ngày UTC và không phải múi giờ của JVM (README chạy server với `-Duser.timezone=UTC`). Từ 00:00 đến 07:00 giờ Việt Nam, ngày UTC vẫn là hôm trước. Ví dụ lúc `2026-10-06T17:30:00Z` ở Việt Nam đã là 00:30 ngày 07/10, nên `neededBy = "2026-10-06"` bị từ chối dù theo UTC vẫn đang là ngày 06/10.
- `neededBy` **trước** hôm nay: 400 `NEEDED_BY_IN_PAST`, không lưu gì. **Hôm nay** và mọi ngày sau được phép; không có giới hạn ngày xa nhất (ví dụ `9999-12-31` vẫn lưu được).
- `neededBy` không gửi hoặc `null` vẫn lưu được: nháp được để trống ngày cần người như task 244.
- **So ở mỗi lần lưu với ngày hiện tại.** Nháp lưu hôm qua với ngày cần người là hôm qua: `GET` vẫn trả như cũ, nhưng `PUT` lại (kể cả gửi nội dung y hệt) bị từ chối và dòng giữ nguyên; muốn lưu thì chọn ngày từ hôm nay trở đi hoặc để trống. Nháp đã lưu không tự bị sửa khi qua ngày.
- "Hôm nay" được tính **sau khi đã khóa tài khoản, phiên (và dòng yêu cầu khi sửa)**, không phải lúc request đến. Request gửi lúc 23:59:59 nhưng phải chờ **các khóa này** tới sau 00:00 thì so với ngày mới.
- Giới hạn sát nửa đêm: ngày được so **trước** khi khóa `FOR SHARE` dòng chức danh và phòng ban (bước 6 của tạo), vì thứ tự lỗi (`NEEDED_BY_IN_PAST` trước lỗi chức danh/phòng ban) được giữ có chủ ý. Nếu request so ngày xong rồi phải chờ khóa chức danh/phòng ban qua 00:00 (ví dụ HR đang sửa đúng chức danh đó bằng `PUT /positions/{id}`), hoặc qua 00:00 trong khoảng ngắn trước khi commit, thì ngày vừa lưu có thể đã sớm hơn hôm nay một ngày tính theo lúc commit. Lần `PUT` sau sẽ bị từ chối nếu ngày đó vẫn ở quá khứ; luồng gửi duyệt sau này nên kiểm lại.

```json
{
  "code": "NEEDED_BY_IN_PAST",
  "message": "Ngày cần người không được trước ngày hôm nay.",
  "fieldErrors": {
    "neededBy": "Ngày cần người không được trước ngày hôm nay."
  }
}
```

Thứ tự: bước 5 của tạo (sau so hai mức lương, trước kiểm chức danh/phòng ban và giải trình lương) và trong bước 7 của sửa (cùng vị trí). Vì vậy ngày ở quá khứ được báo trước cả chức danh không tồn tại, phòng ban đã ngừng áp dụng hay lương ngoài dải chưa có giải trình. Lỗi từng trường (bước 2) vẫn trả trước, và `fieldErrors` của `VALIDATION_ERROR` không có `neededBy`. Ngày sai định dạng hoặc không tồn tại (`31/12/2026`, `2026-02-30`) vẫn là `INVALID_JSON` như trước. Người thiếu quyền hoặc sửa nháp ngoài phạm vi nhận 403, `PUT` UUID không tồn tại nhận 404, trước khi ngày được so. Riêng phòng ban trong body ngoài phạm vi (task 249) được kiểm sau ngày, nên ngày ở quá khứ được báo trước 403 đó.

**Cấu hình.** `app.business-zone` nhận tên múi giờ IANA như `Asia/Ho_Chi_Minh` (hoặc `UTC`, `+07:00`). Tên sai làm ứng dụng dừng ngay khi khởi động thay vì tính sai ngày. Mọi máy chủ chạy backend phải dùng cùng một giá trị. Không cần sửa `.env`. Trong code, `BusinessCalendar.today()` (gói `vn.ttcs.recruitment.common`) đọc `Clock` của ứng dụng rồi đổi sang ngày theo múi giờ này; `RequisitionService` chỉ so `neededBy` với ngày đó. Giao diện nên chặn sẵn ngày trước hôm nay (theo giờ Việt Nam) trên ô chọn ngày, nhưng backend vẫn là nơi kiểm cuối cùng.

Quyết định của backend (chờ BA/PO xác nhận):

- **Hôm nay được phép**: tiêu chí story là "không được ở quá khứ", và Jira ghi "trước ngày hiện tại".
- **Kiểm cả khi sửa nháp có ngày cũ không đổi**: yêu cầu tuyển dụng xin người cho hiện tại và tương lai, giống quy tắc chức danh/phòng ban phải đang áp dụng (task 246) và dải lương hiện tại (task 247). Luồng gửi duyệt sau này nên kiểm lại.
- **Không giới hạn ngày xa nhất** và không bắt nhập ngày khi lưu nháp.
- **Một múi giờ nghiệp vụ chung** cho cả hệ thống (công ty ở Việt Nam), không theo múi giờ của từng người dùng hay trình duyệt.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Body: thiếu `positionId`/`departmentId`/`headcount`/`reason`, số lượng ngoài 1–999, lý do tuyển không phải `REPLACEMENT`/`NEW_HEADCOUNT`, lương âm hoặc vượt 1.000.000.000.000, văn bản quá dài hoặc chứa ký tự NUL; lỗi theo trường nằm trong `fieldErrors`. Tham số: `{id}` không phải UUID, `status`/`page`/`size` sai định dạng, `page` âm, `size` ngoài 1–100, `page × size` vượt 2.147.483.647|
|400|INVALID_JSON|JSON sai; UUID hoặc ngày không đúng định dạng (ví dụ `2026-02-30`); lương hoặc `headcount` không phải số nguyên JSON (ví dụ `1.5`, `"2"`) hoặc vượt 2.147.483.647; `reason` là object/mảng; có trường ngoài hợp đồng|
|400|REQUISITION_SALARY_RANGE_INVALID|`proposedSalaryMin` lớn hơn `proposedSalaryMax`; `fieldErrors.proposedSalaryMax` có lời nhắn cho form|
|400|NEEDED_BY_IN_PAST|`neededBy` trước ngày hôm nay theo múi giờ nghiệp vụ `app.business-zone` (mặc định `Asia/Ho_Chi_Minh`); `fieldErrors.neededBy`|
|400|INVALID_REQUISITION_POSITION|Không có chức danh với `positionId`; `fieldErrors.positionId`|
|400|REQUISITION_POSITION_INACTIVE|Chức danh `positionId` đã ngừng áp dụng (`active = false`); `fieldErrors.positionId`|
|400|INVALID_REQUISITION_DEPARTMENT|Không có phòng ban với `departmentId`; `fieldErrors.departmentId`|
|400|REQUISITION_DEPARTMENT_INACTIVE|Phòng ban `departmentId` đã ngừng áp dụng (`active = false`); `fieldErrors.departmentId`|
|400|SALARY_JUSTIFICATION_REQUIRED|Một mức lương đề xuất đã nhập nằm ngoài dải lương chuẩn của chức danh và `salaryJustification` trống; `fieldErrors.salaryJustification`. Lời nhắn không chứa dải chuẩn|
|401|UNAUTHORIZED hoặc SESSION_INVALID|Thiếu, sai, hết hạn token; phiên bị thu hồi; người gọi bị khóa, kể cả khi điều này xảy ra lúc yêu cầu ghi đang chờ khóa|
|403|FORBIDDEN|Thiếu quyền của thao tác (bảng đầu trang); hoặc người `SCOPED` xem/sửa yêu cầu của phòng ban mình không phụ trách; hoặc người `SCOPED` tạo yêu cầu cho, hay chuyển nháp sang, phòng ban mình không phụ trách (task 249)|
|404|REQUISITION_NOT_FOUND|`GET`/`PUT` với UUID không có yêu cầu nào|
|409|REQUISITION_NOT_DRAFT|`PUT` một yêu cầu không còn ở trạng thái `DRAFT` (chưa xảy ra được, xem trên)|

Ví dụ lỗi dải lương đề xuất ngược:

```json
{
  "code": "REQUISITION_SALARY_RANGE_INVALID",
  "message": "Lương đề xuất tối thiểu không được lớn hơn lương đề xuất tối đa.",
  "fieldErrors": {
    "proposedSalaryMax": "Lương đề xuất tối đa phải lớn hơn hoặc bằng lương đề xuất tối thiểu."
  }
}
```

### Database và phạm vi

Dùng bảng `recruitment_requisitions` của V13 (task 243) và quyền `REQUISITIONS_*` có sẵn từ V3; không thêm migration, không đổi quyền, không cần sửa `.env`. Danh sách lọc theo chỉ mục `recruitment_requisitions_department_id_idx` và `..._status_idx` của V13. Các phòng ban người gọi phụ trách được tìm bằng một truy vấn đệ quy (`WITH RECURSIVE`) trên `departments.parent_id`; truy vấn dùng `UNION` nên vẫn dừng nếu dữ liệu sửa tay tạo vòng lặp cha–con. Các CHECK và khóa ngoại của V13 vẫn là lớp chặn cuối; API kiểm trước để trả lỗi tiếng Việt thay vì 500. Task 246 cũng không thêm migration: giới hạn 999 người và điều kiện chức danh/phòng ban đang áp dụng chỉ nằm ở API (`RequisitionRequest`, `RequisitionService`). Không có API xóa chức danh; API xóa phòng ban (task 197) không xóa phòng còn yêu cầu tuyển dụng chưa đóng. Dòng đã kiểm được giữ khóa `FOR SHARE` đến khi lưu xong, nên chức danh/phòng ban đã kiểm không bị xóa hay bị ngừng áp dụng trước khi lưu, kể cả bằng SQL tay (lệnh đó phải chờ khóa). Task 247 cũng không thêm migration và không đổi quyền: dải chuẩn đọc từ cột `salary_min`/`salary_max` của V7 qua `SalaryBandService`, giải trình lưu vào cột `salary_justification` có sẵn của V13. Task 248 cũng không thêm migration và không đổi quyền: `needed_by` vẫn là cột `DATE` (không có giờ) của V13; quy tắc phụ thuộc ngày hiện tại nên chỉ API kiểm, không phải CHECK của database (một nháp hợp lệ hôm nay sẽ "sai" vào ngày mai). Task 249 cũng không thêm migration và không đổi quyền: phạm vi phòng ban dùng lại truy vấn đệ quy ở trên với cột `manager_user_id`, `parent_id` của V5 và `department_id` của V13; nó phụ thuộc người gọi và cây phòng ban lúc lưu nên chỉ API kiểm, không phải CHECK hay khóa ngoại.

*Nguồn: `docs/api/requisitions.md` (Sprint 2).*


---

<a id="api-recruitment-catalogs"></a>

## API danh mục tuyển dụng dùng chung

Phạm vi TKNHTTDNB1-228, TKNHTTDNB1-229, TKNHTTDNB1-230 và TKNHTTDNB1-231 (story TKNHTTDNB1-27). URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; mọi response thành công và các lỗi `RECRUITMENT_CATALOG_*` dùng `Cache-Control: no-store`.

Đọc cần `ORGANIZATION_READ_ALL`; ghi cần `ORGANIZATION_WRITE_ALL`. Ma trận hiện tại cấp quyền đọc cho cả sáu vai trò nội bộ (recruiter, người phỏng vấn... cần đọc để chọn giá trị), ghi cho ADMIN và HR_MANAGER. Backend đọc quyền hiện tại trong database ở mỗi yêu cầu; cách kiểm lại quyền khi ghi ở mục [Quyền quản lý danh mục](#quyền-quản-lý-danh-mục).

### Loại danh mục

Bốn loại dùng chung một API, phân biệt bằng `{type}` trong URL. `{type}` là tên chính xác, viết hoa, phân biệt hoa/thường (giống tên role ở API vai trò tài khoản):

| `{type}` | Ý nghĩa | Ví dụ giá trị |
|---|---|---|
|`CANDIDATE_SOURCE`|Nguồn ứng viên|LinkedIn, Nhân viên giới thiệu|
|`REJECTION_REASON`|Lý do loại hồ sơ|Chưa phù hợp kỹ năng|
|`WORK_LOCATION`|Địa điểm làm việc|Hà Nội|
|`EMPLOYMENT_TYPE`|Hình thức làm việc|Toàn thời gian|

Loại khác (kể cả `candidate_source`, `candidate-sources`) trả **404** `RECRUITMENT_CATALOG_TYPE_NOT_FOUND`, thông báo liệt kê bốn loại hợp lệ. Database không seed sẵn giá trị nào; Trưởng phòng Nhân sự tự khai báo.

### Tạo và sửa

`POST /recruitment-catalogs/{type}/items` tạo giá trị trong loại danh mục, trả **201**. `PUT /recruitment-catalogs/{type}/items/{id}` thay thế mã, tên và trạng thái của giá trị có UUID tương ứng, trả **200**.

```json
{
  "code": "LINKEDIN",
  "name": "LinkedIn",
  "active": true
}
```

| Trường | Quy tắc |
|---|---|
|code|Bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 50 ký tự; duy nhất **trong cùng loại danh mục**, phân biệt hoa/thường (`OTHER` khác `other`). Cùng mã `OTHER` có thể có ở hai loại khác nhau|
|name|Tên hiển thị; bắt buộc, bỏ khoảng trắng đầu/cuối, tối đa 255 ký tự|
|active|Boolean bắt buộc; false nghĩa là ngừng dùng giá trị này|

Body không có `type` và `sortOrder`:

- Loại danh mục lấy từ URL. PUT không chuyển được giá trị sang loại khác; gọi PUT với `{type}` khác loại của giá trị trả 404 `RECRUITMENT_CATALOG_ITEM_NOT_FOUND`.
- `sortOrder` (thứ tự hiển thị) do server gán: giá trị mới được xếp **cuối** loại danh mục, bằng `sortOrder` lớn nhất hiện có trong loại (tính cả giá trị đã ngừng dùng) cộng 1, hoặc 0 nếu loại chưa có giá trị. PUT giữ nguyên `sortOrder`. Muốn đổi thứ tự hiển thị thì dùng [API sắp xếp](#sắp-xếp-thứ-tự-hiển-thị).

Gửi thêm trường ngoài hợp đồng như `id`, `type`, `sortOrder`, `createdAt` bị từ chối với HTTP 400 `INVALID_JSON`. PUT phải gửi đủ ba trường; giữ nguyên mã của chính giá trị đang sửa không bị coi là trùng.

Response của tạo/sửa và `GET /recruitment-catalogs/{type}/items/{id}`:

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "type": "CANDIDATE_SOURCE",
  "code": "LINKEDIN",
  "name": "LinkedIn",
  "sortOrder": 0,
  "active": true,
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T08:00:00Z"
}
```

UUID trong ví dụ chỉ minh họa. `createdAt` giữ nguyên khi sửa; `updatedAt` là thời điểm ghi gần nhất (UTC, độ chính xác micro giây như PostgreSQL lưu).

### Danh sách

`GET /recruitment-catalogs/{type}/items?active=true`

| Tham số | Ý nghĩa |
|---|---|
|active|true/false; bỏ qua để lấy cả hai trạng thái. Màn hình chọn giá trị (ví dụ chọn nguồn ứng viên) nên dùng `active=true`|

Response là **mảng JSON** chứa toàn bộ giá trị của loại đó, mỗi phần tử có cấu trúc như chi tiết ở trên; loại chưa có giá trị trả `[]`. Danh mục ngắn nên không phân trang. Thứ tự: `sortOrder` tăng dần; cùng `sortOrder` thì theo `name` (so sánh theo collation của cơ sở dữ liệu); cùng cả tên thì theo `code` (mã không trùng trong một loại nên thứ tự luôn cố định). Hai yêu cầu tạo cùng lúc trong một loại có thể nhận cùng `sortOrder` (V10 cho phép); khi đó danh sách xếp chúng theo tên. Sau một lần [sắp xếp](#sắp-xếp-thứ-tự-hiển-thị) mọi `sortOrder` đều khác nhau nên danh sách theo đúng thứ tự đã lưu.

### Sắp xếp thứ tự hiển thị

`PUT /recruitment-catalogs/{type}/order` lưu thứ tự mới cho **toàn bộ** giá trị của một loại danh mục, trả **200**.

```json
{
  "itemIds": [
    "00000000-0000-0000-0000-000000000012",
    "00000000-0000-0000-0000-000000000010",
    "00000000-0000-0000-0000-000000000011"
  ]
}
```

| Trường | Quy tắc |
|---|---|
|itemIds|Mảng UUID bắt buộc, giá trị đứng đầu mảng hiển thị đầu tiên. Phải gồm **đúng mọi** giá trị hiện có của loại trong URL, kể cả giá trị đã ngừng dùng (`active=false`), mỗi giá trị đúng một lần|

- Server gán `sortOrder` theo vị trí trong mảng: 0, 1, 2... Khoảng trống (do xóa) và các số trùng nhau (do hai yêu cầu tạo cùng lúc) được đánh số lại liền nhau. Giá trị tạo sau đó vẫn xếp cuối (`sortOrder` lớn nhất cộng 1).
- Chỉ giá trị có `sortOrder` thay đổi mới đổi `updatedAt`; gửi lại đúng thứ tự đang lưu không đổi dòng nào. `code`, `name`, `active`, `createdAt` giữ nguyên.
- Response là mảng JSON chứa mọi giá trị của loại theo thứ tự vừa lưu, cùng cấu trúc với danh sách. Sau đó `GET .../items` trả đúng thứ tự này (bộ lọc `active` giữ nguyên thứ tự). Loại chưa có giá trị nhận `{"itemIds": []}` và trả `[]`.
- Thiếu giá trị, thừa UUID không tồn tại, UUID thuộc loại danh mục khác, mảng rỗng khi loại đã có giá trị, hoặc một UUID lặp lại: **400** `RECRUITMENT_CATALOG_ORDER_MISMATCH`, không lưu gì. Thường gặp khi người khác vừa thêm/xóa giá trị; giao diện nên tải lại danh sách rồi cho sắp xếp lại.
- Thiếu `itemIds` hoặc có phần tử `null`: 400 `VALIDATION_ERROR` (`fieldErrors.itemIds` hoặc `fieldErrors.itemIds[0]`...). UUID sai định dạng, `itemIds` không phải mảng hoặc có trường khác như `sortOrder`: 400 `INVALID_JSON`.

Mọi thay đổi của một lần sắp xếp nằm trong một transaction: lưu hết hoặc không lưu gì. Backend khóa mọi giá trị của loại danh mục (theo thứ tự UUID) trước khi so danh sách, nên hai yêu cầu sắp xếp cùng loại tại cùng thời điểm chạy lần lượt: yêu cầu sau chờ yêu cầu trước commit rồi ghi đè bằng toàn bộ thứ tự của nó, không bao giờ trộn hai thứ tự. Nếu một giá trị bị xóa trong lúc yêu cầu sắp xếp đang chờ, yêu cầu đó nhận 400 vì danh sách đã cũ. Sửa (PUT) và xóa một giá trị cũng khóa dòng đó, nên không ghi đè lẫn nhau với việc sắp xếp.

### Xóa

`DELETE /recruitment-catalogs/{type}/items/{id}` xóa hẳn giá trị có UUID tương ứng trong loại danh mục của URL. Không có body.

- Thành công: **204**, body rỗng, `Cache-Control: no-store`. Giá trị biến mất khỏi danh sách và `GET` chi tiết trả 404; các giá trị còn lại giữ nguyên `sortOrder` (không tự dồn số). Mã của giá trị đã xóa được dùng lại cho giá trị mới.
- Giá trị **đang được tham chiếu** (một dòng dữ liệu khác, ví dụ hồ sơ ứng viên lưu nguồn ứng viên này, còn trỏ tới nó): **409** `RECRUITMENT_CATALOG_ITEM_IN_USE`, không xóa gì. Kể cả giá trị đã ngừng dùng (`active=false`) vẫn bị chặn nếu còn tham chiếu.

```json
{
  "code": "RECRUITMENT_CATALOG_ITEM_IN_USE",
  "message": "Giá trị danh mục đang được dữ liệu khác sử dụng nên không thể xóa. Hãy chuyển giá trị sang ngừng sử dụng (active = false)."
}
```

Muốn bỏ một giá trị đang được dùng thì PUT với `active=false`: dữ liệu cũ giữ nguyên tên gọi, màn hình chọn giá trị mới (`active=true`) không còn hiện giá trị đó. Xóa chỉ dành cho giá trị nhập nhầm hoặc chưa từng được dùng.

Backend không đếm tham chiếu trước, mà để PostgreSQL kiểm khóa ngoại khi xóa rồi đổi lỗi khóa ngoại thành 409. Cách này đúng với mọi bảng tham chiếu tới danh mục, kể cả bảng thêm sau, và đúng cả khi một yêu cầu khác vừa lưu tham chiếu tới giá trị đó cùng lúc: yêu cầu xóa chờ yêu cầu kia kết thúc, rồi trả 409 nếu tham chiếu đã được lưu hoặc 204 nếu yêu cầu kia bị hủy. Hiện chưa có bảng nào tham chiếu tới danh mục nên mọi giá trị đều xóa được; quy tắc cho bảng tham chiếu sau này ở tài liệu database (`docs/database/README.md` trong repo Backend).

### Quyền quản lý danh mục

Tạo, sửa, xóa và sắp xếp giá trị cần mã quyền `ORGANIZATION_WRITE_ALL`; theo V3 chỉ ADMIN và HR_MANAGER có mã này. Backend kiểm theo **mã quyền** trong database, không theo tên vai trò. Quyền được kiểm ở hai lớp:

1. `SecurityConfiguration`: POST `/items`, PUT `/items/{id}`, DELETE `/items/{id}` và PUT `/order` cần `PERM_ORGANIZATION_WRITE_ALL`. Thiếu quyền thì trả 403 `FORBIDDEN` trước khi vào service.
2. `RecruitmentCatalogService` kiểm lại bên trong transaction ghi:
   - Đầu tiên khóa tài khoản người gọi rồi khóa phiên, sau đó kiểm tài khoản còn được truy cập, access token và phiên chưa hết hạn, quyền vẫn còn trong database. Bước này chạy trước khi đụng tới bất kỳ giá trị danh mục nào, nên người đã mất quyền không khóa được giá trị nào.
   - Sửa và xóa khóa thêm giá trị sẽ đổi; sắp xếp khóa mọi giá trị của loại. Nếu một yêu cầu ghi khác đang giữ giá trị đó thì yêu cầu này phải chờ. Lấy được khóa xong, service kiểm lại hạn token, phiên và quyền rồi mới xử lý tiếp, kể cả việc trả 404 khi giá trị không còn. Tạo mới không khóa giá trị có sẵn nên chỉ có lần kiểm ở bước trên.

| Tình huống | Kết quả |
|---|---|
|RECRUITER, HIRING_MANAGER, INTERVIEWER hoặc APPROVER (mặc định không có `ORGANIZATION_WRITE_ALL`) gọi API ghi|403 `FORBIDDEN`, database không đổi; vẫn đọc được danh mục|
|Quyền bị gỡ khỏi vai trò (xóa dòng `role_permissions`) trong lúc yêu cầu ghi đang chờ khóa|403 `FORBIDDEN`, không lưu gì|
|Access token hết hạn trong lúc yêu cầu ghi đang chờ khóa|401 `SESSION_INVALID`, không lưu gì|
|Admin gỡ vai trò của người gọi bằng `DELETE /accounts/{id}/roles/{role}` trong lúc yêu cầu ghi của người đó đang chạy|API vai trò cũng khóa tài khoản đó nên phải chờ yêu cầu ghi xong. Yêu cầu ghi đang chạy hoàn tất theo quyền đã kiểm; từ yêu cầu kế tiếp (cùng token) người đó nhận 403|
|Cấp thêm `ORGANIZATION_WRITE_ALL` cho vai trò khác (thêm dòng `role_permissions`)|Người có vai trò đó ghi được ngay từ yêu cầu kế tiếp, không cần đăng nhập lại|

Giới hạn hiện tại (giống service phòng ban và chức danh): sau khi lệnh ghi cuối cùng đã gửi xuống, PostgreSQL có thể còn phải chờ một transaction khác đang ghi cùng mã (ràng buộc mã duy nhất) hoặc đang lưu tham chiếu tới giá trị bị xóa (khóa ngoại). Sau lần chờ này service không kiểm lại quyền lần nữa.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu/sai trường, UUID hoặc tham số `active` không phải true/false|
|400|INVALID_JSON|JSON sai hoặc có trường ngoài hợp đồng (kể cả `type`, `sortOrder`); UUID trong `itemIds` sai định dạng|
|400|RECRUITMENT_CATALOG_ORDER_MISMATCH|`itemIds` của PUT `/order` không đúng bằng các giá trị hiện có của loại danh mục (thiếu, thừa, khác loại hoặc lặp)|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token (kể cả hết hạn trong lúc yêu cầu ghi chờ khóa: `SESSION_INVALID`); phiên thu hồi; người gọi bị khóa|
|403|FORBIDDEN|Thiếu quyền tổ chức tương ứng, kể cả khi quyền bị gỡ trong lúc yêu cầu ghi chờ khóa|
|404|RECRUITMENT_CATALOG_TYPE_NOT_FOUND|`{type}` không phải một trong bốn loại ở trên|
|404|RECRUITMENT_CATALOG_ITEM_NOT_FOUND|Không có giá trị với UUID này trong loại danh mục của URL|
|409|RECRUITMENT_CATALOG_CODE_EXISTS|Mã đã được giá trị khác trong cùng loại dùng, kể cả khi hai yêu cầu ghi cùng mã đồng thời|
|409|RECRUITMENT_CATALOG_ITEM_IN_USE|DELETE giá trị còn được dữ liệu khác tham chiếu|

Body được kiểm trước loại danh mục: POST/PUT (kể cả PUT `/order`) với `{type}` sai và body thiếu trường trả 400, không phải 404.

### Database và phạm vi

Dùng bảng `recruitment_catalog_items` của V10 và quyền ORGANIZATION của V3; task 228, 229, 230 và 231 không thêm migration hoặc thay `.env`. Task 231 không đổi URL, mã quyền hay hợp đồng request/response, chỉ thêm bước kiểm lại quyền sau khi chờ khóa giá trị. Sắp xếp chỉ ghi cột `sort_order` và `updated_at`.

*Nguồn: `docs/api/recruitment-catalogs.md` (Sprint 2).*


---

<a id="api-company-profile"></a>

## API trang giới thiệu công ty

Phạm vi TKNHTTDNB1-237 (nội dung trang) và TKNHTTDNB1-238 (tải ảnh, logo), story S2-09 (TKNHTTDNB1-28). URL dùng tiền tố `/api/v1`. Mọi response JSON thành công và các lỗi `COMPANY_*`, `INVALID_COMPANY_*`, `UNSUPPORTED_COMPANY_MEDIA_TYPE`, `FILE_TOO_LARGE` dùng `Cache-Control: no-store`; riêng byte ảnh của API ảnh công khai được phép cache (mục [Xem ảnh](#xem-ảnh)).

| API | Công dụng | Quyền |
|---|---|---|
|`GET /company-profile`|HR mở trình soạn: đọc nội dung đã lưu|`JOB_POSTINGS_WRITE_ALL`|
|`PUT /company-profile`|Lưu (lần đầu là tạo) toàn bộ nội dung trang|`JOB_POSTINGS_WRITE_ALL`|
|`POST /company-profile/preview`|Xem trước đúng như trang công khai, **không lưu**|`JOB_POSTINGS_WRITE_ALL`|
|`GET /public/company-profile`|Cổng tuyển dụng hiển thị trang cho ứng viên|Công khai, không cần token|
|`POST /company-profile/media`|Tải lên một logo hoặc ảnh giới thiệu (`multipart/form-data`)|`JOB_POSTINGS_WRITE_ALL`|
|`GET /company-profile/media/{id}`|Trình soạn và xem trước lấy byte của bất kỳ ảnh đã tải nào|`JOB_POSTINGS_WRITE_ALL`|
|`GET /public/company-media/{id}`|Cổng tuyển dụng lấy byte ảnh mà trang đã lưu đang dùng|Công khai, không cần token|

Các API `/company-profile...` gửi `Authorization: Bearer <accessToken>`. Ma trận hiện tại cấp `JOB_POSTINGS_WRITE_ALL` cho ADMIN và HR_MANAGER. RECRUITER chỉ có `JOB_POSTINGS_WRITE_SCOPED` (tin tuyển dụng của vị trí được phân công) nên bị 403: trang giới thiệu dùng chung cho cả công ty, không có phạm vi phân công. HIRING_MANAGER, APPROVER có `JOB_POSTINGS_READ_ALL` nhưng cũng không đọc được bản trong trình soạn; họ xem trang qua API công khai như ứng viên. Backend đọc quyền hiện tại trong database ở mỗi yêu cầu; khi lưu trang hoặc tải ảnh, service khóa tài khoản người gọi rồi phiên, sau đó kiểm lại trạng thái, phiên, hạn JWT và quyền.

Hai API `/public/...` không cần token. Giống `GET /health`, nếu gửi kèm Bearer hỏng hoặc hết hạn thì bộ lọc bảo mật vẫn trả 401, nên cổng tuyển dụng nên gọi các API này **không** kèm header `Authorization`.

### Lưu nội dung

`PUT /company-profile` thay thế toàn bộ nội dung, trả **200** cả khi tạo lần đầu lẫn khi sửa. Hệ thống chỉ có một trang (một dòng `id = 1` của V11). Lưu xong, trang công khai đổi ngay; không có bản nháp riêng, muốn kiểm tra trước thì dùng xem trước.

```json
{
  "companyName": "Công ty TTCS",
  "tagline": "Nơi phát triển tài năng",
  "introduction": "Chúng tôi xây dựng phần mềm.\n\n- Làm việc linh hoạt\n- Đào tạo hằng năm",
  "logoMediaId": "00000000-0000-0000-0000-000000000011",
  "imageIds": [
    "00000000-0000-0000-0000-000000000012",
    "00000000-0000-0000-0000-000000000013"
  ]
}
```

| Trường | Quy tắc |
|---|---|
|companyName|Bắt buộc, tối đa 255 ký tự, một dòng|
|tagline|Khẩu hiệu, tùy chọn, tối đa 255 ký tự, một dòng; null, bỏ trường hoặc toàn khoảng trắng đều lưu thành null|
|introduction|Bắt buộc, tối đa 20.000 ký tự; được xuống dòng và dùng tab|
|logoMediaId|UUID ảnh đã tải lên với loại `LOGO`; null hoặc bỏ trường nghĩa là không có logo|
|imageIds|Danh sách UUID ảnh đã tải lên với loại `IMAGE`, theo thứ tự hiển thị (phần tử đầu hiện trước); tối đa 10 ảnh, không lặp, không có phần tử null; null hoặc bỏ trường nghĩa là không có ảnh|

Cả ba trường chữ được bỏ mọi loại khoảng trắng ở đầu/cuối, kể cả khoảng trắng không ngắt (`U+00A0`) và khoảng trắng toàn khổ (`U+3000`). Trong `introduction`, xuống dòng kiểu Windows (`\r\n`) hoặc `\r` được đổi thành `\n`; các dòng trống ở giữa được giữ nguyên. Độ dài tính theo đơn vị UTF-16 của Java, nên một emoji có thể được tính là 2 ký tự.

PUT phải gửi đủ nội dung muốn giữ: trường bỏ trống được hiểu là xóa (ví dụ bỏ `imageIds` sẽ xóa hết ảnh khỏi trang). Nên `GET /company-profile` trước rồi gửi lại các giá trị muốn giữ. Bỏ một ảnh khỏi trang không xóa ảnh trong database. Trường ngoài hợp đồng như `createdAt`, `updatedBy` bị từ chối với HTTP 400 `INVALID_JSON`.

Response của PUT và `GET /company-profile` (dữ liệu cho trình soạn; tên trường nội dung giống body của PUT):

```json
{
  "companyName": "Công ty TTCS",
  "tagline": "Nơi phát triển tài năng",
  "introduction": "Chúng tôi xây dựng phần mềm.\n\n- Làm việc linh hoạt\n- Đào tạo hằng năm",
  "logoMediaId": "00000000-0000-0000-0000-000000000011",
  "imageIds": ["00000000-0000-0000-0000-000000000012", "00000000-0000-0000-0000-000000000013"],
  "createdAt": "2026-10-07T08:00:00Z",
  "updatedAt": "2026-10-07T09:30:00Z",
  "updatedBy": "00000000-0000-0000-0000-000000000001"
}
```

UUID trong ví dụ chỉ minh họa. `createdAt` là lần lưu đầu, giữ nguyên khi sửa; `updatedAt` là lần lưu gần nhất (UTC, độ chính xác micro giây như PostgreSQL lưu); `updatedBy` là tài khoản lưu gần nhất. Trước lần lưu đầu, `GET /company-profile` trả **404** `COMPANY_PROFILE_NOT_FOUND`; trình soạn hiển thị form trống.

Hai người lưu cùng lúc được xử lý lần lượt (khóa advisory của PostgreSQL), kể cả lần lưu đầu tiên; cả hai đều nhận 200 và nội dung của người lưu sau cùng được giữ. Chưa có kiểm tra phiên bản để báo "trang đã bị người khác sửa".

### Chỉ nhận văn bản thuần, không nhận HTML

Nội dung là văn bản thuần (có thể viết kiểu Markdown đơn giản như `- ý`, dòng trống giữa các đoạn), **không phải HTML**, để tránh stored XSS trên cổng tuyển dụng. Backend từ chối với 400 `VALIDATION_ERROR` khi:

- có `<` đứng **ngay trước** chữ cái Latin, `/`, `!` hoặc `?`, tức là thứ trình duyệt hiểu là thẻ, thẻ đóng, chú thích hoặc khai báo HTML: `<b>`, `</p>`, `<!-- -->`, `<?xml`, `<img src=x onerror=...>`;
- có ký tự điều khiển (ví dụ ký tự NUL). `introduction` chỉ được dùng xuống dòng `\n` và tab; `companyName`, `tagline` phải nằm trên một dòng, không có tab;
- có ký tự ngắt dòng/ngắt đoạn Unicode `U+2028`, `U+2029` (ở cả ba trường, vì xuống dòng duy nhất được lưu là `\n`);
- có ký tự điều khiển hướng chữ (bidi) `U+202A`–`U+202E`, `U+2066`–`U+2069`, vốn làm chữ hiện ra theo thứ tự khác với thứ tự đã gõ. Dấu hướng `U+200E`, `U+200F` vẫn được nhận;
- không có ký tự nào nhìn thấy được, ví dụ chỉ gồm khoảng trắng độ rộng 0 (`U+200B`), `U+2060` hoặc `U+FEFF`: trang công khai sẽ hiện tên hoặc nội dung trống. Khẩu hiệu chỉ gồm khoảng trắng thường được lưu thành null, nhưng khẩu hiệu chỉ gồm ký tự vô hình như vậy bị từ chối. Ký tự định dạng vô hình nằm giữa chữ thì vẫn được giữ (ví dụ `U+200D` ghép emoji gia đình 👨‍👩‍👧);
- có nửa emoji đứng lẻ (UTF-16 surrogate lẻ, chỉ gửi được bằng escape JSON), vì không lưu đúng nguyên văn được.

Các dạng sau vẫn hợp lệ vì trình duyệt không coi là HTML: `lương < 20 triệu`, `5 <= 10`, `<3`, `&lt;script&gt;` (được giữ nguyên là chữ). Vì vậy không viết liên kết dạng `<https://...>`; hãy ghi thẳng địa chỉ.

Frontend vẫn phải hiển thị nội dung như văn bản (`{{ }}`/`textContent`, không dùng `v-html`/`innerHTML`). Nếu sau này dùng thư viện Markdown, phải tắt HTML thô và chặn liên kết `javascript:`; backend không kiểm tra cú pháp Markdown.

### Xem trước

`POST /company-profile/preview` nhận body giống hệt PUT, kiểm tra dữ liệu giống hệt PUT (cùng lỗi 400) và trả **200** với đúng cấu trúc của `GET /public/company-profile`. API này **không ghi gì** vào database: không tạo/sửa trang, không đổi `updatedAt`, trang công khai giữ nguyên. Backend dùng chung một hàm dựng kết quả cho xem trước và trang công khai, nên nội dung đã xem trước, sau khi PUT, sẽ hiển thị y hệt cho ứng viên.

### Trang công khai

`GET /public/company-profile` trả nội dung đã lưu, chỉ gồm các trường được công khai, không có `createdAt`, `updatedAt`, `updatedBy`:

```json
{
  "companyName": "Công ty TTCS",
  "tagline": "Nơi phát triển tài năng",
  "introduction": "Chúng tôi xây dựng phần mềm.\n\n- Làm việc linh hoạt\n- Đào tạo hằng năm",
  "logo": {
    "id": "00000000-0000-0000-0000-000000000011",
    "width": 400,
    "height": 200,
    "url": "/api/v1/public/company-media/00000000-0000-0000-0000-000000000011"
  },
  "images": [
    {
      "id": "00000000-0000-0000-0000-000000000012",
      "width": 800,
      "height": 600,
      "url": "/api/v1/public/company-media/00000000-0000-0000-0000-000000000012"
    }
  ]
}
```

`tagline` và `logo` có thể là `null`; `images` có thể là mảng rỗng và luôn theo thứ tự hiển thị. `width`/`height` là kích thước pixel của ảnh, giúp giao diện giữ chỗ trước khi ảnh tải xong. `url` là đường dẫn lấy byte ảnh (mục [Xem ảnh](#xem-ảnh)). Xem trước trả cùng cấu trúc nên ảnh chưa lưu cũng có `url`, nhưng `url` đó chỉ mở được sau khi lưu trang. Trước lần lưu đầu, API trả **404** `COMPANY_PROFILE_NOT_FOUND`; cổng tuyển dụng nên ẩn mục giới thiệu hoặc hiện nội dung mặc định.

### Ảnh và logo

#### Tải ảnh lên

`POST /company-profile/media` nhận `multipart/form-data` (giống form có `<input type="file">`) với hai trường, trả **201**:

| Trường form | Quy tắc |
|---|---|
|file|Bắt buộc, một tệp ảnh JPG hoặc PNG, tối đa 5 MB (5.242.880 byte) và 6000 x 6000 pixel|
|kind|Bắt buộc, viết hoa đúng như sau: `LOGO` (để dùng làm `logoMediaId`) hoặc `IMAGE` (để dùng trong `imageIds`)|

```json
{
  "id": "00000000-0000-0000-0000-000000000011",
  "kind": "LOGO",
  "contentType": "image/png",
  "sizeBytes": 18234,
  "width": 400,
  "height": 200,
  "url": "/api/v1/public/company-media/00000000-0000-0000-0000-000000000011"
}
```

Backend kiểm tệp theo thứ tự:

1. **Dung lượng.** Tệp trên 5 MB bị chặn ngay khi server đọc request, trước khi vào controller: 413 `FILE_TOO_LARGE`. Giới hạn nằm trong `application.properties` (`spring.servlet.multipart.max-file-size=5MB`, `max-request-size=6MB`). Request trên 6 MB (ví dụ ảnh điện thoại 7-12 MB) bị từ chối ngay từ `Content-Length`, trước khi đọc body; `server.tomcat.max-swallow-size=20MB` cho Tomcat đọc bỏ phần body còn lại để client vẫn nhận đủ JSON 413. Request trên khoảng 20 MB thì Tomcat đóng kết nối: client gặp lỗi mạng (`fetch` ném `TypeError`), **không** có JSON 413. Vì vậy frontend phải kiểm `file.size <= 5 * 1024 * 1024` trước khi gửi và tự báo lỗi; 413 từ server chỉ là lớp chặn cuối.
2. **Loại tệp theo nội dung.** Backend đọc các byte đầu của tệp: PNG bắt đầu bằng `89 50 4E 47 0D 0A 1A 0A`, JPG bằng `FF D8 FF`. Tên tệp và `Content-Type` trình duyệt gửi **không** được tin. GIF, BMP, WebP, SVG, HTML hoặc tệp chữ đổi đuôi thành `.png` bị từ chối: 400 `UNSUPPORTED_COMPANY_MEDIA_TYPE`. SVG bị từ chối vì có thể chứa script.
3. **Kích thước pixel, trước khi giải mã.** Chiều rộng/cao được đọc từ phần đầu tệp; quá 6000 pixel ở một chiều bị từ chối: 400 `COMPANY_MEDIA_DIMENSIONS_TOO_LARGE`. Nhờ vậy một tệp nhỏ khai là ảnh khổng lồ ("bom giải nén") không làm đầy bộ nhớ server.
4. **Giải mã toàn bộ ảnh** bằng Java ImageIO. Tệp bị cắt, bị hỏng, hoặc chỉ có chữ ký ảnh rồi tới nội dung khác (ví dụ HTML) bị từ chối: 400 `INVALID_COMPANY_MEDIA`. Khi giải mã, server chỉ giữ khoảng 1000 x 1000 điểm ảnh trong bộ nhớ, kể cả với ảnh 6000 x 6000.

Thiếu `kind`, `kind` sai (ví dụ `logo` viết thường), thiếu `file` hoặc tệp rỗng trả 400 `VALIDATION_ERROR`. Gửi JSON thay cho `multipart/form-data` trả **415** với body lỗi mặc định của Spring Boot (không theo dạng `{code, message}`).

Ảnh hợp lệ được lưu nguyên byte gốc vào bảng `company_media` cùng loại (`kind`), kiểu nội dung (`contentType`, lấy từ nội dung tệp), số byte, chiều rộng/cao, thời điểm và người tải. Ảnh không bao giờ bị sửa sau khi tải; muốn thay logo thì tải ảnh mới rồi lưu trang với `logoMediaId` mới. Ảnh không còn dùng vẫn nằm trong database (chưa có API xóa ảnh hay cơ chế dọn ảnh thừa). Backend không mã hóa lại ảnh nên không xóa metadata trong tệp, ví dụ vị trí GPS của ảnh chụp bằng điện thoại; HR nên kiểm ảnh trước khi đưa lên trang công khai.

Tải ảnh **chưa** đưa ảnh lên trang. Ứng viên chỉ thấy ảnh sau khi `PUT /company-profile` lưu ID ảnh vào `logoMediaId` hoặc `imageIds`. Logo phải là ảnh `kind = LOGO`, ảnh giới thiệu phải là ảnh `kind = IMAGE`; ảnh không tồn tại hoặc sai loại bị từ chối ở cả PUT lẫn xem trước (400 `INVALID_COMPANY_LOGO` hoặc `INVALID_COMPANY_IMAGE`), trước khi chạm tới khóa ngoại của V11.

Ví dụ trên trình duyệt:

```js
const file = fileInput.files[0];
if (file.size > 5 * 1024 * 1024) {
  // Kiểm trước khi gửi: tệp quá lớn có thể làm server đóng kết nối thay vì trả 413.
  throw new Error("Ảnh tải lên tối đa 5 MB.");
}
const form = new FormData();
form.append("kind", "LOGO");
form.append("file", file);
const response = await fetch(`${apiBase}/api/v1/company-profile/media`, {
  method: "POST",
  // Không tự đặt Content-Type: trình duyệt tự thêm multipart/form-data kèm boundary.
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
```

Khi tải ảnh, service kiểm tệp trước, rồi khóa tài khoản người gọi, phiên và lấy advisory lock của trang giống khi lưu, sau đó kiểm lại trạng thái, phiên, hạn JWT và quyền rồi mới ghi ảnh.

#### Xem ảnh

| API | Dùng cho | Trả ảnh nào | Cache |
|---|---|---|---|
|`GET /company-profile/media/{id}`|Trình soạn và màn hình xem trước (`JOB_POSTINGS_WRITE_ALL`)|Mọi ảnh đã tải, kể cả ảnh chưa lưu vào trang|`no-store`|
|`GET /public/company-media/{id}`|Cổng tuyển dụng, không cần token|Chỉ ảnh đang là logo hoặc ảnh giới thiệu của trang đã lưu|`max-age=3600, public` kèm `ETag`|

Cả hai trả **200** với byte ảnh gốc và các header:

- `Content-Type`: `image/png` hoặc `image/jpeg` đã lưu;
- `X-Content-Type-Options: nosniff`: trình duyệt không được tự đoán kiểu khác (ví dụ HTML) từ nội dung;
- `Content-Security-Policy: default-src 'none'; sandbox`: kể cả khi mở ảnh trực tiếp trong tab, trang đó không tải thêm gì và không chạy script.

Ảnh không tồn tại trả 404 `COMPANY_MEDIA_NOT_FOUND`; ID không phải UUID trả 400 `VALIDATION_ERROR`.

**Quyết định: ảnh chỉ công khai khi trang đã lưu đang dùng.** API công khai trả 404 `COMPANY_MEDIA_NOT_FOUND` cho ảnh vừa tải nhưng chưa lưu vào trang và cho ảnh đã bị bỏ khỏi trang, giống hệt ảnh không tồn tại. Như vậy HR thử ảnh trong trình soạn mà ứng viên không thấy, và bỏ một ảnh khỏi trang là ảnh đó thôi công khai. Vì ảnh công khai được cache 1 giờ, trình duyệt hoặc proxy đã tải ảnh có thể còn hiển thị ảnh tối đa 1 giờ sau khi ảnh bị bỏ khỏi trang. Hết 1 giờ, trình duyệt hỏi lại kèm `If-None-Match`: ảnh vẫn được dùng thì nhận **304** không có body, ảnh đã bị bỏ thì nhận 404.

`url` (trong response tải ảnh, trong `logo`/`images` của trang công khai và của xem trước) là đường dẫn tương đối của API ảnh công khai, chưa có địa chỉ server. Frontend ghép với địa chỉ API đang dùng, ví dụ `http://localhost:8080` + `url`, rồi đặt vào `<img src>` của trang công khai. Thẻ `<img>` không gửi được header `Authorization`, nên trình soạn và màn hình xem trước (có thể chứa ảnh chưa lưu) tải ảnh qua `GET /company-profile/media/{id}` bằng `fetch` kèm token, rồi hiển thị bằng `URL.createObjectURL(blob)`.

`width`/`height` là kích thước ghi trong tệp. Ảnh JPG chụp bằng điện thoại có thể kèm thông tin xoay (EXIF); khi đó trình duyệt có thể hiển thị ảnh xoay 90° so với `width`/`height`.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|VALIDATION_ERROR|Thiếu/trống/quá dài, có HTML hoặc ký tự điều khiển, không có ký tự nhìn thấy được, quá 10 ảnh, ảnh lặp hoặc phần tử null (`fieldErrors` chỉ ra trường sai); tải ảnh thiếu/sai `kind`, thiếu `file` hoặc tệp rỗng; ID ảnh trong đường dẫn không phải UUID|
|400|INVALID_JSON|JSON sai, UUID sai định dạng hoặc có trường ngoài hợp đồng|
|400|INVALID_COMPANY_LOGO|`logoMediaId` không tồn tại hoặc không phải ảnh loại `LOGO`|
|400|INVALID_COMPANY_IMAGE|Một phần tử của `imageIds` không tồn tại hoặc không phải ảnh loại `IMAGE`|
|400|UNSUPPORTED_COMPANY_MEDIA_TYPE|Tệp tải lên không bắt đầu bằng chữ ký PNG/JPG (GIF, BMP, WebP, SVG, HTML, tệp chữ...)|
|400|COMPANY_MEDIA_DIMENSIONS_TOO_LARGE|Ảnh rộng hoặc cao hơn 6000 pixel|
|400|INVALID_COMPANY_MEDIA|Ảnh bị cắt, hỏng hoặc không giải mã được|
|401|Lỗi xác thực/phiên|Thiếu, sai, hết hạn token; phiên thu hồi; người gọi bị khóa (cả khi gửi token hỏng tới API công khai)|
|403|FORBIDDEN|Thiếu `JOB_POSTINGS_WRITE_ALL` (các API `/company-profile...` của trình soạn)|
|404|COMPANY_PROFILE_NOT_FOUND|Trang chưa được lưu lần nào (`GET /company-profile`, `GET /public/company-profile`)|
|404|COMPANY_MEDIA_NOT_FOUND|Ảnh không tồn tại; với API ảnh công khai, cả ảnh chưa lưu vào trang hoặc đã bị bỏ khỏi trang|
|413|FILE_TOO_LARGE|Tệp tải lên lớn hơn 5 MB (request trên khoảng 20 MB bị đóng kết nối thay vì nhận 413, xem mục [Tải ảnh lên](#tải-ảnh-lên))|
|415|(lỗi mặc định của Spring Boot)|`POST /company-profile/media` không gửi dạng `multipart/form-data`|

Khi lỗi, nội dung trang không thay đổi và không có ảnh nào được lưu.

### Database và phạm vi

Dùng ba bảng `company_profile`, `company_profile_images`, `company_media` của V11 và quyền `JOB_POSTINGS` của V3; task 237 và 238 không thêm migration, quyền mới hay biến `.env`. Task 238 thêm giới hạn tải tệp `spring.servlet.multipart.*` và `server.tomcat.max-swallow-size` vào `application.properties`; giá trị swallow áp dụng cho mọi API (request có body không được đọc hết vẫn được Tomcat đọc bỏ tối đa 20 MB, thay vì 2 MB mặc định). Không có API xóa trang hay xóa ảnh. Giao diện soạn và xem trước thuộc task 234, 235, 239.

*Nguồn: `docs/api/company-profile.md` (Sprint 2).*


---

<a id="api-avatars"></a>

## API ảnh đại diện

Phạm vi TKNHTTDNB1-188 (story TKNHTTDNB1-22: nhân sự nội bộ tải ảnh đại diện để đồng nghiệp nhận ra trên lịch phỏng vấn chung). URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`; mọi response thành công và mọi lỗi của các API này dùng `Cache-Control: no-store`, trừ 401 `SESSION_INVALID` khi service kiểm lại phiên (xem bảng lỗi).

| API | Quyền server yêu cầu | Vai trò được phép theo seed hiện tại |
|---|---|---|
|`GET /profile/avatar`|`SELF_PROFILE_READ`|6 vai trò nội bộ|
|`PUT /profile/avatar`|`SELF_PROFILE_WRITE`|6 vai trò nội bộ|
|`DELETE /profile/avatar`|`SELF_PROFILE_WRITE`|6 vai trò nội bộ|
|`GET /accounts/{id}/avatar`|`SELF_PROFILE_READ`|6 vai trò nội bộ|

Chủ ảnh luôn lấy từ Access Token, giống [API hồ sơ cá nhân](#api-profile): không có API tải lên hoặc xóa ảnh của người khác. Xem ảnh của đồng nghiệp chỉ cần `SELF_PROFILE_READ` vì mục đích là nhận ra nhau; API này chỉ trả ảnh, không trả email, vai trò hay thông tin tài khoản khác (khác `GET /accounts/{id}`, vốn cần `USER_ADMIN_READ_ALL`).

### PUT /api/v1/profile/avatar — tải lên hoặc thay ảnh

Body `multipart/form-data`, tệp nằm trong trường `file`. Trên trình duyệt dùng `FormData` và **không** tự đặt header `Content-Type`; trình duyệt sẽ tự thêm `boundary`.

- Chỉ nhận JPG hoặc PNG, nhận diện bằng các byte đầu tệp. Tên tệp và `Content-Type` của phần tệp bị bỏ qua, nên tệp GIF/WebP/văn bản đổi đuôi thành `.png` vẫn bị từ chối.
- Tối đa 2MB, tức 2.097.152 byte; đúng 2MB vẫn được nhận.
- Mỗi cạnh tối đa 4096 điểm ảnh. Kích thước được đọc từ phần đầu tệp trước khi giải mã toàn bộ, nên tệp khai báo kích thước khổng lồ bị từ chối sớm. Tệp hỏng hoặc bị cắt cụt cũng bị từ chối.
- Server cắt hình vuông lớn nhất ở giữa ảnh, tạo ảnh **256×256** và ảnh thu nhỏ **64×64** (hằng số `AVATAR_SIZE`, `THUMBNAIL_SIZE` trong `AvatarImageProcessor`). Ảnh nhỏ hơn 256 điểm ảnh được phóng to.
- Cả hai ảnh được lưu dạng PNG, kể cả khi tải lên JPG. Ảnh được ghi lại từ điểm ảnh nên không giữ EXIF, GPS hay ghi chú trong tệp gốc. Hướng xoay EXIF của ảnh chụp điện thoại **không** được áp dụng.
- Mỗi tài khoản có tối đa một ảnh; tải lên lần nữa sẽ thay ảnh cũ. Khi yêu cầu bị lỗi, ảnh cũ giữ nguyên.

Thành công trả **200**:

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "contentType": "image/png",
  "sizeBytes": 48213,
  "updatedAt": "2026-10-07T08:00:00Z",
  "imageUrl": "/api/v1/accounts/00000000-0000-0000-0000-000000000001/avatar",
  "thumbnailUrl": "/api/v1/accounts/00000000-0000-0000-0000-000000000001/avatar?size=thumbnail"
}
```

`sizeBytes` là dung lượng ảnh 256×256 đã lưu, không phải dung lượng tệp gốc. `updatedAt` là thời điểm lưu (UTC, độ chính xác micro giây như PostgreSQL). Hai URL là đường dẫn tương đối với địa chỉ backend và dùng được cho cả chính chủ lẫn đồng nghiệp.

Server kiểm tra và xử lý ảnh trước khi mở transaction, để khóa database chỉ giữ trong lúc ghi ngắn. Khi ghi, server khóa tài khoản người gọi rồi phiên đăng nhập, kiểm lại tài khoản còn được truy cập, phiên còn hiệu lực, token chưa hết hạn và quyền `SELF_PROFILE_WRITE`. Nếu trong lúc chờ khóa, tài khoản bị Admin khóa hoặc phiên bị thu hồi thì trả 401 `SESSION_INVALID`; nếu quyền bị gỡ thì trả 403 `FORBIDDEN`; ảnh không đổi. Hai lần tải lên đồng thời của cùng một người được xếp hàng: cả hai thành công, ảnh còn lại là của lần ghi sau, và ảnh lớn với ảnh nhỏ luôn thuộc cùng một lần tải.

### DELETE /api/v1/profile/avatar — xóa ảnh

Trả **204** không có body. Gọi khi chưa có ảnh vẫn trả 204, nên bấm lặp lại không gây lỗi. Khóa và kiểm tra lại giống PUT. Chỉ ảnh của người gọi bị xóa.

### Xem ảnh

`GET /api/v1/profile/avatar?size=full` xem ảnh của chính mình. `GET /api/v1/accounts/{id}/avatar?size=thumbnail` xem ảnh của tài khoản có UUID `{id}`.

| Tham số `size` | Ảnh trả về |
|---|---|
|`full` (mặc định khi bỏ qua)|256×256|
|`thumbnail`|64×64|

Giá trị khác, kể cả viết hoa như `FULL`, trả 400 `VALIDATION_ERROR`. Thành công trả **200**, body là chính byte ảnh với `Content-Type: image/png` và `X-Content-Type-Options: nosniff`. Chưa có ảnh hoặc không có tài khoản với UUID đó đều trả 404 `AVATAR_NOT_FOUND` (không phân biệt hai trường hợp). Ảnh của tài khoản đang bị khóa hoặc chưa kích hoạt vẫn được trả cho đồng nghiệp để lịch cũ còn hiển thị; xóa tài khoản sẽ xóa ảnh.

Thẻ `<img src="...">` không gửi được header Bearer. Frontend cần `fetch` kèm `Authorization`, đọc `response.blob()`, tạo `URL.createObjectURL(blob)` cho thẻ ảnh và `URL.revokeObjectURL` khi không dùng nữa. Vì response là `no-store`, nên giữ blob URL trong bộ nhớ của trang và chỉ tải lại khi `avatarUpdatedAt` của hồ sơ thay đổi.

### Hồ sơ cá nhân

`GET /profile` và `PUT /profile` có thêm `hasAvatar` (boolean) và `avatarUpdatedAt` (thời điểm UTC, `null` khi chưa có ảnh). Các trường cũ giữ nguyên nên frontend cũ không bị ảnh hưởng.

### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|AVATAR_FILE_REQUIRED|Không có trường `file`, ví dụ đặt tên trường khác hoặc gửi JSON thay vì multipart|
|400|AVATAR_INVALID|Tệp 0 byte, tệp hỏng hoặc bị cắt cụt|
|400|AVATAR_DIMENSIONS_TOO_LARGE|Chiều rộng hoặc chiều cao lớn hơn 4096 điểm ảnh|
|400|INVALID_MULTIPART|Body multipart hỏng, server không tách được trường và tệp|
|400|VALIDATION_ERROR|`size` không phải `full`/`thumbnail`; `{id}` không phải UUID|
|401|UNAUTHORIZED|Bộ lọc Bearer từ chối: thiếu, sai hoặc hết hạn token; phiên đã bị thu hồi; tài khoản bị khóa hoặc chưa kích hoạt. Có `WWW-Authenticate: Bearer` và `Cache-Control: no-store`|
|401|SESSION_INVALID|Request đã qua bộ lọc nhưng service kiểm lại thấy tài khoản vừa bị khóa, phiên vừa bị thu hồi hoặc token vừa hết hạn, thường gặp khi PUT/DELETE phải chờ khóa. Lỗi này đi qua `ApiExceptionHandler` nên **không** có `Cache-Control: no-store` và `WWW-Authenticate`, giống các API khác (ma trận quyền (`docs/architecture/role-permission-matrix.md` trong repo Backend), mục 6)|
|403|FORBIDDEN|Thiếu `SELF_PROFILE_READ` (xem) hoặc `SELF_PROFILE_WRITE` (tải lên, xóa)|
|404|AVATAR_NOT_FOUND|Chưa có ảnh hoặc không có tài khoản với UUID đó|
|413|AVATAR_TOO_LARGE|Tệp lớn hơn 2MB nhưng không vượt giới hạn multipart của server|
|413|FILE_TOO_LARGE|Tệp lớn hơn `spring.servlet.multipart.max-file-size` (hiện 5MB), bị chặn trước khi tới API ảnh|
|415|AVATAR_TYPE_UNSUPPORTED|Không phải JPG/PNG theo byte đầu tệp|

Frontend nên kiểm tra `file.size <= 2 * 1024 * 1024` và loại tệp trước khi gửi. Với tệp rất lớn, server có thể đóng kết nối trước khi gửi JSON 413, khi đó `fetch` chỉ báo lỗi mạng.

### Database và phạm vi

Migration V12 tạo bảng `user_avatars`: khóa chính `user_id` tham chiếu `user_accounts` với `ON DELETE CASCADE`, `content_type` (`image/png` hoặc `image/jpeg`), `image` và `thumbnail` kiểu `BYTEA`, `size_bytes` bằng dung lượng `image`, `updated_at`. Không đổi bảng hoặc quyền cũ; dùng `SELF_PROFILE_READ`/`SELF_PROFILE_WRITE` sẵn có. Chưa có hiển thị ảnh trên lịch phỏng vấn; module lịch phỏng vấn sẽ dùng `GET /accounts/{id}/avatar` khi được xây dựng.

*Nguồn: `docs/api/avatars.md` (Sprint 2).*


---

<a id="api-account-import"></a>

## Nhập danh sách nhân sự từ Excel

Phạm vi TKNHTTDNB1-170–175 (story TKNHTTDNB1-20). URL dùng tiền tố `/api/v1`. Gửi `Authorization: Bearer <accessToken>`.

Nhập hàng loạt cũng là tạo tài khoản, nên cả ba API dùng đúng quy tắc của `POST /accounts`: cần **vai trò `ADMIN` và quyền `USER_ADMIN_WRITE_ALL`**. Theo seed hiện tại chỉ ADMIN dùng được; HR_MANAGER chỉ có quyền đọc tài khoản nên nhận 403. Chi tiết ở mục [Quyền truy cập](#quyền-truy-cập).

Hiện có API tải tệp mẫu (170), API đọc tệp để xem trước (171), trong đó mỗi dòng được kiểm tra giá trị và báo lỗi theo từng ô (172), API nhập thật: tạo tài khoản cho dòng hợp lệ, bỏ qua dòng lỗi (173), trả báo cáo tổng kết gồm số dòng thành công, số dòng bị bỏ qua và lý do của từng dòng bị bỏ qua (174), và chỉ người quản trị tài khoản nội bộ mới được xem trước và nhập (175).

### Quyền truy cập

Quyền được kiểm hai lớp, giống các API ghi tài khoản khác:

1. **Bộ lọc URL** trong `SecurityConfiguration`: ba URL `/accounts/import/**` cần đồng thời `ROLE_ADMIN` và `PERM_USER_ADMIN_WRITE_ALL`, như `POST /accounts`. Thiếu một trong hai là 403, controller không chạy.
2. **Service kiểm lại**: trước khi mở tệp, `StaffImportService` gọi `AccountProvisioningService.requireCreateAccess`, tức đúng phần kiểm quyền mà `POST /accounts` dùng. Phần này khóa dòng tài khoản rồi dòng phiên của người gọi (cùng thứ tự với các service tài khoản khác), sau đó đọc lại từ database: tài khoản đã kích hoạt và không bị khóa, phiên chưa đăng xuất, token chưa hết hạn, còn vai trò `ADMIN` và còn quyền `USER_ADMIN_WRITE_ALL`. Việc kiểm này chạy trong một transaction ngắn và commit ngay, nên không giữ khóa trong lúc đọc tệp. Khi nhập thật, mỗi dòng hợp lệ còn được kiểm lại lần nữa lúc tạo tài khoản.

Khóa ở lớp 2 có tác dụng khi một thay đổi đang được lưu đúng lúc request tới. Ví dụ Admin khác đang gỡ vai trò `ADMIN` hoặc khóa tài khoản của người gọi: request chờ thay đổi đó lưu xong rồi mới kiểm, nên thấy kết quả mới và trả 403 hoặc 401, không dùng quyền cũ mà bộ lọc đã thấy.

| Người gọi | Kết quả với cả ba API |
|---|---|
|Có vai trò `ADMIN` và quyền `USER_ADMIN_WRITE_ALL`, phiên còn hợp lệ|Được dùng|
|HR_MANAGER (xem được `GET /accounts` nhưng không tạo được tài khoản)|403 `FORBIDDEN`|
|RECRUITER, HIRING_MANAGER, INTERVIEWER, APPROVER, hoặc có nhiều vai trò trong số này nhưng không có `ADMIN`|403 `FORBIDDEN`|
|Vai trò khác `ADMIN` dù được cấp thêm `USER_ADMIN_WRITE_ALL`|403 `FORBIDDEN`|
|Có vai trò `ADMIN` nhưng `USER_ADMIN_WRITE_ALL` đã bị gỡ khỏi vai trò này|403 `FORBIDDEN`, kể cả với token cấp trước đó|
|Mất vai trò `ADMIN` hoặc quyền `USER_ADMIN_WRITE_ALL` trong lúc request đang chờ|403 `FORBIDDEN`|
|Bị khóa tài khoản hoặc đã đăng xuất trong lúc request đang chờ|401 `SESSION_INVALID`|
|Không gửi token, token sai hoặc hết hạn, phiên đã thu hồi, tài khoản bị khóa từ trước|401 `UNAUTHORIZED`|

Khi bị từ chối ở bước kiểm quyền này (401/403), server chưa đọc tệp: response chỉ là JSON lỗi `{code, message, fieldErrors}` (`fieldErrors` rỗng), không có dòng nào của tệp, không cho biết email nào đã có tài khoản; không tài khoản nào được tạo và không email nào được gửi. Riêng nhập thật còn có thể dừng với 401/403 giữa chừng, sau khi đã tạo một số dòng (xem [Dòng hợp lệ nhưng thất bại lúc tạo](#dòng-hợp-lệ-nhưng-thất-bại-lúc-tạo)). Frontend có thể ẩn chức năng nhập khi `GET /auth/me` không có vai trò `ADMIN` hoặc `GET /auth/permissions` không có `USER_ADMIN_WRITE_ALL`, nhưng server vẫn luôn tự kiểm như trên.

### GET /accounts/import/template

Tải tệp Excel mẫu. Không có tham số, không có body, không cần header `Accept` đặc biệt.

Thành công trả **200** với body là nội dung nhị phân của tệp `.xlsx` (không phải JSON):

| Header | Giá trị |
|---|---|
|Content-Type|`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`|
|Content-Disposition|`attachment; filename="mau-nhap-nhan-su.xlsx"`|
|Cache-Control|`no-store`|

CORS expose header `Content-Disposition`, nên frontend chạy ở origin khác vẫn đọc được tên tệp. Cách tải thường dùng: gọi API bằng `fetch` kèm Bearer, đọc body thành `Blob`, rồi tạo link tải với tên tệp lấy từ `Content-Disposition`.

| HTTP | Mã | Trường hợp |
|---|---|---|
|401|UNAUTHORIZED|Thiếu, sai hoặc hết hạn token; phiên đã thu hồi; tài khoản bị khóa hoặc chưa kích hoạt|
|401|SESSION_INVALID|Service kiểm lại sau khi qua bộ lọc thấy token vừa hết hạn, phiên vừa bị thu hồi hoặc tài khoản vừa bị khóa|
|403|FORBIDDEN|Không có vai trò `ADMIN` hoặc thiếu `USER_ADMIN_WRITE_ALL`, kể cả khi vừa mất trong lúc request chờ (xem [Quyền truy cập](#quyền-truy-cập))|

Response lỗi là JSON `{code, message, fieldErrors}`, có `Cache-Control: no-store` và không có `Content-Disposition`.

### Cấu trúc tệp mẫu

Tệp có hai sheet:

1. **`Nhân sự`** (sheet đầu tiên): chỉ có dòng tiêu đề ở dòng 1, dữ liệu nhập từ dòng 2. Dòng tiêu đề được cố định khi cuộn. Sáu cột dùng định dạng Text để Excel giữ số 0 đầu của số điện thoại và không tự đổi mã thành số. Tiêu đề nền cam là cột bắt buộc, nền xám là cột có thể để trống. Sheet này cố ý không có dòng ví dụ để không ai nhập nhầm một người mẫu.
2. **`Hướng dẫn`**: quy định chung, bảng mô tả từng cột kèm ví dụ, và bảng mã vai trò hợp lệ.

#### Các cột (hợp đồng ổn định)

Tiêu đề dòng 1 và mã cột là hợp đồng giữa tệp và API. Đổi tiêu đề, thứ tự hoặc mã cột sẽ làm hỏng các tệp quản trị viên đã điền; nguồn duy nhất trong code là enum `StaffImportColumn`.

| Cột | Tiêu đề (dòng 1) | Mã cột | Bắt buộc | Trường tài khoản | Quy tắc | Ví dụ |
|---|---|---|---|---|---|---|
|A|Email|`email`|Có|`email`|Email đăng nhập, tối đa 254 ký tự, chưa có tài khoản nào dùng. Bỏ khoảng trắng đầu/cuối và đổi về chữ thường|`nguyen.van.an@example.com`|
|B|Họ và tên|`fullName`|Có|`fullName`|Tối đa 255 ký tự|`Nguyễn Văn An`|
|C|Vai trò|`roles`|Có|`roles`|Một hoặc nhiều mã vai trò bên dưới, viết in hoa, cách nhau bằng dấu phẩy|`RECRUITER, INTERVIEWER`|
|D|Mã phòng ban|`departmentCode`|Không|`departmentId` (tìm theo `departments.code`)|Mã của phòng ban đang áp dụng, đúng chữ hoa/thường như danh mục phòng ban; để trống nếu chưa gán|`HR`|
|E|Số điện thoại|`phone`|Không|`phone`|Di động 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09 hoặc số cố định 11 chữ số bắt đầu bằng 02; có thể ghi `+84` thay số 0 đầu (giống [hồ sơ cá nhân](#api-profile))|`0912345678`|
|F|Chức danh hiển thị|`displayTitle`|Không|`displayTitle`|Chữ tự do tối đa 120 ký tự; không phải mã trong [danh mục chức danh](#api-positions)|`Chuyên viên tuyển dụng`|

Quy tắc của các cột lấy theo `POST /accounts` và `PUT /accounts/{id}` trong [quản trị tài khoản](#api-accounts). Mã cột là tên ổn định mà API xem trước dùng trong trường `column` của lỗi từng ô; giao diện hiển thị tiêu đề tiếng Việt tương ứng.

#### Mã vai trò hợp lệ

Sheet hướng dẫn liệt kê sáu vai trò nội bộ theo thứ tự `ADMIN`, `HR_MANAGER`, `RECRUITER`, `HIRING_MANAGER`, `INTERVIEWER`, `APPROVER`. Tên tiếng Việt được đọc từ cột `display_name` của bảng `roles` (V3) mỗi lần tải, nên luôn trùng với tên trong hệ thống. `CANDIDATE` không phải vai trò nội bộ nên không có trong danh sách.

#### Quy định chung ghi trong sheet hướng dẫn

1. Chỉ nhập dữ liệu ở sheet đầu tiên `Nhân sự`; hệ thống chỉ đọc sheet đầu tiên.
2. Giữ nguyên dòng tiêu đề: không đổi tên, không đổi thứ tự, không thêm hoặc xóa cột.
3. Từ dòng 2, mỗi dòng là một nhân sự; tối đa 500 nhân sự trong một tệp.
4. Cột có tiêu đề nền cam là bắt buộc; cột nền xám có thể để trống.
5. Chỉ nhập giá trị, không dùng công thức; lưu tệp dạng `.xlsx`, dung lượng tối đa 2 MB.
6. Mỗi tài khoản được tạo ở trạng thái chờ kích hoạt và nhận email mời kích hoạt, giống khi tạo từng tài khoản.

API xem trước (mục dưới) áp dụng quy định 1, 2, 3 và 5: chỉ đọc sheet đầu tiên, so khớp dòng tiêu đề, từ chối tệp quá 500 dòng hoặc quá 2 MB và từ chối công thức. Sau đó API kiểm tra giá trị từng ô theo cột "Quy tắc" ở trên (mục [Kiểm tra từng dòng](#kiểm-tra-từng-dòng)). Tệp mẫu và API đọc dùng chung hằng số `StaffImportTemplate.MAX_DATA_ROWS`, `StaffImportTemplate.MAX_FILE_SIZE_MB` và enum `StaffImportColumn`.

### POST /accounts/import/preview

Đọc tệp quản trị viên đã điền và trả các dòng để xem trước khi nhập; mỗi dòng được đánh dấu hợp lệ hoặc không, kèm lỗi của từng ô. API **không tạo gì**: không tạo tài khoản, không gửi email mời, không ghi tệp hay dữ liệu đọc được vào database hoặc ra đĩa. Gửi lại cùng tệp cho cùng kết quả, miễn là tài khoản và phòng ban trong hệ thống chưa đổi.

Request là `multipart/form-data` có một trường tệp tên **`file`**. Ví dụ ở frontend:

```js
const form = new FormData();
form.append('file', input.files[0]);
const response = await fetch(`${apiBaseUrl}/api/v1/accounts/import/preview`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
```

Không tự đặt header `Content-Type`: trình duyệt tự thêm `multipart/form-data; boundary=...`. Frontend **phải** kiểm tra `file.size <= 2 * 1024 * 1024` trước khi gửi và báo lỗi ngay cho người dùng: tệp tới khoảng 10 MB vẫn nhận được JSON `413 FILE_TOO_LARGE`, nhưng tệp lớn hơn nhiều có thể bị server đóng kết nối, khi đó `fetch` chỉ báo lỗi mạng (ví dụ `ERR_CONNECTION_RESET`) và không có JSON để đọc.

#### Server kiểm tra theo thứ tự

1. Phiên, vai trò `ADMIN` và quyền `USER_ADMIN_WRITE_ALL`, kiểm lại sau khi khóa tài khoản và phiên của người gọi (mục [Quyền truy cập](#quyền-truy-cập)). Người không có quyền nhận 401/403 trước khi server xem tới tệp.
2. Có trường `file` và tệp không rỗng.
3. Tệp không lớn hơn 2 MB (2 × 1024 × 1024 byte). Tệp đúng 2 MB vẫn được nhận.
4. Tên tệp kết thúc bằng `.xlsx` (không phân biệt hoa/thường).
5. Nội dung sau khi giải nén không quá 10 MB. Tệp `.xlsx` là tệp zip; giới hạn này chặn tệp nhỏ nhưng giải nén ra rất lớn (zip bomb) trước khi đọc vào bộ nhớ. Theo ước tính, tệp mẫu điền đủ 500 dòng chỉ cỡ dưới 1 MB khi giải nén.
6. Mở được như một workbook `.xlsx`. Tệp `.xls` cũ, tệp `.csv` đổi đuôi, tệp có mật khẩu hoặc tệp hỏng đều bị từ chối.
7. Chỉ đọc **sheet đầu tiên** theo thứ tự trong tệp, không phụ thuộc tên sheet; các sheet khác bị bỏ qua.
8. Dòng 1 phải đúng sáu tiêu đề ở A1–F1 theo thứ tự của bảng cột ở trên; từ G1 trở đi phải trống. Server bỏ qua khoảng trắng đầu/cuối và khác biệt cách mã hóa dấu tiếng Việt (Unicode NFC/NFD), nhưng phân biệt chữ hoa/thường. Mã cột (`email`, `fullName`...) không thay được tiêu đề tiếng Việt.
9. Ô có công thức trong cột A–F (kể cả dòng tiêu đề) làm cả tệp bị từ chối; server không tính công thức. Ô ngoài cột A–F không được đọc.
10. Dòng có sáu ô A–F đều trống hoặc chỉ có khoảng trắng bị bỏ qua và không được đếm. Phải còn ít nhất 1 và không quá 500 dòng nhân sự.
11. Kiểm tra giá trị của từng dòng (mục [Kiểm tra từng dòng](#kiểm-tra-từng-dòng)). Dòng sai không làm hỏng cả tệp: response vẫn là 200 và dòng đó được đánh dấu `valid: false`.

Bước 1–10 sai thì cả tệp bị từ chối với một mã lỗi ở bảng [Lỗi](#lỗi), không có danh sách dòng.

#### Response 200

```json
{
  "totalRows": 3,
  "validRows": 1,
  "invalidRows": 2,
  "rows": [
    {
      "rowNumber": 2,
      "email": "nguyen.van.an@example.com",
      "fullName": "Nguyễn Văn An",
      "roles": ["RECRUITER", "INTERVIEWER"],
      "departmentCode": "HR",
      "phone": "0912345678",
      "displayTitle": "Chuyên viên tuyển dụng",
      "valid": true,
      "errors": []
    },
    {
      "rowNumber": 4,
      "email": "tran.thi.binh@example.com",
      "fullName": null,
      "roles": ["HR_MANAGER", "BOSS"],
      "departmentCode": "OLD",
      "phone": null,
      "displayTitle": null,
      "valid": false,
      "errors": [
        {
          "rowNumber": 4,
          "column": "fullName",
          "cell": "B4",
          "code": "REQUIRED",
          "message": "Họ và tên là bắt buộc."
        },
        {
          "rowNumber": 4,
          "column": "roles",
          "cell": "C4",
          "code": "ROLE_UNKNOWN",
          "message": "Mã vai trò không hợp lệ: BOSS. Chỉ dùng các mã: ADMIN, HR_MANAGER, RECRUITER, HIRING_MANAGER, INTERVIEWER, APPROVER."
        },
        {
          "rowNumber": 4,
          "column": "departmentCode",
          "cell": "D4",
          "code": "DEPARTMENT_INACTIVE",
          "message": "Phòng ban mã \"OLD\" đã ngừng áp dụng, không gán được nhân sự mới."
        }
      ]
    },
    {
      "rowNumber": 5,
      "email": "le.van.cuong@example.com",
      "fullName": "Lê Văn Cường",
      "roles": ["INTERVIEWER"],
      "departmentCode": null,
      "phone": "912345678",
      "displayTitle": null,
      "valid": false,
      "errors": [
        {
          "rowNumber": 5,
          "column": "email",
          "cell": "A5",
          "code": "EMAIL_ALREADY_EXISTS",
          "message": "Email đã được sử dụng cho một tài khoản nội bộ."
        },
        {
          "rowNumber": 5,
          "column": "phone",
          "cell": "E5",
          "code": "PHONE_INVALID",
          "message": "Số điện thoại không đúng định dạng: cần số di động 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09 hoặc số cố định 11 chữ số bắt đầu bằng 02. Nếu Excel làm mất số 0 ở đầu, hãy định dạng ô là Text rồi gõ lại."
        }
      ]
    }
  ]
}
```

Ví dụ trên có dòng 3 để trống nên bị bỏ qua; tài khoản `le.van.cuong@example.com` đã có sẵn trong hệ thống và phòng ban `OLD` đã ngừng áp dụng. Header `Cache-Control: no-store`.

| Trường | Ý nghĩa và cách chuẩn hóa |
|---|---|
|totalRows|Số dòng nhân sự đọc được, bằng số phần tử của `rows` và bằng `validRows + invalidRows`|
|validRows|Số dòng không có lỗi|
|invalidRows|Số dòng có ít nhất một lỗi|
|rowNumber|Số dòng Excel hiển thị bên trái sheet (dòng tiêu đề là 1), để quản trị viên tìm lại dòng|
|email|Bỏ khoảng trắng đầu/cuối, đổi về chữ thường, giống `POST /accounts`|
|fullName|Bỏ khoảng trắng đầu/cuối|
|roles|Tách theo dấu phẩy, bỏ khoảng trắng và mục rỗng, đổi sang chữ in hoa, bỏ mã lặp, giữ thứ tự. Ô trống cho mảng rỗng `[]`|
|departmentCode|Bỏ khoảng trắng đầu/cuối, giữ nguyên chữ hoa/thường|
|phone|Bỏ khoảng trắng đầu/cuối; `+84` ở đầu đổi thành `0`, giống hồ sơ cá nhân|
|displayTitle|Bỏ khoảng trắng đầu/cuối|
|valid|`true` khi dòng không có lỗi, tức là bước nhập sẽ tạo tài khoản cho dòng này|
|errors|Danh sách lỗi theo thứ tự cột A→F, mỗi cột tối đa một lỗi. Dòng hợp lệ có mảng rỗng `[]`, không bao giờ `null`|

Ô trống trả `null` (riêng `roles` là `[]`). Ô kiểu số, ngày hoặc TRUE/FALSE được đọc theo chữ Excel hiển thị: mã phòng ban gõ dạng số `101` trả `"101"`, không thành `101.0`. Số điện thoại gõ dạng số (ô không ở định dạng Text) đã mất số 0 đầu ngay trong Excel, nên server nhận `912345678` và báo `PHONE_INVALID`.

Giá trị sai vẫn được trả nguyên như đã đọc (sau khi chuẩn hóa) để quản trị viên đối chiếu với lỗi.

#### Kiểm tra từng dòng

Server kiểm tra **mọi** dòng, nên quản trị viên thấy toàn bộ lỗi của tệp trong một lần thay vì sửa từng lỗi một. Quy tắc giống tạo một tài khoản bằng `POST /accounts` (email, họ tên, vai trò) và sửa hồ sơ bằng `PUT /accounts/{id}` (phòng ban, số điện thoại, chức danh) trong [quản trị tài khoản](#api-accounts). Mỗi cột chỉ báo **quy tắc đầu tiên** bị vi phạm, theo thứ tự trong bảng.

| Cột | Mã lỗi | Khi nào |
|---|---|---|
|A `email`|`REQUIRED`|Ô trống|
||`TOO_LONG`|Dài hơn 254 ký tự|
||`EMAIL_INVALID`|Sai định dạng. Server dùng chính ràng buộc `@Email` của `CreateAccountRequest`, nên nhận đúng những email mà `POST /accounts` nhận|
||`EMAIL_ALREADY_EXISTS`|Đã có tài khoản dùng email này, ở bất kỳ trạng thái nào (đang hoạt động, chờ kích hoạt, bị khóa). Cùng mã với lỗi 409 của `POST /accounts`|
||`EMAIL_DUPLICATED_IN_FILE`|Email (sau khi bỏ khoảng trắng và đổi chữ thường) có ở hơn một dòng của tệp. **Mọi** dòng trùng đều bị đánh dấu, message nêu các dòng còn lại, ví dụ `dòng 4, 6`, để quản trị viên tự chọn giữ dòng nào|
|B `fullName`|`REQUIRED`|Ô trống hoặc chỉ có khoảng trắng|
||`TOO_LONG`|Dài hơn 255 ký tự|
|C `roles`|`REQUIRED`|Ô trống hoặc chỉ có dấu phẩy|
||`ROLE_UNKNOWN`|Có mã không thuộc sáu vai trò nội bộ (kể cả `CANDIDATE`). Message nêu các mã sai và danh sách mã hợp lệ|
|D `departmentCode`|`TOO_LONG`|Dài hơn 50 ký tự|
||`DEPARTMENT_NOT_FOUND`|Không có phòng ban mang **đúng** mã này; `hr` khác `HR`|
||`DEPARTMENT_INACTIVE`|Phòng ban đã ngừng áp dụng (`active = false`); giống `PUT /accounts/{id}`, không gán nhân sự mới vào phòng ban này|
|E `phone`|`PHONE_INVALID`|Không phải di động 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09 hoặc số cố định 11 chữ số bắt đầu bằng 02 (sau khi đổi `+84` đầu thành `0`). Có khoảng trắng giữa các số cũng sai|
|F `displayTitle`|`TOO_LONG`|Dài hơn 120 ký tự|

Các cột D, E, F không bắt buộc: ô trống không có lỗi. Độ dài đếm theo cách của Java (`String.length()`), giống `@Size` của API tạo và sửa tài khoản.

Mỗi lỗi trong `errors` có các trường:

| Trường | Ý nghĩa |
|---|---|
|rowNumber|Số dòng Excel, trùng `rowNumber` của dòng chứa lỗi|
|column|Mã cột ổn định: `email`, `fullName`, `roles`, `departmentCode`, `phone`, `displayTitle`|
|cell|Địa chỉ ô, ví dụ `A5`; gõ vào ô Name Box của Excel để nhảy tới đúng ô|
|code|Mã lỗi ổn định trong bảng trên, để frontend lọc hoặc tô màu|
|message|Câu tiếng Việt hiển thị được ngay. Message không lặp lại số dòng; giao diện có thể ghép thành `Dòng 5, ô A5: Email đã được sử dụng...`|

Email đã có tài khoản và phòng ban được kiểm tra bằng hai truy vấn chỉ đọc cho cả tệp (bảng `user_accounts` và `departments`), không phải một truy vấn mỗi dòng. Kết quả phản ánh database **tại lúc xem trước**: nếu ai đó tạo tài khoản hoặc ngừng áp dụng phòng ban ngay sau đó, xem trước lần sau sẽ báo lỗi mới. Vì vậy bước nhập thật ([`POST /accounts/import`](#post-accountsimport)) đọc và kiểm tra lại tệp, không tin kết quả xem trước cũ.

Xem trước cho biết một email đã có tài khoản hay chưa. Chỉ người có vai trò `ADMIN` và quyền `USER_ADMIN_WRITE_ALL` gọi được API này; người khác nhận 401/403 trước khi server đọc tệp, nên không dò được email.

#### Lỗi

| HTTP | Mã | Trường hợp |
|---|---|---|
|400|IMPORT_FILE_REQUIRED|Không có trường `file`, tệp 0 byte, hoặc body không phải multipart (ví dụ gửi JSON)|
|400|IMPORT_FILE_INVALID|Tên tệp không kết thúc `.xlsx`; không mở được như `.xlsx`; nội dung giải nén vượt 10 MB|
|400|IMPORT_HEADER_INVALID|Dòng 1 của sheet đầu tiên không đúng tiêu đề mẫu. Message nêu ô sai đầu tiên, ví dụ `ô B1 phải là "Họ và tên"`|
|400|IMPORT_FORMULA_NOT_ALLOWED|Ô trong cột A–F có công thức. Message nêu địa chỉ ô, ví dụ `D3`|
|400|IMPORT_FILE_EMPTY|Không có dòng nhân sự nào sau dòng 1|
|400|IMPORT_TOO_MANY_ROWS|Hơn 500 dòng nhân sự|
|400|INVALID_MULTIPART|Body multipart hỏng, ví dụ bị cắt giữa chừng|
|413|FILE_TOO_LARGE|Tệp lớn hơn 2 MB (hoặc cả request lớn hơn 3 MB). Server từ chối ngay khi thấy vượt giới hạn, không mở workbook. Chỉ chắc chắn nhận được JSON này khi request không quá khoảng 10 MB; lớn hơn nữa thì kết nối có thể bị đóng (xem đoạn dưới bảng)|
|401|UNAUTHORIZED, SESSION_INVALID|Như tải tệp mẫu|
|403|FORBIDDEN|Như tải tệp mẫu|

Response lỗi là JSON `{code, message, fieldErrors}` có `Cache-Control: no-store`; `message` là tiếng Việt, hiển thị được ngay cho người dùng. Gặp một lỗi trong bảng này thì cả tệp không được đọc, không có danh sách dòng.

Giới hạn tải lên nằm trong `application.properties`: `spring.servlet.multipart.max-file-size=2MB`, `max-request-size=3MB` (chừa chỗ cho phần form bao quanh tệp) và `file-size-threshold=2MB` để tệp tải lên nằm trong bộ nhớ, không ghi ra thư mục tạm, vì tệp chứa dữ liệu cá nhân. `INVALID_MULTIPART` và `FILE_TOO_LARGE` của tầng multipart do `ApiExceptionHandler` trả, nên dùng chung cho các API tải tệp sau này.

Khi từ chối một request chưa nhận hết, Tomcat vẫn đọc bỏ phần body còn lại để kết nối không bị ngắt giữa chừng và client đọc được response 413. `server.tomcat.max-swallow-size=10MB` giới hạn phần đọc bỏ này (mặc định của Tomcat chỉ 2 MB, khi đó tệp 5 MB đã bị ngắt kết nối thay vì nhận JSON). Phần còn lại vượt 10 MB thì Tomcat đóng kết nối để không tốn băng thông cho tệp quá lớn, nên frontend vẫn phải tự kiểm tra dung lượng trước khi gửi. Giới hạn này áp dụng cho mọi API, không riêng API nhập nhân sự.

### POST /accounts/import

Nhập thật: tạo tài khoản cho các dòng hợp lệ và bỏ qua các dòng lỗi. Request giống hệt xem trước: `multipart/form-data` với một trường tệp tên **`file`**, cùng giới hạn tệp và cùng quyền (vai trò `ADMIN` **và** `USER_ADMIN_WRITE_ALL`). Frontend thường gọi xem trước rồi mới cho bấm nhập, nhưng server không cần và không nhận kết quả xem trước.

```js
const form = new FormData();
form.append('file', input.files[0]);
const response = await fetch(`${apiBaseUrl}/api/v1/accounts/import`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
```

#### Server xử lý theo thứ tự

1. Phiên, vai trò `ADMIN` và quyền `USER_ADMIN_WRITE_ALL` như xem trước, kể cả khi tệp không có dòng hợp lệ nào. Người không có quyền nhận 401/403 trước khi server xem tới tệp.
2. Đọc tệp đúng như bước 2–10 của [xem trước](#server-kiểm-tra-theo-thứ-tự). Gặp lỗi cấp tệp (bảng [Lỗi](#lỗi)) thì cả tệp bị từ chối và **chưa tạo tài khoản nào**, kể cả cho các dòng đúng.
3. Kiểm tra lại mọi dòng như bước 11 của xem trước, theo database **lúc nhập**. Từ lúc xem trước, có thể đã có người tạo tài khoản trùng email hoặc ngừng áp dụng một phòng ban.
4. Đi lần lượt từng dòng theo thứ tự trong tệp:
   - Dòng có lỗi: bỏ qua, không ghi gì, không gửi email. Dòng vào danh sách `skipped` của báo cáo cùng đúng các lỗi mà xem trước báo cho dòng đó.
   - Dòng hợp lệ: tạo tài khoản bằng chính `AccountProvisioningService` của `POST /accounts`, trong **transaction riêng của dòng đó**. Transaction khóa và kiểm lại phiên, vai trò, quyền của người nhập; khóa phòng ban theo mã (`SELECT ... FOR SHARE`) và kiểm phòng ban còn áp dụng; kiểm email chưa có tài khoản; lưu tài khoản ở trạng thái chờ kích hoạt cùng vai trò, phòng ban, số điện thoại và chức danh; tạo token kích hoạt; cuối cùng gửi email mời giống `POST /accounts`. Dòng xong thì được commit ngay, trước khi sang dòng sau, và vào danh sách `created`.
5. Trả [báo cáo tổng kết](#response-200-báo-cáo-tổng-kết): số dòng thành công, số dòng bị bỏ qua và lý do của từng dòng bị bỏ qua.

Tài khoản tạo từ tệp giống hệt tài khoản tạo bằng `POST /accounts` rồi sửa hồ sơ bằng `PUT /accounts/{id}`: trạng thái `PENDING_ACTIVATION`, mật khẩu tạm và link kích hoạt (hạn theo `ACCOUNT_ACTIVATION_TTL`) chỉ có trong email gửi cho người đó.

#### Dòng hợp lệ nhưng thất bại lúc tạo

Giữa bước 3 và lúc tạo một dòng, dữ liệu vẫn có thể đổi. Khi đó chỉ transaction của dòng ấy bị hủy; tài khoản của các dòng trước và sau không bị ảnh hưởng. Dòng đó vào `skipped` với đúng một lý do (cột giữa của bảng; xem thêm bảng [Lý do bỏ qua](#lý-do-bỏ-qua)).

| Tình huống lúc tạo dòng | Lý do trong báo cáo | Kết quả |
|---|---|---|
|Email vừa được dùng cho một tài khoản khác, kể cả khi hai Admin nhập cùng lúc (ràng buộc unique `user_accounts_email_key` quyết định ai tạo trước)|`EMAIL_ALREADY_EXISTS`, ô cột A|Tài khoản đã có giữ nguyên tên, vai trò, mật khẩu; không gửi email. Tiếp tục dòng sau|
|Phòng ban vừa ngừng áp dụng hoặc đổi mã|`INVALID_DEPARTMENT`, ô cột D|Không tạo gì. Tiếp tục dòng sau|
|Máy chủ thư trả lời nhưng **từ chối địa chỉ** người nhận (mã SMTP 5xx cho địa chỉ đó, ví dụ hộp thư không tồn tại)|`EMAIL_ADDRESS_REFUSED`, ô cột A|Tài khoản của dòng đó bị hủy như `POST /accounts`. Máy chủ thư vẫn hoạt động với địa chỉ khác nên tiếp tục dòng sau|
|**Máy chủ thư không hoạt động**: không kết nối được, đăng nhập SMTP sai, hết thời gian chờ, lỗi tạm thời (mã 4xx) hoặc lỗi khác|`ACCOUNT_EMAIL_UNAVAILABLE`, không gắn ô|Tài khoản của dòng đó bị hủy như `POST /accounts`. Server **dừng tạo**: `stoppedAtRow` là số dòng này; mỗi dòng hợp lệ sau đó vào `skipped` với lý do `NOT_ATTEMPTED` (không thử, không ghi gì, không gửi email); các dòng lỗi sau đó vẫn vào `skipped` với lỗi dữ liệu của chúng|
|Phiên hết hạn hoặc bị thu hồi, Admin bị khóa, mất vai trò `ADMIN` hoặc quyền `USER_ADMIN_WRITE_ALL`|Không có báo cáo|Request dừng ngay với 401 `SESSION_INVALID` hoặc 403 `FORBIDDEN`. Tài khoản đã tạo trước đó vẫn giữ|

Server phân biệt hai trường hợp gửi email lỗi theo lỗi mà thư viện gửi thư trả về (`AccountInvitationMailSender.refusedRecipient`). Từ chối địa chỉ là vấn đề của **riêng dòng đó**: máy chủ đã trả lời ngay nên thử dòng sau không tốn thời gian chờ. Máy chủ thư không hoạt động thì các dòng sau gần như chắc chắn cũng lỗi, và mỗi lần thử có thể chờ hết thời gian chờ SMTP (tới 5 giây mỗi bước), làm request 500 dòng kéo dài hàng chục phút, nên server dừng.

Xem trước không biết máy chủ thư có nhận một địa chỉ hay không, nên dòng bị từ chối địa chỉ vẫn hiện là hợp lệ khi xem trước; chỉ báo cáo nhập mới cho biết lý do `EMAIL_ADDRESS_REFUSED`. Khi đó hãy kiểm tra lại email của dòng.

**Nhập lại cùng tệp là an toàn.** Dòng đã tạo ở lần trước nay có email đã tồn tại nên bị bỏ qua với lý do `EMAIL_ALREADY_EXISTS`: không tạo trùng, không gửi email lần hai, không đổi mật khẩu tạm. Vì vậy sau khi request bị dừng (`stoppedAtRow` khác `null`, 401, 403, mất kết nối), Admin chỉ cần tải lại đúng tệp đó khi hệ thống đã ổn: dòng `stoppedAtRow` và các dòng có lý do `NOT_ATTEMPTED` sẽ được thử lại.

#### Response 200: báo cáo tổng kết

Response là báo cáo tổng kết của lần nhập (TKNHTTDNB1-174): đếm số dòng, liệt kê các dòng đã tạo tài khoản và các dòng bị bỏ qua kèm lý do. Ví dụ một tệp có dòng 3 sai dữ liệu và máy chủ thư từ chối địa chỉ ở dòng 4:

```json
{
  "totalRows": 4,
  "createdCount": 2,
  "skippedCount": 2,
  "stoppedAtRow": null,
  "created": [
    { "rowNumber": 2, "email": "nguyen.van.an@example.com", "accountId": "8d6f3b8e-2f5c-4f8e-9a51-6f1d2c7b9e40" },
    { "rowNumber": 5, "email": "le.van.cuong@example.com", "accountId": "1f0c7a52-93d4-4b7e-8c1a-5e2b9d3f6a17" }
  ],
  "skipped": [
    {
      "rowNumber": 3,
      "email": "tran.thi.binh@example.com",
      "errors": [
        { "rowNumber": 3, "column": "fullName", "cell": "B3", "code": "REQUIRED", "message": "Họ và tên là bắt buộc." },
        { "rowNumber": 3, "column": "departmentCode", "cell": "D3", "code": "DEPARTMENT_INACTIVE", "message": "Phòng ban mã \"OLD\" đã ngừng áp dụng, không gán được nhân sự mới." }
      ]
    },
    {
      "rowNumber": 4,
      "email": "pham.thi.dung@example.com",
      "errors": [
        { "rowNumber": 4, "column": "email", "cell": "A4", "code": "EMAIL_ADDRESS_REFUSED", "message": "Máy chủ thư từ chối địa chỉ email này nên không gửi được email mời; chưa tạo tài khoản. Hãy kiểm tra lại email." }
      ]
    }
  ]
}
```

Khi máy chủ thư ngừng hoạt động ở dòng 3 của một tệp 4 dòng (dòng 2 đã tạo xong trước đó, dòng 4 sai email):

```json
{
  "totalRows": 4,
  "createdCount": 1,
  "skippedCount": 3,
  "stoppedAtRow": 3,
  "created": [
    { "rowNumber": 2, "email": "an@example.com", "accountId": "8d6f3b8e-2f5c-4f8e-9a51-6f1d2c7b9e40" }
  ],
  "skipped": [
    {
      "rowNumber": 3,
      "email": "binh@example.com",
      "errors": [
        { "rowNumber": 3, "column": null, "cell": null, "code": "ACCOUNT_EMAIL_UNAVAILABLE", "message": "Máy chủ thư không hoạt động nên không gửi được email mời; chưa tạo tài khoản. Việc nhập dừng ở dòng này; hãy nhập lại tệp khi máy chủ thư hoạt động." }
      ]
    },
    {
      "rowNumber": 4,
      "email": "sai-email",
      "errors": [
        { "rowNumber": 4, "column": "email", "cell": "A4", "code": "EMAIL_INVALID", "message": "Email không đúng định dạng, ví dụ đúng: nguyen.van.an@example.com." }
      ]
    },
    {
      "rowNumber": 5,
      "email": "cuong@example.com",
      "errors": [
        { "rowNumber": 5, "column": null, "cell": null, "code": "NOT_ATTEMPTED", "message": "Dòng hợp lệ nhưng chưa được nhập vì việc nhập đã dừng ở dòng 3 do máy chủ thư không hoạt động. Nhập lại tệp khi máy chủ thư hoạt động để tạo tài khoản này." }
      ]
    }
  ]
}
```

Header `Cache-Control: no-store`. Response là 200 kể cả khi không dòng nào được tạo hoặc server dừng giữa chừng.

| Trường | Ý nghĩa |
|---|---|
|totalRows|Số dòng nhân sự đọc được, bằng `totalRows` của xem trước cùng tệp và luôn bằng `createdCount + skippedCount`. Dòng trống không được đếm|
|createdCount|Số dòng thành công, tức số tài khoản đã tạo; bằng số phần tử của `created`|
|skippedCount|Số dòng bị bỏ qua (không tạo tài khoản, không gửi email); bằng số phần tử của `skipped`|
|stoppedAtRow|Số dòng Excel mà server không gửi được email mời vì máy chủ thư không hoạt động, rồi dừng tạo. `null` khi mọi dòng hợp lệ đều đã được thử. Giao diện nên báo rõ, ví dụ `Máy chủ thư lỗi ở dòng 3; các dòng sau chưa được nhập. Hãy nhập lại tệp sau.`|
|created|Các dòng đã tạo tài khoản chờ kích hoạt và gửi email mời. Mảng rỗng `[]` khi không tạo được dòng nào, không bao giờ `null`|
|created[].rowNumber|Số dòng Excel hiển thị bên trái sheet, giống `rowNumber` của xem trước|
|created[].email|Email như xem trước (bỏ khoảng trắng đầu/cuối, đổi về chữ thường)|
|created[].accountId|Id của tài khoản mới, dùng được với `GET /accounts/{id}`|
|skipped|Các dòng không được tạo tài khoản. Mảng rỗng `[]` khi mọi dòng đều được tạo, không bao giờ `null`|
|skipped[].rowNumber|Số dòng Excel|
|skipped[].email|Email như xem trước; `null` khi ô trống|
|skipped[].errors|Lý do bỏ qua, **luôn có ít nhất một phần tử**. Mỗi phần tử có các trường `rowNumber`, `column`, `cell`, `code`, `message` như lỗi của xem trước|

Mỗi dòng nhân sự có ở **đúng một** trong hai danh sách. Cả `created` và `skipped` đều theo thứ tự dòng trong tệp (số dòng tăng dần); trong một dòng, lỗi dữ liệu theo thứ tự cột A→F như xem trước. Vì vậy cùng tệp và cùng dữ liệu trong hệ thống luôn cho báo cáo theo cùng thứ tự.

#### Lý do bỏ qua

| Nguồn | Mã | `column` / `cell` | Khi nào | Nhập lại cùng tệp |
|---|---|---|---|---|
|Lỗi dữ liệu|Các mã ở [Kiểm tra từng dòng](#kiểm-tra-từng-dòng): `REQUIRED`, `TOO_LONG`, `EMAIL_INVALID`, `EMAIL_ALREADY_EXISTS`, `EMAIL_DUPLICATED_IN_FILE`, `ROLE_UNKNOWN`, `DEPARTMENT_NOT_FOUND`, `DEPARTMENT_INACTIVE`, `PHONE_INVALID`|Ô có lỗi|Dòng sai khi server kiểm tra lại lúc nhập (bước 3). `errors` giống hệt `errors` mà xem trước trả cho dòng đó vào cùng thời điểm, có thể nhiều lỗi (mỗi cột tối đa một)|Vẫn bị bỏ qua cho tới khi sửa tệp hoặc dữ liệu hệ thống|
|Đổi trong lúc nhập|`EMAIL_ALREADY_EXISTS`|`email`, ô cột A|Email vừa được dùng cho tài khoản khác sau khi server kiểm tra, ví dụ hai Admin nhập cùng lúc. Cùng mã với lỗi dữ liệu và với lỗi 409 của `POST /accounts`; message nói rõ là vừa xảy ra trong lúc nhập|Vẫn bị bỏ qua (email đã có tài khoản)|
||`INVALID_DEPARTMENT`|`departmentCode`, ô cột D|Phòng ban vừa ngừng áp dụng hoặc đổi mã. Cùng mã với lỗi 400 của `PUT /accounts/{id}`|Bị bỏ qua với `DEPARTMENT_NOT_FOUND` hoặc `DEPARTMENT_INACTIVE`|
|Gửi email mời|`EMAIL_ADDRESS_REFUSED`|`email`, ô cột A|Máy chủ thư từ chối địa chỉ người nhận|Được thử lại, nhưng nhiều khả năng lại bị từ chối nếu không sửa email|
||`ACCOUNT_EMAIL_UNAVAILABLE`|`null` / `null`|Máy chủ thư không hoạt động ở dòng này; dòng này là `stoppedAtRow`. Cùng mã với lỗi 503 của `POST /accounts`|Được thử lại|
||`NOT_ATTEMPTED`|`null` / `null`|Dòng hợp lệ nằm sau `stoppedAtRow` nên chưa được thử. Message nêu dòng đã dừng|Được thử lại|

Lý do thuộc nhóm "đổi trong lúc nhập" và "gửi email mời" luôn là lỗi duy nhất của dòng. `column` và `cell` chỉ là `null` khi lý do không nằm ở ô nào (hai mã cuối); lỗi của xem trước luôn có `column` và `cell`. Giao diện có thể ghép `Dòng 4, ô A4: <message>`, hoặc `Dòng 5: <message>` khi `cell` là `null`.

Báo cáo không chứa mật khẩu tạm, token kích hoạt hay câu trả lời gốc của máy chủ thư (mã SMTP, tên máy chủ). Server không lưu báo cáo: nó chỉ có trong response này, nên muốn xem lại sau thì frontend phải tự giữ hoặc cho người dùng tải xuống.

#### Lỗi và thời gian xử lý

Lỗi cấp tệp và lỗi quyền giống hệt [bảng Lỗi của xem trước](#lỗi) (400 `IMPORT_*`, `INVALID_MULTIPART`, 413 `FILE_TOO_LARGE`, 401, 403); khi gặp chúng chưa có tài khoản nào được tạo. Riêng 401 `SESSION_INVALID` và 403 `FORBIDDEN` còn có thể xảy ra giữa chừng như bảng ở trên.

Mỗi dòng hợp lệ được băm mật khẩu tạm (BCrypt) và gửi một email trong lúc request còn chờ, nên tệp nhiều dòng có thể mất từ vài chục giây tới vài phút (chưa đo trên máy thật). Phiên và token được kiểm lại ở mỗi dòng, mà access token chỉ sống 15 phút, nên frontend nên lấy token mới bằng `POST /auth/refresh` ngay trước khi nhập, hiện trạng thái đang xử lý, chặn bấm nhập lần hai và đặt thời gian chờ đủ dài. Nếu client ngắt kết nối giữa chừng, server có thể vẫn chạy tiếp tới hết tệp; xem lại danh sách tài khoản hoặc nhập lại cùng tệp như hướng dẫn ở trên.

### An toàn, database và phạm vi

Mọi ô trong tệp mẫu là ô chữ: không có công thức, macro hay liên kết ngoài. Tệp được tạo mới trong bộ nhớ ở mỗi yêu cầu, không ghi ra đĩa và không chứa dữ liệu tài khoản hoặc phòng ban, chỉ có tên các vai trò.

Khi đọc tệp tải lên, server không tính công thức và không chạy macro. Ngoài giới hạn 2 MB và 10 MB sau giải nén, Apache POI vẫn áp dụng các kiểm tra mặc định của `ZipSecureFile`, ví dụ từ chối tỉ lệ nén bất thường. Xem trước không mở transaction nên không giữ kết nối database trong lúc đọc tệp; hai truy vấn kiểm tra email và phòng ban chỉ chạy sau khi đọc xong.

Không thêm migration. Cả ba API khóa ngắn dòng `user_accounts` và `auth_sessions` của chính người gọi để kiểm quyền rồi commit ngay; ngoài ra tải tệp mẫu chỉ đọc bảng `roles` của V3, xem trước chỉ đọc quyền của người gọi, cột `email` của `user_accounts` và cột `code`, `active` của `departments`. Nhập thật ghi các bảng mà `POST /accounts` vẫn ghi (`user_accounts`, `user_roles`, `account_activation_tokens`), thêm các cột hồ sơ `department_id`, `phone`, `display_title` của V5, và chỉ khóa đọc (`FOR SHARE`) dòng `departments` được dùng. Tệp và nội dung tệp không được lưu ở đâu. Backend dùng thư viện Apache POI `poi-ooxml` 5.5.1 để tạo và đọc tệp `.xlsx`.

*Nguồn: `docs/api/account-import.md` (Sprint 2).*
