import { describe, it, expect } from '@jest/globals';
import { GET } from '../src/app/api/health/route';

// Ensure the health endpoint exposes the complete diagnostic schema.
describe('health endpoint', () => {
  it('exposes policies, storage, kv, and capsule fields', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.policies).toEqual({
      byok: true,
      storage_public_read_capsules: true,
      storage_public_read_theory_zips: true,
    });

    expect(body).toHaveProperty('storage');
    expect(body).toHaveProperty('kv');
    expect(
      body.capsule &&
        'name' in body.capsule &&
        'sha256' in body.capsule &&
        'ts' in body.capsule
    ).toBeTruthy();
  });
});
