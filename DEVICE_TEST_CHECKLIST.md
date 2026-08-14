# Checklist kiểm thử thiết bị thật

## iPhone

- Cài bản Expo iOS qua luồng Publish/Build và đăng nhập tài khoản test.
- Chọn Solo rồi xác nhận không hiện Vận hành, nhân viên, đóng ca và audit.
- Chuyển sang Có nhân viên, tạo staff, đăng nhập PIN 4–6 số và thử PIN sai 5 lần.
- Bán hàng tiền mặt, chuyển khoản và ghi nợ; mở Hóa đơn và xác nhận đối soát thủ công.
- Tạo khuyến mãi phần trăm, giảm tiền và combo; checkout để kiểm tra giá sau giảm.
- Tắt mạng, bán hàng/nhập hàng, khôi phục mạng và kiểm tra cloud conflict.
- Quét barcode bằng camera, xuất Excel/PDF/JSON, khôi phục backup JSON.
- In hóa đơn/tem giá hoặc mở hộp thoại in; kiểm tra quyền chia sẻ.
- Kiểm tra SecureStore/session sau khi đóng và mở lại app.

## Android

- Lặp lại toàn bộ luồng iPhone; kiểm tra adaptive icon, bàn phím và back gesture.
- Kiểm tra camera permission lần đầu và lần từ chối quyền.
- Kiểm tra chia sẻ file, Android print dialog và app lifecycle khi chuyển nền.
- Kiểm tra LAN full-state trên cùng Wi-Fi với laptop quầy.

## Điều kiện đạt

- Không mất dữ liệu sau restart app hoặc mất mạng.
- Tenant A không thể đọc/sửa dữ liệu tenant B.
- Staff không sửa giá, xóa sản phẩm hoặc xóa hóa đơn nếu không có owner guard.
- Số tiền đối soát xác nhận không được nhỏ hơn tổng hóa đơn.
- Khuyến mãi/combo không làm tổng thanh toán âm hoặc giảm vượt subtotal.
