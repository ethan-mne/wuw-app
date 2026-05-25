/**
 * Android: @capacitor-community/fcm is unused (PushNotifications registration provides FCM token).
 * - Patches proguard-android.txt → proguard-android-optimize.txt in the FCM package (AGP 8.13+).
 * - Removes FCM from Capacitor Android project files so Gradle does not evaluate the broken plugin.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const fcmGradle = path.join(
  root,
  'node_modules/@capacitor-community/fcm/android/build.gradle',
);

if (existsSync(fcmGradle)) {
  let gradle = readFileSync(fcmGradle, 'utf8');
  if (gradle.includes("proguard-android.txt")) {
    gradle = gradle.replaceAll(
      "getDefaultProguardFile('proguard-android.txt')",
      "getDefaultProguardFile('proguard-android-optimize.txt')",
    );
    writeFileSync(fcmGradle, gradle, 'utf8');
    console.log('[patch-fcm-android] Updated FCM package proguard file reference');
  }
} else {
  console.warn('[patch-fcm-android] FCM android/build.gradle not found; skipping proguard patch');
}

function stripFcmFromFile(filePath, transforms) {
  if (!existsSync(filePath)) {
    return;
  }
  let text = readFileSync(filePath, 'utf8');
  const next = transforms.reduce((acc, fn) => fn(acc), text);
  if (next !== text) {
    writeFileSync(filePath, next, 'utf8');
    console.log(`[patch-fcm-android] Patched ${path.relative(root, filePath)}`);
  }
}

const androidDir = path.join(root, 'android');

stripFcmFromFile(path.join(androidDir, 'capacitor.settings.gradle'), [
  (s) =>
    s.replace(
      /\r?\ninclude ':capacitor-community-fcm'\r?\nproject\(':capacitor-community-fcm'\)\.projectDir = new File\('\.\.\/node_modules\/@capacitor-community\/fcm\/android'\)\r?\n/g,
      '\n',
    ),
]);

stripFcmFromFile(path.join(androidDir, 'app/capacitor.build.gradle'), [
  (s) => s.replace(/\r?\n\s*implementation project\(':capacitor-community-fcm'\)/g, ''),
]);

stripFcmFromFile(path.join(androidDir, 'app/src/main/assets/capacitor.plugins.json'), [
  (s) => {
    try {
      const plugins = JSON.parse(s);
      const filtered = plugins.filter((p) => p.pkg !== '@capacitor-community/fcm');
      if (filtered.length === plugins.length) {
        return s;
      }
      return `${JSON.stringify(filtered, null, '\t')}\n`;
    } catch {
      return s.replace(
        /\s*\{\s*\r?\n\s*"pkg": "@capacitor-community\/fcm",[\s\S]*?\},\r?\n/,
        '',
      );
    }
  },
]);

console.log('[patch-fcm-android] Android FCM plugin removed from Capacitor project (iOS unchanged)');
