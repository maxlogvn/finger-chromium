# Spec: Test Error classes & Utilities

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Viết unit test cho 4 module tiện ích và xử lý lỗi cốt lõi: `errors.ts`, `utils.ts`, `common/index.ts`, `loader/index.ts`. Tất cả gộp trong một file `tests/utils.test.ts` với các `describe` block phân nhóm rõ ràng.

## Yêu cầu

- Mọi error class phải kế thừa `PluginError` và `Error` (instanceof chain).
- `PluginError` phải set đúng `name`, `constructor.name`, và `[Symbol.toStringTag]`.
- Mỗi error class con phải có message mở rộng (do `dedent`) — không throw lỗi khi khởi tạo.
- `defaultArgs()` phải lọc đúng IGNORED_ARGS, xử lý extensions, force `--bas-force-visible-window` khi không headless.
- `getProfilePath()` phải ưu tiên `userDataDir` > `--user-data-dir` trong args > fallback rỗng.
- `validateConfig()` phải throw `PluginError` nếu value không phải string hoặc options null.
- `validateLauncher()` phải throw `PluginError` nếu launcher không có method `launch`.
- `scripts.waitForResize` phải là function trả về Promise (chỉ test kiểu, không chạy thật).
- `scripts.getViewport` phải là function trả về object `{ width, height }` khi chạy trong browser.
- `Loader` constructor phải lưu đúng target, version, packages.
- `Loader.import()` phải throw `PluginError` khi không tìm thấy package nào.
- `Loader.load()` phải throw `PluginError` khi version không đạt minimum.

## Thiết kế

File test duy nhất `tests/utils.test.ts` với cấu trúc:

```
describe('Error classes')
  describe('PluginError')
    - instanceof Error
    - instanceof PluginError
    - name === constructor name
    - Symbol.toStringTag === constructor name
  describe('MissingKeyError')
    - extends PluginError
    - message chứa hướng dẫn set key
  describe('InvalidEngineError')
    - extends PluginError
    - message chứa hướng dẫn xoá engine
  describe('EngineTimeoutError')
    - extends PluginError
    - message chứa hướng dẫn setEngineTimeout
  describe('RequestTimeoutError')
    - extends PluginError
    - message chứa hướng dẫn setRequestTimeout

describe('Utils')
  describe('defaultArgs()')
    - default options không headless -> --bas-force-visible-window
    - headless: true -> --hide-scrollbars, --mute-audio
    - extensions -> --load-extension
    - ignored args (--kiosk, --headless...) bị lọc bỏ
    - args rỗng -> vẫn có --user-data-dir
  describe('getProfilePath()')
    - ưu tiên userDataDir
    - fallback --user-data-dir trong args
    - không có gì -> string rỗng
  describe('validateConfig()')
    - value hợp lệ (string) + options hợp lệ (object) -> không throw
    - value không phải string -> throw PluginError
    - options null -> throw PluginError
  describe('validateLauncher()')
    - launcher hợp lệ (có launch function) -> không throw
    - launcher null/undefined -> throw PluginError
    - launcher không phải object -> throw PluginError
    - launcher không có launch -> throw PluginError

describe('Common scripts')
  describe('scripts.waitForResize')
    - là function
  describe('scripts.getViewport')
    - là function

describe('Loader')
  describe('constructor')
    - lưu target, version, packages
  describe('import()')
    - packages rỗng -> undefined
    - không tìm thấy -> throw PluginError
  describe('load()')
    - version thấp -> throw PluginError
```

Tham chiếu: `docs/designs/test-error-classes-utilities.design.md`

## API / Data flow

Không có API — đây là unit test cho module có sẵn.

## Components

- `tests/utils.test.ts` (tạo mới) — chứa toàn bộ test.

File nguồn được test (không sửa):
- `src/plugin/errors.ts`
- `src/plugin/utils.ts`
- `src/common/index.ts`
- `src/loader/index.ts`

## Xử lý lỗi

- `Loader.import()` dùng `require()` thật — nếu chạy ở môi trường không có package, test sẽ throw. Cần đảm bảo test chỉ kiểm tra logic chứ không phụ thuộc package bên ngoài. Dùng try/catch trong test để bắt lỗi expected.
- `createRequire` trong `loader/index.ts` dùng `import.meta.url` — không ảnh hưởng đến test vì test chạy qua `tsx` loader.

## Kiểm tra

### Error classes
- Happy path: `new PluginError('test')` — `instanceof PluginError`, `instanceof Error`, `name === 'PluginError'`
- Edge case: `new MissingKeyError('msg')` — message gốc được giữ trong đầu chuỗi
- Edge case: `Symbol.toStringTag` — `Object.prototype.toString.call(err)` trả về `[object PluginError]`

### Utils
- Happy path: `defaultArgs()` với đủ options — arguments đúng thứ tự và nội dung
- Edge case: `getProfilePath()` không có profile path — trả về rỗng
- Error case: `validateConfig('fp', null, {})` — throw PluginError
- Error case: `validateLauncher({})` — throw PluginError vì thiếu launch

### Common scripts
- Chỉ test kiểu dữ liệu (typeof) — không chạy browser

### Loader
- Happy path: constructor lưu đúng giá trị
- Error case: `Loader.import([])` — trả về undefined
- Error case: `Load.load()` với version thấp — throw PluginError
