import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center p-6">
        <View className="w-full max-w-sm bg-momentum-card border border-momentum-border rounded-2xl p-5">
          <Text className="text-base font-bold text-momentum-textPrimary mb-1.5">
            {title}
          </Text>
          <Text className="text-xs text-momentum-textSecondary mb-6 leading-relaxed">
            {message}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-momentum-surface border border-momentum-border items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-momentum-textSecondary">
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                isDestructive ? 'bg-red-950 border border-red-800' : 'bg-momentum-emerald'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-semibold ${
                  isDestructive ? 'text-red-300' : 'text-black'
                }`}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
