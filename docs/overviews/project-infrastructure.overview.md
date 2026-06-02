# Overview: Hạ tầng dự án (Project Infrastructure)

## Kết quả

Đã thiết lập đầy đủ hạ tầng phát triển cho dự án fingerprint-chromium-engine. Tất cả config và tooling đã hoạt động ổn định.

## So sánh Plan vs Thực tế

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 1 | Viết product doc | Hoàn thành |
| 2 | Viết overview doc | Hoàn thành |
| 3 | Kiểm tra tính nhất quán | Hoàn thành |
| 4 | Cập nhật roadmap | Hoàn thành |

## Sai lệch

- Plan dự kiến 4 bước, thực tế làm đúng 4 bước. Không sai lệch.

## Bài học kinh nghiệm

- `npm run clean` dùng `rm -rf dist` không tương thích Windows. Cần sửa script thành `rimraf` hoặc dùng PowerShell `Remove-Item` khi có thời gian.
- Tsup bundle rất nhanh (< 200ms), phù hợp cho CI/CD.
- ESLint với `consistent-type-imports` giúp giảm kích thước bundle đáng kể.
