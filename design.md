# Thiết kế giao diện — Tạp Hóa POS mobile-first

## Mục tiêu sản phẩm

Tạp Hóa POS là công cụ thao tác tại quầy, không còn là giao diện cho laptop. Thiết kế phải giúp người bán tra giá, đưa hàng vào giỏ và hoàn tất một đơn trong vài thao tác bằng một tay trên màn hình dọc 9:16. Các nghiệp vụ quản trị cần thiết vẫn giữ nguyên, nhưng không được cạnh tranh sự chú ý với việc bán hàng.

Định hướng thị giác là **“nhãn giá tại quầy”**: nền giấy ngà dịu, chữ đậm rõ như nhãn kệ hàng, xanh lá chai làm màu xác nhận và một khung nhận diện sản phẩm giống ô ngắm hàng trên quầy. Rủi ro thiết kế chủ động là đưa **khung tra hàng sống** thành trung tâm thay cho dashboard/KPI: nó tạo cảm giác app dành cho người đang cầm một món hàng, không phải người ngồi xem báo cáo.

## Hệ thống nhận diện

| Token | Giá trị | Vai trò |
|---|---:|---|
| Xanh lá chai | `#176B4D` | Hành động chính, trạng thái đã tìm thấy, tổng cần thu |
| Xanh lá sương | `#DDEFE5` | Bề mặt gợi ý, trạng thái an toàn, nền nút phụ |
| Kem nhãn hàng | `#F7F4EC` | Nền toàn màn hình, giảm chói khi dùng lâu |
| Than quầy hàng | `#18231E` | Tiêu đề, giá và thông tin quan trọng |
| Đỏ gạch | `#B6443C` | Lỗi, hết hàng và cảnh báo thao tác không thể hoàn tác |
| Cam nhập hàng | `#C97919` | Tồn thấp, hạn dùng và việc cần xử lý |

Ứng dụng dùng font hệ thống để hiển thị tiếng Việt ổn định. Giá luôn có cỡ lớn, căn phải hoặc đặt cạnh nút thêm để nhìn thấy khi đang cầm hàng. Nhãn phụ tối thiểu 14pt; nút chính cao tối thiểu 52pt; vùng chạm biểu tượng tối thiểu 44pt. Mọi màu trạng thái đi kèm biểu tượng và câu chữ, không chỉ phân biệt bằng màu.

## Cấu trúc điều hướng

Thanh tab dưới chỉ giữ bốn điểm đến có tần suất cao nhất: **Tra giá**, **Bán hàng**, **Hóa đơn** và **Tiện ích**. Màn Tra giá mở mặc định sau khi đăng nhập. Sản phẩm, tồn kho, công nợ, báo cáo, vận hành, kết nối, tài khoản và cài đặt được đưa vào Tiện ích theo nhóm; không còn thanh điều hướng desktop, nhánh điều kiện theo màn hình rộng hay nhãn dành cho laptop.

```text
┌─────────────────────────────────┐
│ Tra giá                          │
│ [Tìm tên hoặc nói tên hàng...]    │
│ [ Chụp sản phẩm ] [ Quét mã ]     │
│ Kết quả / giá / + thêm vào giỏ     │
├─────────────────────────────────┤
│ Tra giá   Bán hàng  Hóa đơn  ⋯    │
└─────────────────────────────────┘
```

## Danh sách màn hình

| Màn hình | Nội dung và bố cục | Chức năng chính |
|---|---|---|
| Tra giá | Thanh tìm kiếm cố định ở trên; hai nút lớn **Chụp sản phẩm** và **Quét mã**; kết quả gần đây và thẻ giá rõ ở nửa dưới. | Tra theo tên, ảnh hoặc mã vạch; thêm sản phẩm vào giỏ. |
| Nhận diện sản phẩm | Camera toàn màn hình với khung bo góc 4:3, hướng dẫn đặt trọn mặt trước bao bì, flash và chọn ảnh từ thư viện. | Chụp/chọn ảnh, gửi nhận diện, hiển thị gợi ý đã đối sánh catalog. |
| Kết quả nhận diện | Ảnh vừa chụp ở đầu; một kết quả tin cậy nhất; danh sách 2–3 lựa chọn thay thế; nút “Không đúng sản phẩm này”. | Người bán xác nhận sản phẩm trước khi xem giá hoặc thêm giỏ. |
| Bán hàng | Giỏ hàng theo dòng lớn, chỉnh số lượng dễ chạm, tổng tiền và nút thanh toán cố định ở đáy. | Thu tiền mặt/chuyển khoản/ghi nợ, hoàn tất đơn. |
| Hóa đơn | Bộ lọc ngày gọn, danh sách hóa đơn theo thời gian, nút xem lại và đối soát. | Tra lại, in/xuất, xác nhận chuyển khoản. |
| Tiện ích | Lưới 2 cột gồm nhóm “Hàng hóa”, “Quản lý quán”, “Báo cáo” và “Tài khoản”; chỉ hiện các tác vụ đúng `storeType`. | Đi tới Sản phẩm, Nhập hàng, Công nợ, Báo cáo, Vận hành, Kết nối và Tài khoản. |
| Sản phẩm & chi tiết | Danh sách tìm kiếm, ảnh sản phẩm, tồn, giá và đơn vị quy đổi; sheet sửa/thêm nằm ở đáy. | Quản lý danh mục, ảnh tham chiếu và tồn kho. |
| Công nợ, Báo cáo, Vận hành | Mỗi màn giữ chức năng hiện có, nhưng dùng tiêu đề ngắn, hành động chính cố định ở đáy và nút quay về Tiện ích. | Quản trị sau bán hàng. |

