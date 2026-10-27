import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Sparkles, Quote, X, BookmarkCheck, RefreshCw, Check } from 'lucide-react-native';
import { quoteApi } from '../../../api/quoteApi';
import { colors } from '../../../theme/colors';

const CATEGORIES = [
  { id: 'momentum', label: 'Momentum' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'stoic', label: 'Stoic' },
  { id: 'coding', label: 'Coding' },
  { id: 'focus', label: 'Focus' },
];

export default function AiQuoteModal({ visible, onClose, onQuoteSaved }) {
  const [selectedCategory, setSelectedCategory] = useState('momentum');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [error, setError] = useState('');

  const generateQuote = async (categoryToUse = selectedCategory) => {
    setIsLoading(true);
    setError('');
    setHasSaved(false);

    try {
      const res = await quoteApi.generateQuote({ category: categoryToUse });
      if (res.data?.success && res.data?.data) {
        setQuoteData(res.data.data);
      } else {
        setError('Failed to generate quote. Please try again.');
      }
    } catch (err) {
      setError('Network error connecting to OpenRouter. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    generateQuote(catId);
  };

  const handleSaveToJournal = async () => {
    if (!quoteData || hasSaved) return;

    setIsSaving(true);
    try {
      const res = await quoteApi.saveQuoteToJournal({
        quote: quoteData.quote,
        author: quoteData.author,
        category: quoteData.category || selectedCategory,
        reflection: quoteData.reflection,
      });

      if (res.data?.success) {
        setHasSaved(true);
        if (typeof onQuoteSaved === 'function') {
          onQuoteSaved(res.data.data);
        }
      }
    } catch (err) {
      setError('Failed to save to journal: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

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
              <View className="w-9 h-9 rounded-xl bg-[#000000] border border-[#183B22] items-center justify-center">
                <Sparkles size={18} color="#00E676" />
              </View>
              <View>
                <Text
                  allowFontScaling={false}
                  className="text-base font-bold text-white font-sans"
                >
                  AI Quote Generator
                </Text>
                <Text
                  allowFontScaling={false}
                  className="text-[10px] font-mono text-momentum-textMuted"
                >
                  Powered by OpenRouter AI
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-[#000000] border border-momentum-border items-center justify-center"
            >
              <X size={15} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Category Chips */}
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleSelectCategory(cat.id)}
                activeOpacity={0.7}
                className={`px-3 py-1.5 rounded-lg border ${
                  selectedCategory === cat.id
                    ? 'bg-[#000000] border-momentum-emerald'
                    : 'bg-[#000000] border-momentum-border'
                }`}
              >
                <Text
                  allowFontScaling={false}
                  className={`text-xs font-semibold ${
                    selectedCategory === cat.id ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quote Display Area */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
            {isLoading ? (
              <View className="py-12 items-center justify-center bg-[#000000] border border-dashed border-[#18241B] rounded-2xl mb-4">
                <ActivityIndicator size="small" color="#00E676" />
                <Text
                  allowFontScaling={false}
                  className="text-xs font-mono text-momentum-emerald mt-3"
                >
                  Generating inspiration with OpenRouter...
                </Text>
              </View>
            ) : quoteData ? (
              <View className="p-4 bg-[#000000] border border-[#183B22] rounded-2xl mb-4 relative">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Quote size={18} color="#00E676" />
                  <Text
                    allowFontScaling={false}
                    className="text-[10px] font-mono text-momentum-emerald uppercase tracking-wider font-bold"
                  >
                    {quoteData.category || selectedCategory}
                  </Text>
                </View>

                <Text
                  allowFontScaling={false}
                  className="text-sm font-semibold text-white leading-relaxed italic mb-3 font-serif"
                >
                  "{quoteData.quote}"
                </Text>

                <Text
                  allowFontScaling={false}
                  className="text-xs font-mono font-bold text-momentum-emerald mb-3 text-right"
                >
                  — {quoteData.author}
                </Text>

                {quoteData.reflection ? (
                  <View className="pt-2.5 border-t border-[#18241B]">
                    <Text
                      allowFontScaling={false}
                      className="text-[11px] text-[#A2B1A6] leading-4"
                    >
                      💡 {quoteData.reflection}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="py-10 items-center justify-center bg-[#000000] border border-dashed border-[#18241B] rounded-2xl mb-4 px-4">
                <Sparkles size={24} color="#00E676" className="mb-2" />
                <Text
                  allowFontScaling={false}
                  className="text-xs text-white text-center font-semibold mb-1"
                >
                  Ready for Daily Fuel?
                </Text>
                <Text
                  allowFontScaling={false}
                  className="text-[11px] text-momentum-textSecondary text-center leading-4"
                >
                  Select a category or tap Generate to create a custom AI quote with OpenRouter.
                </Text>
              </View>
            )}

            {error ? (
              <View className="mb-3 p-2.5 rounded-lg bg-red-950/30 border border-red-800">
                <Text className="text-xs text-red-300">{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Buttons */}
          <View className="gap-2 mt-1">
            {quoteData ? (
              <TouchableOpacity
                onPress={handleSaveToJournal}
                disabled={isSaving || hasSaved}
                activeOpacity={0.8}
                className={`w-full py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                  hasSaved ? 'bg-[#182B1F] border border-momentum-emerald' : 'bg-momentum-emerald'
                }`}
              >
                {hasSaved ? (
                  <>
                    <Check size={16} color="#00E676" strokeWidth={3} />
                    <Text
                      allowFontScaling={false}
                      className="text-xs font-bold text-momentum-emerald font-sans"
                    >
                      Saved to My Quotes!
                    </Text>
                  </>
                ) : isSaving ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <BookmarkCheck size={16} color="#000000" strokeWidth={2.5} />
                    <Text
                      allowFontScaling={false}
                      className="text-xs font-bold text-black font-sans"
                    >
                      Save to My Quotes
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => generateQuote()}
              disabled={isLoading}
              activeOpacity={0.8}
              className={`w-full py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                quoteData
                  ? 'border border-momentum-border bg-[#000000]'
                  : 'bg-momentum-emerald'
              }`}
            >
              {quoteData ? (
                <>
                  <RefreshCw size={14} color="#00E676" />
                  <Text
                    allowFontScaling={false}
                    className="text-xs font-bold text-white font-sans"
                  >
                    Generate Another
                  </Text>
                </>
              ) : (
                <>
                  <Sparkles size={16} color="#000000" strokeWidth={2.5} />
                  <Text
                    allowFontScaling={false}
                    className="text-xs font-bold text-black font-sans"
                  >
                    Generate AI Quote
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
