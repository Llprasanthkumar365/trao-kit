import { extractRequirements } from '../generator';

test('extractRequirements returns at least one requirement for short JD', () => {
  const reqs = extractRequirements('') // empty jd
  expect(reqs.length).toBeGreaterThanOrEqual(1);
});
