# Spec: Hiệu chỉnh tài liệu core theo code thực tế

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Task này hiệu chỉnh tài liệu của cụm core để tài liệu khớp với code thực tế. Đây là non-feature task, không thay đổi source code.

Cụm core là đường đi chính khi user gọi `new BrowserEngine()` để mở browser có fingerprint. Luồng này bắt đầu ở `BrowserEngine`, đi qua bridge của Playwright, vào `FingerprintPlugin`, gọi `API Connector`, rồi tới `RemoteEngine` để giao tiếp với `FastExecuteScript.exe`.

Tài liệu sau khi sửa phải giúp developer mới trả lời được 3 câu hỏi:

- File này nằm ở đâu trong luồng launch hoặc cleanup?
- Method nào là public API, method nào chỉ là chi tiết nội bộ?
- Vì sao code làm như vậy, ví dụ vì sao dùng persistent context, vì sao ép `headless: false`, vì sao cần lock request?

## Yêu cầu

- Chỉ sửa tài liệu, không sửa code.
- Phạm vi vòng này gồm 5 cụm:
  - `BrowserEngine`
  - `Playwright Bridge`
  - `FingerprintPlugin`
  - `API Connector`
  - `RemoteEngine`
- Mỗi cụm phải được đối chiếu với source trước khi sửa docs.
- Mỗi ví dụ code phải dùng API có thật trong source hiện tại.
- Không dùng `usePrivateKey()` trong ví dụ `BrowserEngine`, vì `src/adapter/playwright/chromium.ts` hiện không có method này.
- Tài liệu phải mô tả rõ luồng launch chính:

```txt
BrowserEngine (new instance)
  -> engine.launch()
  -> engine.newContext()
  -> PlaywrightFingerprintPlugin.launchPersistentContext()
  -> FingerprintPlugin._launch(false, options)
  -> api('setup', params)
  -> RemoteEngine.runFunction('setup', params)
  -> FastExecuteScript.exe
```

- Tài liệu phải mô tả rõ luồng cleanup chính:

```txt
engine.quit()
  -> context.close()
  -> engine.cleanup()
  -> browser.close()
  -> connector.cleanup()
  -> engine.kill()
  -> pcapServer.close()
  -> mutex.release()
  -> cleaner.stop()
  -> dataManager.dispose()
```

- Mỗi tài liệu cần giải thích "tại sao", không chỉ liệt kê "làm gì".
- Khi dùng thuật ngữ khó, giải thích ngắn ngay bên cạnh. Ví dụ: `launchPersistentContext` là cách Playwright mở browser với thư mục profile cố định.
- Các phần sai lệch so với docs cũ phải được ghi lại trong overview cuối task.

## Thiết kế

Tham chiếu design doc: `docs/designs/core-documentation-correction.design.md`.

Task này không tạo module mới. Cách làm là đọc source code làm nguồn sự thật, rồi sửa các tài liệu hiện có để phản ánh đúng source.

Các tài liệu sau khi sửa vẫn giữ đúng vai trò:

- `design`: ghi lý do chọn hướng thiết kế và trade-off.
- `spec`: mô tả API, luồng dữ liệu, component, lỗi, kiểm tra.
- `product`: giải thích cách dùng hoặc cách hiểu tính năng ở mức thực tế.
- `overview`: ghi kết quả sau khi thực hiện plan, gồm sai lệch và kiểm tra đã chạy.

Vì đây là task tài liệu, các `plan` cũ của từng feature chỉ sửa khi chúng đang sai rõ ràng so với code hoặc đang gây hiểu nhầm cho developer. Mặc định ưu tiên sửa `design`, `spec`, `product`, và `overview` của 5 cụm core.

## API / Data flow

Task này không thêm API runtime. Data flow cần mô tả trong docs là data flow của hệ thống core.

### Luồng cấu hình và launch

1. User gọi `engine.useFingerprint()`, `engine.useProxy()`, hoặc `engine.useProfile()` (với `engine = new BrowserEngine()`).
2. `BrowserEngine.launch()` hợp nhất options và đẩy cấu hình xuống `PlaywrightFingerprintPlugin`.
3. `BrowserEngine.newContext()` gọi `engine.launchPersistentContext()` với profile runtime.
4. `PlaywrightFingerprintPlugin.launchPersistentContext()` validate options, ép `viewport: null`, tạo launcher proxy, rồi gọi `_launch(false, options)`.
5. `FingerprintPlugin._launch()` gọi `api('setup')` để engine chuẩn bị fingerprint, proxy, profile, browser path và bounds.
6. `API Connector` serialize request qua `RemoteEngine.runFunction()`.
7. `RemoteEngine` ghi JSON request file, watch response bằng `chokidar`, rồi parse kết quả trả về.
8. `FingerprintPlugin._launch()` spawn `worker.exe`, chạy `configure()` và `synchronize()` trước khi trả context cho user.

### Luồng cleanup

