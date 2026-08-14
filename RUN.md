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

## Dùng laptop làm máy chủ trong Wi‑Fi nội bộ

Nếu muốn điện thoại bán hàng và laptop dùng chung dữ liệu mà không cần Internet, hãy để **laptop tại quán** làm máy chủ. Trên laptop, cài Node.js 22 trở lên, mở Terminal/PowerShell tại thư mục `lan-server`, rồi chạy:

```bash
npm install
npm start
```

Máy chủ sẽ hiển thị một địa chỉ dạng `http://192.168.x.x:8765`. Trên laptop, mở thêm địa chỉ đó kèm `/pairing` để hiện QR và mã ghép. Điện thoại và laptop phải cùng Wi‑Fi, sau đó mở tab **Kết nối** trong Tạp Hóa POS, quét QR hoặc nhập địa chỉ/mã ghép để liên kết. Khi đã liên kết, thay đổi sản phẩm, đơn hàng, tồn kho và báo cáo sẽ được thông báo tức thời qua Wi‑Fi nội bộ.

Tệp SQLite `taphoa-pos-lan.sqlite` được lưu cạnh máy chủ LAN trên laptop. Hãy sao chép tệp này định kỳ sang USB hoặc ổ đĩa khác để sao lưu. Trong giờ bán hàng, không tắt cửa sổ Terminal và đặt laptop ở chế độ không ngủ. Máy chủ LAN chỉ dùng trong Wi‑Fi quán; không mở cổng 8765 ra Internet.

## Dữ liệu và phạm vi MVP

Phiên bản hiện tại lưu sản phẩm, giỏ hàng và hóa đơn trực tiếp trên thiết bị bằng **AsyncStorage**, nên các chức năng cốt lõi vẫn sử dụng được khi mất mạng. Dữ liệu mẫu chỉ nhằm giúp thao tác thử nhanh và có thể chỉnh sửa hoặc xóa từ màn **Sản phẩm**.

Tại tab **Báo cáo**, chọn **Ngày**, **Tuần** hoặc **Tháng** để xem doanh thu, số hóa đơn, số lượng hàng bán, giá trị hóa đơn trung bình và danh sách sản phẩm bán chạy. Biểu đồ hiển thị 7 ngày, 8 tuần hoặc 6 tháng gần nhất tương ứng với lựa chọn hiện tại.

Tại tab **Hóa đơn**, nút **Xuất CSV** tạo tệp chi tiết theo từng mặt hàng trong hóa đơn. Tệp CSV dùng dấu chấm phẩy và có mã hóa UTF-8 BOM, phù hợp để mở trong Microsoft Excel hoặc Google Sheets. Trên Web tệp sẽ được tải xuống; trên Android/iOS, hệ thống sẽ mở bảng chia sẻ để lưu hoặc gửi tệp.

## Nhập sản phẩm hàng loạt từ Excel

Trong tab **Sản phẩm**, chọn **Nhập** rồi chọn tệp Excel (`.xlsx`, `.xls`) hoặc CSV từ máy. Hệ thống hiển thị trước số dòng hợp lệ và các dòng cần sửa trước khi lưu. Cột tối thiểu là **Tên sản phẩm** và **Giá bán**; các cột còn lại gồm Giá vốn, Đơn vị, Nhóm hàng, Mã vạch, Tồn kho và Ngưỡng cảnh báo. Tệp `mau-nhap-san-pham.csv` ở thư mục dự án là một mẫu có thể mở và chỉnh sửa bằng Excel.

Nếu một mã vạch đã có, lần nhập mới sẽ cập nhật sản phẩm hiện có thay vì tạo trùng. Khi nhập xong, các mặt hàng có số tồn không vượt ngưỡng cảnh báo sẽ xuất hiện trong khung **Cần nhập thêm hàng** tại trang Tra cứu.

Trong biểu mẫu nhập, chọn **Tải file Excel mẫu** để nhận một bảng `.xlsx` đúng định dạng trước khi điền dữ liệu. Trên điện thoại, hệ thống mở bảng chia sẻ để lưu mẫu; trên Web, tệp được tải xuống trực tiếp.

## Lịch sử kho và cảnh báo tồn thấp

Tại tab **Sản phẩm**, nút biểu tượng đồng hồ mở **Lịch sử kho**. Mỗi dòng thể hiện thời điểm, sản phẩm, loại biến động, số tồn trước/sau và ghi chú. Chạm biểu tượng thanh trượt trên từng sản phẩm để nhập thêm hoặc giảm tồn thủ công; mọi thay đổi, cùng các lần nhập Excel và bán hàng, đều được ghi vào lịch sử.

