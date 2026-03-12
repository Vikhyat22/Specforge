import { useState, useCallback } from 'react';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const stream = useCallback(async (url, body, onChunk, onDone) => {
    const token = localStorage.getItem('sf_token');

    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errMsg = `Request failed: ${response.status}`;
        try {
          const json = await response.json();
          errMsg = json.error || errMsg;
        } catch {
          // ignore parse error
        }
        setError(errMsg);
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (!data) continue;

          if (data === '[DONE]') {
            onDone();
            setIsStreaming(false);
            return;
          }

          let event;
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }

          if (event.type === 'chunk') {
            onChunk(event.text);
          } else if (event.type === 'error') {
            setError(event.message || 'Stream error');
            setIsStreaming(false);
            return;
          }
        }
      }

      // Reader exhausted without [DONE]
      onDone();
      setIsStreaming(false);
    } catch (err) {
      setError(err.message || 'Unknown error');
      setIsStreaming(false);
    }
  }, []);

  return { stream, isStreaming, error, setError };
}
