# Project TODO

- [x] Tạo nhận diện thương hiệu và cập nhật biểu tượng ứng dụng.
- [x] Thiết lập bảng màu, điều hướng bốn khu vực và cấu trúc dữ liệu dùng chung.
- [x] Xây dựng kho dữ liệu cục bộ bằng AsyncStorage cùng dữ liệu mẫu có thể thay thế.
- [x] Xây dựng màn tra cứu giá theo tên hoặc mã vạch với kết quả theo thời gian thực.
- [x] Xây dựng màn quản lý sản phẩm và biểu mẫu thêm/sửa/xóa hàng hóa.
- [x] Hỗ trợ ảnh đại diện sản phẩm cho hàng không có mã vạch.
- [x] Xây dựng quét mã vạch bằng camera và quy trình tạo nhanh khi chưa có mã.
- [x] Xây dựng giỏ hàng POS, điều chỉnh số lượng, giảm giá và hoàn tất bán hàng.
- [x] Tự động trừ tồn kho và hiển thị cảnh báo sắp hết.
- [x] Xây dựng lịch sử hóa đơn cùng màn chi tiết đơn hàng.
- [x] Viết kiểm thử dữ liệu và kiểm tra kiểu mã nguồn.
- [x] Hoàn thiện trải nghiệm Web/iOS/Android và hướng dẫn chạy thử.
- [x] Lưu phiên bản và bàn giao.
- [x] Xây dựng bộ tổng hợp doanh thu theo ngày, tuần và tháng từ hóa đơn đã lưu.
- [x] Thêm màn báo cáo với biểu đồ doanh thu trực quan và các chỉ số tổng quan.
- [x] Xuất lịch sử hóa đơn và chi tiết mặt hàng sang tệp CSV tương thích Excel.
- [x] Kiểm thử báo cáo và tệp xuất CSV.
- [x] Lưu phiên bản nâng cấp và bàn giao.
- [x] Chốt mô hình thiết bị chủ và kiến trúc hoạt động trong mạng LAN không cần Internet.
- [x] Triển khai laptop tại quán làm máy chủ LAN lưu dữ liệu SQLite và phát QR kết nối.
- [x] Thiết kế giao thức QR, phân quyền thiết bị và đồng bộ thời gian thực qua WebSocket.
- [x] Xây dựng máy chủ LAN cùng kho dữ liệu dùng chung bằng SQLite và kiểm thử tự động.
- [x] Kết nối ứng dụng bán hàng và giao diện web quản lý vào máy chủ LAN.
- [ ] Kiểm thử nhiều thiết bị trong cùng Wi‑Fi, soạn hướng dẫn cài đặt và lưu phiên bản nâng cấp.
- [x] Khắc phục lỗi iPhone/Expo Go không kết nối được máy chủ phát triển và xác minh bundle iOS.
- [x] Khôi phục bản xem trước Web POS và xác minh luồng quản lý sản phẩm.
- [x] Hoàn thiện các luồng POS nhất quán trên Web và điện thoại trong phạm vi tính năng hiện có.
- [x] Nhập danh sách sản phẩm hàng loạt từ Excel/CSV với kiểm tra dữ liệu trước khi lưu.
- [x] Bổ sung bảng cảnh báo sản phẩm sắp hết ngay trên trang chủ.
- [x] Hoàn thiện quét mã vạch bằng camera để tra cứu và thêm nhanh sản phẩm trên các nền tảng hỗ trợ.
- [x] Kiểm thử nhập Excel, cảnh báo tồn kho và luồng quét mã bằng bộ kiểm thử, TypeScript, lint và cấu hình Expo.
- [x] Thêm nút tải tệp Excel mẫu ngay trong luồng nhập sản phẩm.
- [x] Lưu lịch sử nhập hàng và điều chỉnh tồn kho theo từng sản phẩm.
- [x] Tạo màn xem chi tiết lịch sử kho có thể lọc theo sản phẩm và loại biến động.
- [x] Thêm bộ lọc và sắp xếp cho danh sách cảnh báo sản phẩm sắp hết trên trang chủ.
- [x] Kiểm thử nhật ký kho, tải tệp mẫu và bộ lọc cảnh báo tồn thấp.
- [x] Thiết kế và xây dựng sổ nợ khách quen, ghi nợ khi bán và thanh toán nợ một phần/toàn bộ.
- [x] Tạo thanh toán VietQR theo số tiền đơn hàng và lưu phương thức tiền mặt/chuyển khoản.
- [x] Hỗ trợ một sản phẩm có nhiều đơn vị quy đổi cùng giá bán theo từng đơn vị.
- [x] Chuẩn bị mô hình dữ liệu cho nhà cung cấp, nhập hàng, hạn sử dụng và đóng ca cuối ngày.
- [x] Kiểm thử công nợ, QR thanh toán và quy đổi đơn vị bằng bộ kiểm thử, TypeScript và lint.
- [x] Kiểm tra trực tiếp sổ nợ, VietQR, quy đổi đơn vị và giao diện POS sau khi khởi động lại.
- [x] Đối chiếu trạng thái tính năng quản lý hạn sử dụng và thông báo rõ phạm vi hiện có.
- [x] Khôi phục bản xem trước POS để hoàn tất kiểm tra trực tiếp các tính năng sau khi khởi động lại.
- [x] Ổn định bản xem trước POS bằng gói Web tĩnh để tránh Metro ngừng phản hồi trong lúc kiểm tra.
- [x] Tạo commit và cập nhật toàn bộ thay đổi hoàn tất của Tạp Hóa POS lên GitHub.
- [x] Kiểm tra giao diện Website POS và các luồng chính trên trình duyệt sau khi cập nhật GitHub.
- [x] Khôi phục bản xem trước Website POS đang không khả dụng để hoàn tất kiểm tra giao diện.
- [x] Tạo lớp vỏ Web desktop với sidebar, header cửa hàng và điều hướng responsive.
- [x] Nâng cấp bố cục Web cho luồng Bán hàng theo dạng hai cột giỏ hàng/thanh toán.
- [x] Nâng cấp bố cục Web cho quản lý Sản phẩm và các trạng thái thao tác chính.
- [x] Kiểm tra responsive Web ở desktop và mobile viewport, sửa lỗi hiển thị.
- [x] Lưu phiên bản Website Web hoàn chỉnh.

