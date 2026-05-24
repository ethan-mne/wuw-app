/**
 * Prevents iOS launch crash when GoogleService-Info.plist is missing from the app bundle.
 * @capacitor-community/fcm calls FirebaseApp.configure() in Plugin.load() unconditionally.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginPath = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../node_modules/@capacitor-community/fcm/ios/Plugin/Plugin.swift',
);

if (!existsSync(pluginPath)) {
  console.warn('[patch-fcm-ios] FCM plugin not installed; skipping');
  process.exit(0);
}

const guard = `        guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
            print("[FCM] GoogleService-Info.plist not in app bundle — skipping Firebase")
            return
        }
`;

const marker = 'GoogleService-Info.plist not in app bundle';
let source = readFileSync(pluginPath, 'utf8');

if (source.includes(marker)) {
  process.exit(0);
}

const needle = `    override public func load() {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }`;

if (!source.includes(needle)) {
  console.warn('[patch-fcm-ios] Unexpected Plugin.swift shape; patch not applied');
  process.exit(0);
}

source = source.replace(needle, `    override public func load() {\n${guard}        if FirebaseApp.app() == nil {\n            FirebaseApp.configure()\n        }`);
writeFileSync(pluginPath, source, 'utf8');
console.log('[patch-fcm-ios] Patched FCM iOS plugin to skip Firebase when plist is missing');
