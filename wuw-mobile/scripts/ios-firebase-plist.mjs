/**
 * Validates GoogleService-Info.plist (real Firebase download, not the example template).
 */
import { existsSync, readFileSync } from 'node:fs';

export function isValidGoogleServicePlistContent(content) {
  if (!content || content.includes('YOUR_IOS')) {
    return false;
  }

  const appId = content.match(/<key>GOOGLE_APP_ID<\/key>\s*<string>([^<]+)<\/string>/i)?.[1]?.trim();
  const apiKey = content.match(/<key>API_KEY<\/key>\s*<string>([^<]+)<\/string>/i)?.[1]?.trim();

  if (!appId || !apiKey) {
    return false;
  }

  if (!/^1:\d+:ios:[a-zA-Z0-9]+$/.test(appId)) {
    return false;
  }

  return apiKey.startsWith('AIza') && apiKey.length > 20;
}

export function isValidGoogleServicePlistFile(filePath) {
  if (!existsSync(filePath)) {
    return false;
  }
  return isValidGoogleServicePlistContent(readFileSync(filePath, 'utf8'));
}
