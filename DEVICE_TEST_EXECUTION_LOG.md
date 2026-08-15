# Device Test Execution Log

## Phạm vi sandbox đã xác minh

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Android bundle | Đạt | Expo export thành công |
| iOS bundle | Đạt | Expo export thành công |
| Web bundle | Đạt | 24 static routes export thành công |
| TypeScript/lint | Đạt | Không có lỗi TypeScript/lint; còn warning module type hiện hữu |
| Offline-first state | Đạt ở unit/LAN smoke | Chưa thay thế kiểm thử mất mạng trên máy thật |
| SecureStore contract | Đã rà soát mã nguồn | Cần xác nhận lifecycle trên iPhone/Android thật |
| Camera barcode | Có implementation/bundle | Cần test permission và camera thật |
| Share Excel/PDF/JSON | Có implementation/bundle | Cần xác nhận share sheet thật |
| Print/price labels | Có implementation/bundle | Cần xác nhận dialog/Bluetooth printer thật |
| LAN full-state | Smoke test trước đó đạt | Cần lặp lại với laptop và điện thoại cùng Wi-Fi thật |

## Các mục chưa thể xác nhận trong sandbox

Việc export bundle không chứng minh camera, SecureStore, share sheet, Bluetooth printing, deep link, app lifecycle, bàn phím/back gesture hoặc hành vi mất mạng hoạt động đúng trên phần cứng. Các mục này cần chạy bằng bản Publish/Build trên ít nhất một iPhone và một Android thật, sử dụng tài khoản test và dữ liệu test riêng.

## Quy trình chạy trên thiết bị thật

Cài build qua luồng Publish/Build, đăng nhập tài khoản test, chọn Solo và WithStaff, kiểm tra staff PIN, bán tiền mặt/chuyển khoản/ghi nợ, đối soát, khuyến mãi/combo, tắt mạng, scan barcode, xuất/chia sẻ file, in, đóng/mở app và LAN cùng Wi-Fi. Ghi lại kết quả Pass/Fail, model/OS, thời gian, ảnh lỗi và log; không dùng dữ liệu khách hàng thật trong lượt kiểm thử đầu tiên.

## Điều kiện ký xác nhận

Chỉ đánh dấu hoàn tất sau khi không mất dữ liệu sau restart/mất mạng, tenant A không đọc được tenant B, staff không vượt owner guard, tổng đối soát không thấp hơn hóa đơn và combo không làm tổng tiền âm hoặc vượt subtotal.
