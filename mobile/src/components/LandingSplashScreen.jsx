import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function LandingSplashScreen({ onFinish, minDuration = 1800 }) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const dotPulse = useRef(new Animated.Value(0.2)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(14)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance: Logo spring pop + fade in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 45,
        friction: 6.5,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Delayed text entrance
    const textTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 250);

    // 3. Ambient Breathing Glow Loop
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    // 4. Dot Heartbeat Ping Loop
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    dotAnimation.start();

    // 5. Instagram-Style Exit: Cinematic zoom + fade out into app
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 1.06,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start(() => {
        glowAnimation.stop();
        dotAnimation.stop();
        if (onFinish) {
          onFinish();
        }
      });
    }, minDuration);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      glowAnimation.stop();
      dotAnimation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDuration, onFinish]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
      pointerEvents="none"
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Center Hero: Animated Momentum Pulse Logo & Wordmark */}
      <View style={styles.centerSection}>
        {/* Ambient Neon Glow Aura behind Logo */}
        <Animated.View
          style={[
            styles.glowContainer,
            {
              opacity: glowPulse,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Svg width={220} height={220} viewBox="0 0 220 220">
            <Defs>
              <RadialGradient
                id="emeraldGlow"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor="#00E676" stopOpacity="0.45" />
                <Stop offset="55%" stopColor="#00E676" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="110" cy="110" r="105" fill="url(#emeraldGlow)" />
          </Svg>
        </Animated.View>

        {/* Momentum Emerald ECG Emblem */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
              <Defs>
                <LinearGradient id="waveGradient" x1="0" y1="0" x2="64" y2="64">
                  <Stop offset="0%" stopColor="#69F0AE" />
                  <Stop offset="50%" stopColor="#00E676" />
                  <Stop offset="100%" stopColor="#00B0FF" />
                </LinearGradient>
              </Defs>
              {/* Sleek Medical/Athletic Pulse Line */}
              <Path
                d="M6 34h12l7-22 10 40 8-26 6 8h9"
                stroke="url(#waveGradient)"
                strokeWidth={4.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>

            {/* Glowing Pulse Dot at highest peak */}
            <Animated.View
              style={[
                styles.peakDot,
                {
                  opacity: dotPulse,
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* Brand Wordmark & Tagline */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>MOMENTUM</Text>
            <View style={styles.emeraldPill}>
              <Text style={styles.emeraldPillText}>PRO</Text>
            </View>
          </View>

          <View style={styles.taglineRow}>
            <View style={styles.taglineDot} />
            <Text style={styles.taglineText}>DISCIPLINE EQUALS FREEDOM</Text>
            <View style={styles.taglineDot} />
          </View>
        </Animated.View>
      </View>

      {/* Bottom Footer (Instagram-style "from Meta") */}
      <Animated.View style={[styles.footerContainer, { opacity: footerOpacity }]}>
        <Text style={styles.footerFrom}>from</Text>
        <View style={styles.footerBrandRow}>
          <View style={styles.footerDot} />
          <Text style={styles.footerBrand}>YOU</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: '#051009',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  peakDot: {
    position: 'absolute',
    top: 24,
    left: 41,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#69F0AE',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  emeraldPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#003318',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  emeraldPillText: {
    color: '#00E676',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  taglineDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#00E676',
    opacity: 0.7,
  },
  taglineText: {
    color: '#63756A',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerFrom: {
    color: '#3F4F45',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E676',
  },
  footerBrand: {
    color: '#8E9C92',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4.5,
  },
});
