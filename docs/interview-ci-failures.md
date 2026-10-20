# PR #157 — phân loại 44 CI failure

Nguồn: [CI run 39434883952](https://github.com/VuVietMinh88/He_Thong_Tuyen_Dung_Noi_Bo_Frontend/actions/runs/39434883952), đọc toàn bộ log job 118669168621. Kết quả cũ: 1235 pass / 44 fail / 1279 tests, 10 file lỗi.

Đối chiếu Backend PR #191 tại `faba268fc3e174e2d11463db325f2ba021292342`; PR còn open, chưa merge. Backend develop tại `c6c374d686d4f02e252832d8ed81d4583926c840`. Các contract nhánh PR không được coi là đã deploy. Không kiểm tra hay thay đổi VPS/database/secrets.

| # | File / test gốc | Nguyên nhân và xử lý |
|---|---|---|
| 1 | `tests/batchInterviewHelper.test.ts` — trả về hợp lệ khi mọi thông số đáp ứng chuẩn AC | Fixture thời gian 2026-10-20 đã qua khi CI chạy; cố định clock trước ngày fixture. |
| 2 | `tests/batchInterviewSchedule.test.tsx` — gọi API POST /recruitment/interviews/batch-schedule khi backend phản hồi thành công | Endpoint batch chưa tồn tại trong contract #191; kiểm tra 501 và không gửi request. |
| 3 | `tests/batchInterviewSchedule.test.tsx` — fallback lưu trữ localStorage khi backend trả về lỗi mạng | Fallback ghi batch offline trái quy tắc; kiểm tra không ghi localStorage. |
| 4 | `tests/batchSchedulePreview.test.tsx` — gọi API backend khi nhấn nút xác nhận và truyền cờ sendCalendarInvite | Calendar invite/batch chưa có contract; không mô phỏng gửi thành công. |
| 5 | `tests/interviewConflict.test.ts` — trả về hasConflict = false khi không có trùng lặp về người hay phòng | Thiếu applicationId và HTTP mock; mock resource-only response rỗng. |
| 6 | `tests/interviewConflict.test.ts` — phát hiện xung đột INTERVIEWER_CONFLICT khi trùng người phỏng vấn trong cùng khung giờ | Thiếu applicationId/mock; bổ sung phân loại INTERVIEWER_CONFLICT, không lấy PII từ cache. |
| 7 | `tests/interviewConflict.test.ts` — phát hiện xung đột ROOM_CONFLICT khi trùng phòng họp trực tiếp OFFLINE trong cùng khung giờ | Thiếu applicationId/mock; bổ sung phân loại ROOM_CONFLICT. |
| 8 | `tests/interviewConflict.test.ts` — phát hiện xung đột BOTH khi trùng cả người phỏng vấn và phòng họp | Thiếu applicationId/mock; giữ phân loại BOTH và đủ hai resource. |
| 9 | `tests/interviewConflict.test.ts` — mặc định ném InterviewerConflictError (Blocking Error) khi có trùng lịch và không kích hoạt ghi đè | Test dựa cache thay vì Backend, gây localhost; mock 409 INTERVIEW_CONFLICT và kiểm tra không lộ chi tiết. |
| 10 | `tests/interviewConflict.test.ts` — ném InterviewApiError khi isOverride = true nhưng thiếu lý do ghi đè hoặc lý do dưới 5 ký tự | Validation lý do thiếu; giữ chặn khoảng trắng; bỏ giả định tối thiểu 5 ký tự không có trong Backend. |
| 11 | `tests/interviewConflict.test.ts` — cho phép lưu lịch thành công khi isOverride = true và có lý do ghi đè hợp lệ (>= 5 ký tự) | Thiếu mock response DTO; kiểm tra request overrideConflicts/reason và server SCHEDULED, không nhật ký giả. |
| 12 | `tests/interviewConflict.test.ts` — xử lý phản hồi lỗi 409 từ backend và ném InterviewerConflictError | Mock dùng code cũ INTERVIEWER_CONFLICT; đổi sang code Backend INTERVIEW_CONFLICT. |
| 13 | `tests/interviewConflictService.test.ts` — ném InterviewConflictValidationError khi thiếu applicationId | Wrapper không kiểm tra applicationId; bổ sung lỗi validation trước request. |
| 14 | `tests/interviewConflictService.test.ts` — ném InterviewConflictValidationError khi lý do ghi đè để trống | Thông báo validation không nhất quán; thống nhất lý do không được để trống. |
| 15 | `tests/interviewConflictService.test.ts` — ném InterviewConflictValidationError khi lý do ghi đè dưới 5 ký tự | Test áp đặt tối thiểu 5 ký tự; kiểm tra lý do ngắn không rỗng được gửi theo contract. |
| 16 | `tests/interviewConflictService.test.ts` — gọi API thành công, lưu vào LocalStorage và đồng bộ Timeline sự kiện ghi đè | DTO mock thiếu startsAt/endsAt/mode/version/participantIds; thay DTO thật, không cache/timeline giả. |
| 17 | `tests/interviewConflictService.test.ts` — fallback lưu dữ liệu offline khi mạng lỗi hoặc máy chủ chưa sẵn sàng | Test kỳ vọng thành công offline; giữ lỗi mạng và không ghi local. |
| 18 | `tests/interviewConflictService.test.ts` — bắt lỗi 403 Forbidden và ném InterviewConflictForbiddenError khi tài khoản không có quyền ghi đè | MockRejectedValueOnce nhưng test gọi hai lần gây localhost; mock persistent, giữ forbidden class/status/message. |
| 19 | `tests/interviewConflictService.test.ts` — bắt lỗi 400 Bad Request từ Backend và ném InterviewConflictValidationError | Implementation chưa ánh xạ HTTP 400 của override thành validation error; sửa wrapper. |
| 20 | `tests/interviewConflictService.test.ts` — bắt lỗi 500 Server Error và ném InterviewApiError | Implementation để lọt AxiosError 500; ánh xạ InterviewApiError giữ status/code. |
| 21 | `tests/interviewEvaluationService.test.ts` — reopens evaluation when requested by a recruiter | Endpoint/payload reopen cũ candidateId, thiếu expectedVersion; dùng interview/form/version/reason, metadata DRAFT. |
| 22 | `tests/interviewEvaluationService.test.ts` — rejects reopening when candidateId is empty | Validation reopen thiếu interviewId; bổ sung chặn ID rỗng và kiểm tra đúng thông báo. |
| 23 | `tests/interviewSchedule.test.tsx` — lấy danh sách người phỏng vấn nội bộ và hỗ trợ tìm kiếm theo tên, chức danh, email | Participant picker chưa có contract; kiểm tra unavailable/no request thay vì sample people. |
| 24 | `tests/interviewSchedule.test.tsx` — chặn lưu lịch nếu thiếu thông tin bắt buộc hoặc thời gian quá khứ | Fixture thiếu nhiều required fields/ISO nên sai nhánh validation; cô lập trường sai, khôi phục required-field checks. |
| 25 | `tests/interviewSchedule.test.tsx` — lưu lịch phỏng vấn thành công vào LocalStorage và đồng bộ Timeline | Thiếu applicationId/mock và kỳ vọng lưu local; dùng server DTO, GET phân trang theo applicationId. |
| 26 | `tests/interviewServiceIntegration.test.ts` — báo lỗi khi thiếu applicationId, vòng phỏng vấn, link họp hoặc người phỏng vấn | Required-field validation bị mất ở implementation; khôi phục và giữ assertion nghiệp vụ. |
| 27 | `tests/interviewServiceIntegration.test.ts` — gọi axiosClient.post đến endpoint backend khi dữ liệu hợp lệ | Endpoint/payload/DTO tạo lịch cũ; đối chiếu exact whitelist contract mới, giữ ID/version. |
| 28 | `tests/interviewServiceIntegration.test.ts` — xử lý lỗi Backend response: 400 Past Time ném InterviewPastTimeError | Mock dùng PAST_TIME_NOT_ALLOWED không có trong #191; Backend trả 400 VALIDATION_ERROR, giữ status/code/message; client past-time test vẫn giữ. |
| 29 | `tests/interviewServiceIntegration.test.ts` — xử lý lỗi Backend response: 409 Conflict ném InterviewerConflictError | Mock code conflict cũ; dùng INTERVIEW_CONFLICT, không gộp mọi 409 thành resource conflict. |
| 30 | `tests/interviewServiceIntegration.test.ts` — xử lý lỗi Backend response: lỗi khác ném InterviewApiError | Implementation lỗi HTTP chung không được typed; giữ InterviewApiError status/errorCode. |
| 31 | `tests/interviewServiceIntegration.test.ts` — lấy danh sách lịch phỏng vấn theo applicationId từ server hoặc local fallback | Array response cũ; dùng InterviewPage, không fabricating candidate PII. |
| 32 | `tests/interviewServiceIntegration.test.ts` — fallback đọc đúng từ LocalStorage khi backend offline | Read fallback dùng cache chưa xác thực; kiểm tra lỗi mạng thay vì trả dữ liệu private. |
| 33 | `tests/interviewServiceIntegration.test.ts` — lọc chính xác lịch cá nhân theo ID người phỏng vấn được phân công | Client userId không quyết định scope; kiểm tra /interviews/me không truyền ID override tài khoản. |
| 34 | `tests/interviewServiceIntegration.test.ts` — lọc theo ngày cụ thể và tìm kiếm từ khóa | Fixture cache cũ/search candidate PII không có trong DTO; mock paginated server rounds/location, giữ membership/ngày/search. |
| 35 | `tests/interviewServiceIntegration.test.ts` — cập nhật trạng thái buổi phỏng vấn (updateInterviewStatus) | COMPLETED thủ công chưa có contract; kiểm tra chặn, thêm cancel expectedVersion/reason và server status/version. |
| 36 | `tests/interviewerCalendarPage.test.tsx` — cung cấp nút mở xem trước CV ứng viên trực tiếp trong hệ thống | SSR không chạy effect, không còn fake default records; test-only state harness với fixture, CV disabled rõ ràng. |
| 37 | `tests/interviewerCalendarPage.test.tsx` — hiển thị thẻ cảnh báo và nút thao tác nộp phiếu đánh giá năng lực | SSR thiếu records; test-only state harness, giữ action đánh giá và không hiển thị đã nộp. |
| 38 | `tests/interviewerCalendarService.test.ts` — calls /my-schedule endpoint and enriches with evaluation status | Endpoint /my-schedule và array cũ; dùng /interviews/me + own evaluation GET. |
| 39 | `tests/interviewerCalendarService.test.ts` — filters schedule by status and search query keyword | Array/COMPLETED/candidate-name search không thuộc DTO; dùng paginated CANCELLED/roundName và giữ membership. |
| 40 | `tests/interviewerCalendarService.test.ts` — falls back to local storage and filters by user ID if API fails | Offline cache scope cũ; lỗi mạng phải truyền ra, không fallback private data. |
| 41 | `tests/interviewerCalendarService.test.ts` — returns candidate profile and CV when interviewer is authorized via API | Assigned-profile/CV chưa có contract #191; 501 và không HTTP. |
| 42 | `tests/interviewerCalendarService.test.ts` — throws InterviewerAccessForbiddenError (403) when server returns 403 Forbidden | Không có endpoint assigned-profile đã xác minh để mock 403; 501/no request, không giả vờ hỗ trợ. |
| 43 | `tests/interviewerCalendarService.test.ts` — throws InterviewerAccessForbiddenError when current user is NOT in interview panel (client validation fallback) | Không được tin cache panel để mở CV; 501/no request dù local chứa hồ sơ khác. |
| 44 | `tests/interviewerCalendarService.test.ts` — submits evaluation and updates local status without page reload | Submit payload tổng điểm/PASSED cũ; dùng viewed expectedVersion, criterionId answers, HIRE, xác nhận server SUBMITTED rồi GET trạng thái. |

## Kiểm tra

- Giữ nguyên hai file 15 regression test `evaluationApiContract.test.ts` (10) và `interviewApiContract.test.ts` (5).
- Giữ số test case của 10 file cũ; không skip/xóa/vô hiệu hóa. Thay các kỳ vọng không còn contract bằng kiểm tra unavailable/không thành công giả.
- Thêm 19 regression case HTTP errors/version conflict/draft-vs-submitted/server status; mọi HTTP dùng mock, không cần Backend local.
- TypeScript `tsc -p tsconfig.app.json --noEmit --incremental false`: pass.
- Nhóm 13 file liên quan: 145 pass / 0 fail, bao gồm nguyên vẹn 15 regression cũ. Lần đầu sandbox lỗi ENOENT thư mục temp trước khi thu thập test; chạy lại ngoài sandbox thành công.
- Không chạy toàn bộ test/build local; toàn bộ suite/build do GitHub CI sau push xác nhận.

## Chức năng chưa thể khôi phục bằng test thành công

Bulk scheduling/calendar invite, participant picker và assigned-profile/CV không thuộc contract #191 đã đối chiếu. Test xác nhận chặn và không gửi request, không giả lập thành công trong production. Nút CV lịch cá nhân disabled, có giải thích. API đánh giá/lập lịch còn phụ thuộc PR #191 được review/merge và phát hành riêng; CI Frontend xanh không xác nhận Backend đã triển khai.
