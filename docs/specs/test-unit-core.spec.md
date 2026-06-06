# Spec: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).  
> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả

Tạo file `tests/unit/core.spec.ts` với unit test cho 3 module core không phụ thuộc `BABLOSOFT_KEY` hay browser thật:
- Error classes (`src/plugin/errors.ts`)
- Public exports (`src/index.ts`)
- Config logic (`src/plugin/config.ts`)

Mục tiêu: đảm bảo coverage cơ bản cho các module này, phát hiện sớm hồi quy khi refactor.

## Phạm vi

- **Trong phạm vi:** Test 5 error class (`PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`), kiểm tra export từ `src/index.ts`, test `getValidPollInterval()` và `ConfigManager.synchronize()` + `configure()`.
- **Ngoài phạm vi:** Test `ConfigManager` với file .ini thật ngoài temp directory. Test tích hợp với browser thật. Test các module khác (loader, adapter, common). Test dùng `chai`, `sinon`, `mock-fs` hoặc thư viện bên thứ ba khác.

## Yêu cầu

- **Functional:**
  - Test tất cả error class: khởi tạo không tham số, khởi tạo với custom message, `instanceof` chain.
  - `MissingKeyError` phải append thêm hướng dẫn vào message (kiểm tra bằng `includes`).
  - Export check: `BrowserEngine` là class, 5 error class là subclass của `PluginError`, các type export tồn tại.
  - `getValidPollInterval()`: trả về `DEFAULT_POLL_INTERVAL` (500) cho NaN, âm, undefined. Clamp giá trị < 100 lên 100. Trả về nguyên giá trị hợp lệ >= 100.
  - `ConfigManager.configure()`: đăng ký cleanup handler `process.once('exit')`, gọi `setViewport` khi có width/height, gán `browser.configure`.
  - `ConfigManager.synchronize()`: đọc file .ini, reset `availWidth`/`availHeight` về `BAS_NOT_SET`, sau đó set giá trị thật, lock theo `id`.
- **Non-functional:**
  - Chạy được với `npm test`, không cần biến môi trường nào.
  - Không spawn browser hay engine worker.
  - Dùng Node `assert` (không thêm thư viện assert mới).
  - Dùng temp directory (`fs.mkdtempSync`) cho config test, cleanup trong `after`.

## Phụ thuộc

- `node:assert` (có sẵn trong Node.js).
- `node:fs` + `node:path` (có sẵn) cho temp directory operations.
- `mocha` (đã có trong `devDependencies`).
- `@types/mocha` (đã có) cho type definitions.
- Tham chiếu design doc: `docs/designs/test-unit-core.design.md`

## Thiết kế

Kiến trúc test theo cấu trúc Mocha describe/it, 3 nhóm chính:

```
tests/unit/core.spec.ts
  describe('Error classes')
    describe('PluginError')
      it('tạo instance không tham số')
      it('tạo instance với custom message')
      it('name === constructor.name')
      it('[Symbol.toStringTag] === constructor.name')
    describe('MissingKeyError')
      it('kế thừa PluginError (instanceof)')
      it('message chứa hướng dẫn set key')
    ... (InvalidEngineError, EngineTimeoutError, RequestTimeoutError tương tự)

  describe('Public exports')
    it('BrowserEngine là class')
    it('PluginError là class và là Error')
    it('MissingKeyError là subclass của PluginError')
    ... (các error khác)
    it('PWChromium là object (type export)')
    it('FetchOptions, FingerprintOptions, ... là object (type export)')

  describe('Config')
    describe('getValidPollInterval()')
      it('undefined → DEFAULT_POLL_INTERVAL')
      it('NaN → DEFAULT_POLL_INTERVAL')
      it('âm → DEFAULT_POLL_INTERVAL')
      it('< 100 → clamp về 100')
      it('>= 100 → giữ nguyên')
    describe('ConfigManager.configure()')
      it('đăng ký cleanup handler qua process.once')
      it('gán browser.configure và gọi nó')
      it('gọi setViewport khi có width/height')
      it('không gọi setViewport khi thiếu width/height')
    describe('ConfigManager.synchronize()')
      it('reset availWidth/availHeight về BAS_NOT_SET')
      it('set giá trị thật sau reset')
      it('dùng lock theo id')
      it('throw khi file .ini không tồn tại')
```

## API / Data flow

```
Test errors:
  new PluginError('msg') → instance.name === 'PluginError'
                         → instance instanceof Error === true
                         → instance instanceof PluginError === true
                         → instance.message === 'msg'

Test export check:
  import { BrowserEngine } from '...' → typeof BrowserEngine === 'function'

Test config:
  getValidPollInterval(NaN) → 500
  getValidPollInterval(-1) → 500
  getValidPollInterval(50) → 100
  getValidPollInterval(200) → 200

  ConfigManager.synchronize(id, pwd, bounds)
    → readFile(`${pwd}/s/${id}1.ini`)
    → replace availWidth=... → BAS_NOT_SET
    → writeFile
    → sleep(500)
    → replace BAS_NOT_SET → bounds.width
    → writeFile
```

## Components

- `tests/unit/core.spec.ts` (tạo mới) -- chứa toàn bộ unit test.
- `tests/unit/` (tạo mới) -- thư mục chứa unit test.
- Không sửa file source code nào.

## Xử lý lỗi

| Tình huống | Cách xử lý trong test |
|------------|----------------------|
| Test error class throw sai | `assert.throws` với `instanceof` check |
| Export bị thiếu | `assert.ok(exportValue)` trước khi kiểm tra type |
| Temp directory không tạo được | `assert.fail` trước, dùng `try` để cleanup |
| Config test dùng file không tồn tại | `assert.rejects` với lỗi đọc file |
| `async-lock` timeout | `assert.rejects` với timeout error |

## Kiểm tra (Testing)

- **Happy path:** Error class khởi tạo đúng, export đủ, `getValidPollInterval` trả về giá trị hợp lệ, `synchronize` đọc/ghi file đúng.
- **Edge case:** `getValidPollInterval` với NaN, âm, undefined, giá trị sát biên (99, 100, 101).
- **Edge case:** `ConfigManager.configure` với bounds rỗng, không gọi `setViewport`.
- **Error case:** File .ini không tồn tại trong `synchronize` -- `assert.rejects`.
- **Error case:** `MissingKeyError` với message rỗng -- vẫn append hướng dẫn.
