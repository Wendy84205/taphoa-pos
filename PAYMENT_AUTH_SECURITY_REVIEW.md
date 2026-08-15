# Rà soát bảo mật: Trial, Stripe và Google OAuth

## Phạm vi và kết quả hiện tại

Đợt rà soát này bao gồm entitlement trial 15 ngày, luồng Stripe Checkout/Billing Portal/webhook ở trạng thái **chưa kích hoạt**, và chuẩn bị Google OAuth mà chưa nhận credentials. Hệ thống không tạo checkout, không mở Billing Portal, và không xác nhận Google Sign-In khi thiếu cấu hình server-side bắt buộc.

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| TypeScript | Đạt | `pnpm check` hoàn tất không lỗi. |
| Lint | Đạt | `pnpm lint` hoàn tất; chỉ còn warning hiện hữu về `eslint.config.js` module type. |
| Regression | Đạt | 14 file test pass, 1 file skip; 46 test pass, 2 test skip. |
| Trial lifecycle | Đạt | Test xác nhận đúng 15 ngày, hết hạn server-side, grace period và tenant legacy. |
| Entitlement guard | Đạt | Owner bị chặn ghi cloud khi entitlement hết hạn; dữ liệu offline cục bộ không bị xóa/chặn. |
| Stripe config | Đạt ở trạng thái chờ | Server chỉ bật khi đủ API key, webhook secret, HTTPS base URL và hai Price ID do server kiểm soát. |
| Dependency audit | Chưa có kết quả | `pnpm audit --prod` bị hệ thống dừng do áp lực bộ nhớ sau khi check/lint/test đã pass; cần chạy lại ở môi trường có đủ RAM hoặc CI. |

## Kiểm soát đã thêm

| Rủi ro | Kiểm soát hiện có |
|---|---|
| Người dùng chỉnh price/plan từ client | Client chỉ gửi mã plan allowlist; backend ánh xạ Price ID từ biến môi trường. |
| Tin redirect success URL là đã trả tiền | Quyền dùng chỉ thay đổi qua Stripe webhook đã xác minh signature, không từ URL success/callback client. |
| Webhook giả mạo | Endpoint dùng raw request body và `Stripe-Signature` cùng webhook signing secret. |
| Webhook giao lặp | `billingWebhookEvents` có unique index theo `(provider, providerEventId)` và payload hash/audit metadata tối thiểu. |
| Hết trial nhưng tiếp tục ghi cloud | Guard server chặn mutation đồng bộ/khôi phục và quản trị nhân viên bằng `PAYMENT_REQUIRED`. |
| Khóa dữ liệu cục bộ khi hết gói | Chỉ chặn cloud write; POS offline vẫn giữ dữ liệu cục bộ để tránh mất dữ liệu vận hành. |
| OTP/SMS bị lạm dụng | Đã bỏ route đăng nhập/khôi phục bằng OTP/SMS; số điện thoại còn là trường contact tùy chọn. |
| Lộ secret xuống client | Readiness endpoint chỉ trả boolean/redirect URI công khai; không trả Stripe key hoặc Google client secret. |

## Khoảng trống chủ động còn lại

Stripe webhook cần được đăng ký ở Stripe Dashboard với URL HTTPS public và các event subscription phù hợp. Khi bật, cần kiểm thử sandbox cho `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, refund và event giao lặp. Stripe mô tả subscription thay đổi phần lớn bất đồng bộ nên webhook là thành phần bắt buộc của integration; endpoint production phải dùng HTTPS và nên trả `2xx` nhanh trước xử lý phức tạp. [1] [2]

Google Sign-In hiện mới có kiểm tra readiness cấu hình. Nó chưa phải Google OAuth chạy thật cho tới khi có Web Client ID/secret, iOS Client ID, Android Client ID, HTTPS redirect URI, Android signing SHA và cấu hình consent screen. Google yêu cầu OAuth client ID được cấu hình theo ứng dụng và redirect URI đã đăng ký. [3]

Việc chọn Stripe vẫn cần xác minh khả năng onboarding/nhận tiền của pháp nhân trước khi production. Nếu Stripe không phù hợp với pháp nhân/thị trường, chỉ cần thay payment adapter; entitlement theo tenant không phụ thuộc gateway.

## Hướng dẫn setup sẽ thực hiện sau

1. Tạo Stripe Test mode product/Price và Billing Portal; nhập credentials qua managed secret settings.
2. Đăng ký endpoint `/api/billing/stripe/webhook` trên domain HTTPS và chọn event cần thiết.
3. Chạy Stripe sandbox test cho checkout, renewal, failed payment, cancel/refund và webhook replay.
4. Tạo OAuth consent screen và client IDs Google cho Web/iOS/Android; cấu hình redirect URI, bundle/package và Android SHA signing.
5. Chạy test end-to-end trên domain staging bằng hai tenant và trên iOS/Android native thật.

## References

[1] [Stripe: Using webhooks with subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks)

[2] [Stripe: Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks)

[3] [Google: Set up OAuth 2.0](https://support.google.com/googleapi/answer/6158849)
