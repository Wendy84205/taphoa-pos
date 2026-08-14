# Thiết kế giao diện — Tạp Hóa POS

## Mục tiêu sản phẩm

Tạp Hóa POS là công cụ bán hàng và tra cứu giá dành cho quán tạp hóa nhỏ. Thiết kế đặt tốc độ thao tác, chữ rõ ràng và các vùng chạm lớn lên trước mật độ thông tin. Ứng dụng vận hành theo hướng **offline-first**: sản phẩm, giỏ hàng, hóa đơn và số lượng tồn được lưu trên thiết bị bằng AsyncStorage; đồng bộ đám mây là hạng mục giai đoạn sau, không nằm trong bản MVP.

Giao diện ưu tiên **màn hình dọc 9:16** và thao tác bằng một tay. Trên web/màn hình rộng, phần thông tin chính được căn giữa trong vùng nội dung thoáng hơn, còn thanh điều hướng vẫn giữ cấu trúc quen thuộc như ứng dụng di động.

## Danh sách màn hình

| Màn hình | Nội dung chính | Chức năng |
|---|---|---|
| Tra cứu | Ô tìm theo tên/mã, danh sách sản phẩm phù hợp, thẻ giá lớn, lối tắt quét mã | Tra cứu tức thời, thêm vào giỏ, mở quét mã |
| Bán hàng | Các dòng hàng trong giỏ, điều chỉnh số lượng, giảm giá, tổng tiền cố định ở đáy | Tạo đơn, hoàn tất thanh toán, trừ tồn kho |
| Sản phẩm | Danh sách hàng hóa, bộ lọc nhóm, thông tin tồn kho và cảnh báo sắp hết | Thêm, sửa, xóa, tìm kiếm sản phẩm |
| Thêm/Sửa sản phẩm | Biểu mẫu tên, giá bán, giá vốn, đơn vị, nhóm, tồn, ngưỡng cảnh báo, mã vạch, ảnh | Lưu sản phẩm vào kho cục bộ |
| Quét mã vạch | Khung camera, trạng thái quyền camera, kết quả quét phóng to | Tìm giá theo mã, thêm nhanh vào giỏ, tạo sản phẩm khi chưa tồn tại |
| Lịch sử | Danh sách hóa đơn theo ngày, doanh thu, trạng thái hóa đơn | Xem chi tiết đơn và các mặt hàng đã bán |
| Chi tiết hóa đơn | Mã hóa đơn, thời gian, từng mặt hàng, giảm giá, tổng thanh toán | Kiểm tra lại giao dịch |

## Luồng thao tác chính

Người bán mở **Tra cứu**, gõ tên hàng hoặc quét mã vạch, chạm **Thêm** trên kết quả rồi chuyển đến **Bán hàng**. Tại giỏ hàng, họ tăng/giảm số lượng hoặc nhập giảm giá, xác nhận **Hoàn tất bán hàng** để tạo hóa đơn và tự động giảm tồn. Ứng dụng trả về màn tra cứu để xử lý khách tiếp theo.

Khi quét một mã chưa có, ứng dụng hiển thị thông báo rõ ràng và mở biểu mẫu tạo nhanh với mã vạch đã điền sẵn. Chủ quán nhập tên, giá bán và tồn ban đầu, sau đó lưu để các lần quét sau hiển thị giá ngay lập tức.

Từ **Sản phẩm**, chủ quán chạm nút thêm ở góc dễ với tới, điền thông tin hoặc chụp/chọn ảnh đại diện. Các mặt hàng có tồn kho không vượt quá ngưỡng được gắn nhãn cảnh báo để ưu tiên nhập thêm.

## Cấu trúc dữ liệu MVP

| Đối tượng | Thuộc tính |
|---|---|
| Product | `id`, `name`, `price`, `costPrice?`, `unit`, `category`, `barcode?`, `imageUri?`, `stockQuantity`, `lowStockThreshold`, `createdAt`, `updatedAt` |
| CartItem | `productId`, `name`, `price`, `unit`, `quantity`, `stockQuantity` |
| Order | `id`, `createdAt`, `items`, `subtotal`, `discount`, `totalAmount` |
| OrderItem | `productId`, `name`, `quantity`, `priceAtSale`, `unit` |

## Màu sắc và phong cách

Giao diện dùng sắc **xanh lá chợ Việt** làm màu hành động chính (`#1F7A4A`), kết hợp nền kem giấy hóa đơn (`#F7F7F2`), bề mặt trắng (`#FFFFFF`) và chữ than đậm (`#1D2A23`). Màu cảnh báo tồn thấp là cam đất (`#D97706`), lỗi là đỏ gạch (`#C2413B`) và doanh thu tích cực dùng xanh lục nhạt (`#DDF4E5`). Các thẻ có bo góc 16px, viền mảnh, đổ bóng rất nhẹ; tránh hiệu ứng trang trí gây phân tán.

Kiểu chữ là sans-serif hệ thống, tiêu đề 24–28px, giá bán 28–34px và văn bản nội dung không nhỏ hơn 15px. Nút hành động có chiều cao tối thiểu 48px, nhãn luôn đi kèm biểu tượng khi không gian cho phép, phù hợp các nguyên tắc khả dụng của giao diện iOS.

## Quy tắc responsive và khả năng tiếp cận

Trên điện thoại, thanh tab cố định gồm **Tra cứu**, **Bán hàng**, **Sản phẩm**, **Lịch sử**; thao tác tạo mới và xác nhận thanh toán được bố trí ở nửa dưới màn hình. Trên máy tính, nội dung tối đa khoảng 960px, giỏ hàng có thể hiện như một khu vực rộng hơn nhưng không thay đổi luồng thao tác. Tất cả trạng thái rỗng, lỗi quyền camera, dữ liệu chưa có và tồn sắp hết đều có nhãn văn bản rõ ràng, không chỉ dựa vào màu sắc.
