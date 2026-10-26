import { syncQueue } from '../storage/syncQueue';
import { networkMonitor } from './networkMonitor';
import apiClient from '../api/apiClient';
import { uploadImageFile } from '../api/imageUpload';
import { cacheManager } from '../storage/cacheManager';

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.listeners = new Set();
  }

  init() {
    networkMonitor.start();
    networkMonitor.addListener((isOnline) => {
      if (isOnline) {
        this.drainQueue();
      }
    });
  }

  addSyncListener(callback) {
    if (typeof callback !== 'function') return () => {};
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event) {
    this.listeners.forEach((cb) => cb(event));
  }

  async drainQueue() {
    if (this.isSyncing) return;
    const isOnline = await networkMonitor.checkConnection();
    if (!isOnline) return;

    this.isSyncing = true;
    this.notify({ status: 'syncing' });

    try {
      const queue = await syncQueue.getQueue();
      for (const item of queue) {
        try {
          // If payload contains a local offline image URI, upload to Cloudinary first
          if (
            item.payload?.image &&
            (item.payload.image.startsWith('file://') || item.payload.image.startsWith('content://'))
          ) {
            try {
              const cloudUrl = await uploadImageFile(item.payload.image);
              if (cloudUrl) {
                const oldLocalUri = item.payload.image;
                item.payload.image = cloudUrl;

                // Also reconcile local cached journals so they reflect the remote Cloudinary URL
                const cachedJournals = await cacheManager.getJournals();
                if (Array.isArray(cachedJournals)) {
                  const updatedJournals = cachedJournals.map((j) =>
                    j.image === oldLocalUri ? { ...j, image: cloudUrl } : j
                  );
                  await cacheManager.setJournals(updatedJournals);
                }
              }
            } catch (imgErr) {
              console.warn('Failed to upload queued local image to Cloudinary:', imgErr?.message);
            }
          }

          if (item.method === 'POST') {
            await apiClient.post(item.endpoint, item.payload);
          } else if (item.method === 'PUT') {
            await apiClient.put(item.endpoint, item.payload);
          } else if (item.method === 'DELETE') {
            await apiClient.delete(item.endpoint);
          }
          await syncQueue.remove(item.id);
        } catch (itemErr) {
          // If server error or offline again, stop draining
          console.warn('Sync failed for mutation item:', item.id, itemErr.message);
          if (!itemErr.response || itemErr.response.status >= 500) {
            break;
          }
          // If 4xx (bad data/not found), remove to prevent poisoning the queue
          if (itemErr.response?.status === 400 || itemErr.response?.status === 404) {
            await syncQueue.remove(item.id);
          }
        }
      }
    } catch (e) {
      console.error('Error during queue drain:', e);
    } finally {
      this.isSyncing = false;
      this.notify({ status: 'idle' });
    }
  }
}

export const syncEngine = new SyncEngine();
