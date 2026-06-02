# Overview: Hạ tầng dự án

Thực tế triển khai đúng spec. Một số điểm cần lưu ý:

- `tsup` `dts.resolve: false` là bắt buộc vì nếu để `true` hoặc bỏ qua, `rollup-plugin-dts` (dùng nội bộ trong tsup) sẽ crash khi parse type từ `playwright-core` -- dẫn đến lỗi build không rõ nguyên nhân.
- External list phải khai báo đầy đủ để esbuild không bundle dependencies. Thiếu một package trong external sẽ làm tăng kích thước bundle và gây conflict version.
- `npm run clean` không chạy trên Windows -- pre-existing bug chưa sửa.
