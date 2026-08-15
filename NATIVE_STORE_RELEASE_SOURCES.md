# Nguồn chính thức — Native Store Release

Ngày rà soát: 15-08-2026. Tài liệu này lưu các yêu cầu bên ngoài cần áp dụng khi chuẩn bị bản iOS/Android phát hành.

| Chủ đề | Yêu cầu đã xác minh | Nguồn |
|---|---|---|
| Google Play target SDK | Từ 31-08-2026, app mới và bản cập nhật phải target Android 16 (API 36) hoặc cao hơn. | [Google Play target SDK](https://developer.android.com/google/play/requirements/target-sdk) |
| Google Play subscriptions | Purchase flow cần server-side verification, cấp entitlement sau khi xác minh, acknowledge giao dịch; subscription có các trạng thái active, cancelled, grace, on hold, paused và expired. Billing Library v8+ là yêu cầu từ 31-08-2026. | [Google Play Billing integration](https://developer.android.com/google/play/billing/integrate) |
| App Store review | Cần app hoàn chỉnh, metadata/URLs hoạt động, backend mở trong khi review, thông tin demo nếu app cần đăng nhập, và IAP sẵn sàng để reviewer kiểm tra. | [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) |
| Sign in with Apple | App iOS có third-party authentication cần cung cấp Apple authentication; standalone build cần capability Sign in with Apple và `ios.usesAppleSignIn: true`. | [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) |

## Hệ quả với Tạp Hóa POS

Tạp Hóa POS đã target Android API 36 trong Expo config. Những blocker native còn lại là Google/Apple OAuth production, IAP/Play Billing cùng entitlement backend, tài khoản store, native device acceptance test, privacy/data safety forms và asset screenshot đúng thiết bị.
