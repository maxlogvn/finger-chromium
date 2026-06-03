# Overview: Test Error classes & Utilities

## Tóm tat

Da viet unit test cho 4 module: `errors.ts`, `utils.ts`, `common/index.ts`, `loader/index.ts`. Tong cong 35 test cases, gop trong file `tests/utils.test.ts`. Tat ca 58 test (35 moi + 23 cu) deu pass.

## Ket qua thuc hien

| Buoc | Ke hoach | Thuc te | Sai lech |
|---|---|---|---|
| Buoc 1: Test Error classes (5 class) | 13 test: instanceof, name, toStringTag, message | Hoan thanh 13 test | Khong co |
| Buoc 2: Test defaultArgs() | 6 test: options mac dinh, headless, extensions, IGNORED_ARGS | Hoan thanh 6 test | 1 test sai hieu behavior cua `headless` default (`!devtools` = true) -> da sua test cho dung |
| Buoc 3: Test getProfilePath() | 4 test: uu tien userDataDir, fallback, empty | Hoan thanh 4 test | Khong co |
| Buoc 4: Test validateConfig() + validateLauncher() | 8 test: hop le + error cases | Hoan thanh 8 test | Khong co |
| Buoc 5: Test Common scripts | 2 test: typeof function | Hoan thanh 2 test | Khong co |
| Buoc 6: Test Loader class | 4 test: constructor, import rong, import throw, load version thap | Hoan thanh 4 test | Khong co |
| Buoc 7: Chay kiem tra | lint, typecheck, test | Tat ca pass | Khong co |

## Sai lech dang chu y

- **Sai lech Buoc 2:** Test `defaultArgs()` mac dinh co `--bas-force-visible-window` la sai. Thuc te `headless` default = `!devtools` = `true` (headless mode) -> co `--hide-scrollbars` va `--mute-audio`, khong co `--bas-force-visible-window`. Da sua test cho dung voi behavior cua code.

## Tai lieu lien quan

- `docs/designs/test-error-classes-utilities.design.md`
- `docs/specs/test-error-classes-utilities.spec.md`
- `docs/plans/test-error-classes-utilities.plan.md`
- `tests/utils.test.ts` (tao moi)

## Ghi chu

- `common/index.ts` chi test typeof function vi script chay trong browser context, khong the test logic that trong unit test thuan.
- `Loader.import()` dung `require()` that qua `createRequire` -> can mock bang package name khong ton tai de test throw.
