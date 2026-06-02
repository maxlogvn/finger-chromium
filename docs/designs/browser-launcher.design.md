# Design: Browser Launcher

## Vấn đề

Cần spawn Chromium từ engine binary (`worker.exe`) và phát hiện DevTools listening URL từ output để kết nối CDP. Process tree gồm worker.exe + chromium child processes.

## Giải pháp: `launch()` function

### Interface Browser

```ts
interface Browser {
  process: ChildProcess;
  port: number;
  url: string;
  configure(): Promise<void>;
  close(): Promise<void>;
}
```

### Spawn và CDP detection

```ts
async function launch(options: LaunchOptions = {}): Promise<Browser> {
  // 1. Tìm port, mặc định random
  // 2. Spawn executablePath với args + --remote-debugging-port=<port>
  // 3. Dùng readline để parse stdout/stderr
  // 4. Regex: /DevTools listening on (ws:\/\/[^\s]+)/gi
  // 5. Parse port từ URL
  // 6. Trả về Browser object
}
```

Dùng `readline.createInterface` thay vì `stream.on('data', ...)` -- dễ xử lý line-by-line hơn.

### Close mechanism

```ts
async close(): Promise<void> {
  try {
    await exec('taskkill /pid <pid> /T /F');
  } catch {
    childProcess.kill();
  }
}
```

`taskkill /T /F` giết toàn bộ process tree -- không thể dùng `process.kill` vì chỉ giết được process cha.

### Interface LaunchOptions

```ts
interface LaunchOptions {
  debuggingPort?: number;
  userDataDir?: string;
  headless?: boolean;
  timeout?: number;
  args?: string[];
  executablePath?: string;
}
```

---

Xem thêm: [Spec](../specs/browser-launcher.spec.md) | [Plan](../plans/browser-launcher.plan.md)
