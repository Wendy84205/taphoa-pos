# Máy chủ LAN Tạp Hóa POS

Thư mục này chạy trên **laptop tại quán**. Máy chủ lưu sản phẩm và hóa đơn vào tệp SQLite ngay trên laptop, hiển thị mã QR để các điện thoại trong cùng Wi‑Fi ghép nối, đồng thời phát thông báo WebSocket khi dữ liệu thay đổi.

## Chuẩn bị lần đầu

Hãy cài Node.js 22 trở lên trên laptop. Sau đó mở Terminal/PowerShell trong thư mục `lan-server` và chạy:

```bash
npm install
npm start
```

Khi thấy địa chỉ dạng `http://192.168.x.x:8765`, mở địa chỉ đó kèm `/pairing` trên trình duyệt laptop. Trang này hiển thị QR và mã ghép thiết bị. Điện thoại cần cùng mạng Wi‑Fi, sau đó vào tab **Kết nối** của Tạp Hóa POS để quét QR hoặc nhập tay địa chỉ/mã ghép.

## Vận hành an toàn

Giữ cửa sổ Terminal đang chạy trong thời gian bán hàng và đặt laptop ở chế độ không ngủ. Tệp dữ liệu là `taphoa-pos-lan.sqlite` trong thư mục này; hãy sao chép tệp đó định kỳ sang USB hoặc ổ đĩa khác để sao lưu. Mã ghép sẽ thay đổi mỗi lần khởi động máy chủ, trừ khi bạn đặt biến môi trường `TAPHOA_PAIR_CODE`.

> Không mở cổng 8765 ra Internet. Máy chủ này được thiết kế chỉ để dùng trong Wi‑Fi nội bộ của quán.
