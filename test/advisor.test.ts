import { test, expect } from '@jest/globals';
import { generateInquiryFromPlan } from '../src/lib/utils/inquiry';

const samplePlan = `- Define scope
- Collect data`;

test('generateInquiryFromPlan creates questions with covers', () => {
  const { markdown, questions } = generateInquiryFromPlan(samplePlan, 'en');
  expect(questions.length).toBe(2);
  expect(markdown.includes('1.')).toBe(true);
  expect(questions[0].covers[0]).toBeTruthy();
  expect(questions[0].question).toContain('Define scope');
});
