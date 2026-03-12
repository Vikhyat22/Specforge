/**
 * OpenRouter streaming provider.
 * Uses the OpenAI-compatible /v1/chat/completions endpoint with SSE.
 */
async function streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'SpecForge',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        max_tokens: 8000,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      return onError(`OpenRouter error ${response.status}: ${text}`);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    for await (const value of readChunks(reader)) {
      const raw = decoder.decode(value, { stream: true });

      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6); // strip 'data: '

        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed  = JSON.parse(data);
          const content = parsed?.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // skip malformed JSON frames
        }
      }
    }

    // Stream exhausted without [DONE] — still signal completion
    onDone();
  } catch (err) {
    onError(err.message || 'OpenRouter stream failed');
  }
}

/**
 * Async generator that yields Uint8Array chunks from a ReadableStream reader.
 */
async function* readChunks(reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield value;
  }
}

module.exports = { streamCompletion };
