# Tạp Hóa POS — Trạng thái dự án và hướng dẫn chạy local

> Tài liệu này mô tả phiên bản MVP hiện tại của Tạp Hóa POS, những phần đã triển khai, các giới hạn còn tồn tại và cách cài đặt dự án trên máy cá nhân để chạy, kiểm thử và chỉnh sửa mã nguồn.

## 1. Tổng quan dự án

Tạp Hóa POS là hệ thống quản lý bán hàng cho cửa hàng tạp hóa Việt Nam, hỗ trợ Web, Android và iOS. Ứng dụng được xây dựng bằng Expo SDK 54, React Native, Expo Router, TypeScript, NativeWind, tRPC, Drizzle ORM và MySQL. Dữ liệu POS ở client được thiết kế theo hướng offline-first; cloud snapshot và LAN full-state sync được dùng để đồng bộ giữa các thiết bị hoặc máy tính trong cửa hàng.

Phiên bản hiện tại phù hợp cho **MVP pilot có kiểm soát**. Có thể dùng để trình diễn, kiểm thử nội bộ và chạy thử tại một cửa hàng với dữ liệu giới hạn. Chưa nên mở công khai cho số lượng lớn user trước khi hoàn tất kiểm thử thiết bị thật và cấu hình production.

## 2. Những tính năng đã hoàn thành

| Nhóm | Tính năng | Trạng thái |
|---|---|---|
| POS | Tra cứu sản phẩm, tìm theo tên/mã vạch, giỏ hàng và checkout | Đã triển khai |
| POS | Thanh toán tiền mặt, chuyển khoản, ghi nợ | Đã triển khai |
| POS | Tạo VietQR động theo số tiền cần thu | Đã triển khai ở mức tạo mã QR |
| Sản phẩm | CRUD sản phẩm, nhóm hàng, giá bán, giá vốn và tồn kho | Đã triển khai |
| Sản phẩm | Nhập danh sách sản phẩm hàng loạt từ Excel/CSV | Đã triển khai |
| Sản phẩm | File Excel mẫu cho nhập hàng loạt | Đã triển khai |
| Sản phẩm | Quét barcode bằng camera | Có implementation; cần kiểm tra trên thiết bị thật |
| Kho | Cảnh báo sắp hết hàng, lọc và sắp xếp | Đã triển khai |
| Kho | Lịch sử nhập hàng và điều chỉnh tồn kho | Đã triển khai |
| Kho | Phiếu nhập hàng, nhà cung cấp và giá vốn trung bình | Đã triển khai |
| Kho | Quy đổi thùng/lốc/chai và giá theo đơn vị | Đã triển khai |
| Kho | Theo dõi lô hàng và hạn sử dụng | Đã triển khai |
| Công nợ | Sổ nợ khách hàng, trả một phần/toàn bộ và lịch sử | Đã triển khai |
| Công nợ | Công nợ nhà cung cấp | Đã triển khai ở luồng vận hành |
| Đối soát | Trạng thái pending/confirmed/rejected, mã tham chiếu và ghi chú | Đã triển khai thủ công |
| Báo cáo | Doanh thu theo ngày, tuần, tháng và theo nhân viên | Đã triển khai |
| Xuất dữ liệu | CSV/Excel/PDF cho báo cáo, công nợ và lịch sử hóa đơn | Đã triển khai |
| Khuyến mãi | Giảm theo phần trăm hoặc số tiền cố định | Đã triển khai |
| Khuyến mãi | Combo và tự chọn mức giảm tốt nhất khi checkout | Đã triển khai ở mức MVP |
| Vận hành | Đóng ca, đối chiếu tiền mặt và ghi nhận chênh lệch | Đã triển khai |
| In ấn | HTML receipt, tem giá và luồng mở hộp thoại in/chia sẻ | Đã triển khai; cần thử máy in thật |
| Multi-tenant | Stores, members, owner/staff và tenant-scoped cloud snapshot | Đã triển khai |
| Store mode | Solo và WithStaff, onboarding và đổi loại hình quán | Đã triển khai |
| Nhân viên | Tạo staff, vai trò, khóa/mở tài khoản và PIN 4–6 số | Đã triển khai |
| Nhân viên | Khóa PIN sau nhiều lần sai và ghi nhận seller trên hóa đơn | Đã triển khai |
| Audit | Nhật ký thao tác và giới hạn owner/staff | Đã triển khai ở mức MVP |
| Đồng bộ | Offline-first, LAN full-state sync, cloud snapshot và conflict version | Đã triển khai ở mức MVP |
| Backup | Backup JSON local/cloud và restore có owner guard | Đã triển khai ở mức MVP |
| Bảo mật | Hash mật khẩu/PIN bằng scrypt, cookie session, CORS production allowlist | Đã triển khai |
| Bảo mật | CSRF cookie/header, rate limit auth/PIN và giới hạn snapshot | Đã triển khai ở mức MVP |
| Giao diện | Landing page, bảng giá, FAQ, animation/hover và cloud guide | Đã triển khai |
| Giao diện | Loading, error, empty state và responsive Web | Đã triển khai |

