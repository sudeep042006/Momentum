import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { authApi } from '../../api/authApi';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-momentum-bg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-momentum-textPrimary tracking-tight">
            Reset Password
          </Text>
          <Text className="text-xs text-momentum-textSecondary mt-1">
            Enter your email to receive recovery instructions
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

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full py-3.5 rounded-xl bg-momentum-emerald items-center justify-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text className="text-sm font-bold text-black">Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} className="items-center mt-2">
          <Text className="text-xs text-momentum-textSecondary">
            Back to <Text className="font-semibold text-momentum-emerald">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
