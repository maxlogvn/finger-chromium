// ─── File: plugin/errors.ts ────────────────────────────────────────────────
// Hệ thống lỗi plugin -- PluginError base class + các lỗi cụ thể.
//
//   Sử dụng class hierarchy riêng thay vì Error thô giúp client có thể
//   bắt lỗi theo từng loại cụ thể (instanceof) và hiển thị hướng dẫn sửa lỗi
//   phù hợp với từng tình huống. Việc gắn kèm giải thích dài (dedent)
//   giúp người dùng tự khắc phục mà không cần tra tài liệu.
// ─────────────────────────────────────────────────────────────────────────────

import dedent from 'dedent';

/**
 * Base class cho mọi lỗi engine. Không dùng Error thô.
 *
 * **Tại sao tự động set `name = constructor.name`?**
 *   Khi subclass không gọi `super(...)` đúng cách hoặc khi minify code,
 *   `instanceof` có thể bị sai. Set tên rõ ràng giúp debug log dễ đọc hơn.
 *
 * **Tại sao bắt `Error.captureStackTrace`?**
 *   Xóa frame constructor khỏi stack trace giúp stack trace ngắn gọn,
 *   chỉ hiển thị nơi lỗi thực sự xảy ra, không hiển thị internal call.
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
 *
 * **Tại sao thông báo dài dòng?**
 *   Từ phiên bản mới, key không chỉ cần cho fetch fingerprint mà còn
 *   cần cho setup và spawn. Nhiều người dùng chỉ set key trước fetch
 *   và quên set lại cho plugin instance. Thông báo này giải thích rõ
 *   thay đổi để tránh confusion.
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
 *
 * **Tại sao khuyến nghị xóa thư mục engine?**
 *   Engine worker có thể bị corrupt do tải dang dở, giải nén lỗi,
 *   hoặc phiên bản cũ không tương thích. Xóa thư mục buộc hệ thống
 *   tải lại từ đầu, giải quyết hầu hết các lỗi dạng này.
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
 *
 * **Tại sao cần timeout riêng?**
 *   Tải engine có thể chậm do network, antivirus scan, hoặc disk I/O.
 *   Timeout mặc định có thể quá thấp với máy chậm hoặc quá cao với CI.
 *   Cho phép điều chỉnh giúp linh hoạt theo môi trường.
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
 *
 * **Tại sao cần timeout riêng cho request?**
 *   API fingerprint service có thể chậm do tải hoặc lỗi mạng.
 *   Tách biệt với engine timeout giúp client xử lý linh hoạt:
 *   - Engine timeout cao hơn (tải worker)
 *   - Request timeout thấp hơn (gọi API)
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
