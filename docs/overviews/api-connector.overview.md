# Overview: API Connector

File: `src/plugin/connector/index.ts` (90 dòng).

## Lưu ý kỹ thuật

- `result.response ?? result`: engine binary trả response ở 2 format khác nhau. Tuỳ API call, response có thể nằm trong `response` field hoặc là root object. Cần cả 2 để tương thích.
- `requestTimeout: 0` cho perfectCanvasRequest: giá trị `0` được xử lý đặc biệt trong `runFunction` - khi `requestTimeout = 0`, hàm `setTimeout` không được gọi (vì setTimeout 0ms vẫn sẽ chạy, nhưng timer không reject). Thực tế, nếu `requestTimeout` falsy (0, undefined, null), `runFunction` bỏ qua hoàn toàn timer timeout.
- `once()` package dùng cho notification và PCAP server listen -- đây là zero-dependency package, chỉ đảm bảo function chạy đúng một lần.
- Biến môi trường `FINGERPRINT_TIMEOUT` dùng chung cho cả engine timeout và request timeout. Nếu cần khác nhau, phải set riêng.
