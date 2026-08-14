# Production Mapping — Tạp Hóa POS

Tài liệu này là runbook cấu hình production candidate. Không ghi secret thật vào repository; giá trị nhạy cảm phải được nhập qua secret manager của môi trường triển khai.

## Kiến trúc đề xuất

| Thành phần | Vai trò | Giá trị production cần cung cấp |
|---|---|---|
| Web hosting | Phục vụ Web static/SPA | Domain HTTPS, SPA fallback, cache asset hash |
| API server | tRPC, auth, snapshot sync | URL HTTPS ổn định, health check `/api/health` |
| Database | MySQL production | `DATABASE_URL` có SSL, backup tự động, migration Drizzle |
| Object/file storage | Export/backup nếu bật | Bucket riêng, private-by-default, lifecycle policy |
| Monitoring | Logs, metrics, alerts | 5xx, 429, tRPC error, sync conflict, latency, bundle failure |

## Environment mapping

| Biến | Mục đích | Production policy |
|---|---|---|
| `DATABASE_URL` | Kết nối MySQL | Secret manager, SSL bắt buộc, không commit |
| `CORS_ORIGINS` | Allowlist domain Web | Chỉ domain HTTPS production, phân cách bằng dấu phẩy |
| `COOKIE_SECRET` | Ký session | Secret ngẫu nhiên mạnh, khác development |
| `OAUTH_SERVER_URL` | OAuth server | Endpoint HTTPS chính thức |
| `VITE/EXPO_PUBLIC_API_BASE_URL` | API base URL cho client | URL HTTPS cố định, không dùng preview/localhost |
| `EXPO_PUBLIC_APP_ID` | App/runtime identity | Giá trị production cố định |

Tên biến thực tế phải đối chiếu với `server/_core/env.ts`, `scripts/load-env.js` và `constants/oauth.ts` trước khi tạo secret. Không đưa secret vào `app.config.ts`, bundle client, GitHub hoặc file export.

## Database go-live

Tạo database production riêng, bật SSL và backup tự động. Chạy migration Drizzle theo thứ tự, gồm migration `0007_young_shatterstar.sql` cho unique email/phone. Trước khi migration, kiểm tra dữ liệu trùng; sau migration, kiểm tra bảng `stores`, `storeMembers`, `posSnapshots`, `snapshotBackups` và `auditLogs`. Thử restore vào database staging trước khi nhận dữ liệu thật.

## Domain, cookie và CORS

Web và API phải dùng HTTPS. `CORS_ORIGINS` chỉ chứa các origin Web được phép. Cookie session phải có `httpOnly`, `secure` trong production, path `/` và policy same-site phù hợp kiến trúc domain. CSRF cookie `taphoa_csrf` phải được gửi kèm header `x-csrf-token` cho mutation Web authenticated.

## Backup, monitoring và rollback

Thiết lập backup database theo lịch, giữ nhiều phiên bản và kiểm tra restore định kỳ. Snapshot POS cần được backup ở cả cloud và local theo hướng dẫn vận hành. Monitoring phải cảnh báo HTTP 5xx, 401/403 bất thường, 429 rate limit, lỗi tRPC, cloud sync conflict, latency và bundle load failure. Mỗi lần phát hành phải có checkpoint ứng dụng và migration rollback plan; không dùng thao tác reset phá dữ liệu.

## Go-live gate

Chỉ mở cho user thật sau khi tenant isolation end-to-end, authenticated onboarding, thiết bị iPhone/Android thật, backup/restore staging, domain HTTPS, CORS allowlist, monitoring và rollback đã được ký xác nhận. OTP/SMS vẫn nằm ngoài phạm vi theo quyết định sản phẩm hiện tại.
