# Design: Bug #20 — Hardcoded `await setTimeout(2000)` bên trong async-lock

## Bối cảnh

Trong `src/plugin/config.ts`, hàm `synchronize()` dùng `await setTimeout(2000)` hai lần bên trong `lock.acquire()` — tổng cộng 4 giây chờ đợi vô ích mỗi lần gọi. Mặc dù lock key là `id` (unique per instance) nên các instance khác nhau không bị block, nhưng 4 giây cho một lần synchronize là quá lãng phí, đặc biệt khi action (setViewport) đã mất thêm ~1-3 giây.

Hai lần setTimeout tương ứng với hai bước:
1. **Reset (2s):** Ghi `BAS_NOT_SET` vào availWidth/availHeight trong file `.ini`, chờ engine nhận biết.
2. **Apply (2s):** Gọi action (CDP resize), ghi giá trị thật, chờ engine cập nhật.

Mục đích của delay là để engine poll file `.ini` kịp phát hiện thay đổi. Nhưng 2 giây mỗi lần là quá dư.

## Câu hỏi làm rõ

- Có cần thiết phải giữ nguyên hai-phase (reset → apply) không? → Có, vì engine cần được báo trước rằng giá trị sắp thay đổi, tránh dùng cached value.
- Poll interval của engine là bao nhiêu? → Không rõ, nhưng giả định là dưới 500ms dựa trên hành vi file-based IPC.
- Có instance nào share lock key `id` không? → `id` từ `SetupResponse`, unique mỗi lần setup, nên các instance khác nhau không block nhau.

## Các phương án

### Phương án 1: Giảm timeout + cấu hình linh hoạt (Recommended)

Giảm `await setTimeout(2000)` xuống `await setTimeout(500)`. Thêm tham số `pollInterval` (mặc định 500) vào `synchronize()` để cho phép tùy chỉnh khi cần.

- Ưu điểm:
  - Thay đổi tối thiểu, backward compatible.
  - Giảm thời gian synchronize từ 4s xuống ~1s (500ms x 2).
  - Cho phép user cấu hình nếu engine của họ poll chậm hơn.
- Nhược điểm:
  - Nếu engine poll interval > 500ms, có thể engine không kịp đọc file.

### Phương án 2: Chuyển thành polling interval configurable, giữ mặc định 2000

Giữ nguyên timeout nhưng thêm tham số `pollInterval` để user có thể giảm nếu muốn.

- Ưu điểm: An toàn nhất, không thay đổi behavior mặc định.
- Nhược điểm: Không giải quyết vấn đề hiệu năng cho default case. 4 giây vẫn là mặc định.

### Phương án 3: Dùng file-watch thay vì setTimeout

Dùng `fs.watch` hoặc chokidar để đợi engine đọc file, thay vì setTimeout mù.

- Ưu điểm: Chính xác, không lãng phí thời gian.
- Nhược điểm: Phức tạp, dễ lỗi (watch event có thể fire nhiều lần, cần debounce). Overkill cho bug nhỏ này.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 — giảm timeout xuống 500ms + thêm tham số `pollInterval`.
- **Phương án được chọn:** (do người duyệt quyết định)
- **Lý do:** Đơn giản, an toàn, giảm đáng kể thời gian synchronize, vẫn cho phép user tinh chỉnh.
- **Ràng buộc:** `pollInterval` mặc định 500ms, unit là milliseconds. Giá trị tối thiểu 100ms (tránh busy-wait).
