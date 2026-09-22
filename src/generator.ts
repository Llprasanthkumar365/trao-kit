import { Kit, Requirement, Question, Flashcard } from './types';
import { fetchPage, extractLinks } from './crawler';
import { LLM, mockLLM, openAIClient } from './llm';

function idFor(prefix: string, n: number) { return `${prefix}${n}`; }

function nowISOString() { return new Date().toISOString(); }

// Simple requirement extractor: split JD into lines and pick lines with keywords
export function extractRequirements(jd: string) {
  const lines = jd.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const reqs: Requirement[] = [];
  let idx = 1;
  for (const l of lines) {
    const lower = l.toLowerCase();
    const isMust = /\b(required|must|must have|should)\b/.test(lower) || /\b\d+\+?\s*years?\b/.test(lower);
    const kind = /react|node|python|java|typescript|docker|kafka/.test(lower) ? 'technical' : (/mentor|manage|lead|senior|team/.test(lower) ? 'behavioural' : 'domain');
    reqs.push({ id: idFor('r', idx++), text: l, kind: kind as any, priority: isMust ? 'must' : 'nice' });
  }
  if (reqs.length === 0) reqs.push({ id: 'r1', text: jd.slice(0, 140), kind: 'domain', priority: 'must' });
  return reqs;
}

// Schedule allocator: distribute questions across days, ensure must reqs covered
export function allocateSchedule(daysAvailable: number, questions: Question[], requirements: Requirement[]) {
  const totalMinutes = daysAvailable * 120; // default 2 hours/day
  const minutesPerQuestion = Math.max(15, Math.floor(totalMinutes / Math.max(1, questions.length)));
  const days: any[] = Array.from({ length: daysAvailable }, (_, i) => ({ day: i + 1, focus: '', question_ids: [], minutes: 0 }));

  // Place must requirements early by ensuring their first question is scheduled early
  const qByReq: Record<string, string[]> = {};
  for (const q of questions) for (const rid of q.requirement_ids) { qByReq[rid] = qByReq[rid] || []; qByReq[rid].push(q.id); }

  // seed day assignments
  let qi = 0;
  for (const req of requirements.filter(r => r.priority === 'must')) {
    const qids = qByReq[req.id] || [];
    if (qids.length) {
      days[Math.min(qi, days.length - 1)].question_ids.push(qids[0]);
      qi++;
    }
  }

  // fill remaining questions round-robin
  const assigned = new Set(days.flatMap(d => d.question_ids));
  let didx = 0;
  for (const q of questions) {
    if (assigned.has(q.id)) continue;
    days[didx].question_ids.push(q.id);
    didx = (didx + 1) % days.length;
  }

  // set minutes and focus
  for (const day of days) {
    day.minutes = Math.max(15, day.question_ids.length * minutesPerQuestion);
    day.focus = day.question_ids.length ? `Practice ${day.question_ids.length} questions` : 'Review company brief';
  }

  return { days_available: daysAvailable, days };
}

export async function buildKit(caseInput: { id: string; jd: string; company_url: string; days: number }, opts: { llm?: LLM }) {
  const llm = opts.llm || mockLLM();

  const jd = caseInput.jd || '';
  const requirements = extractRequirements(jd);

  // crawl company homepage and first-level links
  const pages_used: string[] = [];
  const homepage = await fetchPage(caseInput.company_url);
  pages_used.push(homepage.url);
  const links = extractLinks(homepage.text, caseInput.company_url).slice(0, 10);
  for (const l of links) {
    const p = await fetchPage(l);
    if (p.text) pages_used.push(l);
  }

  // company brief small heuristic
  const what_they_do = homepage.text ? (homepage.text.replace(/\s+/g, ' ').slice(0, 400)) : '';

  // Questions generation + coverage loop (up to 3 passes)
  const questions: Question[] = [];
  const flashcards: Flashcard[] = [];
  const maxPasses = 3;
  let passes = 0;
  let uncovered = requirements.map(r => r.id);

  while (passes < maxPasses && uncovered.length > 0) {
    passes++;
    const gen = await llm.generateQuestions(requirements.filter(r => uncovered.includes(r.id)), 'technical');
    let qIdx = questions.length + 1;
    for (const g of gen) {
      const q: Question = { id: `q${qIdx++}`, requirement_ids: g.requirement_ids.length ? g.requirement_ids : [requirements[0].id], category: 'technical', prompt: g.prompt, answer_outline: g.answer_outline, difficulty: g.difficulty };
      questions.push(q);
      flashcards.push({ id: `f${flashcards.length + 1}`, front: q.prompt, back: q.answer_outline, requirement_ids: q.requirement_ids });
    }

    // recompute uncovered
    const covered = new Set(questions.flatMap(q => q.requirement_ids));
    uncovered = requirements.filter(r => !covered.has(r.id)).map(r => r.id);
  }

  const schedule = allocateSchedule(caseInput.days, questions, requirements);

  const kit: Kit = {
    source: { company: caseInput.company_url.replace(/https?:\/\//, '').split('/')[0], company_url: caseInput.company_url, role: '', location: '', jd_chars: jd.length, researched_at: nowISOString(), pages_used },
    company_brief: { summary: what_they_do.slice(0, 200), what_they_do, sources: pages_used },
    role: { title: '', seniority: '', responsibilities: [], requirements },
    questions,
    flashcards,
    schedule,
    coverage: { uncovered_requirement_ids: uncovered, passes }
  };

  return kit;
}