Ở trang **Tra cứu**, khung **Cần nhập thêm hàng** cho phép lọc theo nhóm hàng. Nút sắp xếp chuyển lần lượt giữa ưu tiên thiếu gấp, số tồn thấp nhất và tên A–Z.

## Quét mã vạch nhanh

Tại trang **Tra cứu**, chạm nút quét mã màu vàng. Lần đầu, hãy cấp quyền dùng camera; hướng camera vào mã EAN, UPC, Code 128, Code 93, Code 39, ITF-14 hoặc Codabar. Nếu tìm thấy sản phẩm, ứng dụng hiển thị giá và nút **Thêm** để đưa vào giỏ; nếu chưa có, chọn **Tạo nhanh** để lưu sản phẩm với mã vừa quét. Khi camera không đọc được, có thể nhập mã ở ô dự phòng bên dưới khung quét.

## Sổ nợ, VietQR và bán sỉ/lẻ

Khi chốt đơn ở tab **Bán hàng**, chọn **Ghi nợ** rồi chọn hoặc tạo **Khách quen**. Hóa đơn được ghi vào sổ nợ và có thể thu từng phần tại tab **Công nợ**. Danh sách ưu tiên theo số tiền và thời gian nợ để chủ quán tiện theo dõi.

Chọn **Chuyển khoản** để mở VietQR với đúng số tiền của đơn. Trước lần dùng đầu, nhập mã BIN 6 số của ngân hàng, số tài khoản và tên chủ tài khoản không dấu. Mã QR được tạo cục bộ trên thiết bị; hãy kiểm tra tiền đã vào tài khoản trước khi hoàn tất bán hàng.

Khi thêm hoặc sửa sản phẩm, mục **Đơn vị quy đổi** cho phép khai báo lốc/thùng, số lượng quy đổi về đơn vị cơ sở và giá bán riêng. Trong trang Tra cứu, chạm nút **lốc** hoặc **thùng** để thêm đúng đơn vị vào giỏ; ứng dụng trừ tồn theo số chai/gói cơ sở.

## Cloud SaaS và nhiều quán

Bản mở rộng cloud dùng **Manus OAuth** cho đăng nhập Web/iOS/Android. Sau lần đăng nhập đầu tiên, hệ thống tự tạo một **workspace/quán** riêng cho tài khoản; dữ liệu giữa các workspace được cô lập bằng `storeId` ở backend. Tài khoản đầu tiên của workspace có vai trò **Chủ quán**; mô hình thành viên đã hỗ trợ `owner` và `staff`, trong đó nhân viên bị chặn khỏi thao tác ghi đè snapshot dữ liệu kho trên cloud.

Khi đã đăng nhập và backend database hoạt động, `CloudSyncProvider` tải snapshot của workspace và cập nhật sản phẩm, hóa đơn, lịch sử kho, khách hàng, công nợ và cài đặt thanh toán. Thay đổi cục bộ vẫn được lưu bằng AsyncStorage trước; khi có mạng, owner sẽ đồng bộ snapshot lên cloud sau một khoảng chờ ngắn để gom các thao tác liên tiếp. Nếu cloud không sẵn sàng, giao diện hiển thị trạng thái **Đang lưu offline** và không xóa dữ liệu cục bộ.

Mở màn **Tài khoản** từ sidebar Web để xem email đăng nhập, workspace, vai trò, trạng thái đồng bộ và danh sách thành viên. Endpoint cloud đều yêu cầu authenticated user; endpoint snapshot chỉ cho owner ghi dữ liệu trong SaaS MVP hiện tại. Đây là lớp nền an toàn cho tenant, chưa phải hệ thống subscription hoặc mời nhân viên qua email hoàn chỉnh.

Để chạy backend cloud, cần cấu hình `DATABASE_URL` cho server theo môi trường WebDev. Migration `drizzle/0001_silent_firebird.sql` tạo các bảng `stores`, `storeMembers`, `posSnapshots` và `auditLogs`; không xóa bảng `users` hay dữ liệu POS cục bộ. Khi phát hành thật, cần bổ sung luồng mời thành viên, conflict resolution theo từng entity, rate limit và backup cloud định kỳ.

Đồng bộ Firebase, mời nhân viên qua email, in Bluetooth, xuất Excel/CSV nâng cao, subscription và nhận diện hàng bằng AI chưa được kết nối đầy đủ ở bản SaaS MVP. Các hạng mục này nên triển khai sau khi xác nhận quy trình bán hàng thực tế của nhiều quán.
