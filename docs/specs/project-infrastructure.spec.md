# Spec: Hạ tầng dự án (Project Infrastructure)

## Mô tả

Hạ tầng dự án bao gồm: cấu trúc thư mục, build pipeline, linting, formatting, testing, và các file cấu hình. Đây là nền tảng để phát triển tất cả các tính năng khác.

## API / Interfaces chính

### Export công khai từ `src/index.ts`

```ts
// Interface chính -- public API của thư viện
export { type PWChromium } from './types/PWChromium';

// Singleton Chromium + các type helper
export {
  Chromium,
  type FetchOptions,
  type FingerprintOptions,
  type Launcher,
  type PluginLaunchOptions,
  type ProfileOptions,
  type ProxyOptions,
} from './adapter/playwright/chromium';
```

### `package.json` -- Cấu hình package

| Field | Giá trị | Ý nghĩa |
|---|---|---|
| `name` | `fingerprint-chromium-engine` | Tên package |
| `version` | `0.2.0` | Phiên bản hiện tại |
| `type` | `module` | Mặc định là ESM |
| `main` | `./dist/index.cjs` | Entry cho CommonJS |
| `module` | `./dist/index.js` | Entry cho ESM |
| `types` | `./dist/index.d.ts` | Declaration file |
| `engines.node` | `>=18.0.0` | Yêu cầu Node.js >= 18 |
| `os` | `["win32"]` | Chỉ hỗ trợ Windows |

### Scripts

| Script | Lệnh | Mô tả |
|---|---|---|
| `lint` | `eslint src/` | Kiểm tra ESLint |
| `lint:fix` | `eslint src/ --fix` | Tự động sửa ESLint |
| `format` | `prettier --write src/` | Format code bằng Prettier |
| `test` | `mocha --exit` | Chạy Mocha tests |
| `clean` | `rm -rf dist` | Xoá thư mục dist (pre-existing bug: không chạy trên Windows) |
| `build` | `npm run clean && tsup` | Build ESM + CJS + DTS |
| `dev` | `tsup --watch` | Build và watch thay đổi |

### Peer Dependencies

| Package | Version | Bắt buộc |
|---|---|---|
| `playwright-core` | `>=1.60.0` | Có (bắt buộc) |

### Các Dependencies chính

| Package | Version | Mục đích |
|---|---|---|
| `async-lock` | `1.4.1` | Đồng bộ truy cập tài nguyên (profile, engine) |
| `axios` | `1.15.2` | HTTP requests -- download engine, fetch fingerprint |
| `chokidar` | `^5.0.0` | Watch file system -- phản hồi IPC từ engine |
| `chrome-remote-interface` | `0.34.0` | Giao tiếp CDP với Chromium |
| `compare-versions` | `6.1.1` | So sánh phiên bản Chromium |
| `debug` | `4.4.3` | Debug logging theo namespace |
| `extract-zip` | `2025.0.1` (trong code: `2.0.1` trong package.json) | Giải nén engine zip |
| `fast-glob` | `3.3.3` | File globbing |
| `proper-lockfile` | `4.1.2` | Lock file ở hệ thống |

## Cấu trúc thư mục

### `src/` (source code)

```
src/
├── index.ts                    # Public API entry point
├── types/                      # TypeScript type definitions
│   ├── PWChromium.ts           # Interface public API -- Chromium singleton
│   ├── fingerprint.ts          # FingerprintOptions
│   ├── proxy.ts                # ProxyOptions
│   ├── profile.ts              # ProfileOptions
│   └── fetch.ts                # FetchOptions, Tag, Time
├── common/                     # In-browser scripts
│   └── index.ts                # waitForResize, getViewport
├── loader/                     # Module loader -- tìm playwright-core
│   └── index.ts                # Loader class
├── plugin/                     # Core logic
│   ├── index.ts                # FingerprintPlugin orchestrator
│   ├── errors.ts               # PluginError hierarchy
│   ├── browser.ts              # Browser management
│   ├── config.ts               # Configuration conversion
│   ├── cleaner.ts              # File Cleanup Daemon
│   ├── utils.ts                # Helper functions
│   ├── connector/              # Engine communication
│   │   ├── index.ts            # API Connector (singleton)
│   │   ├── engine.ts           # RemoteEngine (download, extract, IPC)
│   │   ├── utils.ts            # Connector helpers
│   │   └── pcapServer/         # PCAP TCP server
│   │       └── index.ts
│   ├── launcher/               # Browser launcher
│   │   └── index.ts            # Spawn Chromium, detect DevTools URL
│   └── mutex/                  # Windows named mutex
│       ├── index.ts            # Native addon wrapper
│       ├── win32-ia32/mutex.node  # C++ addon 32-bit
│       └── win32-x64/mutex.node   # C++ addon 64-bit
└── adapter/                    # Playwright bridge
    └── playwright/
        ├── chromium.ts         # BrowserEngine (singleton, fluent API)
        ├── engine.ts           # PlaywrightFingerprintPlugin (bridge)
        ├── data.ts             # AdapterDataManager (profile mapping)
        ├── loader.ts           # Playwright loader
        └── utils.ts            # Hook binding, viewport management
```

