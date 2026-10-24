let fetchFn;
async function getFetch() {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch;
  }
  if (fetchFn) return fetchFn;
  const mod = await import('node-fetch');
  fetchFn = mod.default;
  return fetchFn;
}

/**
 * Generate AI-powered task description or summary using OpenRouter.
 * Expects JSON body with `title` and optional `details` or `description`.
 */
async function generateTaskDescription(req, res, next) {
  try {
    const { title, details, description: existingDescription } = req.body;
    if (!title && !existingDescription) {
      return res.status(400).json({ success: false, message: 'Title or description is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'OpenRouter API key not configured' });
    }

    let prompt;
    if (existingDescription) {
      prompt = `Summarize and polish the following task description into clear objectives, deliverables, and acceptance criteria:\n"${existingDescription}"`;
    } else {
      prompt = `Create a clear, concise task description for a task titled "${title}"` +
        (details ? ` with the following details: ${details}` : '') +
        `. The description should be suitable for a collaborative task management system, including key objectives, expected outcome, and any relevant constraints.`;
    }

    const fetchClient = await getFetch();
    const response = await fetchClient('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'AirTribe Task Generator',
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, message: 'OpenRouter error', details: errText });
    }

    const data = await response.json();
    const generatedContent = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({
      success: true,
      data: {
        description: generatedContent,
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateTaskDescription };
