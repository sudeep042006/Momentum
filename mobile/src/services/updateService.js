import { Linking, Platform } from 'react-native';
import { localStorage } from '../storage/localStorage';

export const CURRENT_APP_VERSION = 'v1.0.0';
const GITHUB_REPO = 'sudeep042006/Momentum';
const SNOOZE_STORAGE_KEY = 'momentum_update_snooze_until';

/**
 * Snoozes the update popup and notification for the specified hours (defaults to 4 hours)
 */
export async function snoozeUpdateReminder(hours = 4) {
  try {
    const snoozeUntil = Date.now() + hours * 60 * 60 * 1000;
    await localStorage.setItem(SNOOZE_STORAGE_KEY, snoozeUntil);
  } catch (err) {
    // Non-blocking fail-safe
  }
}

/**
 * Checks if the update reminder is currently snoozed
 */
export async function isUpdateSnoozed() {
  try {
    const snoozeUntil = await localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!snoozeUntil) return false;
    const expiry = Number(snoozeUntil);
    if (isNaN(expiry)) return false;
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

/**
 * Clears the snooze state so update prompts can fire immediately (e.g. on manual check)
 */
export async function clearUpdateSnooze() {
  try {
    await localStorage.removeItem(SNOOZE_STORAGE_KEY);
  } catch (err) {
    // Non-blocking fail-safe
  }
}

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
 * @param {{ ignoreSnooze?: boolean }} options
 * @returns {Promise<{ hasUpdate: boolean, isSnoozed?: boolean, latestVersion: string, releaseNotes: string, downloadUrl: string }|null>}
 */
export async function checkForAppUpdate(options = {}) {
  if (Platform.OS !== 'android') return null;

  try {
    // 1. Check if user snoozed the update reminder (3 to 4 hours)
    if (!options.ignoreSnooze) {
      const snoozed = await isUpdateSnoozed();
      if (snoozed) {
        return { hasUpdate: false, isSnoozed: true };
      }
    }

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
    const hasNewerVersion = compareVersions(latestTag, CURRENT_APP_VERSION) > 0;

    if (!hasNewerVersion) {
      return { hasUpdate: false };
    }

    // STRICT CHECK: Verify that the release contains a completed .apk asset.
    // When code is pushed, GitHub Actions takes 10-25 mins to build the APK.
    // If the APK asset is not yet uploaded, DO NOT notify the user prematurely!
    const apkAsset = (release.assets || []).find(
      (asset) => asset.name && asset.name.endsWith('.apk') && asset.browser_download_url
    );

    if (!apkAsset) {
      // Build is still running in GitHub Actions; wait until APK is ready
      return {
        hasUpdate: false,
        isBuilding: true,
      };
    }

    return {
      hasUpdate: true,
      isSnoozed: false,
      latestVersion: latestTag,
      currentVersion: CURRENT_APP_VERSION,
      releaseNotes: release.body || 'Performance improvements and bug fixes.',
      downloadUrl: apkAsset.browser_download_url,
      apkSize: apkAsset.size ? (apkAsset.size / (1024 * 1024)).toFixed(1) + ' MB' : null,
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
    // Direct open to trigger Android browser / download manager
    await Linking.openURL(downloadUrl);
  } catch (err) {
    console.warn('Direct openURL failed, attempting fallback:', err);
    try {
      const canOpen = await Linking.canOpenURL(downloadUrl);
      if (canOpen) {
        await Linking.openURL(downloadUrl);
      }
    } catch (fallbackErr) {
      console.error('All Linking attempts failed:', fallbackErr);
    }
  }
}
