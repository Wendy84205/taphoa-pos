# Security Audit — Tạp Hóa POS

**Ngày rà soát:** 15/08/2026. **Phạm vi:** Web Expo, iOS/Android Expo, Express/tRPC, MySQL/Drizzle, cloud snapshot, backup local, OAuth và lớp Stripe chuẩn bị. Đây là review mã nguồn và kiểm thử tự động; không phải penetration test trên tài khoản thật hay kiểm toán tuân thủ độc lập.

## Kết luận ngắn

Các rủi ro có thể khắc phục trực tiếp từ source đã được xử lý: **lộ token/PII qua console**, **login CSRF/token injection ở callback OAuth**, **backup local không được kiểm tra**, **rủi ro hydrate snapshot cache khi đổi tài khoản**, và **Android deep link quá rộng**. Sau sửa đổi, TypeScript, lint, server build, Web export và toàn bộ regression đều đạt.

> Không có cơ sở để khẳng định ứng dụng “không còn lỗ hổng”. Các tích hợp Stripe/Google OAuth chưa được kích hoạt bằng credentials thật, vì vậy chỉ có thể kiểm tra cấu trúc và guard của mã nguồn.

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| TypeScript | Đạt | `pnpm check` |
| Lint Expo | Đạt | `pnpm lint` |
| Regression | Đạt | 17 test files đạt, 1 file skip; 52 tests đạt, 2 tests skip |
| Backend production bundle | Đạt | `pnpm build` |
| Expo Web export | Đạt | 25 routes export thành công |
| Dependency audit tự động | Chưa kết luận | `pnpm audit --prod` dừng do heap OOM trong sandbox |
| Android/iOS native runtime | Chưa kết luận | Cần build và test thiết bị thật |

## Lỗ hổng đã khắc phục

| Mức độ trước sửa | Phát hiện | Cách xử lý | Regression |
|---|---|---|---|
| Cao | `lib/_core/api.ts`, `use-auth.ts` và callback OAuth ghi response headers, token prefix, Set-Cookie hoặc object user vào console. | Gỡ các log client nhạy cảm; callback chỉ trả thông báo lỗi tổng quát. | Static scan sau sửa không còn sink token/cookie/PII đã xác định. |
| Cao | OAuth state chỉ là redirect URI encode, callback native chấp nhận `sessionToken` trực tiếp qua deep link. Một liên kết độc hại có thể ép đăng nhập nhầm tenant. | State chứa nonce; Web bind state bằng cookie HttpOnly 10 phút; native so sánh state đã lưu SecureStore; reject redirect không thuộc callback hợp lệ; bỏ token URL. | `tests/oauth-state.test.ts`. |
| Trung bình | Cookie session được share trên parent domain và có `SameSite=None`, tăng bề mặt subdomain/cross-site. | Chuyển cookie host-only, `HttpOnly`, `SameSite=Lax`, Secure khi HTTPS. | TypeScript, security regression. |
| Trung bình | Import backup local chỉ kiểm tra envelope, có thể restore JSON quá lớn/sâu hoặc shape không hợp lệ vào state local. | Thêm giới hạn 4MB/depth/entry/string, cấm `__proto__`/`constructor`/`prototype`, bắt buộc các list POS cốt lõi và kiểm tra mọi nền tảng trước restore. | `tests/backup-validation.test.ts`. |
| Trung bình | Cloud sync có thể dùng query cache của workspace trước trong khoảng đổi user/account. | Chỉ enable hydrate/push snapshot khi `membership.userId` của workspace khớp user đang xác thực. | `tests/cloud-sync-guard.test.ts`. |
| Thấp | Constants OAuth dùng deep-link scheme khác `app.config.ts`; Android intent filter nhận mọi host custom scheme. | Đồng bộ scheme với Expo config và giới hạn Android callback vào `oauth/callback`. | TypeScript + Web export. |

## Rủi ro còn tồn tại và điều kiện go-live

| Mức độ | Rủi ro còn lại | Việc bắt buộc trước public |
|---|---|---|
| Cao | **Stripe, Google OAuth và IAP chưa có credentials/console product thật**; không thể xác thực callback, chữ ký webhook, renewal/refund hoặc redirect thật. | Cấu hình sandbox trước; test webhook signature, Checkout, Billing Portal, cancel, renewal, duplicate event và Google callback trên domain HTTPS chính thức. |
| Cao | **Không có xác nhận trên iPhone/Android thật** cho SecureStore, callback custom scheme, camera, offline, share file và session. | Chạy `DEVICE_TEST_CHECKLIST.md` bằng native build, không dùng Expo Go làm tiêu chuẩn callback OAuth. |
| Trung bình | `pnpm audit --prod` không hoàn thành vì sandbox thiếu heap. Không thể kết luận dependency tree không có advisory. | Chạy audit trong CI/máy đủ RAM, lưu artifact và chặn merge khi có advisory mức high/critical. |
| Trung bình | JWT session có lifetime dài và hiện chưa có cơ chế server-side revoke/version theo thiết bị. Token bị lộ chỉ hết hạn theo thời gian. | Thiết kế refresh token rotation, session/device registry và logout-all/revoke trước khi mở tài khoản trả phí. |
| Trung bình | `/manus-storage/*` tạo redirect signed URL theo key và không áp dụng tenant authorization. Hiện chưa dùng cho tài liệu nhạy cảm, nhưng sẽ thành rủi ro khi thêm upload hóa đơn/backup/ảnh khách hàng. | Chỉ allowlist asset public, hoặc yêu cầu auth + kiểm tra tenant ownership trước presign. |
| Trung bình | Production security phụ thuộc `CORS_ORIGINS`, domain HTTPS, database/backup/monitoring thật. | Set allowlist origin tuyệt đối, không dùng wildcard, bật TLS, secret manager, database backup encryption và alerting. |
| Thấp | Warning ESLint `MODULE_TYPELESS_PACKAGE_JSON` gây overhead nhỏ nhưng không là lỗ hổng. | Chuẩn hóa module type/ESLint config trong lượt maintenance riêng, sau khi đánh giá ảnh hưởng build tool. |

## Các kiểm tra không thực hiện

Không gửi thanh toán, không tạo sản phẩm Stripe, không đăng nhập Google bằng tài khoản thật, không quét dịch vụ production, không fuzz API công khai và không thao tác dữ liệu tenant thật. Các việc này cần staging riêng, secrets thật và sự phê duyệt vận hành.

## Khuyến nghị ưu tiên

1. Thiết lập **staging HTTPS** với domain/API riêng, `CORS_ORIGINS` allowlist và database test; sau đó chạy test hai tenant, owner/staff và OAuth/Stripe sandbox.
2. Trước khi nhận tiền, bổ sung **session revocation/rotation** và owner-only kiểm tra ownership cho mọi file storage.
3. Thiết lập CI chạy `pnpm check`, `pnpm lint`, `pnpm test`, Expo export và dependency audit có đủ RAM cho mỗi pull request.
