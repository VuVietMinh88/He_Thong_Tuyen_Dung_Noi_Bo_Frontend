# Kiểm chứng gói bàn giao — 2026-10-07

Trạng thái phát hành production: **NOT READY**. Hai lỗi P2 đã biết còn trong nguồn và Docker chưa chạy thực tế; xem KNOWN_ISSUES.md. Gói ZIP được bàn giao để FE chạy thử local với các bằng chứng bên dưới, không phải xác nhận nghiệm thu Jira hay phát hành production.

| Kiểm tra | Kết quả |
|---|---|
| Mã của 40 subtask từ 6 commit được đưa vào bản ghép | PASS — đối chiếu ancestry và MANIFEST |
| Lượt đầy đủ Maven clean verify | 2.001 tests / 63 suites; 1 failure do assert test import nhầm UUID có chuỗi 451; 0 errors/skipped |
| Kiểm tra lại sau khi sửa test | PASS — cả 9 test của StaffImportIntegrationTest; verify/build thành công |
| Kết quả mới nhất theo từng suite | 2001 tests, 63 suites; 0 failures/errors/skipped |
| JaCoCo gate theo pom.xml | PASS trong verify tiếp theo, dùng dữ liệu coverage tích lũy của cả hai lượt |
| PostgreSQL dùng cho full test | 16.15, database tạm riêng |
| Chạy JAR, script tạo env/CSDL và đăng nhập từ thư mục có dấu cách | PASS |
| Migrations trên CSDL trống | PASS — 14 migration, Flyway đến V13 (gồm V7.1) |
| accessToken + user.roles, tên admin UTF-8, API có xác thực | PASS |
| 12 API GET chính, ghi/đọc trang công ty, request thiếu token trả 401 | PASS |
| CORS cho http://localhost:5173 | PASS |
| Chạy lại tạo env giữ nguyên mật khẩu/config | PASS |
| PowerShell scripts | Phân tích cú pháp thành công; native scripts đã chạy thực tế |
| JAR và SQL đi kèm | SHA256 khớp 14 migration; class version 65 (Java 21) |
| Thư viện runtime trong JAR | PASS kiểm tra bytecode 100 thư viện; không có class áp dụng cho Java 21 yêu cầu phiên bản cao hơn |
| Compose | Parse YAML và kiểm tra biến env/network/dependency; chưa chạy Docker Engine |
| Bí mật và dữ liệu máy người gửi | Không đóng .env thật, cache, logs, .git hay dữ liệu PostgreSQL |

Build/test dùng JDK 25.0.4 và compiler release 21. Dockerfile yêu cầu Temurin 21; chưa kiểm runtime JDK 21 riêng hoặc bộ container trên máy này. Native smoke dùng server PostgreSQL 16.15 và psql client 18. Native smoke tạo dữ liệu tổng hợp trong database tạm rồi dừng tiến trình; dữ liệu đó không nằm trong ZIP.

Lệnh kiểm thử nguồn (Maven cache trên máy đóng gói đã có dependency):

```powershell
.\mvnw.cmd -o '-Dmaven.repo.local=C:\Users\lamla\.m2\repository' clean verify
.\mvnw.cmd -o '-Dmaven.repo.local=C:\Users\lamla\.m2\repository' '-Dtest=StaffImportIntegrationTest' '-Djacoco.append=true' verify
```

Người nhận dùng `.\mvnw.cmd clean verify` trong `source`; cần Internet ở lần tải dependency đầu tiên.

Bốn fixture test cũ dùng ADMIN để tạo chức danh có dải lương đã được đổi sang HR_MANAGER theo V7.1; các trường hợp từ chối quyền vẫn được kiểm tra. Bản ghép hợp nhất bảng kiểm quyền của sáu nhánh, giữ rule ngân hàng câu hỏi/xóa phòng ban và loại handler upload trùng nhau. Sau lượt test đầy đủ, chỉ sửa hai assert SMTP trong test import để kiểm code/message lỗi; mã sản phẩm không đổi. Đã chạy lại toàn bộ lớp test bị ảnh hưởng, không chạy lại toàn bộ 63 suite lần thứ hai. Các nhánh gốc không bị sửa.

Hai phát hiện review nghiệp vụ còn lại và lỗi test import đã sửa được ghi rõ trong KNOWN_ISSUES.md. Test đạt không chứng minh hai lỗi nghiệp vụ đó đã hết. Trước phát hành cần sửa chúng, kiểm thử Docker thực tế, kiểm tra frontend theo hợp đồng API và hoàn tất nghiệm thu yêu cầu.

JAR SHA256: `6fc5c08fee8537d475bf5a0ac789a0ff3e48dd6ae157f4bc0f2776af3352d378`. `CHECKSUMS.sha256` chứa checksum từng file của gói; file `.zip.sha256` ở cạnh ZIP chứa checksum toàn bộ ZIP.

Khôi phục khi chạy thử: dừng backend bằng Ctrl+C, giữ CSDL/volume để lần sau chạy tiếp. Chỉ dùng database mới cho gói này. Muốn quay về một bản có schema khác, dùng database mới hoặc backup phù hợp; không tự sửa Flyway history của database đang có dữ liệu.
