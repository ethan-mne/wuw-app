/**
 * Prevents iOS launch crash when GoogleService-Info.plist is missing or invalid.
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

const marker = 'Valid GoogleService-Info.plist not in app bundle';

const guard = `        guard let plistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: plistPath),
              let appId = plist["GOOGLE_APP_ID"] as? String,
              appId.contains(":ios:"),
              !appId.contains("YOUR_"),
              let apiKey = plist["API_KEY"] as? String,
              apiKey.hasPrefix("AIza"),
              !apiKey.contains("YOUR_")
        else {
            print("[FCM] Valid GoogleService-Info.plist not in app bundle — skipping Firebase")
            return
        }
`;

let source = readFileSync(pluginPath, 'utf8');

if (source.includes(marker)) {
  process.exit(0);
}

// Upgrade older patch (file exists only) to content validation
const oldGuard = `        guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
            print("[FCM] GoogleService-Info.plist not in app bundle — skipping Firebase")
            return
        }
`;

const needle = `    override public func load() {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }`;

if (source.includes(oldGuard)) {
  source = source.replace(oldGuard, `${guard}`);
  writeFileSync(pluginPath, source, 'utf8');
  console.log('[patch-fcm-ios] Upgraded FCM patch to validate GoogleService-Info.plist content');
  process.exit(0);
}

if (!source.includes(needle)) {
  console.warn('[patch-fcm-ios] Unexpected Plugin.swift shape; patch not applied');
  process.exit(0);
}

source = source.replace(
  needle,
  `    override public func load() {\n${guard}        if FirebaseApp.app() == nil {\n            FirebaseApp.configure()\n        }`,
);
writeFileSync(pluginPath, source, 'utf8');
console.log('[patch-fcm-ios] Patched FCM iOS plugin to skip Firebase when plist is missing or invalid');
