// ─── File: errors.ts ─────────────────────────────────────────────────────
// Định nghĩa các error class dùng trong toàn bộ plugin.
//
//   1. PluginError – base class cho mọi lỗi
//   2. MissingKeyError – thiếu key bảo mật
//   3. InvalidEngineError – engine chưa được tải/giải nén
//   4. EngineTimeoutError – timeout khi tải engine
//   5. RequestTimeoutError – timeout khi request
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import dedent from 'dedent';

// ─── Error Classes ───────────────────────────────────────────────────────────

export class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }
}

export class MissingKeyError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Do các cập nhật mới nhất, bạn cần chỉ định key không chỉ khi nhận fingerprint, 
      mà cả khi áp dụng nó vào browser.
    `);
  }
}

export class InvalidEngineError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Nguyên nhân có thể do engine chưa được tải xuống hoặc giải nén đúng cách.
      Hướng khắc phục:
       1. Xóa hoàn toàn thư mục engine hiện tại
       2. Chạy lại code để hệ thống tự tải engine mới
       3. Nếu vẫn lỗi, hãy mở issue kèm mô tả chi tiết vấn đề
    `);
  }
}

export class EngineTimeoutError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Bạn có thể điều chỉnh timeout bằng method "setEngineTimeout" - 
      phương thức này thiết lập giới hạn thời gian cho việc tải file engine.
    `);
  }
}

export class RequestTimeoutError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Bạn có thể điều chỉnh timeout bằng method "setRequestTimeout" - 
      phương thức này thiết lập giới hạn thời gian cho việc thực thi request của engine.
    `);
  }
}