# Mở rộng nghiệp vụ tạp hóa Việt Nam

## Các nguyên tắc dữ liệu

Sản phẩm vẫn lưu tồn kho theo **đơn vị cơ sở nhỏ nhất** (ví dụ: chai). Các đơn vị bán như lốc hoặc thùng quy đổi về đơn vị cơ sở, nhờ đó một giao dịch bán lẻ luôn trừ tồn chính xác. Giá bán được gắn với từng đơn vị để phù hợp cả bán sỉ lẫn bán lẻ.

Sổ nợ tách thành các dòng biến động độc lập. Đơn bán chịu tạo một dòng tăng nợ; mỗi lần khách trả tạo một dòng giảm nợ. Cách này giữ được lịch sử thanh toán một phần và số dư hiện tại có thể tính lại minh bạch.

| Đối tượng | Mục đích | Trạng thái trong đợt này |
|---|---|---|
| Customer / DebtTransaction | Khách quen, bán chịu, trả nợ | Triển khai MVP |
| PaymentSettings | Cấu hình tài khoản nhận VietQR tại máy | Triển khai MVP |
| ProductUnit | Thùng/lốc/chai, hệ số quy đổi, giá theo đơn vị | Triển khai MVP |
| Supplier / StockReceipt | Nhà cung cấp và lần nhập hàng | Mô hình sẵn sàng mở rộng |
| ExpiryBatch | Lô hàng và hạn dùng | Mô hình sẵn sàng mở rộng |
| ShiftClosure | Đối chiếu tiền cuối ca | Mô hình sẵn sàng mở rộng |

## Quy tắc vận hành

Một đơn có phương thức **tiền mặt**, **chuyển khoản** hoặc **ghi nợ**. VietQR chỉ được hiện sau khi chủ quán thiết lập ngân hàng, số tài khoản và tên thụ hưởng ngay trên thiết bị; dữ liệu này không yêu cầu gửi lên máy chủ đám mây.

Khi khách trả nợ, khoản thanh toán được gắn với khách và tự giảm dư nợ. Danh sách công nợ ưu tiên người nợ quá hạn lâu hoặc có số dư lớn để chủ quán dễ theo dõi.
