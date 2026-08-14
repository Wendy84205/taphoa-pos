# Kết quả kiểm tra trực tiếp POS

Ngày kiểm tra: 14/08/2026

| Hạng mục | Kết quả |
|---|---|
| Bản xem trước Web | Đã phản hồi và mở được sau khi chuyển sang bản xem trước Web tĩnh. |
| VietQR | Chọn chuyển khoản mở VietQR theo đúng tổng 7.000đ; QR hiển thị sau khi nhập thông tin tài khoản thử nghiệm. |
| Sổ nợ | Tạo khách thử nghiệm và lưu đơn ghi nợ 7.000đ; tab Công nợ hiển thị khách, số điện thoại và số dư 7.000đ. |
| Quy đổi đơn vị | Biểu mẫu sản phẩm hiển thị dòng lốc/thùng với tên đơn vị, hệ số quy đổi và giá bán riêng. Đã lưu lốc 6 chai giá 36.000đ; lựa chọn chai 7.000đ và lốc 36.000đ đã xuất hiện trên giao diện tra cứu. |
| Hạn sử dụng | Hiện mới có kiểu dữ liệu `ExpiryBatch`; chưa có luồng nhập lô, hạn dùng hoặc cảnh báo hạn trên giao diện. |

> Các dữ liệu “Khách kiểm tra”, số điện thoại thử nghiệm, cấu hình VietQR thử nghiệm và giá lốc thử nghiệm được tạo trong bộ nhớ cục bộ của phiên Web để xác minh luồng.
