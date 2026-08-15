# Production Checklist — Tạp Hóa POS

Tài liệu này mô tả các bước cần hoàn tất trước khi public Website và bản iOS/Android. Đây là checklist vận hành, không chứa giá trị secret thật.

## 1. Môi trường và biến cấu hình

| Nhóm | Cấu hình | Môi trường phát triển | Production cần xác nhận |
|---|---|---|---|
| Backend | `DATABASE_URL` | WebDev database | Database production có SSL, migration đã chạy và backup tự động |
| Session | Cookie/session signing từ runtime Manus | WebDev runtime | Domain production, secure cookie, same-site policy và thời hạn session |
| Mobile | API base URL/runtime config | Preview URL | URL HTTPS cố định, không trỏ vào localhost hoặc preview tạm thời |
| Web | Static bundle/hosting | Web preview tĩnh | Domain HTTPS, SPA fallback, cache policy và source-map policy |
| CORS | `CORS_ORIGINS` | Development preview | Chỉ chứa domain production được phép; không phản chiếu origin tùy ý |
| CSRF | Cookie `taphoa_csrf` + header `x-csrf-token` | Đã bật trong API | Xác nhận Web client gửi header cho mọi mutation authenticated |
| Abuse control | Rate limit auth/PIN | In-memory MVP | Giới hạn theo IP/route; production nhiều instance cần Redis hoặc gateway limiter |
| OTP | Không triển khai trong phạm vi hiện tại | Không dùng | Giữ tắt cho đến khi có yêu cầu mới |

## 2. Database và migration

Trước khi public, tạo một database production riêng, chạy toàn bộ migration Drizzle theo thứ tự và xác nhận các bảng tenant gồm `stores`, `storeMembers`, `posSnapshots`, `snapshotBackups` và `auditLogs`. Migration `0007_young_shatterstar.sql` phải được áp dụng để tạo unique constraint nullable cho `users.email` và `users.phone`; nếu database đã có dữ liệu trùng, phải xử lý mapping trước khi migrate. Không dùng database preview để lưu dữ liệu cửa hàng thật. Kiểm tra foreign key, index theo `storeId`, quyền owner/staff và cơ chế compare-and-swap của snapshot.

## 3. Tenant isolation và quyền

Tạo hai workspace kiểm thử độc lập. Tài khoản A phải chỉ đọc/ghi được snapshot, sản phẩm, hóa đơn, công nợ, backup và audit thuộc workspace A; mọi truy cập chéo sang workspace B phải trả về lỗi quyền hoặc dữ liệu rỗng. Tài khoản staff phải bán hàng và ghi nhận seller được phép, nhưng không được đổi giá, xóa sản phẩm, ghi đè cloud snapshot, khôi phục backup hoặc xem audit của owner.

## 4. Backup và khôi phục

Bật lịch backup database ở tầng hosting. Ngoài cloud backup, chủ quán cần có khả năng xuất JSON cục bộ định kỳ và thử khôi phục trên một thiết bị sạch. Mỗi lần khôi phục phải ghi audit log, không xóa dữ liệu hiện tại âm thầm, hiển thị phiên bản/thời điểm backup và cho phép owner xác nhận trước khi áp dụng.

## 5. Monitoring và rollback

Theo dõi HTTP 5xx, lỗi tRPC, lỗi đồng bộ cloud, conflict snapshot, thời gian phản hồi, rate-limit 429 và tỷ lệ bundle load thất bại. Lưu log không chứa mật khẩu, PIN, token hoặc dữ liệu snapshot. Nếu chạy nhiều instance, thay in-memory rate limiter bằng limiter dùng Redis/API gateway. Trước mỗi lần public, lưu checkpoint. Khi có lỗi nghiêm trọng, rollback về checkpoint ứng dụng ổn định và khôi phục database từ backup tương ứng; không dùng `git reset --hard` hoặc migration phá dữ liệu.

## 6. Web hosting

Cấu hình domain HTTPS, SPA fallback cho các route như `/bao-cao`, `/san-pham`, `/van-hanh` và `/tai-khoan`, nén asset, cache bất biến cho bundle có hash và `no-store` cho dữ liệu API. Xác minh khi refresh trực tiếp từng route không trả về trang unavailable. Preview hiện từng có hiện tượng tự restart; production cần health check và process restart policy rõ ràng.

## 7. Mobile release

Dùng luồng Publish để tạo build iOS/Android; không tự build APK trong sandbox. Cài thử trên ít nhất một iPhone và một Android thật. Kiểm tra camera barcode, SecureStore/session, AsyncStorage offline, chia sẻ Excel/PDF, in, deep link, keyboard, quyền camera và hành vi khi mất mạng. Không coi việc `expo export` thành công là thay thế cho kiểm thử thiết bị thật.

## 8. Go-live gate

Chỉ public khi TypeScript, lint, unit tests, tenant isolation tests, rate-limit/CSRF tests, LAN smoke test, authenticated flows và thiết bị thật đều đạt; production database có backup/restore thử nghiệm; domain HTTPS hoạt động; và có checkpoint rollback được xác định rõ. Các tính năng subscription, nhiều chi nhánh, reconciliation ngân hàng tự động, SMS/email invitation và combo nâng cao có thể phát hành ở các giai đoạn sau.
