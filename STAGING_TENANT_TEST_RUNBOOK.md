# Staging Tenant Isolation Runbook

Tài liệu này là kịch bản bắt buộc trước khi mở pilot. Chỉ chạy trên **staging database riêng**, không dùng dữ liệu hoặc tài khoản của cửa hàng thật.

## Điều kiện trước khi chạy

| Điều kiện | Giá trị cần xác nhận |
|---|---|
| API staging | HTTPS domain riêng, `GET /api/readiness` trả HTTP 200 |
| Web staging | Domain đã nằm trong `CORS_ORIGINS` |
| Database staging | Migration mới nhất, có thể xóa toàn bộ dữ liệu test sau lượt chạy |
| Redis staging | Có `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`, test `PING` đạt |
| Thiết bị/browser | Hai browser profile hoặc hai máy; không dùng cùng cookie/session |

## Tài khoản test

Tạo đúng bốn danh tính trên staging. Dùng email test có tên miền không nhận thư thật, ví dụ `owner-a@staging.invalid`.

| Danh tính | Workspace | Vai trò | Mục đích |
|---|---|---|---|
| Owner A | Quán A | owner | Tạo dữ liệu thuộc tenant A |
| Staff A | Quán A | staff | Xác nhận giới hạn nhân viên |
| Owner B | Quán B | owner | Xác nhận tenant B độc lập |
| Anonymous | Không có | không đăng nhập | Xác nhận route protected bị chặn |

## Kịch bản bắt buộc

1. Đăng ký Owner A, chọn `WithStaff`, tạo 2 sản phẩm và 1 hóa đơn; upload cloud snapshot A.
2. Đăng ký Owner B, chọn `Solo`, tạo 1 sản phẩm và snapshot B.
3. Với session Owner B, thử đọc snapshot, backup, audit log, thành viên và restore của A bằng ID/URL/route quan sát được. Mọi request phải bị chặn hoặc chỉ trả dữ liệu B.
4. Với Staff A, thử push snapshot, xem backup, restore, audit, danh sách thành viên, đổi store type và thao tác owner-only. Tất cả phải trả `FORBIDDEN`.
5. Với Anonymous, gọi cùng route protected. Tất cả phải trả `UNAUTHORIZED`.
6. Kiểm tra invoice/báo cáo A không hiện trong B; hóa đơn Staff A có seller đúng người; audit tạo/khóa/reset PIN chỉ thuộc A.
7. Gọi login sai quá giới hạn, xác nhận HTTP `429` và `Retry-After`; gọi lại sau window test hoặc xóa key staging.
8. Xác nhận mutation cookie không có `x-csrf-token` trả `403`; request có CSRF cookie/header hợp lệ hoạt động.

## Điều kiện đạt và cleanup

Không được có dữ liệu hoặc metadata tenant A lộ sang B. Không được có mutation owner-only thành công cho Staff A. Ghi request ID của mọi lỗi từ API log. Khi đạt, export kết quả (không chứa token/mật khẩu), xóa bốn tài khoản test và reset database staging về trạng thái rỗng.