## Ghi chú thiết kế Web

- Hướng hình ảnh: quầy tạp hóa Việt hiện đại, nền giấy ấm, xanh lá chợ làm trục hành động, cam vàng làm tín hiệu cần xử lý.
- Chữ: ưu tiên system sans-serif dễ đọc; tiêu đề đậm, số liệu lớn, nhãn thao tác ngắn.
- Bố cục desktop: sidebar cố định 248px, vùng nội dung rộng 1180px, header có trạng thái LAN/offline và phím tắt tra cứu.
- Chữ ký thị giác: thẻ “ca bán hàng” ở sidebar/header hiển thị doanh thu trong ngày và tình trạng đồng bộ, giúp chủ quán đọc nhanh trạng thái vận hành.
- Responsive: dưới 900px quay về bottom tabs và 1 cột; không thay đổi luồng nghiệp vụ.
- Khả năng tiếp cận: focus rõ, nút thao tác tối thiểu 44px, màu luôn đi kèm nhãn văn bản.

## Thiết kế Web: phiên bản đã rà soát

| Thành phần | Quyết định |
|---|---|
| Nền | #F4F6F1, nhẹ hơn nền kem để tạo cảm giác phần mềm vận hành cả ngày |
| Sidebar | #173B2A, xanh chai đậm; logo vàng mù tạt và active pill xanh sáng |
| Hành động chính | #1F7A4A, hover #17623A |
| Tín hiệu cảnh báo | #D97706 trên nền #FFF4D8 |
| Thẻ doanh thu | gradient xanh lá đậm, số tiền trắng, nhãn “Ca hôm nay” |
| Khu vực nội dung | card trắng, border #DDE6DE, shadow thấp, radius 18px |
| Điểm nhấn | một “quick action rail” bên phải header: quét mã, thêm hàng, mở giỏ |

ASCII wireframe desktop:

