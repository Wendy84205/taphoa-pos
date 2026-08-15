# Chính sách bảo mật — Tạp Hóa POS

**Ngày hiệu lực:** Cập nhật trước ngày phát hành chính thức.

Tạp Hóa POS hỗ trợ cửa hàng tạp hóa quản lý sản phẩm, hóa đơn, tồn kho, công nợ và hoạt động bán hàng. Chính sách này mô tả loại dữ liệu ứng dụng có thể xử lý và cách người dùng kiểm soát dữ liệu đó.

## Dữ liệu có thể được xử lý

Ứng dụng có thể xử lý thông tin tài khoản như tên, email hoặc số điện thoại; thông tin do chủ quán nhập về cửa hàng, nhân viên, khách hàng, nhà cung cấp, hàng hóa, hóa đơn, công nợ và báo cáo. Camera chỉ được dùng khi người dùng chủ động cấp quyền để quét mã vạch hoặc chụp ảnh sản phẩm. Tệp/ảnh chỉ được truy cập khi người dùng chủ động chọn để nhập hoặc gắn dữ liệu sản phẩm.

## Mục đích sử dụng

Dữ liệu được dùng để vận hành các chức năng mà người dùng yêu cầu: xác thực, hiển thị và đồng bộ workspace cửa hàng, bán hàng, quản lý tồn kho, xuất báo cáo, bảo mật tài khoản và hỗ trợ vận hành. Ứng dụng không bán dữ liệu cá nhân cho bên quảng cáo.

## Lưu trữ và đồng bộ

Ứng dụng có thể lưu dữ liệu trên thiết bị để hỗ trợ offline-first. Khi người dùng bật hoặc sử dụng đồng bộ cloud/LAN, dữ liệu workspace có thể được truyền tới hạ tầng do chủ dịch vụ cấu hình. Mọi truyền dữ liệu production phải dùng HTTPS; quyền truy cập được giới hạn theo workspace và vai trò owner/staff.

## Lựa chọn và quyền của người dùng

Người dùng có thể không cấp quyền camera hoặc ảnh; các chức năng phụ thuộc quyền đó sẽ không hoạt động. Người dùng có thể yêu cầu cập nhật hoặc xóa tài khoản/dữ liệu thông qua kênh hỗ trợ được công bố khi phát hành. Chủ quán chịu trách nhiệm có cơ sở hợp pháp khi nhập dữ liệu khách hàng, nhân viên hoặc nhà cung cấp.

## Bảo mật

Tạp Hóa POS sử dụng kiểm soát phiên, phân quyền workspace, PIN nhân viên, rate limit, CSRF protection và log vận hành đã che dữ liệu nhạy cảm. Không có biện pháp bảo mật nào tuyệt đối; người dùng cần bảo vệ thiết bị, mật khẩu và quyền truy cập của nhân viên.

## Liên hệ

Trước khi phát hành, thay phần này bằng tên pháp nhân/chủ sở hữu, email hỗ trợ, địa chỉ liên hệ và URL chính thức. Không submit store khi các thông tin này còn là placeholder.
