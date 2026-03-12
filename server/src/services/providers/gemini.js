/**
 * Google Gemini streaming provider
 */
async function streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError) {
  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent` +
      `?alt=sse&key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          maxOutputTokens: 8000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      return onError(`Gemini API error ${response.status}: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    for await (const chunk of readChunks(reader)) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        let event;
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }

        const part = event?.candidates?.[0]?.content?.parts?.[0];
        if (part?.text) {
          onChunk(part.text);
        }
      }
    }

    onDone();
  } catch (err) {
    onError(err.message || 'Unknown error from Gemini provider');
  }
}

/** Helper: async iterator over ReadableStream reader chunks */
async function* readChunks(reader) {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

module.exports = { streamCompletion };
