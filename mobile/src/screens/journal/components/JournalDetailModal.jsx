import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Edit3,
  Trash2,
  FileText,
  Quote,
  Calendar,
  Clock,
  Tag,
} from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export default function JournalDetailModal({
  visible,
  item,
  onClose,
  onEdit,
  onDelete,
}) {
  const insets = useSafeAreaInsets();

  if (!item) return null;

  const isQuote = item.type === 'quote';
  const dateObj = new Date(item.createdAt || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const tags = Array.isArray(item.tags)
    ? item.tags
    : item.tags
    ? [item.tags]
    : isQuote
    ? ['Quote']
    : ['Notes'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
        }}
      >
        {/* Modal Window Container */}
        <View
          style={{
            width: '100%',
            maxHeight: '90%',
            backgroundColor: '#000000',
            borderRadius: 24,
            borderColor: '#00E676',
            borderWidth: 1.5,
            shadowColor: '#00E676',
            shadowOpacity: 0.18,
            shadowRadius: 22,
            elevation: 12,
            overflow: 'hidden',
          }}
        >
          {/* Top Action Bar */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-momentum-border bg-[#000000]">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-xl bg-[#000000] border border-[#15422B] items-center justify-center">
                {isQuote ? (
                  <Quote size={15} color={colors.emerald.bright} />
                ) : (
                  <FileText size={15} color={colors.emerald.bright} />
                )}
              </View>
              <View>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider text-momentum-emerald"
                >
                  {isQuote ? 'Quote of the Day' : 'Journal Note'}
                </Text>
              </View>
            </View>

            {/* Actions: Edit, Delete, Close */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onEdit(item);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-8 h-8 rounded-xl bg-momentum-surface border border-momentum-border items-center justify-center"
                activeOpacity={0.7}
              >
                <Edit3 size={15} color={colors.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onDelete(item._id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-900/60 items-center justify-center"
                activeOpacity={0.7}
              >
                <Trash2 size={15} color="#ef4444" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-8 h-8 rounded-xl bg-momentum-surface border border-momentum-border items-center justify-center ml-1"
                activeOpacity={0.7}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Note Content */}
          <ScrollView
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Big Title */}
            <Text
              allowFontScaling={false}
              className="text-xl font-bold text-white tracking-tight leading-tight mb-2"
            >
              {item.title || (isQuote ? 'Quote' : 'Untitled Note')}
            </Text>

            {/* Date and Time Meta Pill */}
            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-row items-center bg-momentum-surface border border-momentum-border px-2.5 py-1 rounded-lg">
                <Calendar size={11} color={colors.text.muted} />
                <Text
                  allowFontScaling={false}
                  className="text-[10px] font-mono text-momentum-textSecondary ml-1.5"
                >
                  {dateStr}
                </Text>
              </View>

              <View className="flex-row items-center bg-momentum-surface border border-momentum-border px-2.5 py-1 rounded-lg">
                <Clock size={11} color={colors.text.muted} />
                <Text
                  allowFontScaling={false}
                  className="text-[10px] font-mono text-momentum-textSecondary ml-1.5"
                >
                  {timeStr}
                </Text>
              </View>
            </View>

            {/* Optional Attached Image */}
            {item.image ? (
              <View className="mb-4 rounded-2xl overflow-hidden border border-momentum-border bg-[#000000]">
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-56"
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {/* Full Content Body */}
            <View
              className={`p-4 rounded-2xl mb-4 ${
                isQuote
                  ? 'bg-[#000000] border-l-4 border-momentum-emerald'
                  : 'bg-momentum-surface/80 border border-momentum-border'
              }`}
            >
              <Text
                allowFontScaling={false}
                className={`text-sm leading-relaxed ${
                  isQuote
                    ? 'italic font-serif text-white text-base'
                    : 'text-[#D5DDD7] font-normal'
                }`}
              >
                {item.content}
              </Text>
            </View>

            {/* Tags Section */}
            {tags && tags.length > 0 && (
              <View className="pt-2 border-t border-momentum-border">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Tag size={12} color={colors.text.muted} />
                  <Text
                    allowFontScaling={false}
                    className="text-[10px] font-mono uppercase tracking-wider text-momentum-textMuted font-semibold"
                  >
                    Tags
                  </Text>
                </View>

                <View className="flex-row items-center gap-2 flex-wrap">
                  {tags.map((tag, idx) => (
                    <View
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-[#000000] border border-[#15422B]"
                    >
                      <Text
                        allowFontScaling={false}
                        className="text-[10px] font-mono font-medium text-momentum-emerald"
                      >
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
