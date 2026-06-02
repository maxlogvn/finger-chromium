# Spec: Browser Launcher

## Module: src/plugin/launcher/index.ts (99 dòng)

### Types

```ts
interface LaunchOptions {
  debuggingPort?: number;          // Random nếu không set
  userDataDir?: string;            // Engine tự quản lý
  headless?: boolean;              // Force false
  timeout?: number;
  args?: string[];
  executablePath?: string;         // worker.exe path
}

interface Browser {
  process: ChildProcess;
  port: number;
  url: string;
  configure(): Promise<void>;      // Override bởi config.ts
  close(): Promise<void>;          // taskkill /pid /T /F
}
```

### CDP URL regex

```ts
const DEVSERVER_RE = /DevTools listening on (ws:\/\/[^\s]+)/gi;
```

Hỗ trợ multiple matches (multi-target). Lưu vào array, chỉ dùng cái đầu tiên.

### Close implementation

```ts
async close() {
  try {
    await execAsync(`taskkill /pid ${this.process.pid} /T /F`);
  } catch {
    this.process.kill('SIGKILL');
  }
}
```

`taskkill /T`: kill process tree (worker.exe + chromium). Fallback: `process.kill`.

### readline pattern

```ts
const rl = readline.createInterface({ input: childProcess.stderr });
rl.on('line', (line) => {
  const match = DEVSERVER_RE.exec(line);
  if (match) resolve(match[1]);
});
```
