/**
 * Links a valid GoogleService-Info.plist into the Xcode project (Copy Bundle Resources).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isValidGoogleServicePlistContent, isValidGoogleServicePlistFile } from './ios-firebase-plist.mjs';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const plistPath = path.join(root, 'ios/App/App/GoogleService-Info.plist');
const pbxPath = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');

const fileRefId = 'F1A2B3C41FED79650016851F';
const buildFileId = 'F1A2B3C51FED79650016851F';

function unlinkFromPbx(pbx) {
  let next = pbx;
  next = next.replace(
    new RegExp(`\\t\\t${buildFileId} /\\* GoogleService-Info\\.plist in Resources \\*/ = [^;]+;\\n`, 'g'),
    '',
  );
  next = next.replace(
    new RegExp(`\\t\\t${fileRefId} /\\* GoogleService-Info\\.plist \\*/ = [^;]+;\\n`, 'g'),
    '',
  );
  next = next.replace(
    new RegExp(`\\t\\t\\t\\t${fileRefId} /\\* GoogleService-Info\\.plist \\*/,\\n`, 'g'),
    '',
  );
  next = next.replace(
    new RegExp(`\\t\\t\\t\\t${buildFileId} /\\* GoogleService-Info\\.plist in Resources \\*/,\\n`, 'g'),
    '',
  );
  return next;
}

let pbx = readFileSync(pbxPath, 'utf8');

if (!isValidGoogleServicePlistFile(plistPath)) {
  if (existsSync(plistPath)) {
    const content = readFileSync(plistPath, 'utf8');
    if (content.includes('YOUR_IOS')) {
      console.warn(
        '[ios-firebase] GoogleService-Info.plist contains placeholders — not bundling (would crash iOS). Replace with Firebase download.',
      );
    } else {
      console.warn('[ios-firebase] GoogleService-Info.plist is present but invalid — not bundling.');
    }
  } else {
    console.warn(
      '[ios-firebase] GoogleService-Info.plist missing — app will launch without Firebase until you add the Firebase download.',
    );
  }

  if (pbx.includes('GoogleService-Info.plist')) {
    writeFileSync(pbxPath, unlinkFromPbx(pbx), 'utf8');
    console.warn('[ios-firebase] Removed invalid GoogleService-Info.plist from Xcode project');
  }
  process.exit(0);
}

if (pbx.includes('GoogleService-Info.plist')) {
  process.exit(0);
}

const content = readFileSync(plistPath, 'utf8');
if (!isValidGoogleServicePlistContent(content)) {
  console.warn('[ios-firebase] Refusing to link invalid GoogleService-Info.plist');
  process.exit(0);
}

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
