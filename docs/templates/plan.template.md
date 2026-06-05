# Plan: <tên tính năng>

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** YYYY-MM-DD | **Ngày kết thúc dự kiến:** YYYY-MM-DD

## Các bước thực hiện

- [ ] **Bước 1: Tạo module injector WebGL**  
  - **Làm gì:** Tạo `src/injectors/webgl.ts`, viết hàm `injectWebGLNoise(noiseLevel)`.  
  - **File liên quan:** `src/injectors/webgl.ts` (mới), `src/types.ts` (thêm type).  
  - **Định nghĩa hoàn thành (DoD):** Có unit test đạt coverage > 80%, type check pass.  
  - **Thời gian ước lượng:** 2h  
  - **Rủi ro:** Cần hiểu rõ WebGL API – có thể mất thêm 1h nghiên cứu.  
  - **Phụ thuộc:** Không.

- [ ] **Bước 2: Tích hợp vào engine connector**  
  - **Làm gì:** Sửa `src/plugin/connector/bridge.ts` để gửi config `webgl_noise`.  
  - **File liên quan:** `src/plugin/connector/bridge.ts`, `src/plugin/connector/types.ts`.  
  - **DoD:** Kết nối thành công tới engine mock, request chứa đúng field.  
  - **Thời gian ước lượng:** 1h  
  - **Rủi ro:** Engine API có thể thay đổi – cần kiểm tra tài liệu engine.  
  - **Phụ thuộc:** Bước 1.

- [ ] **Bước 3: Thêm API cho người dùng**  
  - **Làm gì:** Thêm method `chromium.setWebGLNoise(noise)` ở adapter.  
  - **File liên quan:** `src/adapter/playwright/fluent.ts`  
  - **DoD:** Ví dụ trong `examples/` chạy được, in ra giá trị WebGL đã bị noise.  
  - **Thời gian ước lượng:** 1.5h  
  - **Phụ thuộc:** Bước 2.

- [ ] **Bước 4: Viết test integration**  
  - **Làm gì:** Thêm test case trong `test/integration/webgl.test.ts`.  
  - **File liên quan:** `test/integration/webgl.test.ts`  
  - **DoD:** `npm test` chạy thành công, coverage tăng ít nhất 5%.  
  - **Thời gian ước lượng:** 1h  
  - **Phụ thuộc:** Bước 3.

## Kiểm tra tổng thể
Chạy các lệnh sau trước khi đóng plan:
- `npm run lint`
- `npm test`
- `npm run build`
- Kiểm tra thủ công: `node examples/webgl-noise.js` và quan sát output.

## Rủi ro & phương án dự phòng
- **Rủi ro:** Engine phiên bản cũ không hỗ trợ → **Dự phòng:** Hiển thị lỗi rõ ràng, hướng dẫn nâng cấp engine.
- **Rủi ro:** Performance bị ảnh hưởng → **Dự phòng:** Đo benchmark, nếu >50ms thì tối ưu bằng cách inject sau khi page load.

## Ghi chú bổ sung
- Cần cập nhật `CONVENTIONS.md` nếu thêm quy tắc mới về native injection.
- Liên hệ đội engine để xác nhận API ổn định trước khi merge.
