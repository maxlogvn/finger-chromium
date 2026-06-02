# Overview: Mutex Path Resolution

## Mục tiêu

Fix lỗi `Unsupported OS architecture for named mutex` xảy ra sau khi tsup bundle. Nguyên nhân: hardcoded relative path `../../../` trong `src/plugin/mutex/index.ts` bị sai vị trí thư mục sau khi bundle vào `dist/index.js`.

## Kết quả

### File đã sửa

| File | Thay đổi |
|---|---|
| `src/plugin/mutex/index.ts` | Thêm hàm `resolvePackageRoot(startDir)` dùng walk-up algorithm thay hardcoded path |

### Tài liệu đã tạo

| File | Nội dung |
|---|---|
| `finger-chromium/designs/mutex-path-resolution.design.md` | Phân tích 3 phương án, chọn walk-up inline |
| `finger-chromium/specs/mutex-path-resolution.spec.md` | Đặc tả chi tiết, xử lý lỗi, kiểm tra |
| `finger-chromium/plans/mutex-path-resolution.plan.md` | Kế hoạch 9 bước |
| `finger-chromium/overviews/mutex-path-resolution.overview.md` | File này |

### Cập nhật

- `finger-chromium/ROADMAP.md` -- mục Native Mutex, thêm ghi chú bug fix

## Kiểm tra

- `npm run build` -- tsup build thành công (ESM + CJS + DTS)
- `npm run lint` -- 0 errors, 16 warnings (pre-existing, không do thay đổi này)
- `npm test` -- **Không chạy được** do lỗi pre-existing: `.mocharc.yml` dùng `loader: tsx` (deprecated), tsx 4.x yêu cầu `--import`. Cần fix riêng.
- **Xác nhận thủ công:** `require('./dist/index.cjs')` load thành công, không còn lỗi mutex, PCAP server khởi động bình thường.

## Sai lệch so với kế hoạch

- `npm test` không chạy được do lỗi cấu hình mocha/tsx có từ trước. Không ảnh hưởng đến fix.

## Ghi chú kỹ thuật

- Hàm `resolvePackageRoot` dùng `createRequire` để đọc `package.json` từ thư mục cha, kiểm tra `name === 'fingerprint-chromium-engine'`. Giống hệt thuật toán đã dùng trong `src/plugin/connector/engine.ts`.
- Mutex module được khởi tạo ở top-level scope (IIFE), nếu không tìm thấy package root sẽ crash sớm với error message rõ ràng.
- Cần fix `.mocharc.yml` riêng: đổi `loader: tsx` thành `import: tsx` (hoặc dùng `NODE_OPTIONS='--import tsx'`).

---

