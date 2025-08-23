import { test } from '@jest/globals';
import assert from 'node:assert';
import { generateInquiryFromPlan } from '@/lib/utils/inquiry';

const samplePlan = `- Define scope
- Collect data`;

test('generateInquiryFromPlan creates questions with covers', () => {
  const { markdown, questions } = generateInquiryFromPlan(samplePlan, 'en');
  assert.strictEqual(questions.length, 2);
  assert(markdown.includes('1.'));
  assert(questions[0].covers[0]);
  assert(questions[0].question.includes('Define scope'));
});
