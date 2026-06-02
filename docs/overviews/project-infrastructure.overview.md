# Overview: Hạ tầng dự án

## Lưu ý kỹ thuật

- `tsup` `dts.resolve: false` là bắt buộc vì `rollup-plugin-dts` (dùng nội bộ trong tsup) sẽ crash khi parse type từ `playwright-core` nếu `resolve: true`. Lý do: playwright-core dùng một số type pattern mà rollup-plugin-dts không handle được (ví dụ conditional types phức tạp, mapped types với key remapping). Set `resolve: false` chỉ resolve type nội bộ, không quét node_modules -- an toàn hơn.
- External list phải khai báo đầy đủ (14 packages). Thiếu một package sẽ làm esbuild bundle package đó vào dist/, dẫn đến:
  - Tăng kích thước bundle
  - Conflict version nếu user đã cài package đó với version khác
  - Node.js native addon (mutex.node) không bundle được
- `npm run clean` dùng `rm -rf` -- không chạy trên Windows. Cần sửa thành `node:fs` `rmSync(path, { recursive: true, force: true })`. Đây là pre-existing bug chưa fix.
- `createRequire(import.meta.url)` trong loader/index.ts tạo require từ ESM context. `import.meta.url` trỏ tới file hiện tại, dùng làm base path. Khi tsup bundle, ESM output vẫn giữ `import.meta.url` hoạt động.
