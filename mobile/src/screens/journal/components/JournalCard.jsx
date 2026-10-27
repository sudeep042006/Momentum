import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FileText, Quote, MoreHorizontal, ImageIcon } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export default function JournalCard({ item, onPress, onEdit, onDelete }) {
  const isQuote = item.type === 'quote';

  // Format date: Aug 24, 2026 \n 10:32 PM
  const dateObj = new Date(item.createdAt || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Generate tags if string or array
  const tags = Array.isArray(item.tags)
    ? item.tags
    : item.tags
    ? [item.tags]
    : isQuote
    ? ['Quote']
    : ['Notes'];

  return (
    <TouchableOpacity
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.75}
      className="p-4 mb-3 rounded-2xl bg-momentum-card border border-momentum-border"
    >
      {/* Top Header Row */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          {/* Green Icon Box */}
          <View className="w-8 h-8 rounded-xl bg-[#000000] border border-[#15422B] items-center justify-center">
            {isQuote ? (
              <Quote size={15} color={colors.emerald.bright} />
            ) : (
              <FileText size={15} color={colors.emerald.bright} />
            )}
          </View>

          <Text
            allowFontScaling={false}
            className="text-sm font-bold text-white flex-1"
            numberOfLines={1}
          >
            {item.title || (isQuote ? 'Quote of the Day' : 'Untitled Note')}
          </Text>
        </View>

        {/* Right: Timestamp and Action */}
        <View className="items-end">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit && onEdit(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="p-1 -mr-1"
          >
            <MoreHorizontal size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <Text
            allowFontScaling={false}
            className="text-[9px] font-mono text-momentum-textMuted mt-0.5 text-right"
          >
            {dateStr}
          </Text>
          <Text
            allowFontScaling={false}
            className="text-[9px] font-mono text-momentum-textMuted text-right"
          >
            {timeStr}
          </Text>
        </View>
      </View>

      {/* Content preview */}
      <Text
        allowFontScaling={false}
        className={`text-xs leading-relaxed mb-3 ${
          isQuote
            ? 'italic text-white pl-2.5 border-l-2 border-momentum-emerald'
            : 'text-momentum-textSecondary'
        }`}
        numberOfLines={3}
      >
        {item.content}
      </Text>

      {/* Attached Image Preview */}
      {item.image ? (
        <View className="mb-3 rounded-xl overflow-hidden border border-momentum-border bg-[#000000]">
          <Image
            source={{ uri: item.image }}
            className="w-full h-44"
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Tags Pills */}
      <View className="flex-row items-center gap-2 flex-wrap">
        {tags.map((tag, idx) => (
          <View
            key={idx}
            className="px-2.5 py-1 rounded-md bg-[#000000] border border-[#15422B]"
          >
            <Text
              allowFontScaling={false}
              className="text-[9.5px] font-mono font-medium text-momentum-emerald"
            >
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
