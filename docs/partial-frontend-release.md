# Phát hành Frontend từng phần

## Quy tắc

Không chờ toàn bộ Backend hoặc toàn bộ chuỗi PR hoàn thành. Một nhóm chức năng được bật khi API của chính nhóm đó đã được kiểm chứng trên Backend đích. Merge GitHub, API có trong source, API có trong JAR và API hoạt động đúng với người dùng thật là các bằng chứng khác nhau.

| Trạng thái | Hành vi |
| --- | --- |
| AVAILABLE | Dùng API thật; quyền/phạm vi vẫn do Backend quyết định. |
| NOT_IMPLEMENTED | Hiện “Chức năng này hiện chưa được Backend hỗ trợ”; khóa thao tác. Chỉ dùng khi đã có bằng chứng API thiếu ở bản đích. |
| ERROR | Hiện lỗi cần xử lý; phân tích Frontend, Backend, cấu hình. Không đổi 400/401/403/404/409/500 thành NOT_IMPLEMENTED tự động. |
| NOT_VERIFIED | Hiện thông báo chưa xác minh và khóa thao tác. Không suy diễn là Backend thiếu API. |

Không có manifest hợp lệ thì các nhóm API mới mặc định NOT_VERIFIED. Điều này không vô hiệu hóa toàn bộ Frontend hoặc bắt chờ một release Backend đầy đủ. Các adapter bulk/assigned-profile chưa hoàn chỉnh vẫn không được bật chỉ bằng cấu hình AVAILABLE.

## Bằng chứng VPS ngày 2026-10-20

Chỉ kiểm tra đọc, không deploy/restart hay truy cập database:

- SSH đọc `docker exec ttcs-backend-1 sha256sum /app/backend.jar`: `26c43bd9fe96e420da323bb8bc3e29cd1ffd452df43bb974aa15a480d1736c31`.
- SHA256 khớp JAR local `api-live-20261018-inspect.jar` đã tải từ VPS.
- GET `http://127.0.0.1:8080/api/v1/health` trong container trả `status=UP`.
- `javap -v` trên controller của JAR đã đối chiếu cho thấy cả các route lịch, phiếu đánh giá và participant picker dưới đây. Không suy luận từ PR #191/#201 rằng API đã deploy.
- Backend #191 tại `faba268fc3e174e2d11463db325f2ba021292342` và #201 tại `fdd7c93ffb64c50c964257f8b836ddf1c4cb6b8d` vẫn open, chưa merge khi đối chiếu.
- Chưa có phiên đăng nhập được cung cấp cho kiểm chứng role/application scope; không chạy thao tác ghi lên dữ liệu thật.

| Chức năng / endpoint | Bằng chứng bản VPS | Trạng thái hiện tại | Điều kiện bật |
| --- | --- | --- | --- |
| GET `/api/v1/health` | Gọi trong container thành công | AVAILABLE (liveness nội bộ) | Không chứng minh proxy/CORS/DB nghiệp vụ |
| POST/GET `/applications/{id}/interviews` | Mapping có trong JAR đang chạy | NOT_VERIFIED | Kiểm thử scope và tạo lịch ở môi trường/dữ liệu kiểm thử được duyệt |
| GET `/interviews/me`, GET `/interviews/{id}` | Mapping có trong JAR | NOT_VERIFIED | Phiên hợp lệ, chỉ thấy đúng panel, phân trang |
| GET `/applications/{id}/interview-participants` | Mapping có trong JAR, độc lập trạng thái #201 | NOT_VERIFIED | Phân quyền/application scope, response `{items:[{id,fullName}],totalElements,page,size}` |
| POST `/interviews/conflicts` | Mapping có trong JAR | NOT_VERIFIED | Trùng người/phòng, quyền xem resource, không lộ hồ sơ khác |
| PUT `/interviews/{id}`, POST `.../cancel` | Mapping có trong JAR | NOT_VERIFIED | Version, lý do, 409, không mất dữ liệu |
| POST/GET/PUT `/interviews/{id}/evaluations/me` | Mapping có trong JAR | NOT_VERIFIED | Snapshot, quyền panel, lưu nháp thực tế |
| POST `.../evaluations/me/submit` | Mapping có trong JAR | NOT_VERIFIED | Backend SUBMITTED, kết thúc phỏng vấn, version và HTTP error |
| GET `.../evaluations` | Mapping có trong JAR | NOT_VERIFIED | Blind review trước/sau own submission |
| GET `.../{formId}/status`, POST `.../{formId}/reopen` | Mapping có trong JAR | NOT_VERIFIED | RECRUITER + grants + scope, lý do/version/cửa sổ 24h |
| Bulk/calendar invite, assigned-profile/CV | Chưa kiểm chứng contract chạy thực tế; Frontend chưa có adapter đã xác minh | NOT_VERIFIED | Xác minh riêng trước khi thiết kế/bật adapter; không gọi là API thiếu chỉ vì chưa merge |
| Authentication, portal, các module cũ khác | Không được smoke-test lại trong bước này | NOT_VERIFIED trong báo cáo phát hành này | Giữ chức năng đã được chứng minh bởi biên bản kiểm thử riêng; không coi báo cáo này là xác nhận toàn hệ thống |

