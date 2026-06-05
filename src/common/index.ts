// ─── File: common/index.ts ─────────────────────────────────────────────────
// In-browser scripts -- chạy trong context của trang web qua page.evaluate().
//
//   1. waitForResize -- ResizeObserver + requestAnimationFrame
//   2. getViewport -- window.innerWidth / innerHeight
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tập hợp các script chạy trong browser context.
 * Gom vào một object để tránh truyền string thô khi gọi page.evaluate,
 * giúp tái sử dụng và quản lý tập trung.
 */
export const scripts: Record<string, (...args: unknown[]) => unknown> = {
  /**
   * Đợi cho đến khi viewport đã resize xong và layout ổn định.
   *
   * Dùng `ResizeObserver` để bắt sự kiện thay đổi kích thước phần tử body.
   * Sau khi observer kích hoạt, cần **hai frame animation** (double rAF)
   * vì một rAF chỉ đảm bảo paint đã xảy ra, chưa chắc layout đã hoàn toàn
   * ổn định – double rAF giúp chờ thêm một chu kỳ layout/paint nữa,
   * đảm bảo `getViewport` trả về đúng kích thước cuối cùng.
   */
  waitForResize: () => {
    return new Promise((done) => {
      new ResizeObserver((_, observer) => {
        requestAnimationFrame(() => requestAnimationFrame(() => done(observer.disconnect())));
      }).observe(document.body);
    });
  },

  /**
   * Lấy kích thước viewport thực tế.
   *
   * Sử dụng `window.innerWidth` và `innerHeight` thay vì
   * `document.documentElement.clientWidth` vì `innerWidth` bao gồm
   * cả thanh cuộn (nếu có), phản ánh đúng không gian hiển thị của trang.
   */
  getViewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
};
