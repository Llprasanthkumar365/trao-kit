import axios from 'axios';

export type LLM = {
  generateQuestions: (requirements: { id: string; text: string; kind: string }[], category: string) => Promise<{ prompt: string; answer_outline: string; difficulty: number; requirement_ids: string[] }[]>;
};

// Mock LLM: deterministic simple question generation
export const mockLLM = (): LLM => ({
  async generateQuestions(reqs, category) {
    const out: any[] = [];
    for (const r of reqs) {
      out.push({
        prompt: `Explain and discuss: ${r.text}`,
        answer_outline: `Key points to cover for ${r.text}`,
        difficulty: 2,
        requirement_ids: [r.id]
      });
    }
    return out;
  }
});

async function requestWithRetry(url: string, body: any, headers: any, retries = 3, backoff = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await axios.post(url, body, { headers, timeout: 20000 });
      return resp;
    } catch (err: any) {
      const code = err?.response?.status;
      if (attempt === retries - 1) throw err;
      // exponential backoff
      await new Promise((r) => setTimeout(r, backoff * Math.pow(2, attempt)));
      if (code && code >= 500) continue;
    }
  }
  throw new Error('unreachable');
}

// OpenAI client wrapper (uses chat completions). Produces robust JSON extraction and graceful fallback.
export const openAIClient = (apiKey: string, model = 'gpt-4o-mini'): LLM => ({
  async generateQuestions(reqs, category) {
    // System prompt enforces JSON-only output and schema
    const system = `You are a JSON-only generator. Given an array of requirements each with an id and text, produce a JSON array of objects. Each object must have keys: prompt (string), answer_outline (string), difficulty (1|2|3), requirement_ids (array of ids). Return ONLY the JSON array with no explanation.`;

    const user = `Requirements: ${JSON.stringify(reqs)}\nCategory: ${category}\nProduce concise interview questions that target each requirement. Output only JSON array.`;

    const body = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      max_tokens: 1000,
      temperature: 0.2
    };

    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    let resp: any;
    try {
      resp = await requestWithRetry('https://api.openai.com/v1/chat/completions', body, headers, 3, 500);
    } catch (e) {
      return mockLLM().generateQuestions(reqs, category);
    }

    const txt = resp.data?.choices?.[0]?.message?.content || resp.data?.choices?.[0]?.text || '';
    // Try to extract JSON array anywhere in the output
    const start = txt.indexOf('[');
    const end = txt.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      return mockLLM().generateQuestions(reqs, category);
    }

    const jsonText = txt.slice(start, end + 1);
    try {
      const parsed = JSON.parse(jsonText);
      return parsed.map((p: any) => ({ prompt: p.prompt || p.q || '', answer_outline: p.answer_outline || p.a || '', difficulty: Math.min(3, Math.max(1, p.difficulty || 2)), requirement_ids: p.requirement_ids || [] }));
    } catch (e) {
      return mockLLM().generateQuestions(reqs, category);
    }
  }
});
