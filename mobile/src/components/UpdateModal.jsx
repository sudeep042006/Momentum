import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { DownloadCloud, Sparkles, X, ArrowUpRight, Globe, AlertCircle } from 'lucide-react-native';
import { downloadAndInstallUpdate, snoozeUpdateReminder, markVersionInstalled } from '../services/updateService';
import {
  downloadAndInstallApkDirect,
  cancelApkDownloadDirect,
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
  const progressSubRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      cleanupDownloadState();
    }
  }, [visible]);

  const cleanupDownloadState = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadStats('');
    setStatusMessage('');
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
    if (isDownloading) {
      await handleCancelDownload();
    }
    onClose();
  };

  const handleUpdate = async () => {
    if (!updateInfo.downloadUrl) {
      onClose();
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(2);
    setStatusMessage('Connecting to download server...');

    try {
      if (progressSubRef.current && typeof progressSubRef.current.remove === 'function') {
        progressSubRef.current.remove();
      }

      progressSubRef.current = addDownloadProgressListener((data) => {
        if (data && typeof data.progress === 'number') {
          setDownloadProgress(data.progress);
          if (data.bytesTotal > 0) {
            const dl = (data.bytesDownloaded / (1024 * 1024)).toFixed(1);
            const total = (data.bytesTotal / (1024 * 1024)).toFixed(1);
            setDownloadStats(`${dl} MB / ${total} MB`);
          }

          if (data.progress >= 100 || data.status === 'download_complete') {
            setStatusMessage('Download finished! Opening Android installer...');
            markVersionInstalled(updateInfo.latestVersion);
          } else {
            setStatusMessage(`Downloading update... ${data.progress}%`);
          }
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
    if (isDownloading) {
      await handleCancelDownload();
    }
    if (updateInfo?.downloadUrl) {
      markVersionInstalled(updateInfo.latestVersion);
      await downloadAndInstallUpdate(updateInfo.downloadUrl);
    }
    onClose();
  };

  const handleRemindLater = async () => {
    if (isDownloading) {
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
                  {downloadProgress >= 100
                    ? 'Launching Android Installer...'
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
                  style={{ width: `${Math.min(100, Math.max(4, downloadProgress))}%` }}
                />
              </View>

              {/* Status explanation */}
              <View className="flex-row items-start gap-1.5 mt-1">
                <AlertCircle size={13} color="#00E676" style={{ marginTop: 2 }} />
                <Text
                  allowFontScaling={false}
                  className="text-[11px] text-[#A2B1A6] leading-4 flex-1 font-sans"
                >
                  {downloadProgress >= 100
                    ? 'Download complete! The system package installer is launching. If prompted, please allow "Install unknown apps" for Momentum.'
                    : 'Downloading directly to your phone storage. The system installer will pop up automatically when complete.'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Action Buttons */}
          {isDownloading ? (
            <View className="gap-2.5">
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
