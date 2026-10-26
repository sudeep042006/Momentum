import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export default function EditProfileModal({ visible, user, onClose, onSave }) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || user.user_metadata?.name || 'Sudeep Kuralkar');
      setHandle(user.username || user.user_metadata?.username || '@sudeepkuralkar');
      setLocation(user.location || 'Nagpur, India');
      setBio(
        user.bio ||
          'Trying to become a better version of myself everyday.\nDSA | Web Dev | ML | Building useful products.'
      );
    }
  }, [user, visible]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      username: handle.trim(),
      location: location.trim(),
      bio: bio.trim(),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1 bg-black/80 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-momentum-card border-t border-momentum-borderLight rounded-t-3xl p-6 pb-8"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-white tracking-tight">
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1 -mr-1"
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Display Name */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
              Display Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Sudeep Kuralkar"
              placeholderTextColor={colors.text.muted}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-white mb-3"
            />

            {/* Handle */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
              Username
            </Text>
            <TextInput
              value={handle}
              onChangeText={setHandle}
              placeholder="@sudeepkuralkar"
              placeholderTextColor={colors.text.muted}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-white mb-3"
            />

            {/* Location */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
              Location
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Nagpur, India"
              placeholderTextColor={colors.text.muted}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-white mb-3"
            />

            {/* Bio */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about what you build..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-momentum-input border border-momentum-border rounded-xl p-3.5 text-xs text-white h-20 mb-5"
            />

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!name.trim()}
              activeOpacity={0.8}
              className="w-full py-3.5 rounded-xl bg-momentum-emerald items-center justify-center flex-row gap-2"
            >
              <Check size={16} color="#000000" strokeWidth={3} />
              <Text className="text-sm font-bold text-black font-sans">
                Save Changes
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
