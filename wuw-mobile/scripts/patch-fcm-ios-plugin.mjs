/**
 * Copies the patched FCM Plugin.swift into node_modules after npm install.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const source = path.join(root, 'patches/fcm-ios/Plugin.swift');
const target = path.join(
  root,
  'node_modules/@capacitor-community/fcm/ios/Plugin/Plugin.swift',
);

if (!existsSync(source)) {
  console.warn('[patch-fcm-ios] patches/fcm-ios/Plugin.swift missing');
  process.exit(0);
}

if (!existsSync(path.dirname(target))) {
  console.warn('[patch-fcm-ios] @capacitor-community/fcm not installed; skipping');
  process.exit(0);
}

copyFileSync(source, target);
console.log('[patch-fcm-ios] Applied patches/fcm-ios/Plugin.swift');
