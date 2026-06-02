# Spec: Hệ thống kiểu

## Mô tả

TypeScript type definitions cho toàn bộ project.

## File structure

| File | Export chính |
|---|---|
| `PWChromium.ts` | `PWChromium` interface |
| `fingerprint.ts` | `FingerprintOptions` |
| `proxy.ts` | `ProxyOptions` |
| `profile.ts` | `ProfileOptions` |
| `fetch.ts` | `FetchOptions`, `Tag`, `Time` |
| `plugin-options.ts` | `PluginOptions` |
| `config.ts` | `EngineConfig` |

## Strict mode

Toàn bộ codebase dùng TypeScript strict mode.
Không dùng `any` (ngoại trừ 16 pre-existing warnings).

---

Xem thêm: [Design](../designs/type-system.design.md) | [Plan](../plans/type-system.plan.md)
