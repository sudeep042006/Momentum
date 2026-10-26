import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Clock, Trash2 } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { formatTime12h } from '../../../utils/timeUtils';

const CATEGORY_STYLES = {
  development: { bg: '#0D241C', text: '#00E676' },
  backend: { bg: '#0D241C', text: '#00E676' },
  practice: { bg: '#0C2338', text: '#38BDF8' },
  academic: { bg: '#0C2338', text: '#38BDF8' },
  learning: { bg: '#271438', text: '#C084FC' },
  personal: { bg: '#33220A', text: '#F59E0B' },
  planning: { bg: '#33220A', text: '#F59E0B' },
  health: { bg: '#0D241C', text: '#00E676' },
  work: { bg: '#0D241C', text: '#00E676' },
};

export default function TaskRow({ task, onToggle, onDelete }) {
  const isCompleted = task.status === 'completed';
  const catKey = (task.category || 'development').toLowerCase();
  const catStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.development;

  return (
    <View className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-momentum-card border border-momentum-border">
      <View className="flex-row items-center gap-3.5 flex-1 mr-2">
        {/* Instant Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(task)}
          activeOpacity={0.7}
          delayPressIn={0}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: isCompleted ? colors.emerald.bright : '#090D0A',
            borderWidth: isCompleted ? 0 : 1.2,
            borderColor: '#243629',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isCompleted && <Check size={14} color="#000000" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Task Title & Meta */}
        <View className="flex-1">
          <Text
            allowFontScaling={false}
            className={`text-[13px] font-semibold leading-tight ${
              isCompleted ? 'line-through text-momentum-textMuted' : 'text-white'
            }`}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
            {/* Category Pill */}
            <View
              className="px-2 py-0.5 rounded-md"
              style={{ backgroundColor: catStyle.bg }}
            >
              <Text
                allowFontScaling={false}
                className="text-[9px] font-mono font-bold uppercase tracking-wider"
                style={{ color: catStyle.text }}
              >
                {task.category || 'DEVELOPMENT'}
              </Text>
            </View>

            {/* Time code */}
            {task.startTime ? (
              <View className="flex-row items-center">
                <Clock size={11} color={colors.text.muted} />
                <Text
                  allowFontScaling={false}
                  className="text-[10px] font-mono text-momentum-textSecondary ml-1"
                >
                  {formatTime12h(task.startTime)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Delete Icon on Right Side */}
      <TouchableOpacity
        onPress={() => onDelete(task._id)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        delayPressIn={0}
        activeOpacity={0.6}
        className="w-8 h-8 rounded-xl items-center justify-center bg-momentum-surface border border-momentum-border/60"
      >
        <Trash2 size={15} color={colors.text.muted} />
      </TouchableOpacity>
    </View>
  );
}
