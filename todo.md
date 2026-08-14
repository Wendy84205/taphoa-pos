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
- [x] Kiểm tra trạng thái offline/cloud và thông báo lỗi trên Website.
- [x] Thiết kế onboarding tour spotlight theo từng bước, làm tối phần còn lại và chỉ hiển thị lần đầu.
- [x] Thêm cơ chế mở lại hướng dẫn từ khu vực Trợ giúp & hướng dẫn.
- [x] Thiết kế đăng nhập mobile bằng email/mật khẩu và số điện thoại, giữ OAuth hiện có.
- [x] Bổ sung validation, trạng thái lỗi/loading và bảo vệ auth cho luồng đăng nhập mới.
- [x] Kiểm thử onboarding và đăng nhập trên Web/mobile, cập nhật tài liệu và GitHub.
- [x] Rà soát toàn bộ màn quản lý để lập danh sách thiếu sót UX còn lại.
- [x] Thêm cloud guide cho Sản phẩm, Công nợ và Báo cáo.
- [x] Chuẩn hóa component loading, error và empty state cho toàn bộ màn quản lý.
- [x] Bổ sung các điểm UX thiếu quan trọng được phát hiện trong lượt rà soát.
- [x] Kiểm thử toàn bộ route quản lý desktop/mobile và cập nhật GitHub.
- [x] Đồng bộ shell quản lý POS với màu sắc, typography và component của landing page.
- [x] Nâng cấp dashboard Tra cứu và các thẻ KPI/cảnh báo theo UI mới.
- [x] Nâng cấp Bán hàng, Sản phẩm, Hóa đơn, Báo cáo, Công nợ và Tài khoản theo cùng hệ thống.
- [x] Kiểm tra hover/focus, responsive desktop/mobile và trạng thái rỗng/loading trên khu vực POS.
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
- [x] Thêm khôi phục mật khẩu bằng email/số điện thoại và xác thực OTP SMS.
- [x] Thêm đổi mật khẩu và cập nhật thông tin liên hệ trong trang Tài khoản.
- [x] Thêm xuất báo cáo doanh thu và công nợ ra Excel.
- [x] Thêm xuất báo cáo doanh thu và công nợ ra PDF.
- [x] Kiểm thử bảo mật OTP, profile và các file xuất trên Web/mobile.
- [x] Hoàn thiện form quên mật khẩu và trạng thái OTP provider chưa cấu hình.
- [x] Hoàn thiện đổi mật khẩu và cập nhật email/số điện thoại trong hồ sơ.
- [x] Hoàn thiện xuất báo cáo/công nợ ra Excel và PDF.
- [x] Lưu checkpoint Website hoàn thiện và cập nhật GitHub.
- [x] Lưu checkpoint landing enhancements và cập nhật GitHub.

## Phạm vi triển khai sau rà soát (bỏ qua OTP/SMS)

- [ ] Hoàn thiện tài liệu biến môi trường và mapping triển khai cloud production.
- [x] Bổ sung backup/khôi phục dữ liệu POS thủ công và cloud.
- [x] Bổ sung conflict resolution và đồng bộ nhiều thiết bị an toàn theo tenant.
- [ ] Bổ sung kiểm thử cô lập dữ liệu giữa tenant và quyền owner/staff.
- [x] Kiểm thử nhiều thiết bị trong cùng Wi‑Fi và hoàn thiện hướng dẫn LAN.
- [x] Hoàn thiện quản lý lô nhập, hạn sử dụng và cảnh báo hàng cận date.
- [x] Hoàn thiện nhà cung cấp, phiếu nhập, giá vốn trung bình và công nợ nhà cung cấp.
- [x] Bổ sung đóng ca, kiểm tiền mặt thực tế và báo cáo chênh lệch.
- [x] Bổ sung xác nhận chuyển khoản/reconciliation có kiểm soát.
- [x] Bổ sung in hóa đơn và tem giá qua luồng in phù hợp Web/mobile.
- [x] Bổ sung mời nhân viên, khóa thành viên và audit log UI.
- [x] Bổ sung khuyến mãi và combo bán hàng.
- [ ] Kiểm thử production trên trình duyệt, iOS và Android; cập nhật tài liệu bàn giao.

> OTP/SMS và khôi phục mật khẩu qua SMS được chủ động giữ ngoài phạm vi triển khai ở giai đoạn này.

> Subscription, nhiều chi nhánh, tìm kiếm giọng nói, đa ngôn ngữ và nhận diện AI giữ ở backlog thương mại hóa, chưa triển khai trong đợt này.

