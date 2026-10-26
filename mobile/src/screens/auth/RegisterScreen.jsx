import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
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
            Create Account
          </Text>
          <Text className="text-xs text-momentum-textSecondary mt-1">
            Build consistency and track your developer momentum
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
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Linus Torvalds"
              placeholderTextColor={colors.text.disabled}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-momentum-textPrimary"
            />
          </View>

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
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full py-3.5 rounded-xl bg-momentum-emerald items-center justify-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text className="text-sm font-bold text-black">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="items-center mt-2">
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-xs text-momentum-textSecondary">
              Already have an account? <Text className="font-semibold text-momentum-emerald">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
