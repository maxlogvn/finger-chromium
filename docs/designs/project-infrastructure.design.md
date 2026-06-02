# Design: Hạ tầng dự án (Project Infrastructure)

## Vấn đề cần giải quyết

Dự án này là một thư viện Node.js điều khiển trình duyệt Chromium, với nhiệm vụ inject fingerprint thật ở cấp độ C/C++ trước khi trình duyệt khởi chạy. Để làm được việc đó, chúng ta cần:

1. **Một cấu trúc thư mục rõ ràng** để phân tách các thành phần: định nghĩa kiểu (types), logic điều khiển engine (plugin), cầu nối với Playwright (adapter), và script chạy trong trình duyệt (common).
2. **Một hệ thống build** có thể đóng gói thư viện thành 2 định dạng phổ biến (ESM và CJS), đồng thời tạo file khai báo kiểu (.d.ts) cho TypeScript.
3. **Một công cụ kiểm tra lỗi (linting)** để giữ code sạch sẽ và nhất quán.
4. **Một test runner** có thể chạy test với trình duyệt thật -- vì fingerprint injection cần được kiểm tra end-to-end.
5. **Xử lý được trên Windows** vì engine binary (`FastExecuteScript.exe`) và native mutex (`mutex.node`) chỉ chạy trên Windows.

## Các phương án đã cân nhắc

### 1. Build bằng tsc đơn thuần

Dùng `tsc` để compile TypeScript ra JavaScript, sau đó dùng `cpx` hoặc `copyfiles` để copy file.

**Ưu điểm:** Không phụ thuộc vào công cụ bundle, đơn giản.

**Nhược điểm:**
- Không tự động bundle được -- phải quản lý riêng ESM và CJS output.
- Phải cấu hình riêng cho `minify`, `treeshake`.
- Phải dùng thêm `dts-bundle-generator` nếu muốn gộp .d.ts.

**Kết luận:** Loại vì quá thủ công, khó bảo trì.

### 2. Build bằng tsup (chọn)

Dùng `tsup` -- một wrapper cho `esbuild` chuyên cho TypeScript.

**Ưu điểm:**
- Chỉ một cấu hình duy nhất cho cả ESM, CJS và DTS.
- Hỗ trợ `minify`, `treeshake`, `external` ngay trong config.
- Chạy nhanh vì dùng esbuild (viết bằng Go).
- Cộng đồng TypeScript dùng nhiều, tài liệu tốt.

**Nhược điểm:** Không có -- đây là lựa chọn tối ưu.

### 3. Test runner: Jest vs Mocha

**Jest:** Phổ biến, có sẵn mock, coverage. Nhưng nặng, cần cấu hình `ts-jest` hoặc `@swc/jest` để chạy TypeScript.

**Mocha + tsx (chọn):** Nhẹ, linh hoạt, `tsx` chạy TypeScript trực tiếp không cần compile. Cộng với `--exit` flag để tránh process treo.

**Kết luận:** Chọn Mocha vì nhẹ hơn và đủ cho nhu cầu test với browser thật (không cần mock).

## Giải pháp chọn (và tại sao)

### Cấu trúc thư mục

Chia làm 4 nhánh chính dưới `src/`:

| Thư mục | Trách nhiệm |
|---|---|
| `src/types/` | Định nghĩa TypeScript interfaces và types -- `PWChromium.ts`, `fingerprint.ts`, `proxy.ts`, `profile.ts`, `fetch.ts` |
| `src/plugin/` | Logic chính của engine -- quản lý fingerprint, proxy, profile, mutex, cleaner, connector |
| `src/adapter/playwright/` | Cầu nối giữa plugin và Playwright -- override launch, bridge lifecycle |
| `src/common/` | Script chạy trong trình duyệt (in-browser) -- resize viewport |
| `src/index.ts` | Entry point -- re-export public API |

Lý do tách riêng `types/`:
- Các định nghĩa kiểu được dùng bởi cả `plugin/`, `adapter/` và người dùng cuối.
- Đặt riêng giúp dễ tìm, dễ import, tránh circular dependency.
- Khi người dùng cần custom option, họ chỉ cần đọc file `.ts` tương ứng.

### Build pipeline với tsup

tsup được cấu hình để:

1. **Entry point duy nhất:** `src/index.ts`. Tất cả export công khai đều qua file này -- không leak internal API ra ngoài.
2. **Hai định dạng output:**
   - `dist/index.js` (ESM) -- cho `import { Chromium } from 'fingerprint-chromium-engine'`
   - `dist/index.cjs` (CommonJS) -- cho `const { Chromium } = require('fingerprint-chromium-engine')`
