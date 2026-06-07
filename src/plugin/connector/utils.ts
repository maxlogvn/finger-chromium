// ─── File: utils.ts ──────────────────────────────────────────────────────
// Utility cho connector – hiển thị thông báo nâng cấp khi dùng bản miễn phí.
//
//   1. notify – hiển thị thông báo một lần nếu thiếu key
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import once from 'once';
import dedent from 'dedent';
import { createTimer } from '../../common/timer';

// ─── Notify ──────────────────────────────────────────────────────────────────

const printOnce = once((msg: string) => { console.log(msg); });

const notifyOnce = once((): void => {
  console.log(dedent`
    Hãy nâng cấp lên phiên bản đầy đủ của dịch vụ (fingerprint) để nhận được nhiều ưu điểm hơn bản miễn phí:
    - Giả lập fingerprint cho nhiều nền tảng và trình duyệt khác nhau.
    - Tăng giới hạn số lần lấy vân tay từ dịch vụ.
    - Hỗ trợ lọc theo thẻ (tags), phiên bản, độ phân giải màn hình và nhiều tham số khác.
    - Các truy vấn perfect canvas phổ biến đã được tích hợp sẵn vào dữ liệu fingerprint nhận được.
  `);
});

export const notify = (key: string | null | undefined): {
  clear: () => void;
} | undefined => {
  if (!key && process.env.NODE_ENV !== 'test') {
    notifyOnce();
    const timer = createTimer(20_000);
    void timer.promise.then(() => {
      printOnce('Việc lấy fingerprint có thể tốn nhiều thời gian hơn khi dùng phiên bản miễn phí.');
    });
    return {
      clear: timer.clear
    };
  }
  return undefined;
};