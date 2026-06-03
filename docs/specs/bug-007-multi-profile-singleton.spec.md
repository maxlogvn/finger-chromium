# Spec: Bug #7 — Singleton `Chromium` không hỗ trợ launch nhiều profile song song

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> Tham chiếu design: [docs/designs/bug-007-multi-profile-singleton.design.md](../designs/bug-007-multi-profile-singleton.design.md)

## Mô tả

Hiện tại `BrowserEngine` chỉ được export gián tiếp qua biến singleton `Chromium`.
Điều này khiến `launch()` chỉ được gọi một lần trong vòng đời instance — không thể dùng nhiều profile.
Cần export trực tiếp class `BrowserEngine` để người dùng tự tạo instance riêng cho mỗi profile,
giải quyết triệt để vấn đề multi-profile.

## Yêu cầu

1. `BrowserEngine` class được export từ public API (`src/index.ts`).
2. Biến `const Chromium` singleton được xoá — mỗi `new BrowserEngine()` là instance độc lập.
3. `PWChromium` interface giữ nguyên — `BrowserEngine implements PWChromium`.
4. Gọi `launch()` trên một instance không ảnh hưởng đến instance khác.
5. Giữ backward compatibility alias nếu khả thi (export `Chromium` = `BrowserEngine` class).
6. Tất cả test files được cập nhật dùng `new BrowserEngine()`.

## Thiết kế

**Hiện tại (singleton):**
```
Chromium (const instance) → BrowserEngine instance → launch() throw nếu gọi lần 2
```

**Sau khi sửa (class):**
```
BrowserEngine (class) → new BrowserEngine() → instance A → launch()
                      → new BrowserEngine() → instance B → launch()
```

Mỗi instance `BrowserEngine` có state riêng:
- `isLaunched`, `context`, `options`, `privateKey`, `fingerprints`, `proxyData`, `profileData`
- Hoàn toàn độc lập, không share state.

Lưu ý: tầng dưới (connector, RemoteEngine, PCAP server, cleaner, mutex) vẫn là singleton —
không refactor. Điều này có nghĩa là mặc dù mỗi instance có state riêng, chúng vẫn dùng chung
engine process và async-lock queue. Đây là giới hạn kiến trúc đã được chấp nhận.

## API / Data flow

**Trước — singleton (sắp bỏ):**
```ts
import { Chromium } from 'fingerprint-chromium-engine';
const ctx = await Chromium.useFingerprint(fp).launch().newContext();
```

**Sau — class:**
```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const eng1 = new BrowserEngine();
await eng1.useFingerprint(fp1).useProfile('./profile1').launch().newContext();

const eng2 = new BrowserEngine();
await eng2.useFingerprint(fp2).useProfile('./profile2').launch().newContext();

await eng1.quit();
await eng2.quit();
```

## Components

### 1. `src/adapter/playwright/chromium.ts` (sửa)
- Xoá `const Chromium: PWChromium = new BrowserEngine()` ở cuối file.
- Xoá JSDoc comment mô tả singleton (dòng 217-228).
- Export `BrowserEngine` class trực tiếp:
  ```ts
  export class BrowserEngine implements PWChromium { ... }
  // hoac giu nguyen class + export { BrowserEngine }
  ```
- Thêm backward compatibility alias:
  ```ts
  export { BrowserEngine as Chromium };
  ```

### 2. `src/index.ts` (sửa)
- Export `BrowserEngine` thay vì `Chromium`:
  ```ts
  export { BrowserEngine, ... } from './adapter/playwright/chromium';
  ```
- Cập nhật comment header — dòng "Chromium -- singleton instance" thành "BrowserEngine -- class instance".

### 3. `src/types/PWChromium.ts` (sửa nhẹ)
- JSDoc example dòng 22-36: đổi `new BrowserEngine()` thành `new BrowserEngine()` (giữ nguyên — đã đúng).
- JSDoc dòng 17: sửa "Các method cấu hình (`useFingerprint`, `useProxy`, `useProfile`, `usePrivateKey`)".
   `usePrivateKey` không tồn tại — đây là Issue #16 riêng, không fix trong scope này.

### 4. `tests/multi_context.ts` (sửa)
- Import: `import { BrowserEngine } from '../src/adapter/playwright/chromium';`
- Thay `Chromium.useProfile(profilePath)` bằng `new BrowserEngine().useProfile(profilePath)`.
- Vì connector/engine là singleton, test chạy tuần tự (không song song thật):
  ```ts
  for (const profile of LIST_PROFILE_DIR_PATH) {
    const engine = new BrowserEngine().useProfile(profile);
    const browser = engine.launch();
    const context = await browser.newContext();
    await openDrivenSites(context);
    await browser.quit();
  }
  ```

### 5. `tests/quit-cleanup.test.ts` (sửa)
- Import: `import { BrowserEngine } from '../src/adapter/playwright/chromium';`
- Thay `Chromium.quit()` bằng `new BrowserEngine()` cho mỗi test:
  ```ts
  it('quit() không throw khi chưa launch', async () => {
    const engine = new BrowserEngine();
    await engine.quit();
  });
  ```
- Thay `Object.getPrototypeOf(Chromium)` bằng `BrowserEngine.prototype`.

### 6. `tests/browser.ts` (sửa)
- Import: `import { BrowserEngine } from '../src';`
- Thay `Chromium.launch()` bằng `new BrowserEngine().launch()`:
  ```ts
  browser = new BrowserEngine().launch();
  ```

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `launch()` trên instance A, sau đó `launch()` trên instance B | Cả hai đều chạy (state riêng) |
| `quit()` trên instance A | Instance B không bị ảnh hưởng |
| Gọi `useProfile()` sau `launch()` | Không thay đổi — vẫn throw lỗi nếu `isLaunched` |
| Engine dưới (connector) đang busy từ instance A | Instance B sẽ đợi qua async-lock (shared queue) |

## Kiểm tra

### Test cases cho `multi_context.ts`

| Case | Mô tả | Expected |
|---|---|---|
| Happy path | Tạo 2 BrowserEngine, launch từng cái, quit từng cái | Không throw lỗi |
| Idempotent quit | Gọi `quit()` 2 lần trên cùng instance | Lần 2 không làm gì |

### Test cases cho `quit-cleanup.test.ts`

| Case | Mô tả | Expected |
|---|---|---|
| quit trước launch | new BrowserEngine() -> quit() | Không throw |
| quit 2 lần | quit() -> quit() | Lần 2 không throw |
| engine.cleanup trước launch | BrowserEngine.engine.cleanup() | Không throw |
| PWChromium interface | BrowserEngine.prototype có quit() | `typeof quit === 'function'` |

### Test cases cho `browser.ts`

| Case | Mô tả | Expected |
|---|---|---|
| new BrowserEngine | launch -> newContext -> quit | Không throw lỗi |
