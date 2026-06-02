# Spec: API Connector

## Mô tả

Wrapper đồng bộ cho RemoteEngine. Singleton instance với async-lock.

## API

```ts
export const api = async (name: string, params?: ApiParams): Promise<unknown>
export { engine }
```

## Error handling

- `error.includes('key is missing')` → `MissingKeyError`
- Còn lại → `PluginError`

## Locking

- key: `'client'`
- Đảm bảo chỉ một request tại một thời điểm

---

Xem thêm: [Design](../designs/api-connector.design.md) | [Plan](../plans/api-connector.plan.md)
