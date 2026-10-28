import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { DownloadCloud, Sparkles, X, ArrowUpRight, Globe, AlertCircle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { downloadAndInstallUpdate, snoozeUpdateReminder, markVersionInstalled } from '../services/updateService';
import {
  downloadAndInstallApkDirect,
  cancelApkDownloadDirect,
  installDownloadedApkDirect,
  canInstallUnknownAppsDirect,
  openUnknownAppsSettingsDirect,
  addDownloadProgressListener,
} from '../services/systemNotificationService';
import { colors } from '../theme/colors';

export default function UpdateModal({
  visible,
  updateInfo,
  onClose,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStats, setDownloadStats] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [permissionRequired, setPermissionRequired] = useState(false);
  const [isLaunchingInstaller, setIsLaunchingInstaller] = useState(false);
  const progressSubRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!visible) {
      cleanupDownloadState();
    }
  }, [visible]);

  // When returning from Settings after enabling unknown apps, automatically retry launching installer
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isDownloadComplete || downloadProgress >= 100) {
          const permitted = await canInstallUnknownAppsDirect();
          if (permitted) {
            setPermissionRequired(false);
            setStatusMessage('Permission granted! Launching Android installer...');
            await handleTriggerInstall();
          }
        }
      }
      appStateRef.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isDownloadComplete, downloadProgress]);

  const cleanupDownloadState = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadStats('');
    setStatusMessage('');
    setIsDownloadComplete(false);
    setPermissionRequired(false);
    setIsLaunchingInstaller(false);
    if (progressSubRef.current && typeof progressSubRef.current.remove === 'function') {
      progressSubRef.current.remove();
      progressSubRef.current = null;
    }
  };

  if (!visible || !updateInfo) return null;

  const handleCancelDownload = async () => {
    try {
      await cancelApkDownloadDirect();
    } catch (e) {
      // ignore
    }
    cleanupDownloadState();
  };

  const handleCloseModal = async () => {
    if (isDownloading && !isDownloadComplete) {
      await handleCancelDownload();
    }
    onClose();
  };

  const handleTriggerInstall = async () => {
    setIsLaunchingInstaller(true);
    setStatusMessage('Launching package installer...');
    try {
      const permitted = await canInstallUnknownAppsDirect();
      if (!permitted) {
        setPermissionRequired(true);
        setStatusMessage('Permission required: Please enable "Install unknown apps" for Momentum.');
        await openUnknownAppsSettingsDirect();
        setIsLaunchingInstaller(false);
        return;
      }

      setPermissionRequired(false);
      markVersionInstalled(updateInfo.latestVersion);
      const ok = await installDownloadedApkDirect();
      if (ok) {
        setStatusMessage('Android installer opened! Follow the prompt on your screen.');
      } else {
        setStatusMessage('Could not open installer. You can also install via Browser below.');
      }
    } catch (e) {
      console.warn('handleTriggerInstall error:', e);
      setStatusMessage('Error launching installer. Please use browser download.');
    } finally {
      setIsLaunchingInstaller(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await openUnknownAppsSettingsDirect();
    } catch (e) {
      // ignore
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo.downloadUrl) {
      onClose();
      return;
    }

    setIsDownloading(true);
    setIsDownloadComplete(false);
    setPermissionRequired(false);
    setDownloadProgress(2);
    setStatusMessage('Connecting to download server...');

    try {
      if (progressSubRef.current && typeof progressSubRef.current.remove === 'function') {
        progressSubRef.current.remove();
      }

      progressSubRef.current = addDownloadProgressListener(async (data) => {
        if (!data) return;

        if (typeof data.progress === 'number' && data.progress >= 0) {
          setDownloadProgress(data.progress);
        }

        if (data.bytesTotal > 0 && data.bytesDownloaded > 0) {
          const dl = (data.bytesDownloaded / (1024 * 1024)).toFixed(1);
          const total = (data.bytesTotal / (1024 * 1024)).toFixed(1);
          setDownloadStats(`${dl} MB / ${total} MB`);
        }

        if (data.status === 'permission_required') {
          setIsDownloadComplete(true);
          setPermissionRequired(true);
          setStatusMessage('Permission needed: Please enable "Install unknown apps" for Momentum in Settings.');
        } else if (data.status === 'installer_launched') {
          setIsDownloadComplete(true);
          setStatusMessage('Android installer launched! Complete the installation on your screen.');
          markVersionInstalled(updateInfo.latestVersion);
        } else if (data.status === 'download_complete' || data.progress >= 100) {
          setIsDownloadComplete(true);
          setStatusMessage('Download finished! Ready to install update.');
          markVersionInstalled(updateInfo.latestVersion);
        } else if (data.status === 'error' || data.status === 'download_failed') {
          setIsDownloadComplete(false);
          setStatusMessage(data.error || 'Download failed. Please try again or download via browser.');
        } else if (data.progress > 0) {
          setStatusMessage(`Downloading update... ${data.progress}%`);
        }
      });

      const fileName = `Momentum-${updateInfo.latestVersion || 'update'}.apk`;
      const started = await downloadAndInstallApkDirect(updateInfo.downloadUrl, fileName);

      if (!started) {
        // Fallback to browser download if native direct download unavailable
        markVersionInstalled(updateInfo.latestVersion);
        await downloadAndInstallUpdate(updateInfo.downloadUrl);
        cleanupDownloadState();
        onClose();
      }
    } catch (err) {
      console.warn('Native update attempt failed, falling back to browser:', err);
      await downloadAndInstallUpdate(updateInfo.downloadUrl);
      cleanupDownloadState();
      onClose();
    }
  };

  const handleBrowserDownload = async () => {
    if (isDownloading && !isDownloadComplete) {
      await handleCancelDownload();
    }
    if (updateInfo?.downloadUrl) {
      markVersionInstalled(updateInfo.latestVersion);
      await downloadAndInstallUpdate(updateInfo.downloadUrl);
    }
    onClose();
  };

  const handleRemindLater = async () => {
    if (isDownloading && !isDownloadComplete) {
      await handleCancelDownload();
    }
    await snoozeUpdateReminder(updateInfo?.latestVersion, 4);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCloseModal}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 390,
            backgroundColor: '#000000',
            borderRadius: 24,
            borderColor: '#00E676',
            borderWidth: 1.5,
            padding: 22,
            shadowColor: '#00E676',
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 14,
          }}
        >
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="w-11 h-11 rounded-2xl bg-[#000000] border border-[#15422B] items-center justify-center">
              <DownloadCloud size={20} color={colors.emerald.bright} />
            </View>
            <TouchableOpacity
              onPress={handleCloseModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-[#000000] border border-momentum-border items-center justify-center"
            >
              <X size={15} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Title & Version Info */}
          <View className="mb-3.5">
            <View className="flex-row items-center gap-2 mb-1">
              <Text
                allowFontScaling={false}
                className="text-lg font-bold text-white tracking-tight"
              >
                New Update Ready!
              </Text>
              <Sparkles size={14} color={colors.emerald.bright} />
            </View>

            <View className="flex-row items-center gap-2 mt-1">
              <View className="px-2.5 py-0.5 rounded-md bg-[#000000] border border-[#15422B]">
                <Text
                  allowFontScaling={false}
                  className="text-[10px] font-mono font-bold text-momentum-emerald"
                >
                  {updateInfo.latestVersion}
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                className="text-xs font-mono text-momentum-textMuted"
              >
                (Current: {updateInfo.currentVersion}){updateInfo.apkSize ? ` • ${updateInfo.apkSize}` : ''}
              </Text>
            </View>
          </View>

          {/* Release Notes Box */}
          <View className="mb-4 bg-[#000000] border border-momentum-border rounded-xl p-3 max-h-36">
            <Text
              allowFontScaling={false}
              className="text-[10px] font-mono text-momentum-textMuted uppercase tracking-wider mb-1 font-bold"
            >
              What's New:
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                allowFontScaling={false}
                className="text-xs text-[#D5DDD7] leading-relaxed"
              >
                {updateInfo.releaseNotes}
              </Text>
            </ScrollView>
          </View>

          {/* Download Progress & Clear Status Section */}
          {isDownloading ? (
            <View className="mb-4 bg-[#000000] border border-[#18241B] rounded-xl p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  allowFontScaling={false}
                  className="text-xs font-mono font-bold text-momentum-emerald"
                >
                  {isDownloadComplete || downloadProgress >= 100
                    ? permissionRequired
                      ? 'Permission Needed to Install'
                      : 'Download Complete!'
                    : downloadProgress > 0
                    ? `Downloading: ${downloadProgress}%`
                    : 'Starting download...'}
                </Text>
                {downloadStats ? (
                  <Text
                    allowFontScaling={false}
                    className="text-[10px] font-mono text-momentum-textMuted"
                  >
                    {downloadStats}
                  </Text>
                ) : null}
              </View>

              {/* Progress bar */}
              <View className="w-full h-2.5 rounded-full bg-[#141E17] overflow-hidden mb-2.5">
                <View
                  className="h-full bg-momentum-emerald rounded-full"
                  style={{
                    width: `${isDownloadComplete || downloadProgress >= 100 ? 100 : Math.min(100, Math.max(4, downloadProgress))}%`,
                  }}
                />
              </View>

              {/* Status explanation */}
              <View className="flex-row items-start gap-1.5 mt-1">
                {permissionRequired ? (
                  <ShieldCheck size={14} color="#FBBF24" style={{ marginTop: 2 }} />
                ) : isDownloadComplete || downloadProgress >= 100 ? (
                  <CheckCircle2 size={14} color="#00E676" style={{ marginTop: 2 }} />
                ) : (
                  <AlertCircle size={13} color="#00E676" style={{ marginTop: 2 }} />
                )}
                <Text
                  allowFontScaling={false}
                  className={`text-[11px] leading-4 flex-1 font-sans ${permissionRequired ? 'text-amber-300' : 'text-[#A2B1A6]'}`}
                >
                  {statusMessage
                    ? statusMessage
                    : isDownloadComplete || downloadProgress >= 100
                    ? 'APK saved to your device. If the Android installer did not open automatically, tap the button below.'
                    : 'Downloading directly to your phone storage. The system installer will pop up automatically when complete.'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Action Buttons */}
          {isDownloading ? (
            <View className="gap-2.5">
              {isDownloadComplete || downloadProgress >= 100 ? (
                <>
                  {permissionRequired ? (
                    <TouchableOpacity
                      onPress={handleOpenSettings}
                      activeOpacity={0.8}
                      className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-[#F59E0B]"
                    >
                      <ShieldCheck size={16} color="#000000" strokeWidth={2.5} />
                      <Text
                        allowFontScaling={false}
                        className="text-sm font-bold text-black font-sans"
                      >
                        Grant Unknown Apps Permission
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleTriggerInstall}
                    disabled={isLaunchingInstaller}
                    activeOpacity={0.8}
                    className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-momentum-emerald"
                  >
                    {isLaunchingInstaller ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <Text
                          allowFontScaling={false}
                          className="text-sm font-bold text-black font-sans"
                        >
                          Tap to Launch Installer
                        </Text>
                        <ArrowUpRight size={16} color="#000000" strokeWidth={2.5} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleBrowserDownload}
                    activeOpacity={0.7}
                    className="w-full py-2.5 rounded-xl border border-momentum-border bg-[#000000] items-center justify-center flex-row gap-2"
                  >
                    <Globe size={14} color={colors.text.secondary} />
                    <Text
                      allowFontScaling={false}
                      className="text-xs font-semibold text-momentum-textSecondary font-sans"
                    >
                      Or Open Download in Browser (Chrome)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCloseModal}
                    activeOpacity={0.7}
                    className="w-full py-2 items-center justify-center"
                  >
                    <Text
                      allowFontScaling={false}
                      className="text-xs font-semibold text-momentum-textMuted"
                    >
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleCancelDownload}
                    activeOpacity={0.8}
                    className="w-full py-3 rounded-xl border border-red-500/60 bg-red-950/20 items-center justify-center flex-row gap-2"
                  >
                    <X size={15} color="#F87171" strokeWidth={2.5} />
                    <Text
                      allowFontScaling={false}
                      className="text-xs font-bold text-red-400 font-sans"
                    >
                      Cancel Download
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleBrowserDownload}
                    activeOpacity={0.7}
                    className="w-full py-2.5 rounded-xl border border-momentum-border bg-[#000000] items-center justify-center flex-row gap-2"
                  >
                    <Globe size={14} color={colors.text.secondary} />
                    <Text
                      allowFontScaling={false}
                      className="text-xs font-semibold text-momentum-textSecondary font-sans"
                    >
                      Or Download via Browser (Chrome)
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View className="gap-2.5">
              <TouchableOpacity
                onPress={handleUpdate}
                activeOpacity={0.8}
                className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-momentum-emerald"
              >
                <Text
                  allowFontScaling={false}
                  className="text-sm font-bold text-black font-sans"
                >
                  Install Update
                </Text>
                <ArrowUpRight size={16} color="#000000" strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBrowserDownload}
                activeOpacity={0.7}
                className="w-full py-2.5 rounded-xl border border-momentum-border bg-[#000000] items-center justify-center flex-row gap-2"
              >
                <Globe size={14} color={colors.emerald.bright} />
                <Text
                  allowFontScaling={false}
                  className="text-xs font-semibold text-white font-sans"
                >
                  Download via Browser
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRemindLater}
                activeOpacity={0.7}
                className="w-full py-2 items-center justify-center"
              >
                <Text
                  allowFontScaling={false}
                  className="text-xs font-semibold text-momentum-textMuted"
                >
                  Remind Me Later (in 4 hours)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
