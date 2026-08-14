# Hướng dẫn chạy Tạp Hóa POS

## Chạy thử khi phát triển

Trong thư mục dự án, chạy lệnh sau để mở máy chủ phát triển:

```bash
pnpm dev
```

Bạn có thể mở đường dẫn Web do công cụ hiển thị, hoặc quét mã QR bằng **Expo Go** trên Android/iPhone để thử phiên bản di động. Khi quét mã vạch, hãy cho phép ứng dụng dùng camera. Trên Web, chức năng camera phụ thuộc trình duyệt và yêu cầu truy cập bằng kết nối bảo mật.

## Tạo bản Web và APK

Lệnh sau dùng để đóng gói bản Web tĩnh:

```bash
npx expo export --platform web --output-dir dist
```

Để tạo APK Android hoặc phát hành bản chạy được, hãy tạo một checkpoint rồi dùng nút **Publish** trong giao diện quản lý dự án. Luồng này sẽ thực hiện quá trình build phù hợp với ứng dụng Expo mà không cần tự build APK trong môi trường phát triển.

## Dữ liệu và phạm vi MVP

Phiên bản hiện tại lưu sản phẩm, giỏ hàng và hóa đơn trực tiếp trên thiết bị bằng **AsyncStorage**, nên các chức năng cốt lõi vẫn sử dụng được khi mất mạng. Dữ liệu mẫu chỉ nhằm giúp thao tác thử nhanh và có thể chỉnh sửa hoặc xóa từ màn **Sản phẩm**.

Tại tab **Báo cáo**, chọn **Ngày**, **Tuần** hoặc **Tháng** để xem doanh thu, số hóa đơn, số lượng hàng bán, giá trị hóa đơn trung bình và danh sách sản phẩm bán chạy. Biểu đồ hiển thị 7 ngày, 8 tuần hoặc 6 tháng gần nhất tương ứng với lựa chọn hiện tại.

Tại tab **Hóa đơn**, nút **Xuất CSV** tạo tệp chi tiết theo từng mặt hàng trong hóa đơn. Tệp CSV dùng dấu chấm phẩy và có mã hóa UTF-8 BOM, phù hợp để mở trong Microsoft Excel hoặc Google Sheets. Trên Web tệp sẽ được tải xuống; trên Android/iOS, hệ thống sẽ mở bảng chia sẻ để lưu hoặc gửi tệp.

Đồng bộ Firebase, tài khoản nhân viên, in Bluetooth, xuất Excel/CSV và nhận diện hàng bằng AI chưa được kết nối ở bản MVP. Các hạng mục này nên được triển khai ở giai đoạn tiếp theo sau khi đã xác nhận quy trình bán hàng thực tế của quán.
