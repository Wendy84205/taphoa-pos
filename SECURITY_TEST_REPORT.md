# Báo cáo kiểm thử tổng thể và an ninh Tạp Hóa POS

## Kết luận điều hành

MVP hiện **đạt mức dùng thử nội bộ và pilot có kiểm soát**. Các kiểm thử tự động, bundle đa nền tảng, kiểm tra route Web và một số security guard đều đạt. Tuy nhiên, MVP **chưa được xác nhận production public** vì chưa có kiểm thử trên thiết bị iPhone/Android vật lý, chưa có tenant isolation end-to-end bằng hai tài khoản thật giả lập, chưa có rate limit và CSRF protection đầy đủ cho các mutation dùng cookie, và dependency audit chưa hoàn tất do registry/network bị treo.

## Kết quả kiểm thử đã chạy

| Nhóm | Phạm vi | Kết quả |
|---|---|---|
| TypeScript | `pnpm check` | Đạt sau hardening |
| Lint | `pnpm lint` | Đạt; còn cảnh báo module type hiện hữu của `eslint.config.js` |
| Unit tests | 10 test files | 9 passed, 1 skipped; 26 passed, 1 skipped |
| Bundle | Web, Android, iOS | Export thành công cả ba nền tảng |
| Web routes | Tra cứu, Bán hàng, Sản phẩm, Vận hành, Báo cáo, Công nợ, Tài khoản | Render thành công ở desktop 1280px |
| POS domain | tồn kho, công nợ, VietQR, quy đổi đơn vị, báo cáo, import, khuyến mãi/combo | Có test regression và đạt |
| Workspace guard | Solo PIN, disabled staff, staff snapshot write | Đạt |
| Snapshot abuse | Payload trên 4MB | Bị từ chối trước persistence |
| CORS production | Preflight từ origin ngoài allowlist | Trả 403 trong smoke test sạch |

## Rà soát an ninh

### Các điểm đạt

Mật khẩu và PIN không lưu dạng plain text; helper dùng `scryptSync` với salt ngẫu nhiên và `timingSafeEqual`. Các route quản trị dùng `protectedProcedure` và nhiều thao tác kiểm tra membership owner trước khi đọc/ghi workspace. PIN nhân viên có khóa tạm thời sau năm lần sai. Snapshot restore, backup listing và snapshot push được giới hạn theo membership của người gọi. Input chính có Zod validation cho email, số điện thoại, mật khẩu, PIN, memberId, backupId và clientVersion.

Đã áp dụng hardening bổ sung: production CORS không còn phản chiếu origin tùy ý mà yêu cầu `CORS_ORIGINS`; body parser giảm từ 50MB xuống 5MB cho JSON và 1MB cho URL encoded; snapshot bị giới hạn 4MB trước khi serialize/lưu; log client không còn in token prefix hoặc toàn bộ user object.

### Rủi ro còn lại trước production

| Mức | Phát hiện | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| Cao | Chưa có rate limit toàn cục cho login credentials và PIN | Có thể brute-force phân tán dù PIN có lockout theo member | Chưa xử lý |
| Cao | Chưa có CSRF token cho mutation dùng cookie | Cần bảo vệ các mutation Web như restore, update profile, staff và snapshot push | Chưa xử lý |
| Trung bình | Email/phone chưa có unique constraint database | Race condition có thể tạo identity trùng | Chưa xử lý |
| Trung bình | Credentials session trả token trong response để native lưu SecureStore | Web không cần token response; cần tách transport rõ hơn | Cần rà soát tiếp |
| Trung bình | `credentialsOpenId` có dạng dự đoán được | Tăng khả năng enumeration nếu sau này có endpoint nhận openId không đúng thiết kế | Chưa xử lý |
| Trung bình | Snapshot schema còn rộng về cấu trúc | Đã có giới hạn kích thước nhưng chưa có giới hạn depth/array/string theo field | Chưa xử lý |
| Thấp | Dependency audit không hoàn tất | `pnpm audit` bị treo do registry/network trong sandbox | Cần chạy lại trong CI/production pipeline |

## Giới hạn của đợt kiểm thử

Không thực hiện đăng nhập bằng tài khoản production, không chạm dữ liệu production, không thử OTP/SMS theo yêu cầu đã loại khỏi phạm vi, và không thực hiện khai thác phá hoại. Camera, SecureStore, chia sẻ file, in Bluetooth và mất mạng cần được xác nhận thêm trên iPhone/Android thật theo `DEVICE_TEST_CHECKLIST.md`; bundle thành công không thay thế kiểm thử phần cứng thực tế.

## Quyết định phát hành

Có thể phát hành cho **pilot nội bộ một cửa hàng**, với backup thường xuyên và dữ liệu thử giới hạn. Chưa nên quảng bá công khai hoặc mở cho nhiều tenant thật cho đến khi hoàn tất rate limiting, CSRF, unique constraints, tenant isolation end-to-end và kiểm thử thiết bị vật lý.
