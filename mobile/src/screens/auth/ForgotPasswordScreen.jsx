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
import { ArrowLeft, Activity } from 'lucide-react-native';
import { authApi } from '../../api/authApi';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const topPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 24);

  const glowPulse = useRef(new Animated.Value(0.1)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(formFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.22, duration: 4000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.1, duration: 4000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowPulse, formFade]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please provide your email.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.data?.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#000000] relative"
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Ambient Animated Glow */}
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
          opacity: glowPulse,
          transform: [{ scale: 1.1 }],
        }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: topPadding + 10,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        className="px-6"
      >
        <Animated.View style={{ opacity: formFade }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="self-start flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#000000] border border-momentum-border mb-6"
          >
            <ArrowLeft size={14} color="#00E676" />
            <Text
              allowFontScaling={false}
              className="text-xs font-mono text-momentum-textSecondary font-semibold"
            >
              Back
            </Text>
          </TouchableOpacity>

          <View className="mb-7">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-7 h-7 rounded-lg bg-[#000000] border border-[#183B22] items-center justify-center">
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
              Reset Password
            </Text>
            <Text
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary mt-1 leading-5"
            >
              Enter your email to receive recovery instructions.
            </Text>
          </View>

          {error ? (
            <View className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800">
              <Text className="text-xs text-red-300 font-medium">{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View className="mb-4 p-3 rounded-xl bg-green-950/60 border border-green-800">
              <Text className="text-xs text-momentum-emerald font-medium">{message}</Text>
            </View>
          ) : null}

          <View className="mb-6">
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
              placeholderTextColor="#4B5563"
              allowFontScaling={false}
              className="bg-[#000000] border border-momentum-border rounded-xl px-4 py-3 text-sm text-white font-sans"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-xl bg-momentum-emerald items-center justify-center mb-4"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text
                allowFontScaling={false}
                className="text-sm font-bold text-black font-sans uppercase tracking-wider"
              >
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} className="items-center mt-2">
            <Text
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary font-sans"
            >
              Remember password?{' '}
              <Text className="font-semibold text-momentum-emerald">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

