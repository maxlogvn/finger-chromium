# Design: Hạ tầng dự án (Project Infrastructure)

## Bối cảnh

Dự án là thư viện Node.js điều khiển Chromium với fingerprint inject ở tầng C/C++. Cần một hạ tầng vững chắc để phát triển: cấu trúc thư mục rõ ràng, build pipeline (ESM + CJS + DTS), linting/formatting, test runner với browser thật, và tương thích Windows.

## Câu hỏi làm rõ

- Dùng tsup hay tsc để build? → tsup (wrapper cho esbuild, nhanh, đa năng).
- Test runner: Jest hay Mocha? → Mocha + tsx (nhẹ, không cần mock).
- Có hỗ trợ macOS/Linux không? → Không, chỉ Windows (win32) vì engine binary và native mutex.
- playwright-core là dependency hay peer? → Peer dependency (tránh bundle, để người dùng tự chọn version).

## Các phương án

### Phương án 1: Build bằng tsc đơn thuần

Dùng `tsc` compile TypeScript, thêm `cpx` copy file, `dts-bundle-generator` cho DTS.

- Ưu điểm: Không phụ thuộc bundle tool.
- Nhược điểm: Cấu hình thủ công, phải quản lý riêng ESM/CJS, thiếu minify/treeshake.

### Phương án 2: Build bằng tsup (chọn)

Dùng `tsup` — wrapper esbuild chuyên cho TypeScript, hỗ trợ ESM + CJS + DTS trong một config.

- Ưu điểm: Một config duy nhất, hỗ trợ minify/treeshake/external, chạy nhanh.
- Nhược điểm: Phụ thuộc vào tsup, nhưng đây là lựa chọn tối ưu.

### Phương án 3: Test runner: Jest vs Mocha

Jest phổ biến nhưng nặng, cần `ts-jest`. Mocha + tsx nhẹ hơn, chạy TypeScript trực tiếp.

- Ưu điểm Mocha: Nhẹ, không cần compile, linh hoạt.
- Kết luận: Chọn Mocha vì test với browser thật, không cần mock.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (tsup build + Mocha test).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** tsup giảm tải cấu hình build, Mocha đủ cho test end-to-end với browser thật.
- **Luồng hoạt động tổng quát:**
  1. Người dùng import `Chromium` từ package.
  2. Cấu hình fingerprint/proxy/profile qua fluent API.
  3. `launch()` — engine tải + giải nén + spawn worker.exe.
  4. `newContext()` — Playwright launchPersistentContext.
  5. `quit()` — dọn dẹp profile, close context.
