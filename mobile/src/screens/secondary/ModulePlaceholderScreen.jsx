import React from 'react';
import { View, Text } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { Construction } from 'lucide-react-native';

export default function ModulePlaceholderScreen({ route, navigation }) {
  const { title = 'Module', description = 'This module is planned for a future release.' } =
    route.params || {};

  return (
    <View className="flex-1 bg-momentum-bg">
      <AppHeader navigation={navigation} title={title} />
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-14 h-14 rounded-2xl bg-momentum-surface border border-momentum-border items-center justify-center mb-4">
          <Construction size={24} color="#69736B" />
        </View>
        <Text className="text-base font-bold text-momentum-textPrimary mb-1.5 text-center">
          {title}
        </Text>
        <Text className="text-xs text-momentum-textSecondary text-center max-w-xs leading-relaxed mb-4">
          {description}
        </Text>
        <View className="px-3 py-1 rounded-full bg-momentum-surface border border-momentum-border">
          <Text className="text-[10px] font-mono text-momentum-textMuted uppercase tracking-wider">
            Planned Module
          </Text>
        </View>
      </View>
    </View>
  );
}
