import { allocateSchedule } from '../generator';

test('allocateSchedule distributes questions across days and uses integer minutes', () => {
  const questions = Array.from({ length: 6 }, (_, i) => ({ id: `q${i+1}`, requirement_ids: [`r${i+1}`], category: 'technical', prompt: '', answer_outline: '', difficulty: 2 }));
  const reqs = Array.from({ length: 6 }, (_, i) => ({ id: `r${i+1}`, text: `req${i+1}`, kind: 'technical', priority: 'must' }));
  const sched = allocateSchedule(3, questions as any, reqs as any);
  expect(sched.days.length).toBe(3);
  for (const d of sched.days) {
    expect(typeof d.minutes).toBe('number');
    expect(Number.isInteger(d.minutes)).toBe(true);
  }
});
