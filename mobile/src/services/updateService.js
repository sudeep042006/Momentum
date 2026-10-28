import { Linking, Platform } from 'react-native';
import { localStorage } from '../storage/localStorage';

export const CURRENT_APP_VERSION = 'v1.12';
const GITHUB_REPO = 'sudeep042006/Momentum';
const SNOOZE_STORAGE_KEY = 'momentum_update_snooze_until';
const INSTALLED_VERSION_KEY = 'momentum_installed_version';

/**
 * Saves the version the user has installed so the app immediately marks it as up-to-date
 */
export async function markVersionInstalled(version) {
  if (!version) return;
  try {
    const cleanVer = (version || '').startsWith('v') ? version : `v${version}`;
    await localStorage.setItem(INSTALLED_VERSION_KEY, cleanVer);
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Retrieves the effective current version using native package info, localStorage, or fallback
 */
export async function getEffectiveAppVersion() {
  let effective = CURRENT_APP_VERSION;
  try {
    // 1. Try to read from native Android package manager
    const { getNativeAppVersion } = require('./systemNotificationService');
    const native = await getNativeAppVersion();
    if (native?.versionName) {
      const nativeFormatted = native.versionName.startsWith('v') ? native.versionName : `v${native.versionName}`;
      if (compareVersions(nativeFormatted, effective) > 0) {
        effective = nativeFormatted;
      }
    }
  } catch {}

  try {
    // 2. Check if a newer version was marked as installed locally
    const recorded = await localStorage.getItem(INSTALLED_VERSION_KEY);
    if (recorded && compareVersions(recorded, effective) > 0) {
      effective = recorded;
    }
  } catch {}

  return effective;
}

/**
 * Snoozes the update popup and notification for the specified version (defaults to 4 hours)
 * @param {string} version - The version string being snoozed (e.g. 'v1.1')
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
 * Compares two version strings in x.y or semantic format (e.g. 'v1.2' vs 'v1.1' or 'v1.1' vs 'v1.0.1')
 * @returns {number} 1 if vA > vB, -1 if vA < vB, 0 if equal
 */
export function compareVersions(vA, vB) {
  const cleanA = (vA || '').replace(/^v/i, '').trim();
  const cleanB = (vB || '').replace(/^v/i, '').trim();

  if (cleanA === cleanB) return 0;

  const partsA = cleanA.split('.').map((p) => parseInt(p, 10) || 0);
  const partsB = cleanB.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Checks GitHub Releases API for the latest published release
 * @param {{ ignoreSnooze?: boolean }} options
 * @returns {Promise<{ hasUpdate: boolean, isSnoozed?: boolean, isBuilding?: boolean, latestVersion: string, releaseNotes: string, downloadUrl: string, currentVersion: string }|null>}
 */
export async function checkForAppUpdate(options = {}) {
  if (Platform.OS !== 'android') return null;

  try {
    const currentVersion = await getEffectiveAppVersion();

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
    const hasNewerVersion = compareVersions(latestTag, currentVersion) > 0;

    if (!hasNewerVersion) {
      return { hasUpdate: false, latestVersion: latestTag, currentVersion };
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
        currentVersion,
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
      currentVersion,
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
