// ─── File: index.ts ──────────────────────────────────────────────────────
// Loader – dynamic import cho playwright packages với version check.
//
//   1. import – thử require từ danh sách packages
//   2. load – require + verify version, trả về module property
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import { createRequire } from 'module';

import { compare } from 'compare-versions';

import { PluginError } from '../plugin/errors';

const require = createRequire(import.meta.url);

// ─── Loader ──────────────────────────────────────────────────────────────────

export default class Loader {
  private readonly target: string;
  private readonly version: string;
  private readonly packages: string[];

  constructor(target: string, version: string, packages: string[] = []) {
    this.target = target;
    this.version = version;
    this.packages = packages;
  }

  static import(packages: string[] = []): [unknown, string] | undefined {
    if (!packages.length) return undefined;
    for (const id of packages) {
      try {
        const mod = require(id) as Record<string, unknown>;
        const pkg = require(`${id}/package.json`) as { version: string };
        return [mod, pkg.version];
      } catch {
        continue;
      }
    }
    throw new PluginError(`None of the following packages could be found - "${packages.join('", "')}".`);
  }

  load(property = 'chromium'): unknown {
    const result = Loader.import([this.target, ...this.packages]);
    if (!result) {
      throw new PluginError(`Failed to resolve package "${this.target}".`);
    }
    const [module, version] = result;
    if (version && this.version && compare(version, this.version, '<')) {
      throw new PluginError(`Version ${version} of the "${this.target}" package is not supported - use version ${this.version} or higher.`);
    }
    const mod = module as Record<string, unknown>;
    return property in mod ? mod[property] : module;
  }
}