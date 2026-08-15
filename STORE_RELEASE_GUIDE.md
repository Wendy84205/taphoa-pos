# Release Guide — Google Play và App Store

Tài liệu này là hồ sơ kỹ thuật cho **Tạp Hóa POS 1.0.0**. Trước submit, chủ tài khoản phải rà soát lại mọi khai báo privacy theo backend và SDK thực tế đang chạy; đây không phải tư vấn pháp lý.

## Trạng thái release candidate

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Expo Doctor | Đạt 18/18 | Đã thêm `expo-asset`, plugin Font/WebBrowser và dùng một `pnpm-lock.yaml` |
| Android target | `targetSdkVersion: 36` | Phù hợp yêu cầu Google Play cho app mới từ 31/08/2026 [1] |
| Android artifact | Cần Android App Bundle (`.aab`) | Tạo qua luồng Publish/Build, không tự build APK trong sandbox |
| iOS artifact | Cần archive/TestFlight build | Upload qua App Store Connect bởi tài khoản Apple Developer |
| Native test | Chưa nghiệm thu thiết bị thật | Bắt buộc chạy `NATIVE_RELEASE_ACCEPTANCE.md` |
| Privacy policy URL | Chưa public | Publish route `/chinh-sach-bao-mat` ở domain HTTPS chính thức trước submit |

## Google Play Console

Google yêu cầu mọi app phát hành khai báo Data safety chính xác, gồm dữ liệu do thư viện/SDK bên thứ ba xử lý; kể cả app không thu thập dữ liệu cũng cần hoàn thành form và nêu privacy policy. [2]

| Play Console field | Giá trị chuẩn bị | Chủ tài khoản cần xác nhận |
|---|---|---|
| App name | Tạp Hóa POS | Có |
| Default language | Tiếng Việt (vi-VN) | Có |
| App/Category | App · Business | Có |
| Contact email | Email hỗ trợ thật | Có |
| Privacy policy | `https://<domain>/chinh-sach-bao-mat` | Có |
| Data safety | Account info, customer/transaction data, app activity; camera/photos chỉ khi người dùng chủ động cấp quyền | Phải đối chiếu backend/SDK thật |
| Testing track | Internal testing → Closed testing → Production | Có |

## App Store Connect

Apple yêu cầu privacy details (gồm SDK bên thứ ba) để tạo Privacy Nutrition Label trước khi submit; review cũng yêu cầu support link và privacy policy link hoạt động. [3] [4]

| App Store field | Giá trị chuẩn bị | Chủ tài khoản cần xác nhận |
|---|---|---|
| Name | Tạp Hóa POS | Có |
| Subtitle | Bán hàng và quản lý tạp hóa | Có |
| Primary category | Business | Có |
| Support URL | URL hỗ trợ HTTPS thật | Có |
| Privacy policy URL | `https://<domain>/chinh-sach-bao-mat` | Có |
| Privacy Nutrition Label | Dữ liệu account, nội dung kinh doanh/công nợ, identifiers và diagnostics chỉ nếu backend/SDK thật xử lý | Phải đối chiếu backend/SDK thật |
| Testing | TestFlight internal trước, external sau khi cần | Có |

Apple hiện yêu cầu iOS/iPadOS upload được build bằng iOS/iPadOS 26 SDK hoặc mới hơn từ 28/04/2026. Xác nhận build image của luồng Publish/Build đáp ứng điều kiện này trước khi upload. [3]

## Asset checklist

Chuẩn bị icon app 1024×1024, ảnh feature graphic Android, ảnh screenshot portrait từ iPhone và Android thật. Apple cho phép 1–10 screenshot PNG/JPEG/JPG; lấy trực tiếp từ build native thay vì mô phỏng Web. [5]

## Quy trình an toàn

Tạo build qua nút **Publish/Build** trong giao diện quản lý dự án, cài Internal testing/TestFlight trước, chạy native acceptance, rồi mới upload artifact và metadata. Không submit Production/App Review nếu privacy policy chưa public, chưa có tài khoản review/demo hợp lệ hoặc chưa có người chủ tài khoản xác nhận lần cuối.

## References

[1] [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk)

[2] [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-GB)

[3] [Apple: Submitting apps](https://developer.apple.com/app-store/submitting/)

[4] [Apple: App Review](https://developer.apple.com/distribute/app-review/)

[5] [Apple: Upload screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/)
