# Plan: Fingerprint Config

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa FingerprintOptions** (file: `src/types/fingerprint.ts`, dòng 18-91)

    **Signature:**
    ```ts
    export interface FingerprintOptions {
      emulateDeviceScaleFactor?: boolean; // @default true — HiDPI/Retina
      emulateSensorAPI?: boolean;          // @default true — Sensor API
      usePerfectCanvas?: boolean;          // @default true — PerfectCanvas
      useFontPack?: boolean;               // @default true — FontPack
      safeElementSize?: boolean;           // @default false — che giấu element size
      safeBattery?: boolean;               // @default true — Battery API noise
      safeCanvas?: boolean;                // @default true — Canvas noise
      safeAudio?: boolean;                 // @default true — Audio noise
      safeWebGL?: boolean;                 // @default true — WebGL noise
    }
    ```

    **Chi tiết từng field:**
    - `emulateDeviceScaleFactor`: Giả lập màn hình HiDPI (devicePixelRatio). Tốn tài nguyên hơn.
    - `emulateSensorAPI`: Giả lập cảm biến (gia tốc kế, con quay). Bật khi fingerprint mobile.
    - `usePerfectCanvas`: Thay thế canvas data chính xác theo fingerprint. Yêu cầu fingerprint data chứa PerfectCanvas data.
    - `useFontPack`: Đồng bộ font với fingerprint. Cần cài FontPack riêng.
    - `safeElementSize`: Che giấu toạ độ DOM element. Mặc định false vì ảnh hưởng layout.
    - `safeBattery`: Nhiễu Battery API. Nếu thiết bị không có battery, trả về 100%.
    - `safeCanvas`: Nhiễu Canvas 2D.
    - `safeAudio`: Nhiễu Web Audio API (sample rate, channels).
    - `safeWebGL`: Nhiễu WebGL (GPU vendor, renderer).

    **Tại sao:** `safeElementSize` mặc định false vì chặn ClientRects ảnh hưởng layout web app. Các field còn lại true vì fingerprint check kiểm tra đồng thời nhiều kỹ thuật.

- [x] **Bước 2: Implement useFingerprint() trong plugin** (file: `src/plugin/index.ts`, dòng 101-105, và `src/plugin/utils.ts`)

    **Signature:**
    ```ts
    useFingerprint(value = '', options: FingerprintOptions = {}): this
    ```

    **Logic chi tiết:**
    1. Gọi `validateConfig('fingerprint', value, options)` — kiểm tra value là string length > 0, options là object.
    2. Lưu `this.fingerprint = { value, options }` — `PluginConfig` type.
    3. Trong `BrowserEngine`: lưu `this.fingerprints = [data, options]` (tuple).
    4. Trong `launch()`: relay `this.engine.useFingerprint(...this.fingerprints)` — spread tuple.

    **validateConfig (utils.ts):**
    ```ts
    function validateConfig(type: string, value: string, options: object): void {
      if (typeof value !== 'string' || value.length === 0) throw new Error(`${type} data must be a non-empty string`);
      if (options !== undefined && (typeof options !== 'object' || options === null)) throw new Error(`${type} options must be an object`);
    }
    ```

    **Edge cases:**
    - `value = ''` → throw (string rỗng).
    - `value = undefined` → default `''` → throw.
    - `options = null` → `typeof null === 'object'` → `options === null` catch → throw.
    - `options = undefined` → skip validation (dùng default options rỗng).

    **Flow data:**
    ```
    BrowserEngine.useFingerprint(data, opts) → this.fingerprints = [data, opts]
      → launch() → engine.useFingerprint(data, opts) → FingerprintPlugin.useFingerprint()
      → validateConfig() → this.fingerprint = { value: data, options: opts }
      → _launch() → api('setup', { fingerprint: this.fingerprint }) → engine native
    ```

    **Tại sao:** Validate fail sớm — bug phát hiện ngay config, không đợi launch. Tuple + spread cho phép relay signature giữa các layer.

- [x] **Bước 3: Gửi fingerprint lên engine qua api('setup')** (file: `src/plugin/index.ts`, dòng 239-249)

    **Payload:**
    ```ts
    api('setup', {
      fingerprint: this.fingerprint,  // { value: 'json_string', options: {...} }
      ...
    });
    ```

    **Engine native xử lý:**
    - `usePerfectCanvas`: inject canvas data thật từ fingerprint.
    - `safeWebGL`: override WebGLRenderingContext với GPU fingerprint.
    - `safeAudio`: override AudioContext methods.
    - `safeCanvas`: add noise to Canvas2D.
    - `safeBattery`: override Navigator.getBattery().
    - `emulateSensorAPI`: override Sensor constructor.
    - `emulateDeviceScaleFactor`: set devicePixelRatio.
    - `useFontPack`: inject font list matching fingerprint.
    - `safeElementSize`: override Element.getClientRects()/getBoundingClientRect().

    **Tại sao:** Engine native inject ở tầng C/C++ — không bị phát hiện bởi JavaScript runtime check.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- Mặc định bật tất cả trừ `safeElementSize`.
- `usePerfectCanvas` yêu cầu fingerprint data chứa dữ liệu PerfectCanvas.
- `useFontPack` cần cài FontPack riêng (wiki bablosoft).
- Fingerprint data gửi qua `api('setup')` — không có API update sau launch.
