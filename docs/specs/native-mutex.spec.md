# Spec: Native Mutex

## Mô tả

Windows named mutex qua native C++ addon.

## API

| Method | Mô tả |
|---|---|
| `create(name)` | Tạo named mutex, return handle |
| `close(name)` | Đóng handle |

## Naming convention

`Global\{uuid}` — unique mỗi instance.

## Build

Prebuilt binary cho win32 ia32 + x64.
Source: `src/plugin/mutex/mutex.cpp`

---

Xem thêm: [Design](../designs/native-mutex.design.md) | [Plan](../plans/native-mutex.plan.md)
