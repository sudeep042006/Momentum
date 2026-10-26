import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function SegmentedControl({ options, selected, onSelect }) {
  return (
    <View className="flex-row bg-momentum-surface border border-momentum-border rounded-xl p-1">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.8}
            className={`flex-1 py-2 rounded-lg items-center justify-center transition-all ${
              isSelected ? 'bg-momentum-emeraldDeep' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isSelected ? 'text-momentum-textPrimary' : 'text-momentum-textSecondary'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
