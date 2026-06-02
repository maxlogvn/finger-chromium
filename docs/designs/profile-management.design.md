# Design: Quản lý Profile

## Vấn đề

Browser profile (cookie, localStorage, IndexedDB) cần được bảo vệ khỏi corrupt khi browser crash. Cần copy profile vào thư mục tạm khi dùng, restore khi quit.

## Giải pháp: AdapterDataManager

### Temp dir mechanism

```
useProfile('./profiles/user_01')
  → dataManager.map('./profiles/user_01')
    → copy to <BROWSER_RUNNING_DIR>/profile/<timestamp>_<random4hex>/
    → return temp path

quit()
  → dataManager.map(tempPath, './profiles/user_01')
    → copy temp → original
  → dataManager.unmap(tempPath)
    → rm -rf temp
```

### generateUniqueName()

```ts
private generateUniqueName(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 0x10000).toString(16)}`;
}
```

Dùng `Math.random()` thay `crypto.randomBytes` -- không cần bảo mật cao, performance tốt hơn.

### File operations

- `fs.cpSync(src, dest, { recursive: true, force: true })` -- copy deep
- `fs.rmSync(path, { recursive: true, force: true })` -- delete
- `fs.mkdirSync(path, { recursive: true })` -- tạo dir

Tất cả dùng sync API vì profile management chỉ xảy ra ở lifecycle boundaries (launch, quit), không ảnh hưởng runtime.

### Cache

Khi `useProfile` được gọi cùng source path nhiều lần, mỗi lần là một temp dir mới. Temp dir cũ không tự động xoá -- dựa vào `CleanupDaemon` (cleaner.ts) để dọn.

---

Xem thêm: [Spec](../specs/profile-management.spec.md) | [Plan](../plans/profile-management.plan.md)