## 3. Những phần chưa hoàn thành hoặc chưa thể xác nhận

| Mức độ | Hạng mục | Tình trạng và ảnh hưởng |
|---|---|---|
| Blocker public | Kiểm thử iPhone/Android thật | Chưa xác nhận đầy đủ camera, SecureStore, share sheet, in, deep link, app lifecycle và mất mạng |
| Blocker public | Production domain/database | Chưa điền giá trị production thật, chưa chốt domain HTTPS, API base URL và CORS_ORIGINS |
| Blocker public | Backup/restore production | Cần database production riêng, backup tự động, thử restore staging và quy trình rollback |
| Blocker public | Tenant isolation end-to-end | Đã có unit test mô phỏng tenant A/B và guards; cần test bằng hai tài khoản authenticated trong môi trường staging |
| Cần hoàn thiện | Rate limit nhiều instance | Hiện là in-memory limiter. Nếu chạy nhiều instance cần Redis hoặc API gateway limiter |
| Cần hoàn thiện | Token transport Web/native | Native cần token để lưu SecureStore; Web ưu tiên cookie. Cần rà soát tiếp khi chốt production auth architecture |
| Cần hoàn thiện | Dependency audit | Chưa hoàn tất trong sandbox do registry/network không ổn định; cần chạy lại trong CI hoặc máy có registry ổn định |
| Ngoài phạm vi | OTP/SMS | Không triển khai theo yêu cầu hiện tại |
| Ngoài phạm vi | Tự động đối soát ngân hàng | Hiện chỉ hỗ trợ đối soát chuyển khoản thủ công |
| Giai đoạn sau | Subscription, nhiều chi nhánh và giới hạn gói | Chưa triển khai |
| Giai đoạn sau | Mời nhân viên qua SMS/email | Hiện owner có thể tạo tài khoản/PIN trực tiếp |
| Giai đoạn sau | Backup đa vùng và disaster recovery nâng cao | Chưa triển khai |

## 4. Kết quả kiểm thử hiện tại

Lượt regression gần nhất đạt **10 test files passed, 1 skipped; 31 tests passed, 1 skipped**. TypeScript không có lỗi. Lint không có lỗi chức năng; vẫn có warning hiện hữu về `MODULE_TYPELESS_PACKAGE_JSON` trong `eslint.config.js`. Web bundle export thành công. Android và iOS native export đã được xác nhận thành công ở checkpoint trước.

Các nhóm đã có coverage gồm nghiệp vụ POS, nhập Excel, tồn kho, báo cáo, công nợ, quy đổi đơn vị, VietQR, khuyến mãi/combo, LAN types, credential auth, rate limit helper, CSRF helper, snapshot payload limit, Solo/WithStaff, PIN disabled member, staff owner guard và mô phỏng tenant A/B.

