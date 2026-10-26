import { Linking, Platform } from 'react-native';
import { localStorage } from '../storage/localStorage';

export const CURRENT_APP_VERSION = 'v1.0.0';
const GITHUB_REPO = 'sudeep042006/Momentum';
const SNOOZE_STORAGE_KEY = 'momentum_update_snooze_until';

/**
 * Snoozes the update popup and notification for the specified version (defaults to 4 hours)
 * @param {string} version - The version string being snoozed (e.g. 'v1.0.8')
 * @param {number} hours - Number of hours to snooze (defaults to 4)
 */
export async function snoozeUpdateReminder(version, hours = 4) {
  try {
    const data = {
      snoozeUntil: Date.now() + hours * 60 * 60 * 1000,
      version: version || 'all',
    };
    await localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    // Non-blocking fail-safe
  }
}

/**
 * Checks if the update reminder is currently snoozed for the given version
 * @param {string} [targetVersion] - Optional latest version to compare against snoozed version
 */
export async function isUpdateSnoozed(targetVersion) {
  try {
    const raw = await localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!raw) return false;

    let snoozeUntil = 0;
    let snoozedVersion = null;

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        snoozeUntil = Number(parsed.snoozeUntil) || 0;
        snoozedVersion = parsed.version;
      } else {
        snoozeUntil = Number(raw) || 0;
      }
    } catch {
      snoozeUntil = Number(raw) || 0;
    }

    if (Date.now() >= snoozeUntil) {
      await clearUpdateSnooze();
      return false;
    }

    // If a brand new version was published that is NEWER than what was snoozed,
    // NEVER snooze it. New releases must always notify the user!
    if (targetVersion && snoozedVersion && snoozedVersion !== 'all') {
      if (compareVersions(targetVersion, snoozedVersion) > 0) {
        await clearUpdateSnooze();
        return false;
      }
    }

    return true;
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
 * @returns {Promise<{ hasUpdate: boolean, isSnoozed?: boolean, isBuilding?: boolean, latestVersion: string, releaseNotes: string, downloadUrl: string }|null>}
 */
export async function checkForAppUpdate(options = {}) {
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
    const hasNewerVersion = compareVersions(latestTag, CURRENT_APP_VERSION) > 0;

    if (!hasNewerVersion) {
      return { hasUpdate: false, latestVersion: latestTag };
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
        latestVersion: latestTag,
      };
    }

    // Check if this specific version was snoozed by the user
    let isSnoozed = false;
    if (!options.ignoreSnooze) {
      isSnoozed = await isUpdateSnoozed(latestTag);
    }

    return {
      hasUpdate: true,
      isSnoozed,
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
