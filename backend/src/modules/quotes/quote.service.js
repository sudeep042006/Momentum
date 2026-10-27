/**
 * OpenRouter AI Quote & Inspiration Service for Momentum
 * Powers daily quotes, on-demand AI inspiration, and stoic productivity mantras.
 */

// In-memory daily cache { dateKey: "YYYY-MM-DD", quote: {...} }
let dailyQuoteCache = {
  dateKey: null,
  data: null,
};

// Curated high-impact offline fallback quotes for developers & builders
const FALLBACK_QUOTES = [
  {
    quote: "We don't rise to the level of our expectations, we fall to the level of our training.",
    author: "Archilochus",
    category: "discipline",
    reflection: "Your habits determine your floor when pressure mounts. Build repeatable daily momentum."
  },
  {
    quote: "The secret to getting ahead is getting started. Break your complex overwhelming tasks into small manageable tasks.",
    author: "Mark Twain",
    category: "momentum",
    reflection: "Do not wait for motivation. Complete the first micro-step and let momentum take over."
  },
  {
    quote: "Talk is cheap. Show me the code.",
    author: "Linus Torvalds",
    category: "execution",
    reflection: "Execution speaks louder than planning. Ship one concrete improvement today."
  },
  {
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    category: "stoicism",
    reflection: "Focus purely on your reaction, your focus, and your current block of deep work."
  },
  {
    quote: "Discipline equals freedom.",
    author: "Jocko Willink",
    category: "discipline",
    reflection: "Structure your hours rigorously so you earn true autonomy over your life and craft."
  },
  {
    quote: "You do not decide your future. You decide your habits, and your habits decide your future.",
    author: "F.M. Alexander",
    category: "consistency",
    reflection: "Small daily repetitions compound into exponential skill over time."
  },
  {
    quote: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
    category: "coding",
    reflection: "Remove non-essential distractions from your workspace, code, and daily schedule."
  },
  {
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
    category: "focus",
    reflection: "Clarify your immediate intent before jumping blindly into execution."
  },
  {
    quote: "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work as a human being.",
    author: "Marcus Aurelius",
    category: "morning",
    reflection: "Step up to your duty today with zero excuses. The world rewards consistency."
  },
  {
    quote: "A year from now you may wish you had started today.",
    author: "Karen Lamb",
    category: "momentum",
    reflection: "The only day that truly exists is today. Commit to the first block."
  }
];

/**
 * Gets the OpenRouter API Key from environment variables
 */
const getApiKey = () => {
  return process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || '';
};

/**
 * Calls OpenRouter chat completions endpoint
 */
async function callOpenRouter(messages, modelOverride = null) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in the environment.');
  }

  // Preferred models: Fast, reliable free models first, then openrouter/auto
  const models = modelOverride
    ? [modelOverride]
    : [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'google/gemini-flash-1.5',
      ];

  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://momentum-app.com',
          'X-Title': 'Momentum Productivity Engine',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.75,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[OpenRouter] Model ${model} returned ${response.status}:`, errorText);
        lastError = new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
        continue; // Try next fallback model
      }

      const json = await response.json();
      const rawContent = json?.choices?.[0]?.message?.content;
      if (!rawContent) {
        continue;
      }

      // Extract JSON if wrapped in markdown code blocks
      const cleanJson = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed.quote && parsed.author) {
          return {
            quote: parsed.quote.trim().replace(/^["']|["']$/g, ''),
            author: parsed.author.trim(),
            category: parsed.category || 'momentum',
            reflection: parsed.reflection || 'Stay relentless and focused today.',
            modelUsed: model,
          };
        }
      } catch (parseErr) {
        // Fallback: extract quote directly if response is plain text
        return {
          quote: rawContent.split('\n')[0].replace(/^["']|["']$/g, ''),
          author: 'Momentum AI',
          category: 'momentum',
          reflection: 'Keep your momentum strong.',
          modelUsed: model,
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[OpenRouter] Attempt with ${model} failed:`, err.message);
    }
  }

  throw lastError || new Error('All OpenRouter models failed to respond.');
}

/**
 * Returns a randomized fallback quote
 */
function getOfflineFallbackQuote(category = null) {
  let list = FALLBACK_QUOTES;
  if (category) {
    const filtered = FALLBACK_QUOTES.filter((q) => q.category.toLowerCase() === category.toLowerCase());
    if (filtered.length > 0) list = filtered;
  }
  const index = Math.floor(Math.random() * list.length);
  return {
    ...list[index],
    isFallback: true,
  };
}

/**
 * Generates an on-demand quote based on a category/theme
 * @param {string} category - e.g. 'discipline', 'coding', 'stoic', 'focus', 'momentum'
 * @param {string} customPrompt - Optional specific prompt from user
 */
export async function generateQuote(category = 'momentum', customPrompt = '') {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.log('[OpenRouter] No API key present. Using curated fallback quote.');
      return getOfflineFallbackQuote(category);
    }

    const messages = [
      {
        role: 'system',
        content: `You are a stoic mentor and daily momentum guide for ambitious software developers and creators.
Generate an inspiring, punchy, discipline-first quote.
Return STRICT JSON ONLY matching this schema:
{
  "quote": "Quote text (under 25 words)",
  "author": "Author Name (or Stoic Philosopher / Tech Legend / Modern Builder)",
  "category": "${category || 'momentum'}",
  "reflection": "One actionable 1-sentence thought on how to apply this today."
}`,
      },
      {
        role: 'user',
        content: customPrompt || `Give me a powerful, thought-provoking quote about ${category || 'momentum, discipline, and daily execution'}.`,
      },
    ];

    const result = await callOpenRouter(messages);
    return {
      ...result,
      isFallback: false,
    };
  } catch (error) {
    console.error('[OpenRouter] Quote generation failed, using fallback:', error.message);
    return getOfflineFallbackQuote(category);
  }
}

/**
 * Retrieves the Quote of the Day (cached per day for high speed and zero wasted API quota)
 */
export async function getDailyQuote() {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (dailyQuoteCache.dateKey === dateKey && dailyQuoteCache.data) {
    return dailyQuoteCache.data;
  }

  try {
    const quote = await generateQuote('momentum', 'Generate the official quote of the day for today. Focus on consistency, deep work, and daily discipline.');
    dailyQuoteCache = {
      dateKey,
      data: {
        ...quote,
        date: dateKey,
      },
    };
    return dailyQuoteCache.data;
  } catch (error) {
    const fallback = getOfflineFallbackQuote('momentum');
    return {
      ...fallback,
      date: dateKey,
    };
  }
}