3. **DTS (Declaration Files):** `resolve: false` -- chỉ resolve type từ code nội bộ, không resolve từ `node_modules`. Lý do kỹ thuật: `rollup-plugin-dts` (thành phần bên trong tsup) bị crash khi gặp một số dạng type phức tạp từ `playwright-core` (ví dụ conditional types, mapped types với key remapping). Để tránh crash, ta tắt resolve -- kết quả là .d.ts vẫn sẽ `import type { ... } from 'playwright-core'` và người dùng tự có playwright-core trong project của họ (vì nó là peer dependency).
4. **`skipNodeModulesBundle: true`:** Tsup sẽ không bundle các file từ node_modules vào dist. Điều này quan trọng vì nếu bundle, file dist có thể chứa code từ nhiều package khác nhau, gây khó khăn cho debugging và version conflict.
5. **`minify: true`:** Nén code để giảm kích thước file. Dùng trong production.
6. **`treeshake: true`:** Loại bỏ code chết (dead code) -- chỉ bundle những thứ được import. Giúp bundle nhẹ hơn.

### External dependencies

14 packages được khai báo là `external` để esbuild không bundle chúng:

```
playwright-core, async-lock, axios, chokidar, chrome-remote-interface,
compare-versions, debug, dedent, extract-zip, fast-glob, once,
proper-lockfile, dotenv
```

**Tại sao cần external?** Nếu không khai báo, esbuild sẽ cố gắng bundle tất cả vào file dist. Điều này dẫn đến:
- **Kích thước bundle tăng vọt:** playwright-core, axios, chokidar đều là những package lớn.
- **Xung đột version:** Nếu người dùng đã cài `axios@1.15.2` trong project của họ, mà bundle của ta lại chứa `axios@1.14.0`, sẽ có 2 bản axios chạy cùng lúc.
- **Không bundle được native module:** `mutex.node` là C++ addon, esbuild không thể bundle được.

Đặc biệt, `dotenv` là `devDependency` nhưng vẫn nằm trong external list. Lý do: nếu ai đó import file dist mà có `import('dotenv')`, esbuild sẽ không crash mà chỉ báo lỗi runtime -- an toàn hơn là cố bundle.

### Linting và Formatting

- **ESLint** dùng `typescript-eslint` với recommended rules.
- **`consistent-type-imports: error`** -- bắt buộc dùng `import type { ... }` thay vì `import { type ... }`. Giúp tree-shaking tốt hơn vì TypeScript có thể loại bỏ type import hoàn toàn khi compile.
- **`no-explicit-any: warn`** -- cảnh báo, không phải lỗi. Vì đôi khi `any` là cần thiết (ví dụ khi parse JSON fingerprint).
- **Prettier** format với tabs, single quotes, trailingComma all, 100 printWidth.
- Dùng shared config `@cheshire-caat/prettier-config` để đồng bộ format giữa các dự án.

### Chiến lược test

- **Mocha** làm test runner, **tsx** làm transpiler (chạy .ts trực tiếp, không cần compile).
- **Test với browser thật** -- không mock Playwright. Lý do:
  - Fingerprint injection xảy ra ở cấp C/C++ qua CDP message, trước khi JS context được tạo.
  - Nếu mock Playwright, ta không thể biết fingerprint có thực sự được inject vào trình duyệt hay không.
  - Cần verify end-to-end: từ lúc launch browser -> inject fingerprint -> đọc fingerprint từ page -> so sánh với fingerprint gốc.
- File test đặt trong `tests/*.test.ts`, timeout mỗi test là 10 giây.

### Xử lý Windows

- Project chạy trên Windows (win32) -- 32-bit và 64-bit.
- Native mutex là C++ addon, cần file `.node` riêng cho mỗi architecture.
- **Pre-existing bug:** Script `npm run clean` dùng `rm -rf dist` -- lệnh này không tồn tại trên Windows (cmd hay PowerShell đều không có `rm` kiểu Unix). Cần sửa thành `node:fs` `rmSync(path, { recursive: true, force: true })`.

## Luồng hoạt động tổng quát

Khi người dùng cài đặt và chạy thư viện:

```
npm install fingerprint-chromium-engine
       |
       v
Import { Chromium } từ 'fingerprint-chromium-engine'
       |
       v
Chromium.useFingerprint(data) -> useProxy(url) -> useProfile(path)
       |
       v
Chromium.launch() -> engine tải + giải nén + spawn worker.exe
       |
       v
Chromium.newContext() -> Playwright launchPersistentContext
       |
       v
User dùng page -> Chromium.quit() -> dọn dẹp profile, close context
```

---
