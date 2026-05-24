/**
 * Ensures GoogleService-Info.plist is copied into the iOS app bundle when the file exists on disk.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const plistPath = path.join(root, 'ios/App/App/GoogleService-Info.plist');
const pbxPath = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');

if (!existsSync(plistPath)) {
  console.warn(
    '[ios-firebase] GoogleService-Info.plist missing — download from Firebase (iOS app com.winuwatch.wuwapp) and place at ios/App/App/GoogleService-Info.plist',
  );
  process.exit(0);
}

let pbx = readFileSync(pbxPath, 'utf8');
if (pbx.includes('GoogleService-Info.plist')) {
  process.exit(0);
}

const fileRefId = 'F1A2B3C41FED79650016851F';
const buildFileId = 'F1A2B3C51FED79650016851F';

pbx = pbx.replace(
  '/* End PBXBuildFile section */',
  `\t\t${buildFileId} /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRefId} /* GoogleService-Info.plist */; };\n/* End PBXBuildFile section */`,
);

pbx = pbx.replace(
  '/* End PBXFileReference section */',
  `\t\t${fileRefId} /* GoogleService-Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = GoogleService-Info.plist; sourceTree = "<group>"; };\n/* End PBXFileReference section */`,
);

pbx = pbx.replace(
  '504EC3131FED79650016851F /* Info.plist */,',
  `504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\t${fileRefId} /* GoogleService-Info.plist */,`,
);

pbx = pbx.replace(
  '2FAD9763203C412B000D30F8 /* config.xml in Resources */,',
  `2FAD9763203C412B000D30F8 /* config.xml in Resources */,\n\t\t\t\t${buildFileId} /* GoogleService-Info.plist in Resources */,`,
);

writeFileSync(pbxPath, pbx, 'utf8');
console.log('[ios-firebase] Linked GoogleService-Info.plist into Xcode project');
