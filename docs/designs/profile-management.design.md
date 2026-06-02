# Design: Quản lý Profile

## Vấn đề

Browser profile (cookie, localStorage, IndexedDB, extension data) cần được bảo vệ khỏi corrupt khi browser crash. Nếu browser chạy trực tiếp trên thư mục profile gốc, crash sẽ làm hỏng dữ liệu.

## Giải pháp: AdapterDataManager

Copy profile vào thư mục tạm trước khi dùng, restore về thư mục gốc khi quit. Nếu browser crash, chỉ mất dữ liệu thay đổi trong session đó, profile gốc vẫn an toàn.

### Luồng xử lý

```
useProfile('./profiles/user_01')
  → dataManager.map('./profiles/user_01')
    → fs.cpSync copy vào temp
    → <BROWSER_RUNNING_DIR>/profile/<timestamp>_<random4hex>/
    → return temp path

quit()
  → dataManager.map(tempPath, './profiles/user_01')
    → fs.cpSync copy ngược lại
  → dataManager.unmap(tempPath)
    → fs.rmSync xoá temp
```

### Temp dir naming

```ts
private generateUniqueName(): string {
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${Date.now()}_${hex}`;
}
```

Dùng `Math.random()` thay `crypto.randomBytes` -- không cần bảo mật cao, timestamp + 4 hex digits là đủ uniqueness.

### File operations (Node.js 16+)

- `fs.cpSync(src, dest, { recursive: true, force: true })` -- copy thư mục, ghi đè nếu tồn tại.
- `fs.rmSync(path, { recursive: true, force: true })` -- xoá thư mục, không throw nếu không tồn tại.
- `fs.mkdirSync(path, { recursive: true })` -- tạo thư mục cha nếu chưa có.

Đồng bộ API (sync) -- profile operations chỉ xảy ra ở lifecycle boundaries (launch, quit), không ảnh hưởng runtime.

### map() 2 overloads

```ts
map(sourceDir: string): string;       // source → instance temp dir
map(tempDir: string, dest: string): string;  // temp → destination
```

### Instance isolation

Mỗi instance `AdapterDataManager` có một `instanceTempDir` riêng. Khi `dispose()`, chỉ xoá temp dir của instance đó.

---

Xem thêm: [Spec](../specs/profile-management.spec.md) | [Plan](../plans/profile-management.plan.md)
