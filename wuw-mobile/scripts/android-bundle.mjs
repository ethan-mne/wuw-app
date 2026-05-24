import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(rootDir, 'android');

function findJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'))) {
    return process.env.JAVA_HOME;
  }

  const candidates = [
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    'C:\\Program Files\\Android\\Android Studio\\jbr\\Contents\\Home',
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
  ];

  for (const candidate of candidates) {
    const javaBin = path.join(candidate, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (fs.existsSync(javaBin)) {
      return candidate;
    }
  }

  return null;
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error(
    'JAVA_HOME is not set and Android Studio JDK was not found.\n' +
      'Install Android Studio or set JAVA_HOME to your JDK folder.',
  );
  process.exit(1);
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const result = spawnSync(gradlew, ['bundleRelease'], {
  cwd: androidDir,
  env: { ...process.env, JAVA_HOME: javaHome },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