1. `engine.quit()` đóng `BrowserContext` nếu đã tạo.
2. Nếu có profile đích, `AdapterDataManager` map dữ liệu từ thư mục runtime về thư mục lưu.
3. `PlaywrightFingerprintPlugin.cleanup()` kế thừa từ `FingerprintPlugin.cleanup()`.
4. `FingerprintPlugin.cleanup()` đóng browser, gọi `connectorCleanup()`, release mutex, và stop cleaner.
5. `connectorCleanup()` kill `RemoteEngine` và close PCAP server.
6. `engine.quit()` dispose thư mục tạm của instance hiện tại.

## Components

| Nhóm tài liệu | Source làm nguồn sự thật | Docs cần hiệu chỉnh |
|---|---|---|
| BrowserEngine | `src/adapter/playwright/chromium.ts`, `src/types/PWChromium.ts` | `docs/designs/browser-engine.design.md`, `docs/specs/browser-engine.spec.md`, `docs/products/browser-engine.product.md`, `docs/overviews/browser-engine.overview.md` |
| Playwright Bridge | `src/adapter/playwright/engine.ts`, `src/adapter/playwright/utils.ts`, `src/adapter/playwright/loader.ts` | `docs/designs/playwright-bridge.design.md`, `docs/specs/playwright-bridge.spec.md`, `docs/products/playwright-bridge.product.md`, `docs/overviews/playwright-bridge.overview.md` |
| FingerprintPlugin | `src/plugin/index.ts`, `src/plugin/utils.ts`, `src/plugin/config.ts` | `docs/designs/fingerprint-plugin.design.md`, `docs/specs/fingerprint-plugin.spec.md`, `docs/products/fingerprint-plugin.product.md`, `docs/overviews/fingerprint-plugin.overview.md` |
| API Connector | `src/plugin/connector/index.ts`, `src/plugin/connector/pcapServer/index.ts` | `docs/designs/api-connector.design.md`, `docs/specs/api-connector.spec.md`, `docs/products/api-connector.product.md`, `docs/overviews/api-connector.overview.md` |
| RemoteEngine | `src/plugin/connector/engine.ts`, `project.xml` | `docs/designs/remote-engine.design.md`, `docs/specs/remote-engine.spec.md`, `docs/products/remote-engine.product.md`, `docs/overviews/remote-engine.overview.md` |

Task docs mới gồm:

| File | Vai trò |
|---|---|
| `docs/designs/core-documentation-correction.design.md` | Ghi quyết định chia phạm vi và cách viết lại docs core |
| `docs/specs/core-documentation-correction.spec.md` | File này, mô tả yêu cầu và tiêu chí đúng/sai |
| `docs/plans/core-documentation-correction.plan.md` | Kế hoạch sửa từng cụm tài liệu |
| `docs/overviews/core-documentation-correction.overview.md` | Báo cáo kết quả sau khi sửa xong |

## Xử lý lỗi

Vì task này chỉ sửa tài liệu, "lỗi" ở đây là lỗi tài liệu hoặc lỗi quy trình.

- Nếu docs ghi API không tồn tại trong source: sửa docs theo source, không tự thêm API vào code.
- Nếu source và type public mâu thuẫn nhau: ghi rõ trong overview và dừng để hỏi người duyệt nếu cần quyết định code hay docs là nguồn sự thật.
- Nếu một behavior chỉ suy luận được từ code nhưng chưa có test: ghi là "theo code hiện tại", tránh viết như cam kết sản phẩm.
- Nếu phát hiện docs của cụm khác bị ảnh hưởng nhưng ngoài phạm vi: ghi vào overview hoặc roadmap ghi chú cho vòng sau, không mở rộng scope âm thầm.
- Nếu thấy tài liệu cũ có tiếng Việt thiếu dấu hoặc câu khó hiểu trong vùng đang sửa: sửa luôn để thống nhất phong cách.

## Kiểm tra

Kiểm tra chính là kiểm tra tài liệu và consistency, không cần chạy test browser thật vì không sửa code.

- Chạy `rg` để tìm API sai trong các docs core, nhất là `usePrivateKey`.
- Đối chiếu từng method public trong docs với source tương ứng.
- Đọc lại các ví dụ code để đảm bảo có import và không dùng method thiếu.
- Chạy `npm run lint` nếu có sửa code hoặc markdown tooling yêu cầu. Nếu chỉ sửa Markdown và repo không có markdown lint, ghi rõ là không cần.
- Chạy `git diff -- docs/designs docs/specs docs/products docs/overviews docs/ROADMAP.md` để kiểm tra phạm vi thay đổi không lan ra ngoài tài liệu cần sửa.

## Tiêu chí hoàn thành

- 5 cụm core có tài liệu chi tiết hơn và đúng với code hiện tại.
- Không còn ví dụ `BrowserEngine` dùng `usePrivateKey()`.
- Luồng launch và cleanup được mô tả thống nhất giữa các docs.
- Product doc đọc được như tài liệu onboarding thực tế, không chỉ là bản tóm tắt spec.
- Overview ghi rõ file đã sửa, sai lệch đã phát hiện, kiểm tra đã chạy, và phần nào để lại cho vòng sau.
