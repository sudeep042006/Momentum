import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, Sliders, RefreshCw } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export default function DailyQuoteCard({
  quote = 'Discipline equals freedom.',
  author = 'Jocko Willink',
  category = 'DISCIPLINE',
  onOpenSetup,
  onQuickRefresh,
  isLoading = false,
}) {
  return (
    <View className="mb-4 bg-[#000000] border border-[#142E1F] rounded-2xl p-4 shadow-sm">
      {/* Top Bar: Category Pill & Setup Button */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={12} color={colors.emerald.bright} />
          <Text
            allowFontScaling={false}
            className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-momentum-emerald"
          >
            DAILY MOTIVATION • {category || 'FOCUS'}
          </Text>
        </View>

        {/* Set Up Quote Options Button */}
        <TouchableOpacity
          onPress={onOpenSetup}
          activeOpacity={0.7}
          className="flex-row items-center gap-1.5 bg-[#000000] border border-[#1A3A27] px-2.5 py-1 rounded-lg"
        >
          <Sliders size={11} color={colors.emerald.bright} />
          <Text
            allowFontScaling={false}
            className="text-[10px] font-mono font-bold text-momentum-emerald"
          >
            SET UP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quote Body */}
      <Text
        allowFontScaling={false}
        className="text-[13px] font-semibold text-white italic leading-snug mb-2"
        numberOfLines={3}
      >
        "{quote}"
      </Text>

      {/* Footer: Author & Quick Refresh */}
      <View className="flex-row items-center justify-between">
        <Text
          allowFontScaling={false}
          className="text-xs font-mono font-bold text-momentum-textSecondary"
        >
          — {author}
        </Text>

        <TouchableOpacity
          onPress={onQuickRefresh}
          disabled={isLoading}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="flex-row items-center gap-1"
        >
          <RefreshCw size={11} color={colors.text.muted} />
          <Text
            allowFontScaling={false}
            className="text-[10px] font-mono text-momentum-textMuted"
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
