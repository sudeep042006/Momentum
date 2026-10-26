import NetInfo from '@react-native-community/netinfo';

class NetworkMonitor {
  constructor() {
    this.isConnected = true;
    this.listeners = new Set();
    this.unsubscribe = null;
  }

  start() {
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (this.isConnected !== isOnline) {
        this.isConnected = isOnline;
        this.notify(isOnline);
      }
    });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  addListener(callback) {
    if (typeof callback !== 'function') return () => {};
    this.listeners.add(callback);
    try {
      callback(this.isConnected);
    } catch (e) {
      console.warn('Error in network listener callback:', e);
    }
    return () => this.listeners.delete(callback);
  }

  notify(status) {
    this.listeners.forEach((callback) => callback(status));
  }

  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
    return this.isConnected;
  }
}

export const networkMonitor = new NetworkMonitor();
