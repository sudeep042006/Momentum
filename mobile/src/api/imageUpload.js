import { Platform } from 'react-native';
import apiClient from './apiClient';

/**
 * Uploads a local image file to Cloudinary via backend authenticated endpoints
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

  const cleanUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
  const extension = cleanUri.split('.').pop()?.toLowerCase() || 'jpg';
  const name = fileName || `note_${Date.now()}.${extension}`;
  const type = mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');

  const formData = new FormData();
  formData.append('image', {
    uri: cleanUri,
    name,
    type,
  });

  try {
    const res = await apiClient.post('/api/journals/upload', formData, {
      headers: {
        'Accept': 'application/json',
      },
      transformRequest: (data) => data,
      timeout: 45000,
    });
    if (res.data?.url) {
      return res.data.url;
    }
  } catch (err) {
    try {
      const res = await apiClient.post('/api/users/upload', formData, {
        headers: {
          'Accept': 'application/json',
        },
        transformRequest: (data) => data,
        timeout: 45000,
      });
      if (res.data?.url) return res.data.url;
    } catch (fallbackErr) {
      console.warn('Image upload failed:', fallbackErr?.response?.data || fallbackErr?.message);
      return null;
    }
  }

  return null;
}
