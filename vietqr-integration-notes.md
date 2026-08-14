# Ghi chú tích hợp VietQR

Nguồn chính thức: [VietQR.io API tạo mã QR](https://www.vietqr.io/en/danh-sach-api/link-tao-ma-nhanh/api-tao-ma-qr/) và [VietQR.vn tài liệu tích hợp](https://doc.vietqr.vn/doc/api-vietqr-callback/api-vietqr-host2host/integrated-document-for-payment-service-vietqr).

API `POST https://api.vietqr.io/v2/generate` cần `x-client-id` và `x-api-key`; dữ liệu yêu cầu gồm số tài khoản `accountNo`, mã BIN ngân hàng `acqId`, tên chủ tài khoản, cùng số tiền và nội dung chuyển khoản tùy chọn. Phản hồi có thể chứa chuỗi QR `qrCode` và ảnh dạng Data URI `qrDataURL`.

Trong bản POS offline-first, màn thanh toán sẽ dùng cấu hình số tài khoản, BIN và tên chủ tài khoản lưu tại máy; mã QR chỉ đóng vai trò hướng dẫn khách chuyển khoản. Hệ thống không tự xác nhận tiền đã vào tài khoản nếu chưa có dịch vụ callback/reconciliation từ nhà cung cấp VietQR. Khi triển khai callback chính thức, cần dùng máy chủ công khai, đăng ký thông tin kết nối và quản lý thông tin xác thực ngoài ứng dụng.
