import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Flame } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { quoteApi } from '../../../api/quoteApi';
import { localStorage } from '../../../storage/localStorage';

const DAILY_QUOTE_CACHE_KEY = 'momentum_daily_quote_cache';

export default function TodayHeader({ name = 'Sudeep', completedCount = 0, totalCount = 0, streak = 0 }) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Format current date: MON, 20 OCT 2026
  const now = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dateFormatted = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Greeting based on time of day
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  // Dynamic daily quote
  const [quoteData, setQuoteData] = useState({
    quote: "Discipline equals freedom.",
    author: "Jocko Willink",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadQuote() {
      try {
        // 1. Read cached quote immediately for zero lag
        const cached = await localStorage.getItem(DAILY_QUOTE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.quote) {
            setQuoteData(parsed);
          }
        }

        // 2. Fetch fresh quote in background
        const res = await quoteApi.getDailyQuote();
        if (res.data?.success && res.data?.data?.quote && isMounted) {
          setQuoteData(res.data.data);
          await localStorage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify(res.data.data));
        }
      } catch (err) {
        // Keep current quote on network errors
      }
    }

    loadQuote();
    return () => {
      isMounted = false;
    };
  }, []);

  // SVG circular ring calculation
  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View className="mb-4">
      {/* Date */}
      <Text className="text-[10px] font-mono uppercase tracking-widest text-momentum-textMuted font-semibold mb-1">
        {dateFormatted}
      </Text>

      {/* Main greeting and summary cards */}
      <View className="flex-row items-start justify-between">
        {/* Left: Greeting & Quote */}
        <View className="flex-1 pr-3">
          <Text className="text-xl font-bold text-white tracking-tight leading-tight">
            {greeting}
          </Text>
          <Text className="text-xl font-bold text-momentum-emerald tracking-tight leading-tight">
            {name}.
          </Text>
          <Text
            numberOfLines={2}
            className="text-[11px] text-momentum-textSecondary italic mt-1.5 leading-snug"
          >
            "{quoteData.quote}"{quoteData.author ? ` — ${quoteData.author}` : ''}
          </Text>
        </View>

        {/* Right: Progress & Streak Compact Card */}
        <View className="flex-row items-center bg-momentum-card border border-momentum-border rounded-2xl p-2.5 gap-3">
          {/* Circular Ring */}
          <View className="items-center justify-center">
            <Svg width="54" height="54" viewBox="0 0 54 54">
              <Circle
                cx="27"
                cy="27"
                r={radius}
                stroke="#152018"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx="27"
                cy="27"
                r={radius}
                stroke={colors.emerald.bright}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 27 27)"
              />
            </Svg>
            <View className="absolute items-center justify-center">
              <Text className="text-[11px] font-bold text-white font-mono">
                {percentage}%
              </Text>
              <Text className="text-[6.5px] font-mono uppercase text-momentum-textSecondary -mt-0.5">
                COMPLETED
              </Text>
            </View>
          </View>

          {/* Separator */}
          <View className="w-px h-8 bg-momentum-border" />

          {/* Streak Counter */}
          <View className="items-center justify-center pr-1">
            <Flame size={17} color={colors.emerald.bright} />
            <Text className="text-sm font-bold text-white font-mono mt-0.5">
              {streak}
            </Text>
            <Text className="text-[8px] text-momentum-textSecondary">
              Day Streak
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
