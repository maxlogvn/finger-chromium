# Spec: Quản lý Profile

## Mô tả

Quản lý profile bằng AdapterDataManager -- copy vào temp, restore khi quit.

## API

| Method | Mô tả |
|---|---|
| `map(inputDir, targetDir?)` | Copy profile |
| `unmap(tempDirPath)` | Xoá temp |
| `dispose()` | Dọn toàn bộ |

## Temp dir naming

`${timestamp}_${random4hex}` -- unique mỗi lần khởi tạo.

---

Xem thêm: [Design](../designs/profile-management.design.md) | [Plan](../plans/profile-management.plan.md)
