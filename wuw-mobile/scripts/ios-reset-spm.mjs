/**
 * Clears Swift Package Manager resolution so Xcode re-fetches Capacitor for the current toolchain.
 * Run before opening Xcode if you see "SDK is not supported by the compiler" for Capacitor.
 */
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const paths = [
  path.join(root, 'ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'),
  path.join(root, 'ios/App/CapApp-SPM/.build'),
  path.join(root, 'ios/App/CapApp-SPM/Package.resolved'),
];

for (const p of paths) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log('[ios-reset-spm] Removed', p);
  }
}

console.log('');
console.log('Next on your Mac:');
console.log('  1. Xcode → File → Packages → Reset Package Caches');
console.log('  2. Xcode → Product → Clean Build Folder');
console.log('  3. Optional: delete ~/Library/Developer/Xcode/DerivedData/*wuw*');
console.log('  4. cd wuw-mobile && npm install && npm run ios:sync');
console.log('  5. Reopen ios/App/App.xcworkspace and build');
