// ─── File: plugin/errors.ts ────────────────────────────────────────────────
// Hệ thống lỗi plugin -- PluginError base class + các lỗi cụ thể.
// Tất cả lỗi đều kế thừa PluginError, không dùng Error thô.
// ─────────────────────────────────────────────────────────────────────────────

import dedent from 'dedent';

/**
 * Base class cho mọi lỗi engine. Không dùng Error thô.
 * Tự động set name = constructor name và capture stack trace.
 */
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

/**
 * Thiếu key bảo mật -- cần set key qua setServiceKey().
 */
export class MissingKeyError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Do các cập nhật mới nhất, bạn cần chỉ định key không chỉ khi nhận fingerprint, 
      mà cả khi áp dụng nó vào browser.
    `);
  }
}

/**
 * Engine chưa được tải hoặc giải nén đúng cách.
 */
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

/**
 * Timeout khi khởi động engine -- có thể điều chỉnh bằng setEngineTimeout().
 */
export class EngineTimeoutError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Bạn có thể điều chỉnh timeout bằng method "setEngineTimeout" - 
      phương thức này thiết lập giới hạn thời gian cho việc tải file engine.
    `);
  }
}

/**
 * Timeout khi request -- có thể điều chỉnh bằng setRequestTimeout().
 */
export class RequestTimeoutError extends PluginError {
  constructor(message: string) {
    super(dedent`
      ${message}
      Bạn có thể điều chỉnh timeout bằng method "setRequestTimeout" - 
      phương thức này thiết lập giới hạn thời gian cho việc thực thi request của engine.
    `);
  }
}
