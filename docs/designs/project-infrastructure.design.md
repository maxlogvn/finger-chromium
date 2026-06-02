# Design: Hạ tầng dự án

## Vấn đề

Cần một cấu trúc dự án rõ ràng để phát triển thư viện fingerprint cho Playwright. Dự án dùng TypeScript strict mode, bundle ra ESM + CJS.

## Giải pháp

Cấu trúc thư mục 4 nhánh: `types/` (định nghĩa kiểu), `plugin/` (logic chính), `adapter/` (bridge Playwright), `common/` (script chạy trong trình duyệt).

### Build với tsup

Dùng `tsup` bundle entry point `src/index.ts` ra 2 định dạng:
- ESM: `dist/index.js`
- CJS: `dist/index.cjs`

DTS được generate riêng với `resolve: false` -- chỉ resolve type nội bộ, không quét `node_modules`. Lý do: đề phòng `rollup-plugin-dts` lỗi khi gặp type từ Playwright Core (vì Playwright là peer dependency, không bundle).

### External dependencies

Các package nặng như `playwright-core`, `axios`, `chrome-remote-interface`, `extract-zip` đều để là `external` -- esbuild không cố bundle chúng vào file đầu ra. Giữ cho bundle nhẹ và tránh xung đột version với project của người dùng.

### Chiến lược test

Dùng `mocha` + `tsx` loader. Test dùng browser thật -- không mock Playwright. Lý do: fingerprint injection có thể không hoạt động nếu mock, cần verify end-to-end.

### Xử lý Windows

Pre-existing bug: script `npm run clean` dùng `rm -rf` -- không chạy trên Windows. Cần dùng `node:fs` `rmSync` thay thế. Đây là lỗi còn tồn đọng.

---

Xem thêm: [Spec](../specs/project-infrastructure.spec.md) | [Plan](../plans/project-infrastructure.plan.md)
