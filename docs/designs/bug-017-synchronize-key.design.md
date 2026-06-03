# Design: Bug #17 — `synchronize` ghi `BAS_NOT_SET` cho `availWidth/availHeight`

## Bối cảnh

`src/plugin/config.ts:synchronize()` ghi giá trị `availWidth`/`availHeight` vào file `.ini` của engine. Tuy nhiên, nó tìm key name `availWidth`/`availHeight` trong object `bounds`, trong khi API setup trả về `bounds.width`/`bounds.height`. Kết quả: luôn ghi `BAS_NOT_SET`.

```ts
// Code hiện tại (sai):
for (const key of ['availWidth', 'availHeight'] as const) {
  const value = reset ? 'BAS_NOT_SET' : (bounds[key] ?? 'BAS_NOT_SET');
  // bounds.availWidth → undefined → 'BAS_NOT_SET'
}
```

## Câu hỏi làm rõ

- Có nơi nào khác dùng `synchronize()` với `bounds` khác cấu trúc không? → Không, `synchronize()` chỉ được gọi từ `_launch()` trong `index.ts` với `bounds` từ `SetupResponse`.
- Có cần đổi tên property trong `SetupResponse` không? → Không, vì `bounds.width/height` là từ API bablosoft.

## Các phương án

### Phương án 1: Map key trong synchronize
Thêm mapping từ tên key `.ini` sang tên property `bounds`:

```ts
const keyMap = { availWidth: 'width', availHeight: 'height' } as const;
for (const key of ['availWidth', 'availHeight'] as const) {
  const value = reset ? 'BAS_NOT_SET' : (bounds[keyMap[key]] ?? 'BAS_NOT_SET');
}
```

- **Ưu điểm:** Can thiệp tối thiểu, rõ ràng.
- **Nhược điểm:** Không có.

### Phương án 2: Đổi loop key
Dùng cặp `[iniKey, boundsKey]` trong loop:

```ts
for (const [iniKey, boundsKey] of [['availWidth', 'width'], ['availHeight', 'height']] as const) {
  const value = reset ? 'BAS_NOT_SET' : (bounds[boundsKey] ?? 'BAS_NOT_SET');
}
```

- **Ưu điểm:** Trực quan, không cần object map riêng.
- **Nhược điểm:** Tương đương phương án 1.

## Giải pháp được chọn

### Phương án AI đề xuất: Phương án 2
Dùng cặp `[iniKey, boundsKey]` — code dễ đọc hơn.
