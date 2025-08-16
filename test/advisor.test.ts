import { describe, it, expect } from '@jest/globals';
import { generateInquiryFromPlan } from '../src/lib/utils/inquiry';

const samplePlan = `- Define scope
- Collect data`;

describe('generateInquiryFromPlan', () => {
  it('creates questions with covers', () => {
    const { markdown, questions } = generateInquiryFromPlan(samplePlan, 'en');
    expect(questions).toHaveLength(2);
    expect(markdown).toContain('1.');
    expect(questions[0].covers[0]).toBeTruthy();
    expect(questions[0].question).toContain('Define scope');
  });
});
