# Cấu hình còn thiếu: đăng nhập, trial và subscription

## Kết luận ngắn

Tạp Hóa POS hiện có đăng ký/đăng nhập **email–mật khẩu** và **số điện thoại–mật khẩu**, cùng cơ chế session, role owner/staff, PIN quầy, CSRF và rate limit. Hệ thống **chưa có Google Sign-In production**, **chưa có xác thực số điện thoại bằng OTP thực tế**, **chưa có gói dùng thử 15 ngày**, và **chưa có bất kỳ payment/subscription/auto-renewal nào**. Vì vậy, app/web hiện chưa thể thu phí hoặc tự khóa/mở quyền theo thanh toán.

> **Khuyến nghị kiến trúc:** dùng một entitlement backend duy nhất theo tenant/store; Web payment, App Store subscription và Google Play subscription đều gửi sự kiện về backend để backend quyết định quyền dùng app/web. Không tin trạng thái thanh toán chỉ từ client.

## Ma trận hiện trạng

| Nhóm | Hiện có | Chưa có / cần cấu hình | Mức độ |
|---|---|---|---|
| Email login | Register/login credential, hash mật khẩu, session cookie/native token | Email verification, email reset provider, deliverability, policy chống spam | Cần trước public |
| Phone login | Nhập SĐT + mật khẩu, validation định dạng VN | OTP SMS thật, xác minh ownership, resend/cooldown, consent, nhà cung cấp SMS | Blocker nếu cho login bằng OTP |
| Google login | OAuth framework/callback hiện hữu từ template | Google Cloud project, consent screen, client ID Web/iOS/Android, redirect URI, token verification/link account | Blocker nếu quảng bá “Đăng nhập Google” |
| Trial 15 ngày | Chưa có model entitlement | Trial start/end, timezone, eligibility, grace period, anti-abuse, UI countdown, expiry enforcement | Blocker cho freemium |
| Web payment | Chưa có | Chọn cổng thanh toán VN/quốc tế, checkout, webhook ký số, idempotency, refund/reconciliation | Blocker thu phí Web |
| iOS subscription | Chưa có StoreKit/IAP | Subscription Group, product ID, trial offer, server notifications, receipt/transaction verification, restore purchase | Blocker thu phí iOS |
| Android subscription | Chưa có Play Billing | Subscription/base plan/offer, Billing Library, RTDN, purchase verification/acknowledge, restore/manage link | Blocker thu phí Android |
| Đồng bộ quyền | Chưa có | Entitlement theo store/tenant, source-of-truth backend, cancel/refund/renewal events, audit | Blocker multi-platform |

## Cần thiết lập cho Google Sign-In

Tạo Google Cloud project production, OAuth consent screen, và **ba OAuth client riêng**: Web, iOS và Android. Client iOS phải dùng đúng bundle ID; Web cần domain HTTPS và redirect URI production; Android cần package name và SHA-1/SHA-256 certificate của signing key phát hành. Native OAuth nên dùng browser hệ thống/PKCE, kiểm tra `state` chống CSRF và server-side token verification. Google yêu cầu OAuth client credentials nhận diện ứng dụng; redirect URI phải khớp tuyệt đối với URI đã đăng ký. [1]

Nếu iOS cho Google hoặc bất kỳ đăng nhập social bên thứ ba nào để tạo tài khoản chính, cần đánh giá yêu cầu **Sign in with Apple** trong App Review Guidelines trước submit. Đây là hạng mục chưa có trong app.

## Cần thiết lập cho đăng nhập số điện thoại

Hiện số điện thoại chỉ là identifier dùng cùng mật khẩu. Để dùng “đăng nhập bằng số điện thoại” theo nghĩa OTP, cần chọn nhà cung cấp SMS có hỗ trợ Việt Nam, thiết lập sender ID/template, webhook delivery, chi phí, consent và hạn chế lạm dụng. Backend cần bảng OTP hash + TTL, giới hạn gửi theo IP/SĐT/thiết bị, thử sai tối đa, idempotency và audit. Không lưu OTP thô; không trả OTP về client/log.

Các biến cấu hình thường cần gồm `SMS_PROVIDER`, API key/secret, sender ID, callback signature secret và domain callback HTTPS. Những giá trị này chưa được cung cấp/cấu hình.

## Gói dùng thử miễn phí 15 ngày

Nên cấp entitlement lúc **tenant/store đầu tiên** được tạo, không phải mỗi thiết bị hay mỗi lần cài app. Model tối thiểu:

