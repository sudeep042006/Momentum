import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function CustomCheckbox({ isChecked, onToggle, size = 20 }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className={`rounded-md items-center justify-center border transition-all ${
        isChecked
          ? 'bg-momentum-emerald border-momentum-emerald'
          : 'bg-momentum-input border-momentum-border'
      }`}
      style={{ width: size, height: size }}
    >
      {isChecked && <Check size={size - 6} color="#000000" strokeWidth={3} />}
    </TouchableOpacity>
  );
}
