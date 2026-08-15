# Production Runbook — Tạp Hóa POS

Tài liệu này mô tả cách vận hành phiên bản production candidate của Tạp Hóa POS. Tài liệu không chứa secret thật; mọi giá trị thật phải được đặt trong secret manager hoặc cấu hình hosting.

## 1. Cấu hình bắt buộc

| Nhóm | Biến/cấu hình | Yêu cầu production |
|---|---|---|
| Database | `DATABASE_URL` | MySQL có SSL, tài khoản quyền tối thiểu và backup tự động |
| Session | `JWT_SECRET` | Chuỗi ngẫu nhiên đủ mạnh, không dùng lại giữa staging/production |
| OAuth | `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | Callback URL khớp domain HTTPS chính thức |
| Web/mobile API | `EXPO_PUBLIC_API_BASE_URL` | HTTPS cố định; không dùng preview URL hoặc localhost |
| CORS | `CORS_ORIGINS` | Danh sách origin cách nhau bằng dấu phẩy, chỉ gồm domain Web production/staging |
| Global rate limit | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis REST production, dùng token Standard chỉ ở server |
| Readiness | `REQUIRE_DATABASE=true` | Bắt buộc API trả 503 nếu database không sẵn sàng |

Ví dụ định dạng `CORS_ORIGINS`:

```env
CORS_ORIGINS=https://app.example.vn,https://staging.example.vn
REQUIRE_DATABASE=true
```

## 2. Health, readiness và log

| Endpoint | Mục đích | Điều kiện đạt |
|---|---|---|
| `GET /api/health` | Liveness của process | HTTP 200, `ok: true` |
| `GET /api/readiness` | Readiness trước khi nhận traffic | HTTP 200 khi database sẵn sàng; HTTP 503 khi database bắt buộc nhưng không truy cập được |

Mỗi response có `x-request-id`. Server ghi log JSON cho lỗi HTTP, tRPC, rate limit và CSRF; mật khẩu, PIN, token, cookie, snapshot, email và số điện thoại được che trước khi log. Hệ thống theo dõi cần cảnh báo khi tỷ lệ `5xx`, `csrf_rejected`, `rate_limit_exceeded`, `trpc_error` hoặc readiness `503` tăng bất thường.

## 3. Backup và restore

Database phải có backup tự động mỗi ngày và giữ tối thiểu 14 bản gần nhất. Trước khi phát hành migration, tạo backup và chạy thử restore trên staging. Dữ liệu cloud snapshot có bản backup theo phiên bản; chỉ owner được xem/khôi phục backup. Không dùng restore như một thao tác nền âm thầm: chủ quán cần xác nhận phiên bản và thời điểm trước khi khôi phục.

## 4. Rate limit và mở rộng nhiều instance

Rate limit tự dùng memory khi không có Redis. Khi đặt cả `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`, server dùng Upstash Redis REST qua Lua `EVAL` nguyên tử để tăng counter và TTL trong một thao tác. Khi Redis tạm lỗi, server ghi event `upstash_rate_limit_fallback` đã redact và hạ về memory để không làm ngừng bán hàng; cần cảnh báo event này vì fallback không chia sẻ giới hạn giữa các instance.

Adapter dựa trên REST command body và `Authorization: Bearer` theo tài liệu Upstash; token Standard chỉ được giữ server-side, tuyệt đối không đưa vào Web/mobile bundle. Tham khảo [Upstash REST API](https://upstash.com/docs/redis/features/restapi) và [Lua EVAL atomic operations](https://upstash.com/blog/lua-scripting-on-upstash-redis-atomic-operations-over-http).

| Luồng | Chính sách hiện tại | Khuyến nghị production nhiều instance |
|---|---:|---|
| Đăng ký/đăng nhập/khôi phục | 10 lần / 15 phút / IP + route | Redis hoặc API gateway rate limit |
| PIN nhân viên | 8 lần / 15 phút / IP + route; thêm lock tài khoản 5 lần sai | Redis hoặc API gateway rate limit |

## 5. Go-live gate

Chỉ chuyển traffic production sau khi tất cả điều kiện sau đạt: migration trên staging thành công; tenant A/B authenticated end-to-end không truy cập chéo; owner/staff guard đạt; backup/restore staging đạt; `/api/readiness` đạt; Web refresh route hoạt động; iPhone và Android thật hoàn thành checklist camera, SecureStore, offline, share, print và deep link.

## 6. Rollback

Khi có lỗi nghiêm trọng, dừng rollout mới, kiểm tra request ID và lỗi server, rollback ứng dụng về checkpoint đã xác minh, sau đó khôi phục database từ backup tương ứng nếu migration/dữ liệu là nguyên nhân. Không dùng `git reset --hard` hoặc migration xóa dữ liệu trực tiếp trên production.

## 7. Native release

Expo Go qua tunnel của sandbox có thể trả manifest không ổn định. Để nghiệm thu native, dùng luồng **Publish/Build** của dự án tạo bản iOS/Android cài trực tiếp, rồi thực hiện `DEVICE_TEST_CHECKLIST.md`. Khi phát triển local, chạy `npx expo start --lan` trên laptop cùng Wi-Fi với thiết bị; không dùng URL Web preview trong Expo Go.
