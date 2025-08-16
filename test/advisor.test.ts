import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInquiryFromPlan } from '../src/lib/utils/inquiry';

const samplePlan = `- Define scope
- Collect data`;

describe('generateInquiryFromPlan', () => {
  it('creates questions with covers', () => {
    const { markdown, questions } = generateInquiryFromPlan(samplePlan, 'en');
    assert.strictEqual(questions.length, 2);
    assert.ok(markdown.includes('1.'));
    assert.ok(questions[0].covers[0]);
    assert.ok(questions[0].question.includes('Define scope'));
  });
});
