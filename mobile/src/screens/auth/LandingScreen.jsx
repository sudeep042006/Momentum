import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Flame,
  CheckSquare,
  Lock,
  WifiOff,
  Activity,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const heroImage = require('../../assets/landing_hero.jpg');

const FEATURES = [
  {
    icon: CheckSquare,
    color: '#00E676',
    bg: '#000000',
    border: '#15331E',
    title: 'Daily Architecture',
    subtitle: 'Plan your timetable and sync schedule blocks into daily actionable tasks instantly.',
  },
  {
    icon: Flame,
    color: '#F59E0B',
    bg: '#000000',
    border: '#382508',
    title: 'Streak & Heatmap',
    subtitle: 'Track relentless consistency with GitHub-style contribution heatmaps and streak counts.',
  },
  {
    icon: Lock,
    color: '#A78BFA',
    bg: '#000000',
    border: '#2E1D4A',
    title: 'AES-256 Vault',
    subtitle: 'Military-grade encryption for your personal reflections. Only you hold the key.',
  },
  {
    icon: WifiOff,
    color: '#38BDF8',
    bg: '#000000',
    border: '#12314E',
    title: 'Offline-First Engine',
    subtitle: 'Full zero-latency functionality offline with background auto-sync once connected.',
  },
];

export default function LandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const scrollRef = useRef(null);

  // Status bar safety: ensure content is fully below camera punch-hole and status icons
  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 32);

  // Subtle ambient background breathing animations
  const glowPulse1 = useRef(new Animated.Value(0.12)).current;
  const glowPulse2 = useRef(new Animated.Value(0.08)).current;
  const heroFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroFade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse1, { toValue: 0.22, duration: 4000, useNativeDriver: true }),
        Animated.timing(glowPulse1, { toValue: 0.12, duration: 4000, useNativeDriver: true }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse2, { toValue: 0.16, duration: 5500, useNativeDriver: true }),
        Animated.timing(glowPulse2, { toValue: 0.08, duration: 5500, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [glowPulse1, glowPulse2, heroFade]);

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 48));
    if (slide !== activeFeatureIndex && slide >= 0 && slide < FEATURES.length) {
      setActiveFeatureIndex(slide);
    }
  };

  return (
    <View className="flex-1 bg-black relative">
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Ambient Animated Background Glow Orbs */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: '#00E676',
          opacity: glowPulse1,
          transform: [{ scale: 1.1 }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 320,
          left: -70,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: '#059669',
          opacity: glowPulse2,
          transform: [{ scale: 1.05 }],
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        className="px-6 bg-black"
      >
        {/* Top Navbar Brand - Safe Under Android Camera / Status Bar */}
        <View
          style={{ paddingTop: topPadding + 12 }}
          className="flex-row items-center justify-between pb-5"
        >
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-black border border-[#183B22] items-center justify-center">
              <Activity size={20} color="#00E676" strokeWidth={2.5} />
            </View>
            <Text
              allowFontScaling={false}
              className="text-lg font-black tracking-widest text-white uppercase font-sans"
            >
              MOMENTUM
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
            className="px-3.5 py-1.5 rounded-lg border border-[#1C2C20] bg-black"
          >
            <Text
              allowFontScaling={false}
              className="text-xs font-semibold text-momentum-textSecondary font-sans"
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <Animated.View style={{ opacity: heroFade }} className="mt-1 mb-6">
          {/* Tagline Pill */}
          <View className="flex-row items-center self-start px-3 py-1.5 rounded-full bg-black border border-[#163820] mb-4 gap-2">
            <View className="w-2 h-2 rounded-full bg-momentum-emerald" />
            <Text
              allowFontScaling={false}
              className="text-[11px] font-mono font-bold uppercase tracking-wider text-momentum-emerald"
            >
              Discipline Today. Freedom Tomorrow.
            </Text>
          </View>

          {/* Headline */}
          <Text
            allowFontScaling={false}
            className="text-3xl font-black text-white tracking-tight leading-[40px] mb-2"
          >
            Build <Text className="text-momentum-emerald">Momentum.</Text>
            {'\n'}One <Text className="text-momentum-emerald">Day</Text> at a Time.
          </Text>

          {/* Subtitle */}
          <Text
            allowFontScaling={false}
            className="text-xs text-momentum-textSecondary leading-5 mb-5"
          >
            A high-performance personal consistency engine. Architect your schedule, crush your daily tasks, and visualize compounding progress.
          </Text>

          {/* Centerpiece Hero Collage Image Showcase */}
          <View className="w-full rounded-2xl overflow-hidden border border-[#1A2E20] mb-5 bg-black">
            <Image
              source={heroImage}
              resizeMode="cover"
              style={{ width: '100%', height: 230 }}
            />
            {/* Live Indicator Bar */}
            <View className="p-3 bg-black border-t border-[#16271A] flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-momentum-emerald" />
                <Text
                  allowFontScaling={false}
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-momentum-emerald"
                >
                  Momentum Ecosystem
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                className="text-[10px] font-mono text-momentum-textMuted font-semibold"
              >
                Desktop & Mobile
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Feature Carousel Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              allowFontScaling={false}
              className="text-xs font-mono font-bold uppercase tracking-widest text-momentum-textMuted"
            >
              Core Architecture
            </Text>
            <View className="flex-row gap-1.5">
              {FEATURES.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    activeFeatureIndex === i
                      ? 'w-5 bg-momentum-emerald'
                      : 'w-1.5 bg-[#18261C]'
                  }`}
                />
              ))}
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ gap: 12 }}
          >
            {FEATURES.map((feat, index) => {
              const IconComp = feat.icon;
              return (
                <View
                  key={index}
                  style={{
                    width: width - 48,
                    backgroundColor: feat.bg,
                    borderColor: feat.border,
                  }}
                  className="border rounded-2xl p-4.5"
                >
                  <View
                    style={{ backgroundColor: `${feat.color}20` }}
                    className="w-9 h-9 rounded-xl items-center justify-center mb-3"
                  >
                    <IconComp size={18} color={feat.color} strokeWidth={2.3} />
                  </View>
                  <Text
                    allowFontScaling={false}
                    className="text-sm font-bold text-white tracking-tight mb-1"
                  >
                    {feat.title}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="text-xs text-momentum-textSecondary leading-4"
                  >
                    {feat.subtitle}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Call to Actions */}
        <View className="mt-auto gap-3">
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
            className="w-full py-3.5 rounded-xl bg-momentum-emerald flex-row items-center justify-center gap-2 shadow-lg shadow-[#00E676]/20"
          >
            <Text
              allowFontScaling={false}
              className="text-base font-bold text-black font-sans tracking-wide"
            >
              Get Started
            </Text>
            <ArrowRight size={18} color="#000000" strokeWidth={2.6} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
            className="w-full py-3 rounded-xl border border-[#1C2C20] bg-black items-center justify-center"
          >
            <Text
              allowFontScaling={false}
              className="text-xs font-semibold text-white font-sans"
            >
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
