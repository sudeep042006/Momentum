import React from 'react';
import { View, Text } from 'react-native';
import { Flame, Code, Database, BookOpen, Mountain, Lock } from 'lucide-react-native';

const BADGE_CONFIG = {
  streak: { icon: Flame, color: '#00E676', bg: '#000000', border: '#1B472A' },
  dsa: { icon: Code, color: '#38BDF8', bg: '#0C2338', border: '#133857' },
  backend: { icon: Database, color: '#818CF8', bg: '#1A1B3A', border: '#2C2D5A' },
  knowledge: { icon: BookOpen, color: '#10B981', bg: '#000000', border: '#15402D' },
  consistency: { icon: Mountain, color: '#F59E0B', bg: '#33220A', border: '#523610' },
  lock: { icon: Lock, color: '#526056', bg: '#000000', border: '#1A241D' },
};

export default function BadgeCard({ type = 'streak', title, subtitle }) {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG.streak;
  const IconComponent = config.icon;

  return (
    <View className="items-center p-3 rounded-2xl bg-momentum-card border border-momentum-border w-[102px]">
      {/* Hexagonal container */}
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mb-2"
        style={{
          backgroundColor: config.bg,
          borderColor: config.border,
          borderWidth: 1.5,
          shadowColor: config.color,
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }}
      >
        <IconComponent size={20} color={config.color} strokeWidth={2.2} />
      </View>

      <Text className="text-[10.5px] font-bold text-white text-center leading-tight mb-0.5" numberOfLines={2}>
        {title}
      </Text>
      <Text className="text-[9px] font-mono text-momentum-textMuted text-center">
        {subtitle}
      </Text>
    </View>
  );
}
