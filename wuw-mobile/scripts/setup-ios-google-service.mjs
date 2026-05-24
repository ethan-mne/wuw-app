/**
 * Checks iOS Firebase config — does NOT create placeholder plists (they crash the app at launch).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isValidGoogleServicePlistFile } from './ios-firebase-plist.mjs';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const plistPath = path.join(root, 'ios/App/App/GoogleService-Info.plist');

if (isValidGoogleServicePlistFile(plistPath)) {
  console.log('[ios-firebase] OK — valid GoogleService-Info.plist found');
  console.log('[ios-firebase] Next: npm run ios:sync');
  process.exit(0);
}

console.error('[ios-firebase] Missing or invalid GoogleService-Info.plist');
console.error('');
console.error('Download the real file from Firebase Console:');
console.error('  Project: winuwatch-bd56d');
console.error('  iOS bundle ID: com.winuwatch.wuwapp');
console.error('  Save as: wuw-mobile/ios/App/App/GoogleService-Info.plist');
console.error('');
console.error('Do NOT copy GoogleService-Info.plist.example — placeholder values crash iOS on launch.');
console.error('Then run: npm run ios:sync');
process.exit(1);
