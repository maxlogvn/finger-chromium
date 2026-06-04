# Design: Loại bỏ hoàn toàn `as any` khỏi codebase

## Bối cảnh

Hiện tại codebase có 9 chỗ dùng `as any` trong `src/` và 37 chỗ trong `tests/`.
`as any` phá vỡ hoàn toàn type safety -- TypeScript không thể kiểm tra kiểu ở những chỗ này,
che giấu lỗi tiềm ẩn và gây khó khăn khi refactor.

Các vị trí trong `src/` thuộc 4 nhóm:

| Nhóm | Vị trí | Mô tả |
|------|--------|-------|
| API params | `plugin/index.ts:203,215,249` | Object params truyền vào `connector.api()` không có interface |
| Spread call | `plugin/index.ts:231` | Gọi `configure()` với spread args |
| Merge options | `plugin/index.ts:244,270` | Pass object mở rộng (`options as any`) cho `getProfilePath()` và `launcher.launch()` |
| Duck-typing | `adapter/playwright/utils.ts:72`, `plugin/launcher/index.ts:86`, `adapter/playwright/engine.ts:80` | Kiểm tra runtime property / gán giá trị cho read-only property |

## Câu hỏi làm rõ

- Hỏi: Có xử lý `as any` trong `tests/` không? (37 chỗ)
  Trả lời: Có. Test cũng cần type safety -- nếu type thay đổi, `as any` che mất lỗi cần fail.
- Hỏi: Cần giữ backward compatibility cho API public không?
  Trả lời: Cần. `BaseLaunchOptions`, `Connector.api()`, `FingerprintPlugin` là public API
  -- không thay đổi signature của method, chỉ thêm interface nội bộ.
- Hỏi: Có cần xoá `[key: string]: unknown` khỏi `BaseLaunchOptions` không?
  Trả lời: Không. Index signature cho phép pass thêm field tuỳ chỉnh từ Playwright options
  -- chỉ cần fix chỗ dùng `as any`.

## Các phương án

### Phương án 1: Define interface cụ thể cho từng chỗ (recommended)

Define các interface thiếu, dùng type assertion chính xác thay vì `any`.

- **API params:** Thêm `FetchParams`, `SetupParams`, `VersionsParams` interface.
- **Spread call:** Chuyển `configure()` từ spread args sang explicit parameter.
- **Merge options:** Cast đúng type thay vì `any`.
- **Duck-typing:** Dùng type predicate hoặc interface cụ thể.

- Ưu điểm: Type-safe hoàn toàn, pattern rõ ràng, dễ maintain.
- Nhược điểm: Phải sửa nhiều file cùng lúc.

### Phương án 2: Dùng `@ts-expect-error` thay `as any`

Giữ nguyên code, thêm comment `// @ts-expect-error` để TS im lặng.

- Ưu điểm: Ít thay đổi code nhất.
- Nhược điểm: Type safety vẫn bị phá vỡ, không giải quyết gốc vấn đề.

### Phương án 3: Type assertion hẹp (`as SpecificType` thay vì `as any`)

Dùng `as unknown as SpecificType` -- ép kiểu qua `unknown` thay vì `any`.

- Ưu điểm: An toàn hơn `as any` một chút (không cho phép gán lung tung).
- Nhược điểm: Vẫn là type assertion không an toàn, chỉ khác về mức độ.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (Define interface cụ thể).
  Lý do: Triệt để, đúng bản chất, phù hợp với strict mode.

- **Phương án được chọn:** Phương án 1 (Define interface cụ thể).

- **Ràng buộc:**
  - Không thay đổi signature của public API.
  - Interface API params đặt trong file tương ứng (VD: `plugin/index.ts` cho `FetchParams`, `SetupParams`).
  - Test `as any` fix theo pattern: dùng `as unknown as Type` nếu cần ép kiểu,
    hoặc khai báo interface test riêng nếu cần truy cập private member.