## MVP loại hình quán và nhân viên

- [x] Thêm `stores.storeType` với hai giá trị `solo` và `withStaff`, giữ tương thích dữ liệu tenant cũ.
- [x] Thêm onboarding chọn loại hình quán ngay sau đăng ký lần đầu.
- [x] Cho phép đổi loại hình quán trong Cài đặt mà không mất dữ liệu.
- [x] Ẩn tính năng mời nhân viên, phân quyền, đóng ca và audit log khi quán ở chế độ Solo.
- [x] Hoàn thiện mời/tạo tài khoản nhân viên theo tenant và phân quyền owner/staff.
- [x] Thêm đăng nhập nhanh bằng PIN 4–6 số cho nhân viên tại quầy.
- [x] Bắt buộc owner xác nhận thao tác sửa giá/xóa hóa đơn khi WithStaff.
- [x] Gắn người bán/nhân viên vào hóa đơn và hoạt động audit.
- [x] Hoàn thiện đóng ca theo từng nhân viên và đối chiếu tiền mặt.
- [x] Bổ sung audit log UI có lọc theo người dùng, hành động và thời gian.
- [x] Bổ sung báo cáo doanh thu lọc/so sánh theo nhân viên khi WithStaff.
- [x] Tối ưu mobile cho luồng PIN tại quầy và Web cho quản trị tổng thể.
- [x] Viết kiểm thử tenant isolation, role guard, storeType gating và PIN login.

## Checklist kiểm thử Web và app

- [x] Chạy TypeScript, lint và toàn bộ unit tests.
- [x] Chạy smoke test LAN/full-state và kiểm tra server sau restart.
- [x] Kiểm tra Website các route Tài khoản, Vận hành, Báo cáo, Sản phẩm, Bán hàng và Hóa đơn.
- [x] Kiểm tra responsive Website desktop/tablet/mobile và trạng thái onboarding.
- [x] Kiểm tra app contracts cho đăng nhập email/phone/PIN, storeType, role guard và seller attribution.
- [x] Kiểm tra các luồng backup/restore, nhập hàng, hạn dùng, đóng ca, in file và in hóa đơn/tem giá.
- [x] Ghi nhận lỗi, sửa hồi quy nếu có và cập nhật checkpoint kiểm thử.

## Rà soát khoảng trống Website/app

- [x] Đối chiếu lại tính năng còn thiếu và blocker trước public sau checkpoint kiểm thử e41d5e2f.
- [x] Phân biệt rõ phần đã triển khai, phần mới có model/UI và phần chưa kiểm thử authenticated/device thật.
- [x] Cập nhật danh sách ưu tiên triển khai tiếp theo cho Website, iOS và Android.

## Tiếp tục hoàn thiện trước public và mở rộng thương mại hóa

- [x] Viết test tenant isolation và role guard với hai workspace giả lập.
- [x] Thêm test authenticated onboarding, tạo nhân viên, PIN và audit log qua router contract.
- [ ] Ổn định Web preview và xác định nguyên nhân route unavailable/tự restart.
- [ ] Hoàn thiện tài liệu production mapping: database, domain, environment, backup, monitoring và rollback.
- [ ] Bổ sung xác nhận chuyển khoản/reconciliation theo giao dịch.
- [ ] Bổ sung mời nhân viên qua SMS/email, khóa/mở tài khoản và đổi PIN.
- [ ] Bổ sung khuyến mãi theo sản phẩm/đơn hàng và combo.
- [ ] Thiết kế subscription, nhiều chi nhánh, giới hạn gói và thanh toán thương mại hóa.
- [ ] Kiểm thử iPhone/Android thật và cập nhật tài liệu public.

- [x] Tạo checklist production mapping chi tiết cho database, domain, environment, backup, monitoring, rollback và mobile release.
- [x] Bổ sung owner-only khóa/mở tài khoản nhân viên và đổi PIN 4–6 số, kèm audit log và kiểm tra trạng thái.

## Đối soát chuyển khoản, khuyến mãi/combo và kiểm thử thiết bị thật

