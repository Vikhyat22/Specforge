/**
 * Anthropic Claude streaming provider
 */
async function streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      return onError(`Anthropic API error ${response.status}: ${errorText}`);
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

        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta' &&
          event.delta.text
        ) {
          onChunk(event.delta.text);
        } else if (event.type === 'message_stop') {
          onDone();
          return;
        }
      }
    }

    // Stream ended without explicit message_stop
    onDone();
  } catch (err) {
    onError(err.message || 'Unknown error from Anthropic provider');
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
