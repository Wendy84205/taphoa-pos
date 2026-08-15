# Native Build Acceptance — iPhone và Android

Expo Go qua tunnel sandbox không phải luồng nghiệm thu ổn định. Dùng **native build trực tiếp** tạo từ nút Publish/Build của dự án, sau đó cài lên ít nhất một iPhone và một Android thật.

## Chuẩn bị build

| Hạng mục | iPhone | Android |
|---|---|---|
| Bản cài | IPA/TestFlight hoặc build ad hoc phù hợp | APK/AAB test phù hợp |
| Backend | HTTPS staging/production, không dùng localhost | HTTPS staging/production, không dùng localhost |
| Tài khoản | Owner test và Staff test | Owner test và Staff test |
| Mạng | Wi-Fi và 4G/5G | Wi-Fi và 4G/5G |

## Luồng UX cần nghiệm thu

1. Cài app sạch, mở lần đầu, đăng ký/đăng nhập email hoặc số điện thoại, rồi chọn Solo hoặc WithStaff.
2. Đóng và mở lại app; xác nhận session native nằm trong SecureStore và không yêu cầu đăng nhập lại sai cách.
3. Với WithStaff, đăng nhập PIN tại quầy; thử sai nhiều lần và kiểm tra lockout.
4. Bán một hóa đơn, thêm sổ nợ/chuyển khoản/VietQR/khuyến mãi; đóng ca, in/chia sẻ hóa đơn nếu thiết bị có hỗ trợ.
5. Cấp quyền camera rồi quét barcode; từ chối quyền và kiểm tra thông báo/luồng thay thế.
6. Tắt mạng, bán offline; bật mạng lại và xác minh đồng bộ không tạo bản ghi trùng hoặc ghi đè tenant khác.
7. Thử backup/restore trên owner; kiểm tra Staff bị chặn các màn owner-only.
8. Mở deep link/callback login, đổi sáng/tối, xoay màn hình nếu thiết bị hỗ trợ và kiểm tra vùng safe area.

Chỉ đánh dấu đạt khi mọi bước trong `DEVICE_TEST_CHECKLIST.md` được thực hiện trên thiết bị thật. Nếu có lỗi, lưu model máy, OS, bản build, request ID, ảnh/video tái hiện và các bước thao tác tối thiểu.
