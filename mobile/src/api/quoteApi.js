import apiClient from './apiClient';

export const quoteApi = {
  /**
   * Fetches the cached Quote of the Day
   */
  getDailyQuote: () => apiClient.get('/api/quotes/daily'),

  /**
   * Generates a new AI quote on demand via OpenRouter
   * @param {{ category?: string, prompt?: string }} params
   */
  generateQuote: (params = {}) => apiClient.post('/api/quotes/generate', params),

  /**
   * Saves an AI-generated quote directly to the user's Journal (type: 'quote')
   * @param {{ quote: string, author: string, category?: string, reflection?: string }} data
   */
  saveQuoteToJournal: (data) => apiClient.post('/api/quotes/save-to-journal', data),
};
