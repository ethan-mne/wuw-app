/**
 * Patches @capacitor-community/fcm iOS plugin:
 * - Skip FirebaseApp.configure() when GoogleService-Info.plist is missing/invalid
 * - Re-apply cached APNs token before getToken
 * - Return cached FCM token from UserDefaults
 * - Persist FCM token in UserDefaults when MessagingDelegate fires
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
const cacheMarker = 'wuw_fcm_registration_token';

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

    private func wuwCachedFcmToken() -> String? {
        let token = UserDefaults.standard.string(forKey: "${cacheMarker}")
        return (token ?? "").isEmpty ? nil : token
    }
`;

const getTokenStart = `    @objc func getToken(_ call: CAPPluginCall) {
        wuwReapplyApnsTokenIfNeeded()
        if let cached = wuwCachedFcmToken() {
            self.fcmToken = cached
            call.resolve(["token": cached])
            return
        }
`;

let source = readFileSync(pluginPath, 'utf8');
let changed = false;

function markReplaced(next) {
  if (next !== source) {
    source = next;
    changed = true;
  }
}

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
    markReplaced(source.replace(oldGuard, `${guard}`));
  } else if (source.includes(needle)) {
    markReplaced(
      source.replace(
        needle,
        `    override public func load() {\n${guard}        if FirebaseApp.app() == nil {\n            FirebaseApp.configure()\n        }`,
      ),
    );
  }
}

if (!source.includes(apnsMarker) && !source.includes('private func wuwReapplyApnsTokenIfNeeded()')) {
  markReplaced(
    source.replace(
      '    @objc func didRegisterWithToken(notification: NSNotification) {',
      `${apnsHelper}\n    @objc func didRegisterWithToken(notification: NSNotification) {`,
    ),
  );
}

if (!source.includes('wuwCachedFcmToken()')) {
  if (source.includes('    @objc func getToken(_ call: CAPPluginCall) {\n        if (fcmToken ?? "").isEmpty {')) {
    markReplaced(
      source.replace(
        '    @objc func getToken(_ call: CAPPluginCall) {\n        if (fcmToken ?? "").isEmpty {',
        `${getTokenStart}        if (fcmToken ?? "").isEmpty {`,
      ),
    );
  } else if (
    source.includes(
      '    @objc func getToken(_ call: CAPPluginCall) {\n        wuwReapplyApnsTokenIfNeeded()\n        if (fcmToken ?? "").isEmpty {',
    )
  ) {
    markReplaced(
      source.replace(
        '    @objc func getToken(_ call: CAPPluginCall) {\n        wuwReapplyApnsTokenIfNeeded()\n        if (fcmToken ?? "").isEmpty {',
        `${getTokenStart}        if (fcmToken ?? "").isEmpty {`,
      ),
    );
  }
}

if (!source.includes('UserDefaults.standard.set(token, forKey: "wuw_fcm_registration_token")')) {
  markReplaced(
    source.replace(
      '    @objc public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {\n        self.fcmToken = fcmToken\n    }',
      `    @objc public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        self.fcmToken = fcmToken
        if let token = fcmToken, !token.isEmpty {
            UserDefaults.standard.set(token, forKey: "${cacheMarker}")
        }
    }`,
    ),
  );
}

if (changed) {
  writeFileSync(pluginPath, source, 'utf8');
  console.log('[patch-fcm-ios] Patched FCM iOS plugin');
} else {
  console.log('[patch-fcm-ios] FCM iOS plugin already patched');
}
