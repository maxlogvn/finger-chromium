import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'node18',

  // 👇 DTS config - KHÔNG bỏ skipNodeModulesBundle vào đây
  dts: {
    resolve: false, // Chỉ resolve type nội bộ, không quét node_modules
    compilerOptions: {
      declaration: true,
      declarationDir: 'dist',
      // ❌ KHÔNG thêm skipNodeModulesBundle ở đây
    },
  },

  clean: true,
  sourcemap: false,
  minify: true,
  treeshake: true,
  shims: true,

  // 👇 QUAN TRỌNG: Option của tsup, phải ở ROOT level
  skipNodeModulesBundle: true,

  // 👇 Khai báo external để esbuild không cố bundle dependencies
  external: [
    'playwright-core',
    'async-lock',
    'axios',
    'chokidar',
    'chrome-remote-interface',
    'compare-versions',
    'debug',
    'dedent',
    'extract-zip',
    'fast-glob',
    'once',
    'proper-lockfile',
    'dotenv',
  ],

});
