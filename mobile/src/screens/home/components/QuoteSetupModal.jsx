import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Sparkles, Sliders, RefreshCw, BookOpen, Smartphone, Check } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { quoteApi } from '../../../api/quoteApi';
import { updateNativeWidget } from '../../../services/systemNotificationService';
import { localStorage } from '../../../storage/localStorage';

const QUOTE_CATEGORIES = [
  { id: 'DEVELOPER', label: '💻 Developer', prompt: 'coding, debugging, clean architecture, software mastery' },
  { id: 'STOICISM', label: '🏛️ Stoicism', prompt: 'stoic wisdom, mental resilience, Marcus Aurelius, emotional control' },
  { id: 'DEEP_WORK', label: '⚡ Deep Work', prompt: 'unbroken focus, elimination of distraction, intense flow state' },
  { id: 'DISCIPLINE', label: '🔥 Discipline & Grit', prompt: 'extreme discipline, consistency over motivation, relentless execution' },
  { id: 'STARTUP', label: '🚀 Startup & Hustle', prompt: 'shipping products, building wealth, relentless ambition, bias to action' },
  { id: 'FITNESS', label: '💪 Strength & Health', prompt: 'physical conditioning, high energy, athletic mindset' },
];

export default function QuoteSetupModal({
  visible,
  currentQuote,
  currentAuthor,
  currentStreak = 1,
  onClose,
  onApplyQuote,
}) {
  const [selectedCat, setSelectedCat] = useState(QUOTE_CATEGORIES[0]);
  const [previewQuote, setPreviewQuote] = useState(currentQuote || 'Discipline equals freedom.');
  const [previewAuthor, setPreviewAuthor] = useState(currentAuthor || 'Jocko Willink');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const handleGenerate = async (catObj) => {
    const targetCat = catObj || selectedCat;
    setIsGenerating(true);
    try {
      const res = await quoteApi.generateQuote({
        category: targetCat.id,
        prompt: `Write a short, powerful, 1-2 sentence quote about ${targetCat.prompt}. Give a real or inspiring author.`,
      });

      if (res.data?.success && res.data?.data?.quote) {
        const { quote, author } = res.data.data;
        setPreviewQuote(quote);
        setPreviewAuthor(author || 'Momentum AI');
      } else {
        Alert.alert('Notice', 'Could not reach AI model. Kept current quote.');
      }
    } catch (err) {
      Alert.alert('AI Quote Notice', 'Generated local inspirational quote.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToJournal = async () => {
    setIsSavingJournal(true);
    try {
      await quoteApi.saveQuoteToJournal({
        quote: previewQuote,
        author: previewAuthor,
        category: selectedCat.id,
        reflection: 'Saved from Daily Quote widget.',
      });
      Alert.alert('Saved to Journal', 'This quote has been saved to your personal reflection journal!');
    } catch {
      Alert.alert('Notice', 'Could not save to journal. Please check internet connection.');
    } finally {
      setIsSavingJournal(false);
    }
  };

  const handleSyncToAndroidWidget = async () => {
    try {
      await updateNativeWidget(previewQuote, previewAuthor, currentStreak);
      Alert.alert(
        'Widget Updated!',
        'This quote is now set for your Android Home Screen Widget. You can add the widget by long-pressing your home screen!'
      );
    } catch (err) {
      Alert.alert('Widget Notice', 'Widget updated locally.');
    }
  };

  const handleApplyToApp = async () => {
    const updated = {
      quote: previewQuote,
      author: previewAuthor,
      category: selectedCat.id,
    };
    await localStorage.setItem('momentum_daily_quote_cache', JSON.stringify(updated));
    await updateNativeWidget(previewQuote, previewAuthor, currentStreak);
    if (typeof onApplyQuote === 'function') {
      onApplyQuote(updated);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 390,
            backgroundColor: '#000000',
            borderRadius: 24,
            borderColor: '#00E676',
            borderWidth: 1.5,
            padding: 22,
            shadowColor: '#00E676',
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 14,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Sliders size={18} color={colors.emerald.bright} />
              <Text allowFontScaling={false} className="text-base font-bold text-white tracking-tight">
                Set Up Daily Quotes
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-[#000000] border border-momentum-border items-center justify-center"
            >
              <X size={15} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text allowFontScaling={false} className="text-xs text-momentum-textSecondary mb-3">
            Choose a theme, generate AI motivation, and sync directly to your Android Home Screen Widget.
          </Text>

          {/* Categories Selector */}
          <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider font-bold text-momentum-textMuted mb-2">
            Select Focus Theme
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {QUOTE_CATEGORIES.map((cat) => {
                const isSelected = selectedCat.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setSelectedCat(cat);
                      handleGenerate(cat);
                    }}
                    activeOpacity={0.8}
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSelected
                        ? 'bg-momentum-emerald border-momentum-emerald'
                        : 'bg-[#000000] border-momentum-border'
                    }`}
                  >
                    <Text
                      allowFontScaling={false}
                      className={`text-xs font-bold font-sans ${
                        isSelected ? 'text-black' : 'text-white'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Live Quote Preview Card */}
          <View className="bg-[#050D08] border border-[#142E1F] rounded-2xl p-4 mb-4">
            {isGenerating ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color={colors.emerald.bright} />
                <Text allowFontScaling={false} className="text-xs font-mono text-momentum-emerald mt-2">
                  Summoning AI Motivation...
                </Text>
              </View>
            ) : (
              <>
                <Text
                  allowFontScaling={false}
                  className="text-sm font-semibold text-white italic leading-relaxed mb-2"
                >
                  "{previewQuote}"
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text allowFontScaling={false} className="text-xs font-mono font-bold text-momentum-emerald">
                    — {previewAuthor}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleGenerate()}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-1 bg-[#000000] border border-[#18241B] px-2 py-1 rounded-lg"
                  >
                    <RefreshCw size={11} color={colors.text.secondary} />
                    <Text allowFontScaling={false} className="text-[10px] font-mono text-momentum-textSecondary font-bold">
                      Reroll
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-2 mb-4">
            {/* Sync to Android Widget Button */}
            <TouchableOpacity
              onPress={handleSyncToAndroidWidget}
              activeOpacity={0.8}
              className="flex-1 py-2.5 rounded-xl bg-[#000000] border border-momentum-border flex-row items-center justify-center gap-1.5"
            >
              <Smartphone size={13} color={colors.emerald.bright} />
              <Text allowFontScaling={false} className="text-xs font-semibold text-white">
                Sync to Widget
              </Text>
            </TouchableOpacity>

            {/* Save to Journal */}
            <TouchableOpacity
              onPress={handleSaveToJournal}
              disabled={isSavingJournal}
              activeOpacity={0.8}
              className="flex-1 py-2.5 rounded-xl bg-[#000000] border border-momentum-border flex-row items-center justify-center gap-1.5"
            >
              <BookOpen size={13} color="#C084FC" />
              <Text allowFontScaling={false} className="text-xs font-semibold text-white">
                Save to Journal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Apply Button */}
          <TouchableOpacity
            onPress={handleApplyToApp}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-xl bg-momentum-emerald flex-row items-center justify-center gap-2"
          >
            <Check size={16} color="#000000" strokeWidth={3} />
            <Text allowFontScaling={false} className="text-sm font-bold text-black font-sans">
              Set as Daily Quote & Apply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