- [x] Thêm trạng thái thanh toán chuyển khoản: chờ xác nhận, đã xác nhận, từ chối.
- [x] Thêm mã tham chiếu, ghi chú và thời điểm đối soát giao dịch chuyển khoản.
- [x] Thêm màn/drawer đối soát thủ công cho owner, gắn với hóa đơn và audit log.
- [x] Không cho đánh dấu đã đối soát nếu số tiền xác nhận nhỏ hơn tổng phải thu.
- [x] Thêm khuyến mãi giảm theo phần trăm và số tiền cho sản phẩm/đơn hàng.
- [x] Thêm combo theo nhóm sản phẩm, giá combo và điều kiện số lượng.
- [x] Hiển thị rõ giá gốc, mức giảm, giá sau khuyến mãi trong POS và hóa đơn.
- [x] Bổ sung test tính giá khuyến mãi, combo, hoàn tiền/ghi nợ và đối soát.
- [x] Tạo checklist kiểm thử iPhone/Android thật cho camera, SecureStore, offline, chia sẻ file và in.
- [x] Export bundle Web/Android/iOS và cập nhật hướng dẫn cài đặt kiểm thử thiết bị.

## Kiểm thử tổng thể và an ninh MVP

- [x] Chạy toàn bộ TypeScript, lint, unit tests và bundle Web/Android/iOS.
- [ ] Kiểm thử chức năng POS, sản phẩm, tồn kho, công nợ, VietQR, nhập hàng, hạn dùng, đóng ca, đối soát và khuyến mãi/combo.
- [ ] Kiểm thử backup/restore, cloud snapshot, conflict resolution và LAN full-state.
- [x] Kiểm tra Website responsive, route chính, loading/error/empty state và onboarding.
- [x] Kiểm tra app contracts/native compatibility cho camera, SecureStore, offline, chia sẻ và in.
- [ ] Rà soát auth/session, password hashing, cookie, CORS, input validation và rate limit.
- [ ] Rà soát tenant isolation, owner/staff authorization, PIN lockout và audit trail.
- [x] Rà soát secret exposure, log nhạy cảm, file backup và dữ liệu export.
- [x] Ghi nhận phát hiện, khắc phục lỗi hồi quy nếu có và xác minh lại.
- [x] Hardening CORS production, giới hạn body/snapshot và loại bỏ log token/user nhạy cảm.
- [ ] Bổ sung rate limit cho login/PIN và CSRF protection cho mutation dùng cookie.
- [ ] Bổ sung unique constraint email/phone và kiểm thử tenant isolation bằng hai tenant thật giả lập.

## MVP production candidate — blocker cần hoàn thiện

- [x] Thêm rate limit theo IP và identifier cho đăng nhập email/số điện thoại, đăng ký và staff PIN.
- [x] Thêm CSRF protection cho các mutation Web dùng cookie, gồm profile, staff, snapshot và restore.
- [ ] Tách rõ token response native khỏi Web hoặc giảm tối đa việc trả token trong response Web.
- [x] Bổ sung giới hạn cấu trúc snapshot theo depth, số lượng phần tử và độ dài chuỗi.
- [x] Thêm unique constraint database cho email và số điện thoại nullable, kèm migration an toàn.
- [ ] Viết test tenant isolation giữa hai workspace và test owner/staff cho mọi route quản trị.
- [x] Viết test rate limit, CSRF, payload giới hạn và không lộ dữ liệu nhạy cảm trong log.
- [ ] Hoàn thiện production environment mapping, CORS_ORIGINS, cookie, database, backup, monitoring và rollback.
- [ ] Chạy lại dependency audit trong môi trường registry ổn định.
- [ ] Chạy DEVICE_TEST_CHECKLIST.md trên iPhone và Android thật.
- [x] Chạy full regression, export Web/Android/iOS và tạo checkpoint MVP production candidate.

## Tenant, thiết bị thật và production go-live

- [ ] Kiểm thử hai tenant bằng tài khoản giả lập an toàn: đọc/ghi snapshot, backup, restore, audit và thành viên không truy cập chéo.
- [ ] Kiểm thử owner/staff theo từng route quản trị và xác nhận dữ liệu seller/audit đúng tenant.
- [ ] Hoàn tất checklist iPhone/Android thật cho camera, SecureStore/session, offline, chia sẻ, in, deep link và mất mạng.
- [x] Ghi nhận rõ các bước không thể thực hiện trong sandbox và hướng dẫn người dùng xác nhận trên thiết bị thật.
- [ ] Hoàn thiện mapping domain HTTPS, CORS_ORIGINS, cookie, API base URL và database production.
- [ ] Hoàn thiện kế hoạch backup/restore, monitoring, alerting và rollback production.
- [x] Chạy regression cuối, cập nhật checklist go-live và tạo checkpoint bàn giao.
- [x] Kiểm thử mô phỏng tenant A/B cho snapshot access và owner/staff guards.
- [x] Tạo DEVICE_TEST_EXECUTION_LOG.md và PRODUCTION_MAPPING.md cho bước bàn giao.
