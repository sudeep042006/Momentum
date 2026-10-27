import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, ChevronDown, X } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

const CELL_SIZE = 10;
const CELL_GAP = 2.5;

const LEVEL_COLORS = [
  '#000000', // Level 0: 0% / empty
  '#0d381e', // Level 1: 1-25%
  '#086634', // Level 2: 26-50%
  '#009e4d', // Level 3: 51-75%
  '#00E676', // Level 4: 76-99%
  '#5cff9d', // Level 5: 100%
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const formatReadableDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function ContributionHeatmap({
  heatmapData = [],
  todayTasks = null,
  showLegend = false,
}) {
  const scrollRef = useRef(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const totalWeeks = 24;
  const weeks = [];
  const now = new Date();

  // Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = now.getDay();
  // Map so Monday = 0, Tuesday = 1, ..., Sunday = 6
  const currentDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const yToday = now.getFullYear();
  const mToday = String(now.getMonth() + 1).padStart(2, '0');
  const dToday = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yToday}-${mToday}-${dToday}`;

  // Find Monday of the current week
  const currentWeekMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayIndex);

  // Map real database records by date string (YYYY-MM-DD)
  const dataMap = new Map();
  if (Array.isArray(heatmapData)) {
    heatmapData.forEach((d) => {
      if (d && d.date) {
        const clean = d.date.split('T')[0];
        let rank = 0;
        const completed = Number(d.tasksCompleted || 0);
        const total = Number(d.totalTasks || (completed > 0 ? completed : 0));
        if (d.rank !== undefined && d.rank !== null) {
          rank = Number(d.rank);
        } else if (completed > 0) {
          const pct = (completed / Math.max(total, 1)) * 100;
          rank = pct >= 100 ? 5 : pct >= 75 ? 4 : pct >= 50 ? 3 : pct >= 25 ? 2 : 1;
        }
        dataMap.set(clean, {
          rank: Math.min(Math.max(rank, 0), 5),
          completed,
          total,
        });
      }
    });
  }

  // Include live today's task completion if provided
  if (todayTasks && Array.isArray(todayTasks) && todayTasks.length > 0) {
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    const total = todayTasks.length;
    const pct = total > 0 ? (completed / total) * 100 : 0;
    const todayRank = completed > 0 ? (pct >= 100 ? 5 : pct >= 75 ? 4 : pct >= 50 ? 3 : pct >= 25 ? 2 : 1) : 0;
    dataMap.set(todayStr, {
      rank: todayRank,
      completed,
      total,
    });
  }

  // Build grid of 24 weeks ending on current week
  for (let w = 0; w < totalWeeks; w++) {
    const weekOffset = totalWeeks - 1 - w; // 0 for current week, 1 for previous week, etc.
    const weekMonday = new Date(currentWeekMonday);
    weekMonday.setDate(currentWeekMonday.getDate() - weekOffset * 7);

    const daysInWeek = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(weekMonday);
      cellDate.setDate(weekMonday.getDate() + d);

      const y = cellDate.getFullYear();
      const m = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dt = String(cellDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dt}`;

      const isToday = dateStr === todayStr;
      const isFuture = cellDate > now && !isToday;

      // Exact database value, defaulting to 0 for days with no activity
      const entry = dataMap.get(dateStr) || { rank: 0, completed: 0, total: 0 };
      daysInWeek.push({
        date: dateStr,
        level: isFuture ? 0 : entry.rank,
        completed: isFuture ? 0 : entry.completed,
        total: isFuture ? 0 : entry.total,
        isToday,
        isFuture,
        dayOfWeek: DAYS[d],
      });
    }
    weeks.push(daysInWeek);
  }

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 150);
  }, [heatmapData]);

  return (
    <View className="bg-momentum-card border border-momentum-border rounded-2xl p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Calendar size={16} color={colors.emerald.bright} />
          <View>
            <Text className="text-sm font-bold text-white tracking-tight">
              Momentum Heatmap
            </Text>
            <Text className="text-[10px] text-momentum-textSecondary">
              Daily task completion over the past year.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-momentum-surface border border-momentum-border"
        >
          <Text className="text-[10px] font-medium text-momentum-textSecondary">
            Last 12 Months
          </Text>
          <ChevronDown size={12} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Grid with Weekday Labels */}
      <View className="flex-row">
        {/* Left Day Labels */}
        <View className="justify-between pr-2 py-0.5" style={{ height: (CELL_SIZE + CELL_GAP) * 7 }}>
          {DAYS.map((day, idx) => (
            <Text
              key={idx}
              className="text-[8px] font-mono text-momentum-textMuted leading-none"
              style={{ height: CELL_SIZE }}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Scrollable Heatmap Weeks */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
        >
          <View>
            <View className="flex-row" style={{ gap: CELL_GAP }}>
              {weeks.map((week, wIndex) => (
                <View key={wIndex} style={{ gap: CELL_GAP }}>
                  {week.map((cell, dIndex) => {
                    const isSelected = selectedCell?.date === cell.date;
                    return (
                      <TouchableOpacity
                        key={dIndex}
                        activeOpacity={cell.isFuture ? 1 : 0.7}
                        disabled={cell.isFuture}
                        onPress={() => !cell.isFuture && setSelectedCell(cell)}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: cell.isFuture
                            ? '#0A0E0B'
                            : LEVEL_COLORS[cell.level] || LEVEL_COLORS[0],
                          borderRadius: 2.5,
                          borderWidth: cell.isToday ? 1.5 : isSelected ? 1.5 : cell.isFuture ? 0.5 : 0,
                          borderColor: cell.isToday
                            ? '#00E676'
                            : isSelected
                            ? '#FFFFFF'
                            : cell.isFuture
                            ? '#121A14'
                            : 'transparent',
                          opacity: cell.isFuture ? 0.35 : 1,
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Bottom Month Labels */}
            <View className="flex-row justify-between mt-2 px-1">
              {MONTHS.map((month, idx) => (
                <Text
                  key={idx}
                  className="text-[8px] font-mono text-momentum-textMuted mr-3"
                >
                  {month}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Selected Day Task Detail Info Card */}
      {selectedCell ? (
        <View className="mt-3.5 p-3 rounded-xl bg-[#000000] border border-momentum-emerald flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View
              className="w-3.5 h-3.5 rounded-full border border-white/20"
              style={{ backgroundColor: LEVEL_COLORS[selectedCell.level] || LEVEL_COLORS[0] }}
            />
            <View className="flex-1">
              <Text className="text-xs text-white">
                <Text className="font-bold text-momentum-emerald font-mono">
                  {selectedCell.completed}
                </Text>{' '}
                task{selectedCell.completed === 1 ? '' : 's'} out of{' '}
                <Text className="font-bold text-white font-mono">
                  {selectedCell.total}
                </Text>{' '}
                task{selectedCell.total === 1 ? '' : 's'} completed
              </Text>
              <Text className="text-[10px] font-mono text-momentum-textSecondary mt-0.5">
                on {formatReadableDate(selectedCell.date)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedCell(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-5 h-5 rounded-full bg-black/60 items-center justify-center"
          >
            <X size={11} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Legend */}
      {showLegend && (
        <View className="flex-row items-center gap-1.5 mt-3 pt-2.5 border-t border-momentum-border">
          <Text className="text-[9px] font-mono text-momentum-textMuted mr-1">Less</Text>
          {LEVEL_COLORS.map((color, idx) => (
            <View
              key={idx}
              style={{
                width: 9,
                height: 9,
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          ))}
          <Text className="text-[9px] font-mono text-momentum-textMuted ml-1">More</Text>
        </View>
      )}
    </View>
  );
}
