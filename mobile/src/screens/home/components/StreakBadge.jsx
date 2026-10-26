import React from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export default function StreakBadge({ streak = 0 }) {
  return (
    <View className="flex-row items-center bg-momentum-surface border border-momentum-border rounded-xl px-2.5 py-1.5 self-start mb-3">
      <Flame size={14} color={streak > 0 ? colors.emerald.bright : colors.text.muted} />
      <Text className="text-xs font-mono font-bold text-momentum-textPrimary ml-1.5">
        {streak} {streak === 1 ? 'day' : 'days'} streak
      </Text>
    </View>
  );
}