Không ghi NOT_IMPLEMENTED hoặc ERROR cho một API VPS nếu chưa có đủ bằng chứng. Ba finding P2 là lỗi tích hợp Frontend đã xử lý, không phải bằng chứng lỗi Backend.

## Cấu hình nhóm tính năng khi build (đề xuất, chưa áp dụng)

`VITE_BACKEND_CAPABILITIES` là JSON công khai, không phải secret. Các khóa: `apiBaseUrl` phải khớp VITE_API_BASE_URL, `backendSha256` là SHA256 JAR đã xác minh, `verifiedAt` là mốc xác minh, `features` gồm `schedules` (đọc lịch), `scheduleWrites` (tạo/sửa/hủy/xung đột), `participantPicker`, `evaluations`, `reopening`, `assignedProfile`, `bulkScheduling`.

Ví dụ cấu trúc để Repository Admin điền từ bằng chứng kiểm thử; **không sao chép AVAILABLE khi chưa kiểm thử**:

```json
{
  "apiBaseUrl": "https://BACKEND-DA-XAC-MINH/api/v1",
  "backendSha256": "SHA256_64_KY_TU_CUA_JAR_DA_XAC_MINH",
  "verifiedAt": "THOI_DIEM_XAC_MINH_ISO_8601",
  "features": {
    "schedules": "NOT_VERIFIED",
    "scheduleWrites": "NOT_VERIFIED",
    "participantPicker": "NOT_VERIFIED",
    "evaluations": "NOT_VERIFIED",
    "reopening": "NOT_VERIFIED",
    "assignedProfile": "NOT_VERIFIED",
    "bulkScheduling": "NOT_VERIFIED"
  }
}
```

Manifest là xác nhận của người vận hành, không phải cơ chế tự kiểm tra SHA trên server và không thay thế authorization. Khi đổi Backend hoặc API origin phải xác minh lại và build lại manifest. Cấu hình sai/mất bằng chứng mặc định NOT_VERIFIED. File setup Vitest dùng manifest riêng chỉ để test HTTP mocks; không được dùng làm bằng chứng deploy.

## Kế hoạch phê duyệt phát hành từng phần

1. Merge Frontend sau khi ba P2 được review, CI xanh và cơ chế khóa riêng được chấp nhận. Không bắt buộc merge cả chuỗi Backend trước.
2. Lập danh sách nhóm muốn phát hành và phiên bản Backend đích thực tế. Xác minh trên môi trường kiểm thử tương ứng; đọc JAR/health không đủ thay smoke test có xác thực.
3. Chỉ chuyển nhóm đạt kiểm thử sang AVAILABLE. Ví dụ lịch đã đạt nhưng đánh giá chưa đạt: bật schedules; scheduleWrites/evaluations/reopening giữ NOT_VERIFIED. Lịch vẫn tải được, trạng thái đánh giá là unknown, không bị giả định đã/chưa nộp.
4. Picker và scheduleWrites cần AVAILABLE riêng để tạo lịch; đọc lịch không phụ thuộc picker. API thật lỗi phải được điều tra, không tự hạ thành unsupported. Reopen cần RECRUITER, grants đọc/ghi phỏng vấn, đọc ứng viên; Backend quyết định phạm vi application.
5. Chạy CI/build với cấu hình phát hành đã duyệt; kiểm tra URL/proxy/CORS và smoke test từng nhóm trước khi đưa artifact Frontend lên VPS. Không chạy migration hay nâng Backend chỉ để deploy FE.
6. Cần xử lý hoặc vô hiệu hóa riêng các thao tác note/tag/rating cũ trước khi đưa chúng vào phạm vi phát hành: `candidateProfileService` còn fallback thành công local ở develop. Không tuyên bố chúng đạt nguyên tắc không thành công giả. Các thao tác này nằm ngoài adapter phỏng vấn của PR và không được đưa vào danh sách đã nghiệm thu.
7. Chuẩn bị artifact Frontend cũ để rollback tài nguyên tĩnh. Bản này không thay VPS/database/SMTP/secrets hoặc DEPLOY_ENABLED; deployment cần phê duyệt riêng.
