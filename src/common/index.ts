// ─── File: index.ts ──────────────────────────────────────────────────────
// Scripts map chứa các đoạn JavaScript inject vào browser thông qua CDP.
//
//   1. waitForResize – chờ resize hoàn tất qua ResizeObserver
//   2. getViewport – lấy kích thước viewport hiện tại
// ─────────────────────────────────────────────────────────────────────────────

// ─── Scripts ─────────────────────────────────────────────────────────────────

export const scripts: Record<string, (...args: unknown[]) => unknown> = {
  waitForResize: () => {
    return new Promise(done => {
      new ResizeObserver((_, observer) => {
        requestAnimationFrame(() => requestAnimationFrame(() => { observer.disconnect(); done(undefined); }));
      }).observe(document.body);
    });
  },
  getViewport: () => ({
    width: window.innerWidth,
    height: window.innerHeight
  })
};