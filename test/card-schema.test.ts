import { CardSchema } from '@/lib/schema/card.ts';
import { test, expect } from '@jest/globals';

test('submissionDate accepts valid calendar dates', () => {
  const data = {
    caseNumber: '2024-001',
    submissionDate: '2024-02-29',
    documents: ['petition.pdf'],
  };
  const parsed = CardSchema.parse(data);
  expect(parsed.submissionDate).toBe('2024-02-29');
});

test('submissionDate rejects invalid calendar dates', () => {
  const data = {
    caseNumber: '2024-001',
    submissionDate: '2024-02-30',
    documents: ['petition.pdf'],
  };
  expect(() => CardSchema.parse(data)).toThrow();
});
