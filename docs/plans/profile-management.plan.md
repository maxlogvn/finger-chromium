# Plan: Quản lý Profile

- [x] Bước 1: Tạo AdapterDataManager class với tempRootDir và instanceTempDir
  - `tempRootDir`: `<BROWSER_RUNNING_DIR>/profile` (mặc định)
  - `instanceTempDir`: `<tempRootDir>/<timestamp>_<random4hex>`

- [x] Bước 2: Implement generateUniqueName() -- `${Date.now()}_${Math.random().toString(16).slice(2,6)}`
  - Dùng Math.random() thay crypto -- performance > security
  - 4 hex digits (65,536 giá trị) + timestamp (ms) → collision cực thấp

- [x] Bước 3: Dùng fs.cpSync/rmSync/mkdirSync cho copy/delete operations
  - `fs.cpSync(src, dest, { recursive: true, force: true })`: deep copy, ghi đè
  - `fs.rmSync(path, { recursive: true, force: true })`: xoá thư mục
  - `fs.mkdirSync(path, { recursive: true })`: tạo thư mục

- [x] Bước 4: Integrate vào BrowserEngine.useProfile() + quit()
  - `useProfile()`: gọi `dataManager.map(source)` → copy vào temp, lưu temp path
  - `quit()`: gọi `dataManager.map(temp, destination)` → copy về, `dataManager.unmap()` → xoá temp

## Edge cases

- Temp dir đã tồn tại (collision) → `cpSync` với `force: true` sẽ ghi đè, không crash
- Source profile không tồn tại → `cpSync` throw ENOENT, không bắt ở data.ts (để caller xử lý)
- Quit() khi chưa useProfile → không có saveProfileDirPath, chỉ unmap BROWSER_RUNNING_DIR
- Temp dir bị xoá tay trước khi quit → unmap() warn nhưng không throw
