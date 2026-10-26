import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      className="flex-1 bg-momentum-bg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-momentum-textPrimary tracking-tight">
            Mommenttum
          </Text>
          <Text className="text-xs text-momentum-textSecondary mt-1">
            Developer productivity & daily consistency engine
          </Text>
        </View>

        {error ? (
          <View className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800">
            <Text className="text-xs text-red-300 font-medium">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3.5 mb-6">
          <View>
            <Text className="text-[11px] font-semibold text-momentum-textSecondary mb-1.5 uppercase tracking-wider">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@domain.com"
              placeholderTextColor={colors.text.disabled}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-momentum-textPrimary"
            />
          </View>

          <View>
            <Text className="text-[11px] font-semibold text-momentum-textSecondary mb-1.5 uppercase tracking-wider">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.text.disabled}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-momentum-textPrimary"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full py-3.5 rounded-xl bg-momentum-emerald items-center justify-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text className="text-sm font-bold text-black">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-between mt-2">
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text className="text-xs text-momentum-textSecondary">Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-xs font-semibold text-momentum-emerald">Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