> Việc export bundle thành công không thay thế kiểm thử trên iPhone/Android thật. Camera, SecureStore, in Bluetooth, share sheet và hành vi khi mất mạng phải được xác nhận trên thiết bị vật lý.

## 5. Công cụ cần cài trên máy local

### 5.1. Bắt buộc

| Công cụ | Mục đích | Gợi ý phiên bản |
|---|---|---|
| Git | Clone và quản lý mã nguồn | Phiên bản mới ổn định |
| Node.js | Chạy Expo, TypeScript và server | Node 22 LTS hoặc tương thích Expo SDK 54 |
| pnpm | Cài dependency và chạy scripts | pnpm 9.x |
| VS Code | Chỉnh sửa mã nguồn | Bản mới ổn định |
| MySQL | Database local nếu chạy backend đầy đủ | MySQL 8.x |
| Expo Go | Test nhanh native trên điện thoại | Cài từ App Store/Google Play |

### 5.2. Cài thêm nếu phát triển iOS

Cần macOS, Xcode, iOS Simulator, CocoaPods và Apple Developer account nếu muốn build/cài bản iOS native ngoài Expo Go. Máy Linux/Windows không thể tự build iOS native đầy đủ như macOS.

### 5.3. Cài thêm nếu phát triển Android

Cài Android Studio, Android SDK, Android SDK Platform tương thích, Android Emulator và biến môi trường `ANDROID_HOME`. Có thể dùng điện thoại Android thật bật Developer Options và USB debugging.

### 5.4. Cài đặt mẫu

Trên macOS/Linux, có thể cài Node bằng `nvm` rồi cài pnpm:

```bash
nvm install 22
nvm use 22
corepack enable
corepack prepare pnpm@9.12.0 --activate
node --version
pnpm --version
```

