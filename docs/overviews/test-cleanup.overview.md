# Overview: Test Cleanup (SettingsCleaner + ConfigManager + Mutex)

## Tóm tắt

Đã viết unit test cho ba module cleanup: `cleaner.ts` (SettingsCleaner), `config.ts` (ConfigManager), và `mutex/index.ts` (Mutex). Tổng cộng 19 test cases mới, tất cả pass cùng với 85 test cũ (104/104 pass). Phương pháp hybrid: manual stub trên CJS module exports (proper-lockfile, async-lock), integration với temp file thật (fs, fast-glob), và global override (setInterval, clearInterval).

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Task 1: Cài đặt dependencies | Thêm sinon + @types/sinon | Không cần — đã gỡ bỏ | Không dùng sinon vì ESM constraints, manual stub đủ |
| Task 2: SettingsCleaner watch/ignore/include/stop | 8 test cases với sinon.stub | 8 test cases với manual stub + integration | sinon.stub không dùng được cho CJS default imports (live binding) — chuyển sang manual property mutation |
| Task 3: SettingsCleaner cleanup cycle | 4 test cases (private method) | Bỏ — không test được `#cleanup` vì JS native private field | `#cleanup` là native private — không thể truy cập từ ngoài, không thể trigger qua fake timers |
| Task 4: ConfigManager configure | 3 test cases | 3 test cases | `configure()` overwrites `browser.configure` — test verify overwrite thay vì call count |
| Task 5: ConfigManager synchronize + pollInterval | 5 test cases | 5 test cases (2 synchronize + 3 pollInterval) | Dùng real .ini file trong temp dir thay vì mock fs — chậm hơn (~1s/test) |
| Task 6: Mutex tests | 4 test cases | 4 test cases | Không sai lệch |
| Task 7: Lint + typecheck + test | Pass tất cả | 0 errors, 15 warnings (có sẵn), typecheck pass, 104/104 tests pass | Không có |

## Sai lệch đáng chú ý

- **Thay proxyquire bằng manual stub:** Ban đầu spec chọn proxyquire + sinon, nhưng proxyquire không tương thích với `tsx/esm` loader (ESM imports không đi qua `require()`). Giải pháp: manual stub trực tiếp trên CJS module exports object (`lock.lock = async () => {}`) — hoạt động vì CJS module exports object được chia sẻ qua tất cả ESM importers. Cập nhật spec và design để phản ánh approach mới.
- **Bỏ test `#cleanup` private method:** `cleaner.ts` dùng `#cleanup` (JS native private field) — không thể truy cập từ test. Fake timers (sinon.useFakeTimers) có thể trigger gián tiếp nhưng gây side effects với `Date.now()` trong `cleanup()` logic và không await được `async` cleanup callback. Quyết định bỏ test cleanup cycle, chỉ test `stop()` hành vi unlock.
- **sinon chỉ dùng cho global spies:** Thay vì sinon.stub cho module imports, sinon chỉ dùng cho `global.setInterval`/`global.clearInterval` spy. Các dependency khác mock bằng manual property mutation hoặc integration với temp file thật. Cập nhật spec để phản ánh phạm vi sử dụng sinon bị thu hẹp.
- **PollInterval tests chậm (~1s):** Vì dùng `setTimeout` thật với pollInterval 500ms/100ms, các test synchronize mất ~1s mỗi test. Đây là trade-off chấp nhận được (tổng cộng ~3s cho cả suite).

## Tài liệu liên quan

- `docs/designs/test-cleanup.design.md`
- `docs/specs/test-cleanup.spec.md`
- `docs/plans/test-cleanup.plan.md`
- `docs/overviews/test-cleanup.overview.md` — file này
- `tests/cleanup.test.ts` — file test mới
- `package.json` — thêm `sinon` + `@types/sinon` vào devDependencies

## Ghi chú

- Task này là non-feature task (chỉ viết test), không cần product doc.
- JS native `#` private fields tiếp tục là rào cản testability cho các module khác. Cân nhắc chuyển sang TypeScript `private` (compile-time only) cho dễ test.
- ESM module mocking vẫn là vấn đề mở. Nếu cần mock ESM modules trong tương lai, có thể xem xét `testdouble` hoặc `unstable` node --experimental-loader.
