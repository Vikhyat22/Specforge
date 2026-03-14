const anthropic   = require('./providers/anthropic');
const gemini      = require('./providers/gemini');
const openrouter  = require('./providers/openrouter');
const opencode    = require('./providers/opencode');

/**
 * Returns the name of the currently configured AI provider.
 * Reads AI_PROVIDER from the environment; defaults to 'openrouter'.
 */
function getProvider() {
  return (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
}

/**
 * Stream a completion from whichever provider is active.
 *
 * @param {string}   systemPrompt
 * @param {string}   userPrompt
 * @param {Function} onChunk  - called with each text fragment as it arrives
 * @param {Function} onDone   - called once when the stream finishes
 * @param {Function} onError  - called with an error message string on failure
 */
function streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError) {
  const provider = getProvider();

  if (provider === 'anthropic') {
    return anthropic.streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError);
  }

  if (provider === 'gemini') {
    return gemini.streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError);
  }

  if (provider === 'opencode') {
    return opencode.streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError);
  }

  // default: openrouter
  return openrouter.streamCompletion(systemPrompt, userPrompt, onChunk, onDone, onError);
}

module.exports = { streamCompletion, getProvider };
