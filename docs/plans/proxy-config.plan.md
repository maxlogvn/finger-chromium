# Plan: Cấu hình Proxy

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa ProxyOptions + type helpers** (file: `src/types/proxy.ts`, dòng 14-210)

    **Signatures:**
    ```ts
    type IPString = string & {};  // branded type
    type IPExtractionMethod = 'raw' | 'xpath' | 'regexp' | 'jsonpath';
    type PrivateIPReplacement = IPString | 'disable' | 'local';
    type PublicIPReplacement = IPString | 'disable' | 'auto';
    ```

    **ProxyOptions fields (18 fields):**
    | Field | Type | Default | Ghi chú |
    |---|---|---|---|
    | `changeBrowserLanguage` | `boolean` | `true` | Accept-Language header |
    | `changeGeolocation` | `boolean` | `false` | Navigator.geolocation |
    | `changeTimezone` | `boolean` | `true` | Intl.DateTimeFormat |
    | `changeWebRTC` | `'enable'\|'disable'\|'replace'` | `'replace'` | WebRTC IP handling |
    | `publicIPv4` | `PublicIPReplacement` | `'auto'` | Public IPv4 qua WebRTC |
    | `publicIPv6` | `PublicIPReplacement` | `'auto'` | Public IPv6 |
    | `privateIPv4` | `PrivateIPReplacement \| 'private class a'\|'b'\|'c'` | `'local'` | Private IPv4 |
    | `privateIPv6` | `PrivateIPReplacement \| 'unique local address'` | `'local'` | Private IPv6 |
    | `ipExtractionMethod` | `IPExtractionMethod \| { v4, v6 }` | `'raw'` | Extraction method |
    | `ipExtractionParam` | `string \| { v4, v6 }` | `''` | Extraction parameter |
    | `ipExtractionURL` | `string \| { v4, v6 }` | `''` | Extraction URL |
    | `detectExternalIP` | `boolean \| { v4, v6 }` | `true` | Auto external IP |
    | `ipInfoMethod` | `'database' \| 'ip-api.com'` | `'database'` | Geo lookup method |
    | `ipInfoKey` | `string` | `''` | ip-api.com API key |
    | `enableTunneling` | `boolean` | `true` | Tunneling system |
    | `enableQUIC` | `boolean` | `false` | QUIC over UDP |
    | `dnsMode` | `'system-proxy'\|'custom-proxy'\|'custom-direct'` | `'system-proxy'` | DNS resolution mode |
    | `dnsIP` | `string` | `'1.1.1.1'` | Custom DNS IP |

    **Object notation cho complex fields:**
    ```ts
    ipExtractionMethod?: IPExtractionMethod | { v4: IPExtractionMethod; v6: IPExtractionMethod };
    ipExtractionParam?: string | { v4: string; v6: string };
    ipExtractionURL?: string | { v4: string; v6: string };
    detectExternalIP?: boolean | { v4: boolean; v6: boolean };
    ```

    **DNS modes:**
    - `system-proxy`: DNS hệ thống → hostname gửi đến proxy.
    - `custom-proxy`: DNS tùy chỉnh → query qua proxy (UDP hỗ trợ).
    - `custom-direct`: DNS tùy chỉnh → query local → traffic còn lại qua proxy.

    **Tại sao:** Branded type `IPString = string & {}` zero-cost type safety. Object notation cho phép IPv4/v6 config riêng. DNS modes cho user linh hoạt routing.

- [x] **Bước 2: Implement useProxy() trong plugin** (file: `src/plugin/index.ts`, dòng 125-129)

    **Signature:** `useProxy(value = '', options: ProxyOptions = {}): this`

    **Logic:**
    1. `validateConfig('proxy', value, options)` — value là URL proxy string.
    2. Lưu `this.proxy = { value, options }`.

    **Edge cases:**
    - `value = 'http://user:pass@host:8080'` → valid.
    - `value = 'socks5://host:1080'` → SOCKS5.
    - `value = ''` → throw.

- [x] **Bước 3: Implement setProxyFromArguments() fallback** (file: `src/plugin/index.ts`, dòng 147-152)

    **Signature:** `setProxyFromArguments(args: string[] = []): this`

    **Logic:**
    ```ts
    if (this.proxy == null) {  // chưa gọi useProxy
      for (const arg of args) if (arg.includes('--proxy-server')) return this.useProxy(arg.slice(15));
    }
    return this;
    ```

    **Edge cases:**
    - `args = ['--proxy-server=http://host:8080']` → `arg.slice(15)` = `http://host:8080`.
    - `args = ['--proxy-server', 'http://host:8080']` (2 args) → arg.includes('--proxy-server') match dòng 1 nhưng không có URL → useProxy('') → validate fail.
    - `this.proxy` đã set → skip fallback.

- [x] **Bước 4: Gửi proxy lên engine qua api('setup')** (file: `src/plugin/index.ts`, dòng 239-249)

    **Payload:** `api('setup', { proxy: this.proxy, ... })` — engine native xử lý tunneling, WebRTC, DNS.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- Proxy xử lý hoàn toàn ở engine native — plugin chỉ gửi config.
- `setProxyFromArguments()` fallback từ Playwright proxy option.
- DNS modes: system-proxy (default), custom-proxy (UDP required), custom-direct.
- `enableTunneling` false = proxy không hoạt động (dùng VPN).
- `enableQUIC` = QUIC over UDP — proxy cần hỗ trợ.
