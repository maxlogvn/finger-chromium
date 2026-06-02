# Plan: Hệ thống Lỗi (Error Hierarchy)

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa PluginError base class** (file: `src/plugin/errors.ts`, dòng 10-36)

    **Signature:**
    ```ts
    export class PluginError extends Error {
      [Symbol.toStringTag]: string;
      constructor(message?: string);
    }
    ```

    **Logic chi tiết:**
    ```ts
    constructor(message?: string) {
      super(message || 'PluginError');
      this.name = this.constructor.name;
      this[Symbol.toStringTag] = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);  // V8 stack trace — bỏ constructor khỏi trace
    }
    ```

    **Tại sao các chi tiết:**
    - `Error.captureStackTrace(this, this.constructor)` — target `this` (instance), limit stack trace bỏ qua constructor function, bỏ qua `PluginError` ở top.
    - `Symbol.toStringTag` — `Object.prototype.toString.call(new PluginError())` → `[object PluginError]` thay `[object Error]`.
    - `this.name = this.constructor.name` — subclass kế thừa không cần override.

- [x] **Bước 2: Định nghĩa các Error subclass** (file: `src/plugin/errors.ts`, dòng 38-94)

    **Signatures:**
    ```ts
    export class MissingKeyError extends PluginError {
      constructor(message?: string);
    }

    export class InvalidEngineError extends PluginError {
      constructor(message?: string);
    }

    export class EngineTimeoutError extends PluginError {
      constructor(message?: string);
    }

    export class RequestTimeoutError extends PluginError {
      constructor(message?: string);
    }
    ```

    **Chi tiết constructor mỗi class:**
    ```ts
    constructor(message: string = DEFAULT_MESSAGES.SomeError) {
      super(message);  // PluginError tự set name, toStringTag
    }
    ```

    **Message constants (dòng 6-8):**
    ```ts
    export const DEFAULT_ERROR_MESSAGES = {
      MissingKeyError: 'Private key not specified. Please provide your private key from the bablosoft.com website in the account section.',
      InvalidEngineError: 'Engine does not exist. Must specify or upload the engine.',
      EngineTimeoutError: 'Engine runtime error. Recovery is not possible.',
      RequestTimeoutError: 'Request timeout.',
    } as const;
    ```

    **Tại sao:** `as const` literal type — TypeScript infer string literal, không mutate. Messages mặc định giải thích rõ (đường dẫn lấy key, hướng dẫn upload engine).

- [x] **Bước 3: Update index.ts export** (file: `src/index.ts`)

    **Signature:**
    ```ts
    export {
      PluginError,
      MissingKeyError,
      InvalidEngineError,
      EngineTimeoutError,
      RequestTimeoutError,
    } from './plugin/errors';
    ```

**Edge cases (dùng sai error class):**
- Throw `PluginError` với message tuỳ chỉnh → vẫn PluginError instance.
- Catch `PluginError` bắt tất cả error subclass.
- Catch `MissingKeyError` chỉ bắt MissingKeyError.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- 5 class: 1 base + 4 sub.
- `Error.captureStackTrace` chỉ V8 (Node.js, Chrome) — không fallback.
- `DEFAULT_ERROR_MESSAGES` cho message đa ngữ trong tương lai.
- `instanceof` check hoạt động đúng cho subclass.
