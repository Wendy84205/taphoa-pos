# Rà soát giao diện Website POS

Ngày kiểm tra: 14/08/2026

| Khu vực | Trạng thái quan sát |
|---|---|
| Trang Tra cứu | Hiển thị tìm kiếm, quét mã, bộ lọc nhóm, cảnh báo tồn thấp, giá theo chai/lốc và danh sách hàng hóa. |
| Sản phẩm | Hiển thị 6 mặt hàng, tìm kiếm, nhóm hàng, nút nhập Excel, thêm sản phẩm, tồn kho và tác vụ theo từng dòng. |
| Báo cáo | Hiển thị doanh thu 7.000đ, biểu đồ theo ngày, số hóa đơn, giá trị trung bình và mặt hàng bán chạy của dữ liệu thử nghiệm. |
| Công nợ | Hiển thị khách thử nghiệm, số điện thoại, dư nợ 7.000đ và nút Thu nợ. |
| Điều hướng | Thanh tab Tra cứu, Bán hàng, Sản phẩm, Hóa đơn, Báo cáo, Công nợ và Kết nối xuất hiện ở đáy trang. |
| Máy chủ Web | Máy chủ Web tĩnh trả HTTP 200 sau khi khởi động lại. |

> Đây là kiểm tra trực quan trên trình duyệt. Các chức năng camera và luồng thiết bị di động cần tiếp tục thử trên thiết bị thật.

## Kiểm tra phiên bản giao diện Web hoàn thiện

- Desktop 1280px: sidebar xanh đậm, thẻ “Ca hôm nay”, trạng thái offline/LAN, header thao tác nhanh và trạng thái active theo từng tab hiển thị đúng trên Tra cứu, Bán hàng, Sản phẩm, Báo cáo, Công nợ.
- Mobile Web 375px: tự chuyển về bottom tabs; không hiển thị sidebar desktop; màn Tra cứu vẫn giữ ô tìm kiếm, quét mã, cảnh báo tồn kho và các thẻ sản phẩm không bị tràn ngang.
- Điều hướng trực tiếp `/ban-hang`: header đổi ngữ cảnh thành “Bán hàng”, sidebar active đúng và trạng thái giỏ trống có nút “Tra cứu sản phẩm”.
- Kiểm tra TypeScript và lint đều thành công; bundle Web dựng thành công với 18 route tĩnh.
