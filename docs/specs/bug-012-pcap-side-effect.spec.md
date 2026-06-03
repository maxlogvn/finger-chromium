# Spec: Bug #12 — PCAP server side effect ở module scope

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Chuyển `pcapServer.listen()` từ module scope (top-level code) vào bên trong `api()`,
dùng lazy init pattern. Chỉ cần import file connector là đủ để kích hoạt TCP server —
side effect nguy hiểm, cần loại bỏ.

## Yêu cầu

- `pcapServer.listen()` không được gọi ở module scope.
- Lần gọi `api()` đầu tiên phải tự động kích hoạt PCAP server và `await` cho đến khi server sẵn sàng.
- Các lần gọi `api()` sau không được khởi động lại PCAP server.
- `cleanup()` vẫn phải dừng được PCAP server qua `pcapServer.close()`.
- Không thay đổi API public (`api()`, `cleanup()`, `engine`).

## Thiết kế

Tham chiếu: `docs/designs/bug-012-pcap-side-effect.design.md` — Phương án 1 (Lazy init trong `api()`).

## API / Data flow

**Luồng hiện tại (module scope):**

```ts
// connector/index.ts — lúc import:
pcapServer.listen().then((port) => {
  engine.setArgs([`--mock-pcap-port=${port}`]);
});

// api() — không biết gì về PCAP:
export const api = async (name, params) => { ... };
```

**Luồng mới (lazy init):**

```ts
// connector/index.ts — không có side effect lúc import
let initPromise: Promise<void> | undefined;

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = pcapServer.listen().then((port) => {
      engine.setArgs([`--mock-pcap-port=${port}`]);
    });
  }
  return initPromise;
}

// api() — await init trước:
export const api = async (name, params) => {
  await ensureInit();
  // ... phần còn lại giữ nguyên
};
```

## Components

- `src/plugin/connector/index.ts` (sửa) — xoá module-scope `pcapServer.listen()`, thêm lazy init.

Các file khác không cần sửa.

## Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| PCAP server listen fail (port ko mở được) | Promise reject — `api()` throw lỗi. Cần `try/catch` trong `api()` (lỗi này có từ trước, không thay đổi). |
| `cleanup()` gọi trước khi `api()` lần đầu | `pcapServer.close()` kiểm tra `server` undefined — an toàn. |

## Kiểm tra

- **Happy path:** Import connector => chưa mở port. Gọi `api()` lần đầu => PCAP server start, engine set args. Gọi `api()` lần 2 => không start lại.
- **Edge case:** Import connector rồi gọi `cleanup()` luôn — không crash vì PCAP chưa start.
- **Error case:** Không áp dụng (không thay đổi logic xử lý lỗi hiện tại).
