import { stableStringify } from '@/lib/utils/idempotency';

describe('stableStringify', () => {
  test('handles cyclic object references', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;
    expect(stableStringify(obj)).toBe(
      '{"name":"test","self":"[Circular]"}',
    );
  });

  test('handles cyclic array references', () => {
    const arr: any[] = [];
    arr.push(arr);
    expect(stableStringify(arr)).toBe('["[Circular]"]');
  });
});
