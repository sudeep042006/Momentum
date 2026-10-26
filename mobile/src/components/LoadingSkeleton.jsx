import React from 'react';
import { View } from 'react-native';

export default function LoadingSkeleton({ count = 3, height = 48 }) {
  return (
    <View className="gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="bg-momentum-card border border-momentum-border rounded-xl opacity-60"
          style={{ height }}
        />
      ))}
    </View>
  );
}
