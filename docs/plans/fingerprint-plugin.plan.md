# Plan: FingerprintPlugin

- [x] Bước 1: Tạo class FingerprintPlugin với properties (launcher, version, fingerprint, profile, proxy)
- [x] Bước 2: Implement fluent config methods (useFingerprint, useProfile, useProxy, etc.)
- [x] Bước 3: Implement validateConfig + validateLauncher (utils.ts)
- [x] Bước 4: Implement fetch() + versions() -- api wrapper
- [x] Bước 5: Implement _launch() core lifecycle
- [x] Bước 6: Tích hợp cleaner + mutex trong _launch()
- [x] Bước 7: Tích hợp configure() cho viewport resize + .ini sync
