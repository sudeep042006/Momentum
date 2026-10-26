import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { DownloadCloud, Sparkles, X, ArrowUpRight } from 'lucide-react-native';
import { downloadAndInstallUpdate, snoozeUpdateReminder } from '../services/updateService';
import { downloadAndInstallApkDirect, addDownloadProgressListener } from '../services/systemNotificationService';
import { colors } from '../theme/colors';

export default function UpdateModal({
  visible,
  updateInfo,
  onClose,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStats, setDownloadStats] = useState('');

  useEffect(() => {
    if (!visible) {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadStats('');
    }
  }, [visible]);

  if (!visible || !updateInfo) return null;

  const handleUpdate = async () => {
    if (!updateInfo.downloadUrl) {
      onClose();
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(2);

    // 1. Listen for live download progress events from Android DownloadManager
    let sub = null;
    try {
      sub = addDownloadProgressListener((data) => {
        if (data && typeof data.progress === 'number') {
          setDownloadProgress(data.progress);
          if (data.bytesTotal > 0) {
            const dl = (data.bytesDownloaded / (1024 * 1024)).toFixed(1);
            const total = (data.bytesTotal / (1024 * 1024)).toFixed(1);
            setDownloadStats(`${dl} MB / ${total} MB`);
          }
        }
      });

      const fileName = `Momentum-${updateInfo.latestVersion || 'update'}.apk`;
      const started = await downloadAndInstallApkDirect(updateInfo.downloadUrl, fileName);

      if (!started) {
        // Fallback to browser download if native DownloadManager unavailable
        await downloadAndInstallUpdate(updateInfo.downloadUrl);
        setTimeout(() => {
          setIsDownloading(false);
          onClose();
        }, 1500);
      }
    } catch (err) {
      // Fallback
      await downloadAndInstallUpdate(updateInfo.downloadUrl);
      setIsDownloading(false);
      onClose();
    } finally {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    }
  };

  const handleRemindLater = async () => {
    await snoozeUpdateReminder(updateInfo?.latestVersion, 4); // Remind after 4 hours for this version
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleRemindLater}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: '#0D120F',
            borderRadius: 24,
            borderColor: '#1E2E22',
            borderWidth: 1.2,
            padding: 24,
            shadowColor: '#00E676',
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="w-12 h-12 rounded-2xl bg-[#0D241C] border border-[#15422B] items-center justify-center">
              <DownloadCloud size={22} color={colors.emerald.bright} />
            </View>
            <TouchableOpacity
              onPress={handleRemindLater}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-momentum-surface border border-momentum-border items-center justify-center"
            >
              <X size={15} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Title & Subtitle */}
          <View className="mb-4">
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
              <View className="px-2.5 py-0.5 rounded-md bg-[#0D241C] border border-[#15422B]">
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
          <View className="mb-5 bg-momentum-surface/80 border border-momentum-border rounded-xl p-3.5 max-h-40">
            <Text
              allowFontScaling={false}
              className="text-[10px] font-mono text-momentum-textMuted uppercase tracking-wider mb-1.5 font-bold"
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

          {/* In-App Download Progress Bar (Direct In-App Install) */}
          {isDownloading && (
            <View className="mb-4 bg-[#080D09] border border-[#18241B] rounded-xl p-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  allowFontScaling={false}
                  className="text-xs font-mono font-bold text-momentum-emerald"
                >
                  {downloadProgress >= 100
                    ? 'Launching Installer...'
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

              <View className="w-full h-2.5 rounded-full bg-[#141E17] overflow-hidden">
                <View
                  className="h-full bg-momentum-emerald rounded-full"
                  style={{ width: `${Math.min(100, Math.max(4, downloadProgress))}%` }}
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isDownloading}
            activeOpacity={0.8}
            className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 mb-2.5 ${
              isDownloading ? 'bg-[#182B1F]' : 'bg-momentum-emerald'
            }`}
          >
            {isDownloading ? (
              <>
                <ActivityIndicator size="small" color="#00E676" />
                <Text
                  allowFontScaling={false}
                  className="text-sm font-bold text-momentum-emerald font-sans ml-1"
                >
                  {downloadProgress >= 100 ? 'Installing...' : `Downloading (${downloadProgress}%)`}
                </Text>
              </>
            ) : (
              <>
                <Text
                  allowFontScaling={false}
                  className="text-sm font-bold text-black font-sans"
                >
                  Install Update
                </Text>
                <ArrowUpRight size={16} color="#000000" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRemindLater}
            disabled={isDownloading}
            activeOpacity={0.7}
            className="w-full py-2.5 items-center justify-center"
          >
            <Text
              allowFontScaling={false}
              className="text-xs font-semibold text-momentum-textMuted"
            >
              Remind Me Later (in 4 hours)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
