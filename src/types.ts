export type Requirement = {
  id: string;
  text: string;
  kind: 'technical' | 'behavioural' | 'domain';
  priority: 'must' | 'nice';
};

export type Question = {
  id: string;
  requirement_ids: string[];
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit';
  prompt: string;
  answer_outline: string;
  difficulty: number; // 1..3
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
};

export type Day = { day: number; focus: string; question_ids: string[]; minutes: number };

export type Kit = {
  source: { company: string; company_url: string; role: string; location: string; jd_chars: number; researched_at: string; pages_used: string[] };
  company_brief: { summary: string; what_they_do: string; sources: string[] };
  role: { title: string; seniority: string; responsibilities: string[]; requirements: Requirement[] };
  questions: Question[];
  flashcards: Flashcard[];
  schedule: { days_available: number; days: Day[] };
  coverage: { uncovered_requirement_ids: string[]; passes: number };
};