## Luồng người dùng chính

Người bán mở **Tra giá**, nhìn thấy ngay ô tìm và hai cách nhận hàng: chụp bao bì hoặc quét mã. Khi chụp ảnh, app yêu cầu quyền camera một lần, hướng dẫn đưa mặt trước sản phẩm vào khung, rồi hiển thị trạng thái “Đang tìm trong hàng hóa của quán”. Kết quả chỉ được xem là tra giá sau khi đối sánh với một sản phẩm có trong catalog của quán. Người bán chạm xác nhận, xem giá/tồn/đơn vị và chạm **Thêm vào giỏ**. Giá chỉ lấy từ dữ liệu catalog của quán; nhận diện AI không bao giờ tạo hay suy đoán giá.

Khi nhận diện không chắc chắn, app hiển thị tối đa ba lựa chọn dựa trên tên nhãn hàng, thương hiệu, dung tích và ảnh tham chiếu. Người bán có thể chạm “Tìm bằng tên”, “Quét mã” hoặc “Chụp lại”. Nếu catalog chưa có sản phẩm đó, app chuyển sang tạo sản phẩm nhanh với ảnh đã chụp; chỉ chủ quán được lưu giá/tồn mới.

Sau khi chọn sản phẩm, người bán tiếp tục tại **Bán hàng**, chọn phương thức thanh toán và hoàn tất. App quay về Tra giá với một thông báo ngắn, không mở dashboard hay danh sách quản trị.

## Tra giá bằng ảnh: nguyên tắc dữ liệu và an toàn

Ảnh được chụp ở chất lượng đủ để đọc bao bì, nén giới hạn kích thước, gửi qua API bảo vệ và nhận kết quả có cấu trúc gồm `brand`, `productName`, `variant`, `size`, `confidence` và các dấu hiệu nhìn thấy. Backend dùng mô hình vision chỉ để trích xuất đặc điểm sản phẩm; client/backend dùng các đặc điểm đó để xếp hạng sản phẩm **đã có** trong catalog của tenant hiện tại. Không gửi ảnh cho tenant khác, không dùng giá từ AI, không tự thêm sản phẩm vào giỏ khi chưa có xác nhận của người bán.

Các trạng thái bắt buộc gồm: quyền camera bị từ chối (kèm nút mở Cài đặt), camera chưa sẵn sàng, đang nhận diện, ảnh quá mờ, không tìm thấy trong catalog, lỗi mạng và gợi ý có độ tin cậy thấp. Ảnh phục vụ tìm nhanh không được giữ vĩnh viễn mặc định; ảnh dùng làm ảnh sản phẩm chỉ được lưu khi chủ quán xác nhận.

## Quy tắc iOS và thao tác một tay

Nút chính ở vùng dưới ngón cái; sheet chọn kết quả dùng presentation dạng page sheet; thanh tab sử dụng biểu tượng SF Symbols thân thuộc và nhãn tiếng Việt ngắn. Chuyển cảnh chỉ fade/slide nhẹ 160–220ms, tôn trọng Reduce Motion. Các thao tác quan trọng có phản hồi haptic nhẹ; khi thêm vào giỏ hoặc nhận diện xong có phản hồi rõ bằng haptic thành công và thay đổi trạng thái.

## Tiêu chí nghiệm thu

Một người bán có thể bắt đầu từ Tra giá, chụp bao bì, chọn đúng mặt hàng có trong kho và thêm vào giỏ mà không mở Tiện ích. Toàn bộ nghiệp vụ quản trị vẫn truy cập được từ Tiện ích, nhưng không còn xuất hiện như tab chính hay giao diện laptop. Luồng ảnh phải luôn có phương án thay thế bằng tìm tên và quét mã vạch, đồng thời không hiển thị giá nếu không đối sánh được một sản phẩm cụ thể của quán.
