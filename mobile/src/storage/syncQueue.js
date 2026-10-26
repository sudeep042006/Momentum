import { localStorage } from './localStorage';

const QUEUE_KEY = 'offline_sync_queue';

export const syncQueue = {
  async getQueue() {
    const queue = await localStorage.getItem(QUEUE_KEY);
    return Array.isArray(queue) ? queue : [];
  },

  async enqueue(action) {
    const queue = await this.getQueue();
    const item = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      ...action,
    };
    queue.push(item);
    await localStorage.setItem(QUEUE_KEY, queue);
    return item;
  },

  async remove(id) {
    const queue = await this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await localStorage.setItem(QUEUE_KEY, filtered);
  },

  async clear() {
    await localStorage.setItem(QUEUE_KEY, []);
  },

  async size() {
    const queue = await this.getQueue();
    return queue.length;
  },
};
