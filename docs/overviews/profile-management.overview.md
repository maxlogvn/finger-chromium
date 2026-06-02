# Overview: Quản lý Profile

File: `src/adapter/playwright/data.ts` (98 dòng).

## Lưu ý kỹ thuật

- `map()` có 2 overload: `map(source)` cho copy vào temp, `map(temp, destination)` cho copy từ temp ra. Dùng TypeScript overload, không phải optional parameter -- code gọi phải chọn đúng overload.
- Temp dir naming không dùng crypto vì performance -- `Math.random()` tạo 4 hex digits (tối đa 65536 giá trị). Trong thực tế collision rất thấp vì timestamp + PID đảm bảo uniqueness.
- `fs.cpSync` và `fs.rmSync` là Node.js 16+ API -- project yêu cầu Node 18 nên an toàn.
- Khi dùng `dispose()`, nó gọi `unmap(instanceTempDir)` -- xoá temp dir của instance này. Nếu temp dir không tồn tại, chỉ warn chứ không throw.
