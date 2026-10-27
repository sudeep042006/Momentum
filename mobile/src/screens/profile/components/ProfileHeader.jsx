import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Edit3, MapPin, Calendar, Camera } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export default function ProfileHeader({ user, onEdit }) {
  const name = user?.name || user?.user_metadata?.name || 'Sudeep Kuralkar';
  const handle = user?.username || user?.user_metadata?.username || '@sudeepkuralkar';
  const location = user?.location || 'Nagpur, India';
  const joinedDate = user?.joinedDate || 'Joined Jul 2026';
  const bio =
    user?.bio ||
    'Trying to become a better version of myself everyday.\nDSA | Web Dev | ML | Building useful products.';
  const profilePic = user?.profilePic || user?.user_metadata?.profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View className="p-4 mb-4 rounded-2xl bg-momentum-card border border-momentum-border">
      {/* Top row with avatar, name, handle, and Edit button */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-3.5 flex-1 mr-2">
          {/* Avatar with Camera Badge */}
          <View className="relative">
            <View className="w-16 h-16 rounded-full bg-[#000000] border-2 border-[#1B3624] items-center justify-center overflow-hidden">
              {profilePic ? (
                <Image source={{ uri: profilePic }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-xl font-bold text-momentum-emerald font-mono">
                  {initials}
                </Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#000000] border border-[#243629] items-center justify-center">
              <Camera size={10} color="#FFFFFF" />
            </View>
          </View>

          {/* Name & Handle */}
          <View className="flex-1">
            <Text className="text-base font-bold text-white tracking-tight" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-xs font-mono text-momentum-textSecondary">
              {handle}
            </Text>
            <Text className="text-[11px] text-momentum-textSecondary mt-0.5">
              Builder • Developer • Curious
            </Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-momentum-emerald bg-[#000000]"
        >
          <Edit3 size={12} color={colors.emerald.bright} />
          <Text className="text-[11px] font-bold text-momentum-emerald">
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meta: Location and Joined */}
      <View className="flex-row items-center gap-4 mb-2.5">
        <View className="flex-row items-center gap-1">
          <MapPin size={11} color={colors.text.muted} />
          <Text className="text-[10px] font-mono text-momentum-textSecondary">
            {location}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Calendar size={11} color={colors.text.muted} />
          <Text className="text-[10px] font-mono text-momentum-textSecondary">
            {joinedDate}
          </Text>
        </View>
      </View>

      {/* Bio */}
      <Text className="text-[11px] font-mono text-momentum-textSecondary leading-relaxed">
        {bio}
      </Text>
    </View>
  );
}
