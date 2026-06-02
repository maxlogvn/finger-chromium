# Overview: API Connector

## Mục tiêu

Xây dựng lớp wrapper đồng bộ cho RemoteEngine: singleton, async-lock, error normalization, auto-start PCAP server.

## Kết quả

- `src/plugin/connector/index.ts`: 90 dòng.
- Singleton `engine` instance được export.
- `api(name, params)` function với async-lock.
- PCAP server tự động start khi import.
- Notification cho bản free (thiếu key).

## Kiểm tra

- `npm run lint` -- 0 errors.
- Các import: `RemoteEngine`, `pcapServer`, `AsyncLock`, `MissingKeyError`, `PluginError`.
- `async-lock` có trong dependencies.

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| Dùng `engineTimeout` và `requestTimeout` riêng | Cả 2 đều lấy từ `FINGERPRINT_TIMEOUT` | Đơn giản hoá cấu hình, người dùng chỉ cần set 1 biến |
| PCAP server start riêng | Auto-start khi import connector | Không thể quên start, giảm lỗi người dùng |

## Ghi chú kỹ thuật

- `FINGERPRINT_TIMEOUT` dùng chung cho cả engine và request timeout. Nếu cần tách riêng, có thể set qua `setEngineTimeout()` và `setRequestTimeout()` trên engine instance.
- Khi PerfectCanvas request được bật, `requestTimeout` set về 0 (vô hạn). Lý do: quá trình render canvas động có thể mất nhiều phút.

---
