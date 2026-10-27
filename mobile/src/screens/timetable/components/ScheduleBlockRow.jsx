import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Dumbbell,
  Coffee,
  Utensils,
  GraduationCap,
  Laptop,
  Code,
  Database,
  BookOpen,
  Calendar,
  MoreHorizontal,
  CheckSquare,
} from 'lucide-react-native';
import { colors } from '../../../theme/colors';

// Match icon and styling by activity title / category
function getActivityMeta(title = '', category = '') {
  const lower = title.toLowerCase();
  const catLower = category.toLowerCase();

  if (lower.includes('gym') || lower.includes('workout')) {
    return {
      icon: Dumbbell,
      accent: '#00E676',
      badge: 'HEALTH',
      badgeBg: '#000000',
      badgeText: '#00E676',
    };
  }
  if (lower.includes('morning') || lower.includes('routine')) {
    return {
      icon: Coffee,
      accent: '#F59E0B',
      badge: 'PERSONAL',
      badgeBg: '#33220A',
      badgeText: '#F59E0B',
    };
  }
  if (lower.includes('breakfast') || lower.includes('dinner') || lower.includes('lunch')) {
    return {
      icon: Utensils,
      accent: '#F59E0B',
      badge: 'PERSONAL',
      badgeBg: '#33220A',
      badgeText: '#F59E0B',
    };
  }
  if (lower.includes('college') || lower.includes('university') || catLower.includes('academic')) {
    return {
      icon: GraduationCap,
      accent: '#38BDF8',
      badge: 'ACADEMIC',
      badgeBg: '#0C2338',
      badgeText: '#38BDF8',
    };
  }
  if (lower.includes('backend') || lower.includes('code')) {
    return {
      icon: Code,
      accent: '#38BDF8',
      badge: 'DEVELOPMENT',
      badgeBg: '#0C2338',
      badgeText: '#38BDF8',
    };
  }
  if (lower.includes('sql') || lower.includes('database')) {
    return {
      icon: Database,
      accent: '#C084FC',
      badge: 'LEARNING',
      badgeBg: '#271438',
      badgeText: '#C084FC',
    };
  }
  if (lower.includes('dsa') || catLower.includes('learning')) {
    return {
      icon: Laptop,
      accent: '#C084FC',
      badge: 'LEARNING',
      badgeBg: '#271438',
      badgeText: '#C084FC',
    };
  }
  if (lower.includes('read') || lower.includes('book')) {
    return {
      icon: BookOpen,
      accent: '#00E676',
      badge: 'PERSONAL',
      badgeBg: '#33220A',
      badgeText: '#F59E0B',
    };
  }

  return {
    icon: Calendar,
    accent: '#00E676',
    badge: 'ROUTINE',
    badgeBg: '#000000',
    badgeText: '#00E676',
  };
}

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [hours, minutes] = timeStr.split(':');
  if (hours !== undefined && minutes !== undefined) {
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
};

export default function ScheduleBlockRow({ block, isCurrentTime = false, onEdit, onDelete }) {
  const meta = getActivityMeta(block.title, block.category);
  const IconComponent = meta.icon;
  const startFormatted = formatTime12h(block.startTime);
  const endFormatted = formatTime12h(block.endTime);

  return (
    <View className="flex-row items-center mb-3">
      {/* Left Time Column & Timeline Dot */}
      <View className="w-16 items-start justify-center pr-2">
        <Text
          className={`text-[10px] font-mono font-medium ${
            isCurrentTime ? 'text-momentum-emerald font-bold' : 'text-momentum-textMuted'
          }`}
        >
          {startFormatted || '09:00 AM'}
        </Text>
      </View>

      {/* Timeline Node & Vertical Connector */}
      <View className="items-center mr-3 relative justify-center">
        {isCurrentTime ? (
          <View className="w-3.5 h-3.5 rounded-full border-2 border-momentum-emerald bg-momentum-bg items-center justify-center">
            <View className="w-1.5 h-1.5 rounded-full bg-momentum-emerald" />
          </View>
        ) : (
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: meta.accent }}
          />
        )}
      </View>

      {/* Activity Card */}
      <TouchableOpacity
        onPress={() => onEdit && onEdit(block)}
        activeOpacity={0.8}
        className="flex-1 flex-row items-center justify-between p-3 rounded-2xl bg-momentum-card border"
        style={{
          borderColor: isCurrentTime ? colors.emerald.bright : '#18241B',
          shadowColor: meta.accent,
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          {/* Category Icon Container */}
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{
              backgroundColor: `${meta.accent}18`,
              borderColor: `${meta.accent}30`,
              borderWidth: 1,
            }}
          >
            <IconComponent size={17} color={meta.accent} strokeWidth={2.2} />
          </View>

          {/* Title and Time Range */}
          <View className="flex-1">
            <Text className="text-xs font-bold text-white tracking-tight" numberOfLines={1}>
              {typeof block.title === 'string' && /^[0-9a-fA-F]{24,}$/.test(block.title.trim())
                ? 'Free Slot'
                : (block.title || 'Free Slot')}
            </Text>
            <Text className="text-[10px] font-mono text-momentum-textSecondary mt-0.5">
              {startFormatted} – {endFormatted}
            </Text>
          </View>
        </View>

        {/* Right Badge and More Button */}
        <View className="flex-row items-center gap-1.5">
          {Boolean(block.addToDailyList) && (
            <View className="px-1.5 py-0.5 rounded-md bg-[#00E676]/15 border border-[#00E676]/40 flex-row items-center gap-0.5">
              <CheckSquare size={9} color="#00E676" />
              <Text className="text-[8.5px] font-mono font-bold text-[#00E676]">
                DAILY
              </Text>
            </View>
          )}

          <View
            className="px-2 py-0.5 rounded-md"
            style={{ backgroundColor: meta.badgeBg }}
          >
            <Text
              className="text-[9px] font-mono font-bold tracking-wider"
              style={{ color: meta.badgeText }}
            >
              {meta.badge}
            </Text>
          </View>

          <View className="p-1 -mr-1">
            <MoreHorizontal size={16} color={colors.text.muted} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
