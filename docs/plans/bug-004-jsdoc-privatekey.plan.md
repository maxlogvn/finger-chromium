# Plan: Bug #4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại

## Các bước thực hiện

- [ ] Bước 1: Code — sửa JSDoc trong `src/types/PWChromium.ts`
    - Dòng 17: xoá `usePrivateKey` khỏi mô tả, thay bằng ghi chú về biến môi trường.
    - Dòng 25: xoá `.usePrivateKey('your-private-key')` khỏi example code.
    - Thêm dòng comment hướng dẫn set `BABLOSOFT_KEY` ở đầu JSDoc.

- [ ] Bước 2: Kiểm tra — `npm run lint`, `npm run build`

- [ ] Bước 3: Viết overview

- [ ] Bước 4: Cập nhật Roadmap — đánh dấu Hoàn thành

## Kiểm tra

- `npm run lint`
- `npm run build`

## Ghi chú

- Chỉ sửa comment, không sửa logic code.
