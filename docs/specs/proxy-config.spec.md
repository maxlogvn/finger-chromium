# Spec: Cấu hình Proxy

## File: `src/types/proxy.ts` (210 dòng)

### Interface `ProxyOptions`

```ts
interface ProxyOptions {
  // --- Đồng bộ thông tin ---
  changeBrowserLanguage?: boolean;                    // default: true
  changeGeolocation?: boolean;                        // default: false
  changeTimezone?: boolean;                           // default: true

  // --- WebRTC ---
  changeWebRTC?: 'enable' | 'disable' | 'replace';   // default: 'replace'
  publicIPv4?: IPString | 'disable' | 'auto';         // default: 'auto'
  publicIPv6?: IPString | 'disable' | 'auto';         // default: 'auto'
  privateIPv4?: IPString | 'disable' | 'local'
    | 'private class a' | 'private class b' | 'private class c';  // default: 'local'
  privateIPv6?: IPString | 'disable' | 'local'
    | 'unique local address';                                        // default: 'local'

  // --- IP Detection ---
  ipExtractionMethod?: 'raw' | 'xpath' | 'regexp' | 'jsonpath' | { v4: ...; v6: ... };
  ipExtractionParam?: string | { v4: string; v6: string };
  ipExtractionURL?: string | { v4: string; v6: string };
  detectExternalIP?: boolean | { v4: boolean; v6: boolean };        // default: true

  // --- IP Info ---
  ipInfoMethod?: 'database' | 'ip-api.com';           // default: 'database'
  ipInfoKey?: string;                                  // default: ''

  // --- Tunneling ---
  enableTunneling?: boolean;                          // default: true
  enableQUIC?: boolean;                               // default: false

  // --- DNS ---
  dnsMode?: 'system-proxy' | 'custom-proxy' | 'custom-direct';  // default: 'system-proxy'
  dnsIP?: string;                                     // default: '1.1.1.1'
}
```

### Các types hỗ trợ

```ts
type IPExtractionMethod = 'raw' | 'xpath' | 'regexp' | 'jsonpath';
type PrivateIPReplacement = IPString | 'disable' | 'local';
type PublicIPReplacement = IPString | 'disable' | 'auto';
type IPString = string & {};  // Branded type
```

### IPv4/IPv6 Dual Stack

Nhiều option hỗ trợ object `{ v4, v6 }`:

```ts
detectExternalIP: { v4: true, v6: false }
ipExtractionMethod: { v4: 'jsonpath', v6: 'raw' }
ipExtractionURL: { v4: 'https://api-v4.example.com/ip', v6: 'https://api-v6.example.com/ip' }
```

### Validation

- `validateConfig('proxy', value, options)` kiểm tra value là string (URL), options là object.
- `setProxyFromArguments(args)` parse `--proxy-server=<url>` từ mảng args nếu proxy chưa set.

### Integration

```ts
// Trong _launch():
const setupParams = {
  key: serviceKey,
  proxy: this.proxy,    // { value: proxyUrl, options: ProxyOptions }
  // ...
};
await api('setup', setupParams);
```

---

## Kiểm tra

- Proxy URL không hợp lệ -> engine binary reject khi setup.
- `setProxyFromArguments()` chỉ set nếu proxy chưa được config.
- `changeGeolocation` default false -> không gây popup permission.

---
