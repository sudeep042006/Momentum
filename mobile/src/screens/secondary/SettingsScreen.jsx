import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AppHeader from '../../components/AppHeader';
import SyncStatusBar from '../../components/SyncStatusBar';
import { PRIMARY_API_URL, FALLBACK_API_URL } from '../../api/apiClient';
import { syncQueue } from '../../storage/syncQueue';
import { localStorage } from '../../storage/localStorage';
import { useSync } from '../../context/SyncContext';
import { syncEngine } from '../../sync/syncEngine';
import { Server, Database, Trash2, RefreshCw } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function SettingsScreen({ navigation }) {
  const { isOnline, pendingCount } = useSync();
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Local Cache',
      'This will clear cached dashboard data. Authentication and pending sync queue will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              // Clear cached keys
              await localStorage.removeItem('cached_heatmap');
              await localStorage.removeItem('cached_stats');
              await localStorage.removeItem('cached_schedule');
              await localStorage.removeItem('cached_journals');
              Alert.alert('Done', 'Local cache cleared.');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while device is offline.');
      return;
    }
    await syncEngine.drainQueue();
    Alert.alert('Sync Finished', 'Pending outbox queue has been processed.');
  };

  return (
    <View className="flex-1 bg-momentum-bg">
      <AppHeader navigation={navigation} title="Settings & Diagnostics" />
      <SyncStatusBar />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xs uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2">
          Backend & Network
        </Text>
        <View className="p-4 mb-4 rounded-xl bg-momentum-card border border-momentum-border">
          <View className="flex-row items-center gap-2 mb-2">
            <Server size={15} color={colors.emerald.bright} />
            <Text className="text-xs font-bold text-momentum-textPrimary">
              Active API Endpoints
            </Text>
          </View>
          <Text className="text-[11px] font-mono text-momentum-textSecondary mb-1">
            Primary: {PRIMARY_API_URL}
          </Text>
          <Text className="text-[11px] font-mono text-momentum-textMuted mb-2">
            Fallback: {FALLBACK_API_URL}
          </Text>
          <View className="flex-row items-center gap-1.5 pt-2 border-t border-momentum-border">
            <View
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-momentum-emerald' : 'bg-red-500'
              }`}
            />
            <Text className="text-xs font-semibold text-momentum-textPrimary">
              Status: {isOnline ? 'Connected' : 'Offline Mode'}
            </Text>
          </View>
        </View>

        <Text className="text-xs uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2">
          Offline Storage & Sync
        </Text>
        <View className="p-4 mb-6 rounded-xl bg-momentum-card border border-momentum-border">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Database size={15} color={colors.emerald.bright} />
              <Text className="text-xs font-bold text-momentum-textPrimary">
                Pending Outbox Queue
              </Text>
            </View>
            <Text className="text-xs font-mono font-bold text-momentum-emerald">
              {pendingCount} item{pendingCount === 1 ? '' : 's'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleForceSync}
            disabled={pendingCount === 0 || !isOnline}
            className={`py-2.5 px-3 rounded-lg border flex-row items-center justify-center gap-2 mb-3 ${
              pendingCount > 0 && isOnline
                ? 'bg-momentum-surface border-momentum-emerald'
                : 'bg-momentum-surface/40 border-momentum-border opacity-50'
            }`}
          >
            <RefreshCw size={13} color={colors.emerald.bright} />
            <Text className="text-xs font-semibold text-momentum-emerald">
              Force Sync Outbox
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearCache}
            disabled={clearing}
            className="py-2.5 px-3 rounded-lg bg-momentum-surface border border-red-950 flex-row items-center justify-center gap-2"
          >
            <Trash2 size={13} color="#ef4444" />
            <Text className="text-xs font-semibold text-red-400">
              Clear Cache
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mt-6">
          <Text className="text-xs font-mono text-momentum-textMuted">
            Mommenttum Mobile v1.0.0
          </Text>
          <Text className="text-[10px] text-momentum-textDisabled mt-1">
            Developer Productivity Architecture
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
