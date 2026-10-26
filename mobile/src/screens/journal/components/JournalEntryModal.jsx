import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { X, FileText, Quote, Plus, Image as ImageIcon, Camera, Trash2 } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageFile } from '../../../api/imageUpload';
import { networkMonitor } from '../../../sync/networkMonitor';
import { colors } from '../../../theme/colors';

export default function JournalEntryModal({
  visible,
  initialData = null,
  defaultType = 'note',
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('note');
  const [imageUri, setImageUri] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTags(Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '');
      setType(initialData.type || 'note');
      setImageUri(initialData.image || '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
      setType(defaultType);
      setImageUri('');
    }
    setIsUploading(false);
  }, [initialData, defaultType, visible]);

  const processSelectedAsset = async (asset) => {
    if (!asset?.uri) return;
    // Show image immediately inside phone so user can see it without waiting
    setImageUri(asset.uri);

    // If connected, try uploading to Cloudinary through backend
    try {
      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        setIsUploading(true);
        const cloudinaryUrl = await uploadImageFile(asset.uri, asset.fileName, asset.type);
        if (cloudinaryUrl) {
          setImageUri(cloudinaryUrl);
        }
      }
    } catch (err) {
      console.log('Saved image locally inside phone. Will sync when connected:', err?.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Gallery Error', result.errorMessage || 'Could not open image library');
        return;
      }

      const asset = result?.assets?.[0];
      if (asset) {
        await processSelectedAsset(asset);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      setIsUploading(false);
    }
  };

  const handleCaptureCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Momentum requires camera permission to capture photos for your notes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
          return;
        }
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Camera Error', result.errorMessage || 'Could not open camera');
        return;
      }

      const asset = result?.assets?.[0];
      if (asset) {
        await processSelectedAsset(asset);
      }
    } catch (err) {
      console.warn('Camera capture error:', err);
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    const splitTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      content: content.trim(),
      tags: splitTags.length > 0 ? splitTags : [type === 'quote' ? 'Quote' : 'General'],
      type,
      image: imageUri || null,
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
            className="bg-momentum-card border-t border-momentum-borderLight rounded-t-3xl p-6 pb-8 max-h-[85%]"
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  allowFontScaling={false}
                  className="text-base font-bold text-white tracking-tight"
                >
                  {initialData ? 'Edit Entry' : type === 'quote' ? 'New Quote' : 'New Note'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-1 -mr-1"
                >
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Segmented Type Toggle */}
              <View className="flex-row gap-2.5 mb-4">
                <TouchableOpacity
                  onPress={() => setType('note')}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-2 ${
                    type === 'note'
                      ? 'bg-[#0D241C] border-momentum-emerald'
                      : 'bg-momentum-surface border-momentum-border'
                  }`}
                >
                  <FileText
                    size={14}
                    color={type === 'note' ? colors.emerald.bright : colors.text.muted}
                  />
                  <Text
                    allowFontScaling={false}
                    className={`text-xs font-bold ${
                      type === 'note' ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                    }`}
                  >
                    Notes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType('quote')}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-2 ${
                    type === 'quote'
                      ? 'bg-[#0D241C] border-momentum-emerald'
                      : 'bg-momentum-surface border-momentum-border'
                  }`}
                >
                  <Quote
                    size={14}
                    color={type === 'quote' ? colors.emerald.bright : colors.text.muted}
                  />
                  <Text
                    allowFontScaling={false}
                    className={`text-xs font-bold ${
                      type === 'quote' ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                    }`}
                  >
                    Quotes
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title / Attribution Input */}
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={type === 'quote' ? 'Author / Attribution (e.g. Marcus Aurelius)' : 'Title (e.g. Scaler Course)'}
                placeholderTextColor={colors.text.muted}
                className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-white mb-3"
              />

              {/* Content Multi-line */}
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder={type === 'quote' ? '"Write the quote here..."' : 'Capture your insights, progress, or ideas...'}
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-momentum-input border border-momentum-border rounded-xl p-3.5 text-sm text-white h-24 mb-3"
              />

              {/* Tags Input */}
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="Tags separated by commas (e.g. Learning, Backend, Java)"
                placeholderTextColor={colors.text.muted}
                className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-2.5 text-xs text-white mb-3"
              />

              {/* Image Attachment Section */}
              <View className="mb-4">
                {imageUri ? (
                  <View className="relative rounded-2xl overflow-hidden border border-momentum-border mb-2 bg-[#060806]">
                    <Image source={{ uri: imageUri }} className="w-full h-36" resizeMode="cover" />
                    {isUploading ? (
                      <View className="absolute inset-0 bg-black/70 items-center justify-center flex-row gap-2">
                        <ActivityIndicator size="small" color="#00E676" />
                        <Text className="text-xs font-semibold text-white">Uploading to Cloudinary...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setImageUri('')}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 items-center justify-center"
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={handleCaptureCamera}
                      disabled={isUploading}
                      activeOpacity={0.8}
                      className="flex-1 flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-momentum-border bg-momentum-surface"
                    >
                      <Camera size={14} color={colors.emerald.bright} />
                      <Text
                        allowFontScaling={false}
                        className="text-xs font-semibold text-momentum-emerald"
                      >
                        Take Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handlePickFromGallery}
                      disabled={isUploading}
                      activeOpacity={0.8}
                      className="flex-1 flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-momentum-border bg-momentum-surface"
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color={colors.emerald.bright} />
                      ) : (
                        <ImageIcon size={14} color={colors.emerald.bright} />
                      )}
                      <Text
                        allowFontScaling={false}
                        className="text-xs font-semibold text-momentum-emerald"
                      >
                        {isUploading ? 'Uploading...' : 'From Gallery'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!content.trim()}
                activeOpacity={0.8}
                className={`w-full py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                  content.trim() ? 'bg-momentum-emerald' : 'bg-momentum-emerald/30'
                }`}
              >
                <Plus size={16} color="#000000" strokeWidth={3} />
                <Text
                  allowFontScaling={false}
                  className="text-sm font-bold text-black font-sans"
                >
                  {initialData ? 'Update Entry' : 'Save Entry'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
