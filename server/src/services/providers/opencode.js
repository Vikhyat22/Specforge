async function streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError) {
  try {
    const response = await fetch('https://opencode.ai/zen/go/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENCODE_GO_API_KEY,
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        max_tokens: 16000,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      }),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      return onError(`OpenCode Go error ${response.status}: ${text}`)
    }
    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    async function* readChunks(reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield value
      }
    }
    for await (const value of readChunks(reader)) {
      const raw = decoder.decode(value, { stream: true })
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          onDone()
          return
        }
        try {
          const parsed  = JSON.parse(data)
          const content = parsed?.choices?.[0]?.delta?.content
          if (content) onChunk(content)
        } catch {
          // skip malformed frames
        }
      }
    }
    onDone()
  } catch (err) {
    onError(err.message || 'OpenCode Go stream failed')
  }
}
module.exports = { streamCompletion }
