import React from 'react';
import { View, Text } from 'react-native';
import { useSync } from '../context/SyncContext';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount } = useSync();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <View
      className={`flex-row items-center justify-center py-1.5 px-3 border-b ${
        !isOnline
          ? 'bg-[#151206] border-[#382b08]'
          : 'bg-[#000000] border-[#0e3b1f]'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff size={13} color={colors.status.warning} />
          <Text className="text-[11px] text-[#f59e0b] ml-1.5 font-medium">
            Offline • {pendingCount > 0 ? `${pendingCount} changes saved locally` : 'Working locally'}
          </Text>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={12} color={colors.emerald.bright} />
          <Text className="text-[11px] text-momentum-emerald ml-1.5 font-medium">
            Syncing changes with cloud...
          </Text>
        </>
      ) : null}
    </View>
  );
}
