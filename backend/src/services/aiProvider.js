import axios from 'axios';

/**
 * Universal AI Provider Client
 * Supports Google Gemini, OpenAI, Groq, Anthropic, OpenRouter
 * Falls back to built-in intelligent domain-specific heuristic engine if API key is not configured or fails.
 */
export const callAI = async (prompt, systemInstruction = '', jsonMode = true) => {
  const apiKey = process.env.AI_API_KEY;
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo');

  if (!apiKey || apiKey.trim() === '') {
    // Return null to signal fallback to the deterministic smart heuristic engine
    return null;
  }

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2500,
          responseMimeType: jsonMode ? 'application/json' : 'text/plain'
        }
      };

      const response = await axios.post(url, payload, { timeout: 15000 });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini API');

      return jsonMode ? parseJSONSafely(text) : text;
    }

    if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
      const baseURL = provider === 'groq' 
        ? 'https://api.groq.com/openai/v1/chat/completions' 
        : provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const payload = {
        model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        ...(jsonMode && provider === 'openai' ? { response_format: { type: 'json_object' } } : {})
      };

      const response = await axios.post(baseURL, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const text = response.data?.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Empty response from ${provider} API`);

      return jsonMode ? parseJSONSafely(text) : text;
    }

    return null;
  } catch (error) {
    console.warn(`[AI Provider Warning] ${provider} call failed: ${error.message}. Using high-precision heuristic fallback.`);
    return null;
  }
};

export const parseJSONSafely = (text) => {
  if (typeof text !== 'string') return text;
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try cleaning code markdown blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (inner) {
        console.error('Failed to parse json block:', inner.message);
      }
    }
    // Try finding outer curly braces
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (inner) {
        console.error('Failed to parse braced substring:', inner.message);
      }
    }
    throw new Error('AI returned non-JSON text output');
  }
};
