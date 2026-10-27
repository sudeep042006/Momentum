import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Subtle ambient background breathing animations
  const glowPulse1 = useRef(new Animated.Value(0.1)).current;
  const glowPulse2 = useRef(new Animated.Value(0.06)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 30);

  useEffect(() => {
    Animated.timing(formFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse1, { toValue: 0.22, duration: 4000, useNativeDriver: true }),
        Animated.timing(glowPulse1, { toValue: 0.1, duration: 4000, useNativeDriver: true }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse2, { toValue: 0.16, duration: 5000, useNativeDriver: true }),
        Animated.timing(glowPulse2, { toValue: 0.06, duration: 5000, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [glowPulse1, glowPulse2, formFade]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-black relative"
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Ambient Animated Background Glow Orbs */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: '#00E676',
          opacity: glowPulse1,
          transform: [{ scale: 1.1 }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 40,
          left: -50,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: '#059669',
          opacity: glowPulse2,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: topPadding + 14,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
        className="px-6 bg-black"
      >
        <Animated.View style={{ opacity: formFade }}>
          {/* Back to Landing Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Landing')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="self-start flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-[#1C2C20] mb-6"
          >
            <ArrowLeft size={14} color="#00E676" />
            <Text
              allowFontScaling={false}
              className="text-xs font-mono text-momentum-textSecondary font-semibold"
            >
              Back
            </Text>
          </TouchableOpacity>

          {/* Header Title */}
          <View className="mb-7">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-7 h-7 rounded-lg bg-black border border-[#183B22] items-center justify-center">
                <Activity size={16} color="#00E676" strokeWidth={2.5} />
              </View>
              <Text
                allowFontScaling={false}
                className="text-sm font-mono font-bold tracking-widest text-momentum-emerald uppercase"
              >
                MOMENTUM
              </Text>
            </View>

            <Text
              allowFontScaling={false}
              className="text-3xl font-black text-white tracking-tight leading-tight"
            >
              Welcome back.
            </Text>
            <Text
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary mt-1 leading-4"
            >
              Developer productivity & daily consistency engine
            </Text>
          </View>

          {error ? (
            <View className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800">
              <Text
                allowFontScaling={false}
                className="text-xs text-red-300 font-medium"
              >
                {error}
              </Text>
            </View>
          ) : null}

          <View className="gap-3.5 mb-6">
            <View>
              <Text
                allowFontScaling={false}
                className="text-[11px] font-semibold text-momentum-textSecondary mb-1.5 uppercase tracking-wider"
              >
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@domain.com"
                placeholderTextColor={colors.text.disabled}
                className="bg-black border border-[#1C2C20] rounded-xl px-4 py-3 text-sm text-white font-sans"
              />
            </View>

            <View>
              <Text
                allowFontScaling={false}
                className="text-[11px] font-semibold text-momentum-textSecondary mb-1.5 uppercase tracking-wider"
              >
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.text.disabled}
                className="bg-black border border-[#1C2C20] rounded-xl px-4 py-3 text-sm text-white font-sans"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-xl bg-momentum-emerald items-center justify-center mb-4 shadow-lg shadow-[#00E676]/20"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text
                allowFontScaling={false}
                className="text-sm font-bold text-black font-sans tracking-wide"
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center justify-between mt-2">
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text
                allowFontScaling={false}
                className="text-xs text-momentum-textSecondary"
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text
                allowFontScaling={false}
                className="text-xs font-semibold text-momentum-emerald"
              >
                Create account
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
