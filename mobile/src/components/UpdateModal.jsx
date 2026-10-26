import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { DownloadCloud, Sparkles, X, ArrowUpRight } from 'lucide-react-native';
import { downloadAndInstallUpdate } from '../services/updateService';
import { colors } from '../theme/colors';

export default function UpdateModal({
  visible,
  updateInfo,
  onClose,
}) {
  if (!visible || !updateInfo) return null;

  const handleUpdate = () => {
    if (updateInfo.downloadUrl) {
      downloadAndInstallUpdate(updateInfo.downloadUrl);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
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
              onPress={onClose}
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
                (Installed: {updateInfo.currentVersion})
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

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleUpdate}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-xl bg-momentum-emerald flex-row items-center justify-center gap-2 mb-2.5"
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
            onPress={onClose}
            activeOpacity={0.7}
            className="w-full py-2.5 items-center justify-center"
          >
            <Text
              allowFontScaling={false}
              className="text-xs font-semibold text-momentum-textMuted"
            >
              Remind Me Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
