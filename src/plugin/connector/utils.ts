// ─── File: connector/utils.ts ──────────────────────────────────────────────
// Tiện ích connector -- notification khi dùng bản free (thiếu key).
// Dùng once() để chỉ hiển thị một lần.
// ─────────────────────────────────────────────────────────────────────────────

import once from 'once';
import dedent from 'dedent';

type ClearableTimer = Parameters<typeof clearTimeout>[0];

const printOnce = once(console.log);

const notifyOnce = once((): void => {
  console.log(dedent`
    Hãy nâng cấp lên phiên bản đầy đủ của dịch vụ  (fingerprint) để nhận được nhiều ưu điểm hơn bản miễn phí:
    - Giả lập fingerprint cho nhiều nền tảng và trình duyệt khác nhau.
    - Tăng giới hạn số lần lấy vân tay từ dịch vụ.
    - Hỗ trợ lọc theo thẻ (tags), phiên bản, độ phân giải màn hình và nhiều tham số khác.
    - Các truy vấn perfect canvas phổ biến đã được tích hợp sẵn vào dữ liệu fingerprint nhận được.
  `);
});

/**
 * Hiển thị thông báo upgrade khi thiếu key -- chỉ một lần.
 * Delay 20s trước khi in cảnh báo time-out.
 *
 * @param key - Private key (null/undefined nếu chưa set)
 * @returns Timer handle (có thể clear nếu cần)
 */
export const notify = (key: string | null | undefined): ClearableTimer => {
  if (!key && process.env.NODE_ENV !== 'test') {
    notifyOnce();
    return setTimeout(
      printOnce,
      20_000,
      'Việc lấy fingerprint có thể tốn nhiều thời gian hơn khi dùng phiên bản miễn phí.'
    );
  }
  return undefined;
};
