import React from 'react';
import { View, Text } from 'react-native';

export default function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <View className="items-center justify-center py-12 px-6">
      {Icon && (
        <View className="w-12 h-12 rounded-xl bg-momentum-surface border border-momentum-border items-center justify-center mb-3">
          <Icon size={22} color="#69736B" />
        </View>
      )}
      <Text className="text-sm font-semibold text-momentum-textPrimary mb-1 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-xs text-momentum-textSecondary text-center max-w-[260px] leading-relaxed mb-4">
          {description}
        </Text>
      )}
      {action && <View>{action}</View>}
    </View>
  );
}
