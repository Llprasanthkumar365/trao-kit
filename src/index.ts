import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { mockLLM, openAIClient } from './llm';
import { buildKit } from './generator';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '200kb' }));

const apiKey = process.env.OPENAI_API_KEY || '';
const llm = apiKey ? openAIClient(apiKey, process.env.OPENAI_MODEL) : mockLLM();

app.post('/api/generate', async (req, res) => {
  try {
    const { id, jd, company_url, days } = req.body;
    if (!id || !jd || !company_url || !days) return res.status(400).json({ error: 'missing id/jd/company_url/days' });
    const kit = await buildKit({ id, jd, company_url, days }, { llm });
    return res.json({ id, status: 'ok', kit });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 5002;
app.listen(port, () => console.log(`trao-kit backend listening ${port}`));
