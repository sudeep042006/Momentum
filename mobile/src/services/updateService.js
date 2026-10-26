import { Linking, Platform } from 'react-native';

export const CURRENT_APP_VERSION = 'v1.0.0';
const GITHUB_REPO = 'sudeep042006/Momentum';

/**
 * Compares two semantic version strings (e.g. 'v1.0.1' vs 'v1.0.0')
 * @returns {number} 1 if vA > vB, -1 if vA < vB, 0 if equal
 */
export function compareVersions(vA, vB) {
  const cleanA = (vA || '').replace(/^v/, '').split('.').map(Number);
  const cleanB = (vB || '').replace(/^v/, '').split('.').map(Number);

  const len = Math.max(cleanA.length, cleanB.length);
  for (let i = 0; i < len; i++) {
    const a = cleanA[i] || 0;
    const b = cleanB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Checks GitHub Releases API for the latest published release
 * @returns {Promise<{ hasUpdate: boolean, latestVersion: string, releaseNotes: string, downloadUrl: string }|null>}
 */
export async function checkForAppUpdate() {
  if (Platform.OS !== 'android') return null;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const release = await response.json();
    const latestTag = release.tag_name || '';
    const hasUpdate = compareVersions(latestTag, CURRENT_APP_VERSION) > 0;

    // Find the APK file from release assets
    const apkAsset = (release.assets || []).find(
      (asset) => asset.name && asset.name.endsWith('.apk')
    );
    const downloadUrl = apkAsset?.browser_download_url || release.html_url;

    return {
      hasUpdate,
      latestVersion: latestTag,
      currentVersion: CURRENT_APP_VERSION,
      releaseNotes: release.body || 'Performance improvements and bug fixes.',
      downloadUrl,
    };
  } catch (error) {
    console.log('Update check failed (offline or network):', error?.message);
    return null;
  }
}

/**
 * Opens the direct APK download / install link
 */
export async function downloadAndInstallUpdate(downloadUrl) {
  if (!downloadUrl) return;
  try {
    const canOpen = await Linking.canOpenURL(downloadUrl);
    if (canOpen) {
      await Linking.openURL(downloadUrl);
    }
  } catch (err) {
    console.warn('Failed to open update URL:', err);
  }
}