[logo + ca hôm nay] [Tra cứu nhanh / trạng thái LAN / cửa hàng]
[Tra cứu]         [hero search + cảnh báo tồn kho + hàng gần đây]
[Bán hàng]        [content page, desktop grid]
[Sản phẩm]        [secondary actions]
[Hóa đơn]
[Báo cáo]
[Công nợ]
[Kết nối]

Phiên bản Web sẽ dùng lớp vỏ này; native vẫn giữ bottom tabs và cùng các screen hiện tại.

**Suy xét:** Không dùng dashboard dày đặc hoặc gradient trang trí toàn màn hình vì chủ quán cần đọc giá và trạng thái tồn kho nhanh hơn là xem một trang marketing. Điểm khác biệt nằm ở “ca hôm nay” và trạng thái LAN ngay trong khung điều hướng, phù hợp bối cảnh vận hành tại quầy.

## SaaS cloud multi-tenant từ prompt mới

- [x] Chốt giữ Expo/React Native làm codebase Web/Android/iOS hiện tại; không chuyển sang Flutter trong phạm vi dự án đang có.
- [x] Thiết kế tenant Store/Member với chủ quán và nhân viên, phân quyền không sửa giá/xóa đơn.
- [x] Bổ sung schema cloud cho cửa hàng, thành viên, sản phẩm, đơn hàng và audit metadata theo tenant.
- [x] Bổ sung API protected và kiểm tra tenant ở server cho dữ liệu POS.
- [x] Tích hợp trạng thái đăng nhập và màn hình tài khoản/cửa hàng trên Web/mobile.
- [x] Xây dựng đồng bộ cloud có kiểm soát, giữ offline-first cục bộ làm bộ đệm tạm thời.
- [ ] Bổ sung kiểm thử cô lập dữ liệu giữa hai tenant và quyền nhân viên.
- [x] Cập nhật RUN.md với cách bật backend, tài khoản và giới hạn của bản SaaS MVP.
- [x] Commit và push toàn bộ thay đổi SaaS lên GitHub.

## Hoàn thiện Website và chuẩn bị Vercel/Supabase

- [x] Rà soát và hoàn thiện luồng Website Tra cứu, Bán hàng, Sản phẩm, Hóa đơn, Báo cáo, Công nợ và Tài khoản.
- [x] Redesign toàn bộ UI Website theo hệ thống dashboard/POS chuyên nghiệp, giàu phân cấp thị giác hơn.
- [x] Tạo dashboard Tra cứu có hero, chỉ số vận hành, cảnh báo tồn kho và hoạt động gần đây.
- [x] Tạo workspace Bán hàng desktop hai cột với thanh tìm kiếm, giỏ hàng và thanh toán rõ ràng.
- [x] Nâng cấp bảng Sản phẩm, Hóa đơn, Báo cáo, Công nợ và Tài khoản theo cùng hệ thống component.
- [ ] Kiểm tra trạng thái offline/cloud và thông báo lỗi trên Website.
- [x] Đọc và đối chiếu repository UI/UX Pro Max với hệ thống UI hiện tại.
- [x] Thêm animation nhẹ, hover/focus/press state cho landing page.
- [x] Thêm form đăng ký dùng thử/liên hệ và trạng thái submit rõ ràng.
- [x] Thêm route Bảng giá với các gói và CTA.
- [x] Thêm FAQ accordion và nội dung giải đáp cho chủ cửa hàng.
- [x] Thêm các đám mây chỉ dẫn sử dụng website/app theo ngữ cảnh.
- [x] Kiểm tra accessibility, reduced motion và responsive cho các tương tác mới.
- [x] Tạo landing page giới thiệu Tạp Hóa POS tách biệt khỏi khu vực vận hành.
- [x] Bổ sung hero, tính năng nổi bật, lợi ích cửa hàng và CTA bắt đầu dùng thử.
- [x] Kiểm tra landing page responsive desktop/mobile và điều hướng vào POS.
- [x] Kiểm thử responsive Web desktop/tablet/mobile và các thao tác POS chính.
- [ ] Chuẩn bị tài liệu biến môi trường và mapping backend cho Vercel/Supabase, chưa public.
- [x] Lưu checkpoint Website hoàn thiện và cập nhật GitHub.
- [x] Lưu checkpoint landing enhancements và cập nhật GitHub.
