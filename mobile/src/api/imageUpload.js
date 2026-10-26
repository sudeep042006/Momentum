import { Platform } from 'react-native';
import apiClient from './apiClient';

/**
 * Uploads a local image file to Cloudinary via backend /api/users/upload
 * @param {string} uri - Local file uri (file:// or content://)
 * @param {string} [fileName] - Optional file name
 * @param {string} [mimeType] - Optional mime type
 * @returns {Promise<string|null>} Cloudinary secure_url or null on failure
 */
export async function uploadImageFile(uri, fileName, mimeType) {
  if (!uri) return null;
  // If it's already a remote URL, return it directly
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  const formData = new FormData();
  formData.append('image', {
    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
    name: fileName || `image_${Date.now()}.jpg`,
    type: mimeType || 'image/jpeg',
  });

  try {
    const res = await apiClient.post('/api/journals/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 35000,
    });
    if (res.data?.url) return res.data.url;
  } catch (err) {
    // Fallback to /api/users/upload
    try {
      const res = await apiClient.post('/api/users/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 35000,
      });
      return res.data?.url || null;
    } catch (fallbackErr) {
      console.warn('Both journal and user image upload failed:', fallbackErr?.message);
      return null;
    }
  }

  return null;
}
