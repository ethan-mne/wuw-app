/**
 * Capacitor writes Package.swift paths with OS-native separators. Windows sync
 * produces backslashes that break SPM on macOS. Run after `cap sync ios`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const packageSwift = path.join(root, 'ios/App/CapApp-SPM/Package.swift');

const content = readFileSync(packageSwift, 'utf8');
const normalized = content.replace(
  /path: "([^"]*)"/g,
  (_, packagePath) => `path: "${packagePath.replace(/\\/g, '/')}"`,
);

if (normalized !== content) {
  writeFileSync(packageSwift, normalized);
  console.log('[normalize-ios-spm-paths] Normalized Package.swift path separators');
}
