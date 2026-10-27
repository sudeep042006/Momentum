import * as quoteService from './quote.service.js';
import * as journalService from '../journals/journal.service.js';

/**
 * GET /api/quotes/daily
 * Returns the cached Quote of the Day
 */
export const getDailyQuote = async (req, res) => {
  try {
    const quote = await quoteService.getDailyQuote();
    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily quote: ' + error.message,
    });
  }
};

/**
 * POST /api/quotes/generate
 * Generates an on-demand quote via OpenRouter AI
 * Body: { category?: string, prompt?: string }
 */
export const generateQuote = async (req, res) => {
  try {
    const { category, prompt } = req.body || {};
    const quote = await quoteService.generateQuote(category, prompt);
    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate quote: ' + error.message,
    });
  }
};

/**
 * POST /api/quotes/save-to-journal
 * Saves a quote directly to the authenticated user's Journal as a Quote card
 * Body: { quote: string, author: string, category?: string, reflection?: string }
 */
export const saveQuoteToJournal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { quote, author, category, reflection } = req.body || {};
    if (!quote) {
      return res.status(400).json({ success: false, message: 'Quote text is required' });
    }

    // In Momentum, quotes have author as title and the quote text as content
    const journalData = {
      title: author || 'Wisdom',
      content: reflection ? `"${quote}"\n\n💡 Reflection: ${reflection}` : quote,
      type: 'quote',
      tags: [category || 'Momentum AI', 'Quote'],
      isPublic: false,
    };

    const saved = await journalService.createJournal(userId, journalData);
    res.status(201).json({
      success: true,
      message: 'Quote saved to journal successfully',
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save quote to journal: ' + error.message,
    });
  }
};
