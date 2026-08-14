# Kết quả kiểm tra Web

## Vận hành

Route `/van-hanh` tải đúng WebShell và màn `Nhập hàng & đóng ca`. Đã quan sát thấy ba chế độ `Nhập hàng`, `Hạn dùng`, `Đóng ca`, danh sách sản phẩm, nhà cung cấp, các ô số lượng/giá vốn/thanh toán/hạn dùng, nút lưu phiếu nhập và vùng phiếu nhập gần đây. Route không có lỗi runtime trong nội dung trích xuất.

## Báo cáo

Route `/bao-cao` tải đúng WebShell và màn `Doanh thu`. Đã quan sát thấy bộ chọn `Ngày`, `Tuần`, `Tháng`, nút `Excel`, `PDF`, KPI doanh thu/số hóa đơn/sản phẩm, biểu đồ biến động doanh thu và danh sách bán chạy. Dữ liệu mô phỏng trên thiết bị hiển thị 7.000đ, 1 hóa đơn và 1 sản phẩm.

## Ghi chú

Ảnh chụp đồng thời nhiều route có thể hiển thị onboarding dashboard do các route được chụp song song trong cùng preview context. Kiểm tra tuần tự bằng điều hướng trực tiếp xác nhận `/van-hanh` và `/bao-cao` hoạt động đúng.

## Sản phẩm

Lần truy cập đầu tiên vào `/san-pham` báo “This page is currently unavailable”, sau khi khởi động lại preview route tải bình thường. Kiểm tra tuần tự sau restart xác nhận có 6 mặt hàng, tìm kiếm theo tên/mã vạch, bộ lọc danh mục, cảnh báo 1 mặt hàng sắp hết, nút Nhập, In tem, Thêm và các thao tác điều chỉnh/sửa/xóa trên từng sản phẩm.

Kết luận route Sản phẩm hoạt động sau restart; cần theo dõi hiện tượng preview tạm thời unavailable nếu lặp lại trong môi trường phát triển.

## Tài khoản

Sau restart, `/tai-khoan` tải đúng màn đăng nhập. Đã xác nhận tabs `Email` và `Số điện thoại`, input email, input mật khẩu, nút Đăng nhập, tạo tài khoản, Manus OAuth và nút quay lại bán hàng. Chưa thực hiện submit tài khoản vì không có thông tin đăng nhập do người dùng cung cấp; vì vậy chưa thể kiểm tra trực tiếp màn onboarding Solo/WithStaff, quản lý nhân viên, PIN và audit log bằng phiên authenticated.

## Ghi nhận preview

Preview Web có hiện tượng process tự restart/route tạm unavailable khi truy cập tuần tự một số route; sau `webdev_restart_server`, các route `/van-hanh`, `/bao-cao`, `/san-pham`, `/tai-khoan` đều tải được. Unit tests, TypeScript và lint vẫn sạch.
