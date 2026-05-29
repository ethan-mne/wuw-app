/**
 * Patches @capacitor-community/fcm iOS plugin:
 * - Skip FirebaseApp.configure() when GoogleService-Info.plist is missing/invalid
 * - Re-apply cached APNs token before getToken/refreshToken (TestFlight / debug refresh)
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

const guardMarker = 'Valid GoogleService-Info.plist not in app bundle';
const apnsMarker = 'wuwReapplyApnsTokenIfNeeded';

const guard = `        guard let plistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: plistPath),
              let appId = plist["GOOGLE_APP_ID"] as? String,
              appId.contains(":ios:"),
              !appId.contains("YOUR_"),
              let apiKey = plist["API_KEY"] as? String,
              apiKey.hasPrefix("AIza"),
              !apiKey.contains("YOUR_")
        else {
            print("[FCM] ${guardMarker} — skipping Firebase")
            return
        }
`;

const apnsHelper = `
    /// Re-apply APNs token saved by AppDelegate (FCM getToken after debug refresh).
    private func wuwReapplyApnsTokenIfNeeded() {
        guard Messaging.messaging().apnsToken == nil,
              let data = UserDefaults.standard.data(forKey: "wuw_last_apns_device_token") else {
            return
        }
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        Messaging.messaging().apnsToken = data
    }
`;

let source = readFileSync(pluginPath, 'utf8');
let changed = false;

if (!source.includes(guardMarker)) {
  const needle = `    override public func load() {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }`;

  const oldGuard = `        guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
            print("[FCM] GoogleService-Info.plist not in app bundle — skipping Firebase")
            return
        }
`;

  if (source.includes(oldGuard)) {
    source = source.replace(oldGuard, `${guard}`);
    changed = true;
  } else if (source.includes(needle)) {
    source = source.replace(
      needle,
      `    override public func load() {\n${guard}        if FirebaseApp.app() == nil {\n            FirebaseApp.configure()\n        }`,
    );
    changed = true;
  } else {
    console.warn('[patch-fcm-ios] Unexpected Plugin.swift shape for Firebase guard; skipping guard patch');
  }
}

if (!source.includes(apnsMarker)) {
  if (!source.includes('private func wuwReapplyApnsTokenIfNeeded()')) {
    source = source.replace(
      '    @objc func didRegisterWithToken(notification: NSNotification) {',
      `${apnsHelper}\n    @objc func didRegisterWithToken(notification: NSNotification) {`,
    );
    changed = true;
  }

  source = source.replace(
    '    @objc func getToken(_ call: CAPPluginCall) {\n        if (fcmToken ?? "").isEmpty {',
    `    @objc func getToken(_ call: CAPPluginCall) {\n        wuwReapplyApnsTokenIfNeeded()\n        if (fcmToken ?? "").isEmpty {`,
  );
  source = source.replace(
    '    @objc func refreshToken(_ call: CAPPluginCall) {\n        // Delete FCM Token on Firebase',
    `    @objc func refreshToken(_ call: CAPPluginCall) {\n        wuwReapplyApnsTokenIfNeeded()\n        // Delete FCM Token on Firebase`,
  );
  changed = true;
}

if (changed) {
  writeFileSync(pluginPath, source, 'utf8');
  console.log('[patch-fcm-ios] Patched FCM iOS plugin (Firebase guard + APNs re-apply before getToken)');
} else {
  console.log('[patch-fcm-ios] FCM iOS plugin already patched');
}
