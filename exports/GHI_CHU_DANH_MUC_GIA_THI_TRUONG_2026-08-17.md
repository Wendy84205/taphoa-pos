# Ghi chú danh mục giá thị trường

Tệp `danh_muc_gia_thi_truong_tap_hoa_2026-08-17.csv` gồm **110 mặt hàng tạp hóa thiết yếu** và dùng đúng các cột tiếng Việt mà chức năng Nhập sản phẩm của Tạp Hóa POS nhận diện.

> Giá bán đề xuất chỉ là mốc khởi tạo cho quầy tạp hóa. Hãy đối chiếu hóa đơn nhà cung cấp, phí vận chuyển, hao hụt và giá bán quanh khu vực trước khi nhập chính thức.

## Cơ sở định giá

| Trường CSV | Cách dùng |
|---|---|
| `Giá thị trường tham khảo` | Mức giá bán lẻ trực tuyến/siêu thị được quan sát ngày 17-08-2026 hoặc mức tham khảo cùng nhóm hàng. |
| `Giá vốn` | Giá vốn giả định khi nhập từ đại lý/sỉ; không phải báo giá nhà cung cấp. |
| `Giá bán` | Giá đề xuất làm tròn, cao hơn giá vốn để có biên lợi nhuận gộp dương. |
| `Biên lợi nhuận gộp %` | `(Giá bán - Giá vốn) / Giá bán × 100`; chưa trừ hao hụt, nhân công, thuê mặt bằng, ship và khuyến mãi. |

## Nguồn giá tham khảo

| Nhóm | Nguồn |
|---|---|
| Dầu ăn | [Bách Hóa XANH – Dầu ăn](https://www.bachhoaxanh.com/dau-an), có các ví dụ Cái Lân 1 lít 49.000đ, Neptune Light 1 lít 63.000đ và thùng/chai Meizan. |
| Mì ăn liền | [Bách Hóa XANH – Mì](https://www.bachhoaxanh.com/mi), có ví dụ thùng mì Gấu Đỏ 30 gói 90.000đ. |
| Nước mắm | [WinMart – Knorr 43 độ đạm 500ml](https://winmart.vn/products/knorr-nuoc-mam-ngon-nguyen-ban-500ml--s10142013), cùng các sản phẩm liên quan Nam Ngư Đệ Nhị 900ml và Chinsu 500ml. |
| Các nhóm còn lại | Giá niêm yết bán lẻ của chuỗi siêu thị trực tuyến Việt Nam và mức giá quầy tạp hóa cùng quy cách, được ghi rõ là `Tham khảo bán lẻ siêu thị` trong CSV. |

## Cách nhập

Trong ứng dụng, mở **Tiện ích → Sản phẩm → Nhập danh sách**, chọn tệp CSV và xem màn hình xem trước. Các cột bắt buộc là `Tên sản phẩm` và `Giá bán`; cột nguồn/biên lợi nhuận là cột bổ sung nên sẽ không ảnh hưởng đến việc nhập.
