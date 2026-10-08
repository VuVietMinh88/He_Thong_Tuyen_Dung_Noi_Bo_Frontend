# Giới hạn của bản bàn giao

Gói phục vụ chạy thử và tích hợp frontend trên máy cá nhân. Có mã của 40 subtask Sprint 2 theo các commit trong MANIFEST; điều này không thay thế nghiệm thu Jira hoặc xác nhận sẵn sàng triển khai production.

Hai phát hiện P2 từ lượt review backend trước vẫn còn trong snapshot nguồn này:

1. Một số lệnh sửa (yêu cầu tuyển dụng, chức danh, khung năng lực và gắn khung) kiểm hạn JWT trước khi chờ khóa bản ghi nghiệp vụ, chưa kiểm lại sau khi chờ. Nếu token hết hạn ngay trong khoảng chờ, lệnh sửa có thể vẫn thành công. Lỗi đã được tái hiện với sửa yêu cầu tuyển dụng; các nhánh còn lại được xác định từ luồng mã. Cần sửa và kiểm thử lại trước phát hành.
2. Import Excel có thể nhận họ tên chỉ gồm khoảng trắng Unicode U+2003, khác với validation của API tạo tài khoản. Cần thống nhất kiểm tra tên bắt buộc ở preview và import.

Các lỗi trên không được che bằng việc bỏ test. Bộ kiểm thử hiện có chưa bao phủ đầy đủ chúng; kết quả test đạt không có nghĩa hai lỗi đã được sửa. Khi thử import, nhập họ tên có chữ; tránh dùng gói này cho dữ liệu thật.

Máy đóng gói không có Docker Engine, nên chưa chạy thực tế bộ container. Cấu hình Compose và Dockerfile được cung cấp cho người nhận; kết quả kiểm chứng Java/PostgreSQL và những kiểm tra đã chạy ghi trong VERIFICATION.md.

Luồng email ở cách chạy Java cần Mailpit hoặc SMTP riêng. Cách Docker đã khai báo Mailpit. Gói không đi kèm dữ liệu nghiệp vụ của máy người gửi và không có frontend.

Trong lúc đóng gói đã sửa riêng một lỗi test ngẫu nhiên: `StaffImportIntegrationTest` tìm `550`/`451` trên toàn response nên nhầm UUID có chuỗi số đó thành lỗi lộ thông tin SMTP. Bản test trong gói chỉ kiểm `code`/`message` của các lỗi import. Chi tiết lượt kiểm thử trước và sau sửa nằm trong VERIFICATION.md; thay đổi này không sửa hai lỗi nghiệp vụ nêu trên.
