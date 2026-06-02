# Plan: Hệ thống Kiểu (Type System)

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa PWChromium interface** (file: `src/types/PWChromium.ts`, dòng 38-164)

    **Signature:**
    ```ts
    export interface PWChromium {
      readonly engine: object;
      repackChromium(launcher: object): this;
      useFingerprint(data: string, options?: object): this;
      useProxy(data: string, options?: object): this;
      useProfile(dirPath: string, options?: object): this;
      newFingerprint(options: FetchOptions): Promise<string | undefined>;
      launch(options?: object): this;
      newContext(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>;
      quit(saveDataPath?: string): Promise<void>;
    }
    ```

    **Tại sao:** Interface (không type alias) — declaration merging cho phép user mở rộng. Method chain (return this) — Fluent API. `Promise<void>` — async.

- [x] **Bước 2: Định nghĩa FingerprintOptions** (file: `src/types/fingerprint.ts`, dòng 18-91)

    **9 fields:**
    | Field | Type | Default | Ghi chú |
    |---|---|---|---|
    | `emulateDeviceScaleFactor` | `boolean` | `true` | HiDPI |
    | `emulateSensorAPI` | `boolean` | `true` | Sensor |
    | `usePerfectCanvas` | `boolean` | `true` | PerfectCanvas |
    | `useFontPack` | `boolean` | `true` | FontPack |
    | `safeElementSize` | `boolean` | `false` | Element size |
    | `safeBattery` | `boolean` | `true` | Battery |
    | `safeCanvas` | `boolean` | `true` | Canvas |
    | `safeAudio` | `boolean` | `true` | Audio |
    | `safeWebGL` | `boolean` | `true` | WebGL |

    **Tại sao:** `safeElementSize` default false — ảnh hưởng layout. Còn lại true — fingerprint check kiểm tra nhiều API.

- [x] **Bước 3: Định nghĩa ProxyOptions** (file: `src/types/proxy.ts`, dòng 14-210)

    **18 fields, full list ở proxy-config plan.**

    **Branded type:**
    ```ts
    type IPString = string & {};  // zero-cost type safety — intersection với {}
    ```

    **IP types:**
    ```ts
    type IPExtractionMethod = 'raw' | 'xpath' | 'regexp' | 'jsonpath';
    type PrivateIPReplacement = IPString | 'disable' | 'local';
    type PublicIPReplacement = IPString | 'disable' | 'auto';
    ```

    **Object notation:**
    ```ts
    ipExtractionMethod?: IPExtractionMethod | { v4: IPExtractionMethod; v6: IPExtractionMethod };
    ```

    **Tại sao branded type `IPString = string & {}`:**
    - Không runtime overhead — compile-time check.
    - `{}` = non-nullish object — intersection `string & {}` = string.
    - No phantom property — khác `type IPString = string & { __brand: never }`.
    - TypeScript không cho gán raw string vào IPString — ép user cast.

    **Tại sao object notation:**
    - `{ v4: ..., v6: ... }` cho IPv4/IPv6 riêng biệt.
    - Union `IPExtractionMethod | { v4, v6 }` — backward compatible.

- [x] **Bước 4: Định nghĩa ProfileOptions** (file: `src/types/profile.ts`, dòng 16-30)

    **Signature:**
    ```ts
    export interface ProfileOptions {
      loadProxy?: boolean;       // @default true
      loadFingerprint?: boolean; // @default true
    }
    ```

- [x] **Bước 5: Định nghĩa FetchOptions và liên quan** (file: `src/types/fetch.ts`, dòng 1-42)

    **Signatures:**
    ```ts
    export interface FetchOptions {
      tags?: string[];
      time?: Time;
    }

    export interface Time {
      start?: string;  // ISO 8601 — vd: '2026-01-01'
      end?: string;    // ISO 8601
    }

    export interface Tag {
      name: string;
      description?: string;
    }
    ```

    **Tại sao:** `Time` interface riêng — có thể mở rộng (timezone, format). `tags` array string — filter fingerprint bộ sưu tập.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup bundle (type-check + dts)
```

## Ghi chú

- 5 TypeScript files, 5 interfaces, 3 type aliases.
- `PWChromium` là interface (không type) — declaration merging.
- `IPString` là branded type — zero runtime cost.
- Object notation cho ipExtractionMethod, ipExtractionParam, ipExtractionURL, detectExternalIP.
