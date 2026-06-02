# Spec: Hạ tầng dự án

## Cấu trúc thư mục

```
src/
├── index.ts          # Public API -- re-export Chromium singleton + types
├── types/            # 5 files: PWChromium, fingerprint, proxy, profile, fetch, plugin-options, config
├── common/           # 1 file: in-browser scripts (waitForResize, getViewport)
├── loader/           # 1 file: generic npm module loader (createRequire + compare-versions)
├── plugin/           # Core logic: errors, mutex, launcher, browser, config, cleaner, connector/
└── adapter/          # Playwright bridge: chromium.ts, engine.ts, data.ts, utils.ts, loader.ts
```

## Build pipeline

- `tsup` target `node18`
- Format: ESM (`dist/index.js`) + CJS (`dist/index.cjs`)
- DTS: `resolve: false`, `declarationDir: 'dist'`
- External: `playwright-core`, `async-lock`, `axios`, `chokidar`, `chrome-remote-interface`, `compare-versions`, `debug`, `dedent`, `extract-zip`, `fast-glob`, `once`, `proper-lockfile`, `dotenv`

## Linting & Formatting

- ESLint + Prettier
- Format: tabs, single quotes, 100 printWidth, no trailingComma
- `npm run format`: prettier --write src/ tests/

## Testing

- Mocha + tsx loader
- File tests/*.test.ts
- Test với browser thật, không mock
