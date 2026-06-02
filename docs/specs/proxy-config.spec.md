# Spec: Cấu hình Proxy

## Options chi tiết

```ts
interface ProxyOptions {
  changeBrowserLanguage?: boolean;                    // default: true
  changeGeolocation?: boolean;                        // default: false
  changeTimezone?: boolean;                           // default: true
  changeWebRTC?: 'enable' | 'disable' | 'replace';   // default: 'replace'

  publicIPv4?: IPString | 'disable' | 'auto';         // default: 'auto'
  publicIPv6?: IPString | 'disable' | 'auto';         // default: 'auto'
  privateIPv4?: IPString | 'disable' | 'local';       // default: 'local'
  privateIPv6?: IPString | 'disable' | 'local';       // default: 'local'

  ipExtractionMethod?: 'raw' | 'xpath' | 'regexp' | 'jsonpath' | { v4, v6 };
  ipExtractionParam?: string | { v4, v6 };
  ipExtractionURL?: string | { v4, v6 };

  detectExternalIP?: boolean | { v4, v6 };            // default: true
  ipInfoMethod?: 'database' | 'ip-api.com';           // default: 'database'
  ipInfoKey?: string;                                  // default: ''

  enableTunneling?: boolean;                          // default: true
  enableQUIC?: boolean;                               // default: false
  dnsMode?: 'system-proxy' | 'custom-proxy' | 'custom-direct';  // default: 'system-proxy'
  dnsIP?: string;                                     // default: '1.1.1.1'
}
```

## IPv4/IPv6 dual stack

Nhiều option hỗ trợ cấu hình riêng cho IPv4 và IPv6 qua object `{ v4, v6 }`. Ví dụ:
```ts
detectExternalIP: { v4: true, v6: false }
ipExtractionMethod: { v4: 'jsonpath', v6: 'raw' }
```

## Validation

- `validateConfig('proxy', value, options)` kiểm tra value là string (URL), options là object
- `setProxyFromArguments(args)` parse `--proxy-server=<url>` từ mảng args nếu proxy chưa set
