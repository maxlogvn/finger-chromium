# Plan: Hệ thống lỗi

- [x] Bước 1: Tạo `PluginError` base class (captureStackTrace, toStringTag)
- [x] Bước 2: Tạo 4 subclass (MissingKey, InvalidEngine, EngineTimeout, RequestTimeout)
- [x] Bước 3: Tích hợp error normalization vào connector/index.ts (key missing check)
- [x] Bước 4: Tích hợp timeout error vào engine.ts (Promise.race + setTimeout)