| Field | Ý nghĩa |
|---|---|
| `planCode` | `trial`, `starter`, `pro`, `expired` |
| `trialStartedAt` / `trialEndsAt` | Mốc UTC, trial ends = start + 15 ngày |
| `status` | `trialing`, `active`, `past_due`, `grace`, `canceled`, `expired` |
| `source` | `web`, `apple`, `google_play`, `manual` |
| `providerCustomerId` / `providerSubscriptionId` | Đối chiếu với payment provider/store |
| `entitlementVersion` | Đồng bộ cache offline an toàn |

App/Web cần hiển thị số ngày còn lại, cảnh báo trước khi hết hạn, trang chọn gói, trạng thái thanh toán, nút khôi phục giao dịch và chế độ read-only/quyền tối thiểu khi hết hạn. Backend phải kiểm entitlement ở mọi mutation trả phí, không chỉ ẩn nút trên UI.

## Thanh toán và auto-renewal

### Web

Chọn gateway phù hợp pháp nhân/thị trường (ví dụ cổng thanh toán Việt Nam hoặc Stripe nếu đủ điều kiện), tạo checkout trên server, nhận webhook có chữ ký và cấp entitlement sau khi xác thực server-side. Bắt buộc có idempotency key, bảng payment event bất biến, retry queue, reconciliation và quy trình refund/chargeback. Không đánh dấu user đã trả tiền từ query parameter hay callback client.

### iOS

Với subscription số hóa bán trong app, cấu hình auto-renewable subscription trong App Store Connect: Subscription Group, Product ID, giá, localizations, introductory/free-trial offer, App Store Server Notifications và xác thực giao dịch ở backend. Apple cho biết auto-renewable subscriptions sẽ gia hạn trừ khi người dùng hủy; subscription được tổ chức trong Subscription Group và product. [2]

### Android

Tạo subscription product, base plan và offer trong Play Console, tích hợp Play Billing, xác nhận/acknowledge purchase, dùng Real-time Developer Notifications (RTDN) và xác thực token ở backend. Google mô tả subscription là recurring transaction cấp entitlement, và yêu cầu app mới/cập nhật dùng Play Billing Library 8+ từ 31/08/2026. [3]

### Đồng bộ app và web

Một user mua ở App Store hay Play Store vẫn phải thấy quyền trên Web nếu chính sách sản phẩm cho phép. Vì vậy backend phải map Apple transaction/Google purchase/Web payment vào cùng `storeId` entitlement. Cần xử lý renew, cancel, billing retry/grace period, refund/revoke, restore purchase, đổi gói và trùng webhook một cách idempotent. Không thể dùng một gateway Web để thay cho StoreKit/Play Billing trong app mà không đánh giá chính sách store và khu vực phân phối.

## Hạ tầng và pháp lý chưa thiết lập

| Hạng mục | Cần làm |
|---|---|
| Domain production | Domain HTTPS cố định cho Web, OAuth redirect, webhook và privacy policy; domain Manus hiện dùng được để xem nhưng không nên là định danh thương mại lâu dài nếu chưa chốt sở hữu. |
| Database production | MySQL/Postgres managed, backup đã thử restore, migration, encryption/TLS, least-privilege user. |
| Secret management | Lưu OAuth/SMS/payment/webhook secret qua managed secret store, không commit `.env`. |
| Webhook operation | Queue, retry, dead-letter, request signature verification, idempotency, monitoring/alert. |
| Legal | Điều khoản sử dụng, pricing, cancellation/refund policy, privacy policy có pháp nhân/email thật, consent SMS, invoice/tax consultation. |
| Support | Email hỗ trợ, SLA, review account/demo data cho App Review/Play review. |
| Observability | Error tracking, metrics login/payment/webhook, audit, alert khi renewal webhook lỗi. |

## Thứ tự triển khai khuyến nghị

1. Chốt pháp nhân, domain, pricing và gateway/payment strategy.
2. Tích hợp entitlement + trial 15 ngày trên backend, UI plan/expiry và enforcement.
3. Tích hợp Google Sign-In + Sign in with Apple (nếu áp dụng) + SMS OTP thật.
4. Tích hợp Web payment và webhook trước để có dòng thanh toán dễ test.
5. Tích hợp StoreKit và Play Billing, server notifications/RTDN, restore purchase.
6. Chạy sandbox/TestFlight/internal testing với renew, cancel, refund, grace, hết trial và đổi thiết bị.
7. Hoàn tất legal/support/privacy rồi mới submit store production.

## References

[1] [Google OAuth 2.0 for installed apps](https://developers.google.com/identity/protocols/oauth2/native-app)

[2] [Apple: Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)

[3] [Google Play Billing: About subscriptions](https://developer.android.com/google/play/billing/subscriptions)
