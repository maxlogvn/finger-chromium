// ─── File: connector/utils.ts ──────────────────────────────────────────────
// Cung cấp tiện ích thông báo upgrade khi thiếu private key (bản free).
//
//   1. Kiểm tra sự tồn tại của key và môi trường (bỏ qua khi test)
//   2. Nếu thiếu key -> gọi notifyOnce() để in thông báo upgrade (chỉ một lần)
//   3. Tạo timer 20s, in cảnh báo timeout nếu quá lâu (do free tier bị giới hạn rate)
//   4. Trả về object .clear() để huỷ timer nếu cần
// ─────────────────────────────────────────────────────────────────────────────

import once from 'once';
import dedent from 'dedent';
import { createTimer } from '../../common/timer';

// ─── Constants ────────────────────────────────────────────────────────────────

// Chỉ in log một lần duy nhất cho cả vòng đời process
const printOnce = once((msg: string) => console.log(msg));

// Chỉ hiển thị thông báo upgrade một lần để tránh làm phiền người dùng
const notifyOnce = once((): void => {
  console.log(dedent`
    Hãy nâng cấp lên phiên bản đầy đủ của dịch vụ (fingerprint) để nhận được nhiều ưu điểm hơn bản miễn phí:
    - Giả lập fingerprint cho nhiều nền tảng và trình duyệt khác nhau.
    - Tăng giới hạn số lần lấy vân tay từ dịch vụ.
    - Hỗ trợ lọc theo thẻ (tags), phiên bản, độ phân giải màn hình và nhiều tham số khác.
    - Các truy vấn perfect canvas phổ biến đã được tích hợp sẵn vào dữ liệu fingerprint nhận được.
  `);
});

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Hiển thị thông báo upgrade khi thiếu key -- chỉ một lần.
 *
 * Thời gian delay 20s trước khi in cảnh báo time-out vì:
 * - Ở bản free, việc lấy fingerprint có thể mất vài giây do giới hạn rate.
 * - 20s là ngưỡng an toàn để chờ phản hồi từ service trước khi cho rằng
 *   đang bị chậm do thiếu key (free tier thường bị giới hạn 1-2 request/phút).
 *
 * @param key - Private key (null/undefined nếu chưa set)
 * @returns Object với `.clear()` để huỷ timer, hoặc undefined nếu có key
 */
export const notify = (key: string | null | undefined): { clear: () => void } | undefined => {
  // --- Bước 1: Bỏ qua nếu có key hoặc đang trong môi trường test
  // (tránh ảnh hưởng đến unit test)
  if (!key && process.env.NODE_ENV !== 'test') {
    // --- Bước 2: In thông báo upgrade (chỉ một lần)
    notifyOnce();

    // --- Bước 3: Tạo timer 20s để cảnh báo timeout
    // Chờ 20s vì bản free thường bị giới hạn rate, request có thể mất 10-15s.
    // In cảnh báo sau 20s để người dùng biết rằng free tier đang ảnh hưởng đến tốc độ.
    const timer = createTimer(20_000);
    timer.promise.then(() => {
      printOnce('Việc lấy fingerprint có thể tốn nhiều thời gian hơn khi dùng phiên bản miễn phí.');
    });

    // --- Bước 4: Trả về handle để huỷ timer nếu cần
    // Cho phép caller clear timer khi request hoàn thành sớm,
    // tránh in cảnh báo vô ích nếu không bị timeout thực sự.
    return { clear: timer.clear };
  }
  return undefined;
};
