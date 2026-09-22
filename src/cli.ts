#!/usr/bin/env node
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { buildKit } from './generator';
import { mockLLM, openAIClient } from './llm';

async function run() {
  const argv = yargs(hideBin(process.argv)).option('input', { type: 'string', demandOption: true }).option('output', { type: 'string', demandOption: true }).argv as any;
  const inputFile = argv.input;
  const outputFile = argv.output;

  const raw = fs.readFileSync(inputFile, 'utf8');
  const cases = JSON.parse(raw);
  const results: any[] = [];

  const apiKey = process.env.OPENAI_API_KEY || '';
  const llm = apiKey ? openAIClient(apiKey, process.env.OPENAI_MODEL) : mockLLM();

  for (const c of cases) {
    try {
      const kit = await buildKit(c, { llm });
      results.push({ id: c.id, status: 'ok', kit, error: null });
    } catch (e: any) {
      results.push({ id: c.id, status: 'failed', kit: null, error: { code: 'GEN_FAIL', message: e.message || String(e) } });
    }
  }

  const out = { version: '1.0', generated_at: new Date().toISOString(), kits: results };
  fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));
  console.log('Wrote', outputFile);
}

run().catch((e) => { console.error(e); process.exit(1); });