### `docs/` (tài liệu)

```
docs/
├── designs/        # Tài liệu thiết kế (21 files)
├── specs/          # Đặc tả chi tiết (21 files)
├── plans/          # Kế hoạch thực hiện (21 files)
├── products/       # Tài liệu tính năng cho dev (20 files)
├── overviews/      # Báo cáo kết quả (21 files)
├── ROADMAP.md      # Theo dõi tiến độ
├── CONVENTIONS.md  # Quy ước code
├── STACK.md        # Công nghệ sử dụng
├── Welcome.md      # Giới thiệu
└── WORKFLOW.md     # Quy trình phát triển
```

## Luồng dữ liệu

### Build flow

```
src/index.ts (entry)
      │
      ▼
tsup bundle ──► dist/index.js (ESM)
               ► dist/index.cjs (CJS)
               ► dist/index.d.ts (DTS, resolve: false)
      │
      ▼
Publish lên npm (npm publish)
      │
      ▼
User install → import/require → dùng Chromium singleton
```

### Test flow

```
npm test (mocha --exit)
      │
      ▼
mocha tìm tests/*.test.ts
      │
      ▼
tsx transpile .ts → JavaScript
      │
      ▼
Browser thật (Playwright Chrome) chạy test

Không mock → fingerprint injection được verify end-to-end
```

## File liên quan

| File | Vai trò |
|---|---|
| `package.json` | Thông tin package, dependencies, scripts |
| `tsconfig.json` | TypeScript config (strict, ES2022, paths) |
| `tsup.config.ts` | Build config (ESM, CJS, external, DTS) |
| `eslint.config.ts` | ESLint config (typescript-eslint) |
| `.prettierrc` | Prettier config (tabs, single quotes, 100 width) |
| `.mocharc.yml` | Mocha config (tsx loader, 10s timeout) |
| `project.xml` | Engine BAS config file (chứa EngineVersion) |
| `src/index.ts` | Public API re-export |

## Xử lý lỗi

- **Build lỗi:** `tsup` sẽ báo lỗi TypeScript compile hoặc esbuild bundle. Cần kiểm tra lại cú pháp.
- **Lint lỗi:** ESLint báo lỗi `consistent-type-imports` (error) và `no-explicit-any` (warn). Fix theo hướng dẫn.
- **Test lỗi:** Mocha report lỗi kèm stack trace. Nếu test cần browser thật, đảm bảo playwright chromium đã được cài (`npx playwright install chromium`).
- **Clean không chạy trên Windows:** Pre-existing bug. Tạm thời dùng `Remove-Item -Recurse -Force dist` trên PowerShell.

## Ghi chú kỹ thuật

- **`dts.resolve: false`** trong tsup.config.ts là bắt buộc. Nếu set `true`, tsup sẽ crash vì `rollup-plugin-dts` không parse được type từ playwright-core (các conditional types phức tạp).
- **External list có 14 packages.** `dotenv` là devDependency nhưng vẫn trong list -- để phòng trường hợp code có dynamic import.
- **`skipNodeModulesBundle: true`** phải đặt ở ROOT level của tsup config, không phải trong `dts.compilerOptions`. Sai vị trí sẽ không có tác dụng.
- **Playwright Core** là peer dependency, không được bundle. Thư viện tự tìm playwright-core qua `createRequire` (xem `src/loader/index.ts`).
- **Format script** (`npm run format`) chỉ chạy trên `src/`, không format `tests/` hay `docs/`.
- **ESLint ignores** `dist/**` và `node_modules/**`.
- **Mocha** dùng `--exit` flag để tự động thoát process sau khi test, tránh treo do browser process hoặc async handles còn mở.
- Trong `package.json`, `extract-zip` version là `2.0.1` theo dependencies. Tuy nhiên trong code `src/plugin/connector/engine.ts` import `extract-zip` và dùng `extract()` function -- version 2.x API vẫn tương thích.

---
