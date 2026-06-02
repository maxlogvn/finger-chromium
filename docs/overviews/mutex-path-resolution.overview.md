# Overview: Mutex Path Resolution

## Tóm tắt

Fix lỗi `Unsupported OS architecture for named mutex` xảy ra sau khi tsup bundle. Nguyên nhân: hardcoded relative path `../../../` trong `src/plugin/mutex/index.ts` bị sai vị trí thư mục sau khi bundle vào `dist/index.js`. Đã thay bằng walk-up algorithm tìm package root.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Phân tích | Xác định nguyên nhân hardcoded path | Đúng kế hoạch | Không có |
| Bước 2: Thiết kế | 3 phương án, chọn walk-up inline | Đúng kế hoạch | Không có |
| Bước 3: Code | Thêm `resolvePackageRoot()`, thay path | Đúng kế hoạch | Không có |
| Bước 4: Build + Lint | `npm run build`, `npm run lint` | Build success, lint 0 errors | Không có |
| Bước 5: Test | `npm test` | Không chạy được do lỗi mocha/tsx pre-existing | Sai lệch: test environment bug có từ trước |

## Sai lệch đáng chú ý

- `npm test` không chạy được do lỗi cấu hình mocha/tsx có từ trước (`.mocharc.yml` dùng `loader: tsx` deprecated, tsx 4.x yêu cầu `--import`). Không ảnh hưởng đến fix.

## Tài liệu liên quan

- `docs/designs/mutex-path-resolution.design.md`
- `docs/specs/mutex-path-resolution.spec.md`
- `docs/plans/mutex-path-resolution.plan.md`
- `src/plugin/mutex/index.ts`

## Ghi chú

- Hàm `resolvePackageRoot` dùng `createRequire` để đọc `package.json` từ thư mục cha, kiểm tra `name === 'fingerprint-chromium-engine'`. Giống hệt thuật toán đã dùng trong `src/plugin/connector/engine.ts`.
- Mutex module được khởi tạo ở top-level scope (IIFE), nếu không tìm thấy package root sẽ crash sớm với error message rõ ràng.
- Cần fix `.mocharc.yml` riêng: đổi `loader: tsx` thành `import: tsx` (hoặc dùng `NODE_OPTIONS='--import tsx'`).
