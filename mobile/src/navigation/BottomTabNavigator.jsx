import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import SyncStatusBar from '../components/SyncStatusBar';
import HomeScreen from '../screens/home/HomeScreen';
import JournalScreen from '../screens/journal/JournalScreen';
import TimetableScreen from '../screens/timetable/TimetableScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Home, BookOpen, Calendar, User } from 'lucide-react-native';
import { colors } from '../theme/colors';

const TABS = [
  { name: 'Home', label: 'Home', icon: Home, component: HomeScreen },
  { name: 'Journal', label: 'Journal', icon: BookOpen, component: JournalScreen },
  { name: 'Schedule', label: 'Schedule', icon: Calendar, component: TimetableScreen },
  { name: 'Profile', label: 'Profile', icon: User, component: ProfileScreen },
];

export default function BottomTabNavigator({ navigation, route }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const tabWidth = width / TABS.length;

  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const lastHandledScreenParam = useRef(null);

  const scrollToPage = useCallback(
    (index, animated = true) => {
      const x = index * width;
      if (scrollRef.current) {
        if (typeof scrollRef.current.scrollTo === 'function') {
          scrollRef.current.scrollTo({ x, animated });
        } else if (
          scrollRef.current.getNode &&
          typeof scrollRef.current.getNode().scrollTo === 'function'
        ) {
          scrollRef.current.getNode().scrollTo({ x, animated });
        }
      }
    },
    [width]
  );

  const handleTabPress = useCallback(
    (index) => {
      setActiveIndex(index);
      scrollToPage(index, true);
    },
    [scrollToPage]
  );

  // Sync with external drawer/screen navigation params only when a genuine new screen param arrives
  useEffect(() => {
    const targetScreen = route?.params?.screen;
    if (targetScreen && targetScreen !== lastHandledScreenParam.current) {
      lastHandledScreenParam.current = targetScreen;
      const normalizedTarget = targetScreen === 'Timetable' ? 'Schedule' : targetScreen;
      const targetIdx = TABS.findIndex((t) => t.name === normalizedTarget);
      if (targetIdx !== -1) {
        setActiveIndex(targetIdx);
        scrollToPage(targetIdx, true);
      }
    }
  }, [route?.params?.screen, scrollToPage]);

  // When swiping finishes, settle the active icon state
  const handleMomentumScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);
    if (pageIndex >= 0 && pageIndex < TABS.length && pageIndex !== activeIndex) {
      setActiveIndex(pageIndex);
    }
  };

  // 100% Native-driven smooth sliding green pill + bar across tabs
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, width, width * 2, width * 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* 1. STATIC TOP NAVBAR - Strictly below camera punch hole, never moves on swipe */}
      <AppHeader
        navigation={navigation}
        onProfilePress={() => handleTabPress(3)}
      />
      <SyncStatusBar />

      {/* 2. SWIPABLE PAGE CONTENT ONLY - Hardware-accelerated native scroll tracking */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ flex: 1 }}
      >
        <View style={{ width, flex: 1 }}>
          <HomeScreen navigation={navigation} />
        </View>
        <View style={{ width, flex: 1 }}>
          <JournalScreen navigation={navigation} />
        </View>
        <View style={{ width, flex: 1 }}>
          <TimetableScreen navigation={navigation} />
        </View>
        <View style={{ width, flex: 1 }}>
          <ProfileScreen navigation={navigation} />
        </View>
      </Animated.ScrollView>

      {/* 3. STATIC BOTTOM TAB BAR - Smooth Native Sliding Green Indicator */}
      <View
        style={{
          backgroundColor: '#000000',
          borderTopColor: '#18241B',
          borderTopWidth: 1,
          height: 64 + bottomInset,
          paddingTop: 4,
          paddingBottom: bottomInset + 2,
          position: 'relative',
        }}
      >
        {/* Native-Driven Sliding Green Glowing Pill & Underline */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 4,
            left: 0,
            width: tabWidth,
            height: 52,
            alignItems: 'center',
            transform: [{ translateX: indicatorTranslateX }],
          }}
          pointerEvents="none"
        >
          {/* Glowing Green Pill centered around the icon */}
          <View
            style={{
              width: 50,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'rgba(0, 230, 118, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(0, 230, 118, 0.28)',
            }}
          />
          {/* Green Indicator Underline cleanly positioned at the very bottom, below text */}
          <View
            style={{
              position: 'absolute',
              bottom: 1,
              width: 18,
              height: 2.5,
              borderRadius: 2,
              backgroundColor: colors.emerald.bright,
            }}
          />
        </Animated.View>

        {/* Tab Items Row with Real-Time Native Cross-Fade Greening (Zero Lag) */}
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 52,
            alignItems: 'center',
          }}
        >
          {TABS.map((tab, index) => {
            const IconComponent = tab.icon;

            // Real-time GPU native interpolation for instant icon & text greening:
            const activeOpacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });

            const inactiveOpacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [1, 0, 1],
              extrapolate: 'clamp',
            });

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
                delayPressIn={0}
                style={{
                  width: tabWidth,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Icon Layer: Grey outline fades to Emerald Green natively with zero lag */}
                <View
                  style={{
                    width: 32,
                    height: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Animated.View style={{ position: 'absolute', opacity: inactiveOpacity }}>
                    <IconComponent size={20} color="#5E6D62" strokeWidth={1.8} />
                  </Animated.View>
                  <Animated.View style={{ opacity: activeOpacity }}>
                    <IconComponent size={20} color={colors.emerald.bright} strokeWidth={2.4} />
                  </Animated.View>
                </View>

                {/* Text Layer: Grey fades to Bold Emerald Green natively */}
                <View
                  style={{
                    height: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Animated.Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    style={{
                      position: 'absolute',
                      opacity: inactiveOpacity,
                      color: '#5E6D62',
                      fontSize: 10,
                      fontWeight: '500',
                      includeFontPadding: false,
                      textAlign: 'center',
                    }}
                  >
                    {tab.label}
                  </Animated.Text>
                  <Animated.Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    style={{
                      opacity: activeOpacity,
                      color: colors.emerald.bright,
                      fontSize: 10,
                      fontWeight: '700',
                      includeFontPadding: false,
                      textAlign: 'center',
                    }}
                  >
                    {tab.label}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
