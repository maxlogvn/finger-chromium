# Spec: Bug #11 — `defaultLauncher` mutable state

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Loại bỏ `defaultLauncher` khỏi module scope trong `src/adapter/playwright/engine.ts` để không còn global mutable state. Cho phép inject launcher qua `BrowserEngine` constructor — dễ dàng mock khi unit test.

Tham chiếu: [Design](../designs/bug-011-default-launcher.design.md)

## Yêu cầu

1. `BrowserEngine` constructor có thể nhận `launcher?` parameter — nếu không truyền, dùng default (Playwright thật)
2. `BrowserEngine` constructor không tham số vẫn hoạt động (backward compatible)
3. Không còn `defaultLauncher` hoặc `browserType` ở module scope
4. `PlaywrightFingerprintPlugin` không phụ thuộc vào module-level state
5. Tất cả test hiện có vẫn pass

## Thiết kế

### `src/adapter/playwright/engine.ts`

**Thay đổi:**
- Xoá `const browserType: BrowserType = defaultLoader.load()`
- Xoá `const defaultLauncher: Launcher = { ... }`
- Thêm factory function:

```ts
function createDefaultLauncher(): Launcher {
  const browserType: BrowserType = defaultLoader.load();
  return {
    launch: browserType.launch.bind(browserType),
    launchPersistentContext: browserType.launchPersistentContext.bind(browserType),
  };
}
```

- Sửa constructor:

```ts
constructor(launcher?: Launcher) {
  super();
  this.pwLauncher = launcher ?? createDefaultLauncher();
}
```

### `src/adapter/playwright/chromium.ts`

**Thay đổi:**
- Import `Launcher` type (đã có sẵn)
- Sửa constructor nhận `launcher` param:

```ts
constructor(launcher?: Launcher) {
  this.engine = new PlaywrightFingerprintPlugin(launcher);
  ...
}
```

## API / Data flow

- **Input constructor:** `new BrowserEngine()` hoặc `new BrowserEngine(mockLauncher)`
- **Output:** `PlaywrightFingerprintPlugin` instance với `pwLauncher` đã được gán
- **Khi không truyền:** `createDefaultLauncher()` được gọi → `defaultLoader.load()` → Playwright chromium

## Components

| File | Thay đổi |
|------|---------|
| `src/adapter/playwright/engine.ts` | Xoá module-level state, thêm factory function, sửa constructor default |
| `src/adapter/playwright/chromium.ts` | Thêm `launcher` param vào constructor |

## Xử lý lỗi

- `launcher` không hợp lệ (thiếu `launch` hoặc `launchPersistentContext`): TypeScript compiler bắt ở compile time — không cần runtime check
- `defaultLoader.load()` fail: vẫn throw `PluginError` như hiện tại

## Kiểm tra

- **Happy path:** `new BrowserEngine()` tạo instance với Playwright thật
- **Inject mock:** `new BrowserEngine(mockLauncher)` dùng launcher giả
- **Backward compatible:** code cũ `new BrowserEngine()` vẫn hoạt động
- **Instance independence:** hai `new BrowserEngine()` không share launcher state
- **Edge case:** truyền `undefined` — vẫn dùng factory (tương đương không truyền)