Trên Windows, có thể cài Node.js LTS từ [nodejs.org](https://nodejs.org/), sau đó mở PowerShell và chạy:

```powershell
corepack enable
corepack prepare pnpm@9.12.0 --activate
node --version
pnpm --version
```

## 6. Clone và cài dependency

Repository hiện tại là `Wendy84205/POS-SalesSystem` theo cấu hình GitHub của dự án. Thực hiện:

```bash
git clone https://github.com/Wendy84205/POS-SalesSystem.git
git clone https://github.com/Wendy84205/taphoa-pos.git
cd taphoa-pos
pnpm install
```

Nếu repository thực tế đã đổi tên hoặc đang dùng một thư mục local khác, hãy dùng đúng URL repository được đội phát triển cung cấp. Không commit file `.env`, token, cookie secret, database password hoặc file backup chứa dữ liệu thật.

## 7. Cấu hình biến môi trường local

Dự án có cơ chế load environment qua `scripts/load-env.js`. Hãy kiểm tra `server/_core/env.ts`, `scripts/load-env.js`, `constants/oauth.ts` và `drizzle.config.ts` để biết tên biến chính xác ở phiên bản đang checkout.

Tối thiểu, backend local thường cần các nhóm cấu hình sau:

| Nhóm | Mục đích |
|---|---|
| Database URL | Kết nối MySQL local hoặc database staging |
| Session/OAuth | Auth session và OAuth callback |
| CORS origins | Cho phép Web local, ví dụ `http://localhost:8081` |
| API base URL | Client gọi API local hoặc staging |
| Storage | Nếu bật file storage/export cloud |

Ví dụ file local, không dùng giá trị này cho production:

```env
NODE_ENV=development
DATABASE_URL=mysql://taphoa:local_password@127.0.0.1:3306/taphoa_pos
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

Tên biến session/OAuth phải lấy theo file cấu hình hiện tại, không tự đoán hoặc tạo tên khác. Nếu dùng database của WebDev/Manus, không thay đổi schema hoặc dữ liệu production bằng database local.

## 8. Tạo database local và chạy migration

Tạo database MySQL local:

```sql
CREATE DATABASE taphoa_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taphoa'@'localhost' IDENTIFIED BY 'local_password';
GRANT ALL PRIVILEGES ON taphoa_pos.* TO 'taphoa'@'localhost';
FLUSH PRIVILEGES;
```

Sau khi cấu hình `DATABASE_URL`, kiểm tra schema và migration:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Migration `0007_young_shatterstar.sql` tạo unique constraint nullable cho email và số điện thoại. Nếu database đã có dữ liệu trùng, phải xử lý dữ liệu trùng trước khi chạy migration trên staging/production.

## 9. Chạy dự án local

### 9.1. Chạy API server

Mở Terminal 1:

```bash
cd taphoa-pos
pnpm dev:server
```

API server mặc định chạy trên cổng `3000` theo cấu hình WebDev hiện tại.

### 9.2. Chạy Web preview static

Để dựng và phục vụ bản Web static:

```bash
cd taphoa-pos
pnpm web:build
pnpm web:serve
```

Mở trình duyệt tại `http://localhost:8081` hoặc URL mà server in ra. Các route chính gồm `/`, `/ban-hang`, `/san-pham`, `/van-hanh`, `/bao-cao`, `/cong-no`, `/tai-khoan` và `/gioi-thieu`.

### 9.3. Chạy Expo Metro cho mobile

Mở Terminal 2:

```bash
cd taphoa-pos
npx expo start
```

Nếu điện thoại và máy local cùng Wi-Fi:

```bash
npx expo start --lan
```

Nếu cần thử tunnel:

```bash
npx expo start --tunnel
```

Expo Go phải quét QR được sinh bởi **Metro Expo**, không phải QR của Web preview. URL native hợp lệ bắt đầu bằng `exp://`; URL `https://8081-...manus.computer` dùng cho trình duyệt Web. Tunnel trong sandbox có thể không ổn định; nếu Expo Go báo `Failed to parse manifest JSON`, hãy chạy Metro trên laptop cùng Wi-Fi với điện thoại hoặc dùng bản native build trực tiếp.

### 9.4. Chạy tất cả lệnh kiểm tra

```bash
pnpm check
pnpm lint
pnpm test
```

Các script tiện ích trong `package.json`:

| Lệnh | Mục đích |
|---|---|
| `pnpm check` | TypeScript check |
| `pnpm lint` | Expo ESLint |
| `pnpm test` | Vitest regression |
| `pnpm web:build` | Export Web static |
| `pnpm web:serve` | Serve Web static |
| `pnpm dev:server` | Chạy API server watch mode |
| `pnpm dev:metro` | Chạy Expo Web/Metro theo cấu hình script |
| `pnpm db:push` | Generate và migrate Drizzle; dùng cẩn thận |
| `pnpm android` | Mở Expo Android workflow |
| `pnpm ios` | Mở Expo iOS workflow |
| `pnpm qr` | Chạy script QR nếu đã truyền URL phù hợp |

## 10. Quy trình chỉnh sửa code

Trước khi sửa, tạo branch riêng:

```bash
git checkout -b feature/ten-tinh-nang
```

Sau đó chỉnh sửa mã nguồn, chạy format/lint/check/test:

```bash
pnpm format
pnpm check
pnpm lint
pnpm test
```

Các file quan trọng:

| File/thư mục | Vai trò |
|---|---|
| `app/` | Màn hình Expo Router Web/mobile |
| `app/(tabs)/index.tsx` | Màn hình Tra cứu/dashboard chính |
| `app/(tabs)/van-hanh.tsx` | Nhập hàng, hạn dùng, đóng ca, khuyến mãi |
| `app/(tabs)/tai-khoan.tsx` | Workspace, store type, staff và profile |
| `lib/pos-store.tsx` | State và nghiệp vụ POS offline-first |
| `lib/promotions.ts` | Tính khuyến mãi/combo |
| `lib/trpc.ts` | Client API và session transport |
| `server/routers.ts` | tRPC routes, validation và owner/staff guards |
| `server/credential-auth.ts` | Credential auth, password hashing và user lookup |
| `server/security.ts` | Rate limit, CSRF helper và cookie helper |
| `server/_core/index.ts` | Express server, CORS, body limits và middleware |
| `drizzle/schema.ts` | Database schema |
| `tests/` | Unit/regression/security tests |
| `DEVICE_TEST_CHECKLIST.md` | Checklist chạy trên iPhone/Android thật |
| `PRODUCTION_CHECKLIST.md` | Điều kiện trước khi public |
| `PRODUCTION_MAPPING.md` | Mapping domain/database/backup/monitoring |

## 11. Quy trình Git và cập nhật repository

Sau khi kiểm thử đạt:

```bash
git status
git add .
git commit -m "chore: update taphoa pos"
git push origin feature/ten-tinh-nang
```

Sau đó tạo Pull Request vào branch chính. Không push `.env`, secret, database dump, QR tạm, log chứa token hoặc dữ liệu cửa hàng thật.

## 12. Quy trình kiểm thử UX từ login đến sử dụng

Bắt đầu bằng tài khoản test riêng. Kiểm tra đăng ký/đăng nhập, session sau refresh, onboarding chọn Solo hoặc WithStaff, sau đó tạo sản phẩm, nhập tồn, tìm/scan sản phẩm, thêm vào giỏ, thanh toán tiền mặt/chuyển khoản/ghi nợ và mở lại hóa đơn.

Tiếp theo kiểm tra các luồng quản trị: xem cảnh báo tồn, nhập phiếu hàng, giá vốn trung bình, hạn sử dụng, khuyến mãi/combo, báo cáo, xuất Excel/PDF, đối soát chuyển khoản, đóng ca, backup/restore và LAN sync. Với WithStaff, kiểm tra staff PIN, quyền không sửa giá/xóa dữ liệu, seller trên hóa đơn và audit log. Lặp lại toàn bộ luồng trên Web và native build.

## 13. Điều kiện trước khi public

Không public rộng chỉ dựa trên việc Web/Android/iOS export thành công. Cần hoàn tất tenant isolation end-to-end bằng hai tài khoản, authenticated onboarding, camera/SecureStore/share/in/mất mạng trên thiết bị thật, database production riêng, migration, backup/restore staging, domain HTTPS, CORS allowlist, monitoring và rollback. Sau khi các điều kiện này đạt, lưu checkpoint và dùng nút Publish trong giao diện quản lý để triển khai.

## 14. Tài liệu liên quan trong repository

| Tài liệu | Nội dung |
|---|---|
| `README.md` | Tổng quan template và quy ước Expo |
| `PRODUCTION_CHECKLIST.md` | Checklist go-live |
| `PRODUCTION_MAPPING.md` | Mapping môi trường production |
| `SECURITY_TEST_REPORT.md` | Kết quả kiểm thử và security review |
| `DEVICE_TEST_CHECKLIST.md` | Kiểm thử thiết bị thật |
| `DEVICE_TEST_EXECUTION_LOG.md` | Phần đã kiểm tra trong sandbox và phần còn chờ thiết bị |
| `todo.md` | Lịch sử công việc, blocker và backlog |

## 15. Kết luận

Tạp Hóa POS hiện đã có nền tảng MVP khá đầy đủ cho vận hành thử: POS, tồn kho, công nợ, VietQR, nhập hàng, hạn dùng, quy đổi đơn vị, báo cáo, khuyến mãi/combo, multi-tenant, owner/staff, offline/LAN/cloud sync và các lớp hardening cơ bản. Phần chưa hoàn tất chủ yếu thuộc về **xác nhận môi trường production và phần cứng thật**, không phải các nghiệp vụ cốt lõi. Khi phát triển local, nên bắt đầu bằng Web preview và unit tests; khi kiểm tra camera, SecureStore, in và chia sẻ, cần dùng native build trên thiết bị thật thay vì phụ thuộc Expo Go tunnel của sandbox.
