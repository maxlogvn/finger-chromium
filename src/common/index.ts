// ─── File: common/index.ts ─────────────────────────────────────────────────
// In-browser scripts -- chạy trong context của trang web qua page.evaluate().
//
//   1. waitForResize -- ResizeObserver + requestAnimationFrame
//   2. getViewport -- window.innerWidth / innerHeight
// ─────────────────────────────────────────────────────────────────────────────

export const scripts: Record<string, (...args: unknown[]) => unknown> = {
  /**
   * Đợi resize hoàn tất -- dùng ResizeObserver + double rAF để đảm bảo
   * layout đã ổn định sau khi thay đổi kích thước.
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
   */
  getViewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
};
