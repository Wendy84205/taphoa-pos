# Báo cáo kiểm thử tổng thể và an ninh Tạp Hóa POS

## Kết luận điều hành

MVP hiện **đạt mức production candidate cho pilot có kiểm soát**. Các kiểm thử tự động, bundle đa nền tảng, kiểm tra route Web và security guard đều đạt. Đã bổ sung rate limit auth/PIN, CSRF cookie/header cho mutation Web, giới hạn kích thước và cấu trúc snapshot, unique constraint nullable cho email/phone và test regression tương ứng. Tuy nhiên, MVP **chưa được xác nhận public production** vì chưa có tenant isolation end-to-end bằng hai tài khoản thật giả lập, chưa kiểm thử iPhone/Android vật lý, chưa hoàn thiện mapping production và dependency audit chưa hoàn tất do registry/network bị treo.

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
| Snapshot abuse | Payload trên 4MB hoặc cấu trúc quá sâu/quá lớn | Bị từ chối trước persistence |
| CORS production | Preflight từ origin ngoài allowlist | Trả 403 trong smoke test sạch |
| Rate limit | Auth/PIN theo IP + route | Đã bật in-memory; cần Redis/gateway nếu multi-instance |
| CSRF | Cookie/header cho mutation Web | Đã bật và có unit test |
| Identity uniqueness | Email/phone nullable | Migration 0007 đã áp dụng trên database hiện tại |

## Rà soát an ninh

### Các điểm đạt

Mật khẩu và PIN không lưu dạng plain text; helper dùng `scryptSync` với salt ngẫu nhiên và `timingSafeEqual`. Các route quản trị dùng `protectedProcedure` và nhiều thao tác kiểm tra membership owner trước khi đọc/ghi workspace. PIN nhân viên có khóa tạm thời sau năm lần sai. Snapshot restore, backup listing và snapshot push được giới hạn theo membership của người gọi. Input chính có Zod validation cho email, số điện thoại, mật khẩu, PIN, memberId, backupId và clientVersion.

Đã áp dụng hardening bổ sung: production CORS không còn phản chiếu origin tùy ý mà yêu cầu `CORS_ORIGINS`; body parser giảm từ 50MB xuống 5MB cho JSON và 1MB cho URL encoded; snapshot bị giới hạn 4MB trước khi serialize/lưu; log client không còn in token prefix hoặc toàn bộ user object.

### Rủi ro còn lại trước production

| Mức | Phát hiện | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| Cao | Rate limiter hiện lưu trong memory của một process | Khi chạy nhiều instance, mỗi instance có bucket riêng | Cần thay bằng Redis/gateway trước scale-out |
| Trung bình | Cần tenant isolation end-to-end bằng hai tenant thật giả lập | Unit guard đã có nhưng chưa thay thế kiểm thử authenticated thật | Chưa hoàn tất |
| Trung bình | Credentials session trả token trong response để native lưu SecureStore | Web không cần token response; cần tách transport rõ hơn | Cần rà soát tiếp |
| Trung bình | `credentialsOpenId` có dạng dự đoán được | Tăng khả năng enumeration nếu sau này có endpoint nhận openId không đúng thiết kế | Chưa xử lý |
| Trung bình | Snapshot schema còn rộng về cấu trúc | Đã có giới hạn kích thước nhưng chưa có giới hạn depth/array/string theo field | Chưa xử lý |
| Thấp | Dependency audit không hoàn tất | `pnpm audit` bị treo do registry/network trong sandbox | Cần chạy lại trong CI/production pipeline |

## Giới hạn của đợt kiểm thử

Không thực hiện đăng nhập bằng tài khoản production, không chạm dữ liệu production, không thử OTP/SMS theo yêu cầu đã loại khỏi phạm vi, và không thực hiện khai thác phá hoại. Camera, SecureStore, chia sẻ file, in Bluetooth và mất mạng cần được xác nhận thêm trên iPhone/Android thật theo `DEVICE_TEST_CHECKLIST.md`; bundle thành công không thay thế kiểm thử phần cứng thực tế.

## Quyết định phát hành

Có thể phát hành cho **pilot nội bộ một cửa hàng**, với backup thường xuyên và dữ liệu thử giới hạn. Chưa nên quảng bá công khai hoặc mở cho nhiều tenant thật cho đến khi hoàn tất tenant isolation end-to-end, kiểm thử thiết bị vật lý, mapping production và dependency audit. Nếu triển khai nhiều instance, cần thay in-memory rate limiter bằng Redis hoặc gateway limiter.
