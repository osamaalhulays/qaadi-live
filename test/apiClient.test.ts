import { apiFetch } from '@/lib/apiClient';

const ENV_KEY = 'NEXT_PUBLIC_QAADI_API_BASE';

describe('apiFetch', () => {
  const originalFetch = global.fetch;
  const originalBase = process.env[ENV_KEY];

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalBase === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = originalBase;
    }
    jest.resetAllMocks();
  });

  test('returns raw Response when raw option is true', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    const response = new Response('ok', { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(response);

    const result = await apiFetch('/test', { raw: true });
    expect(result).toBe(response);
  });

  test('throws "invalid_json" for malformed JSON body', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    const response = new Response('not-json', { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(apiFetch('/test')).rejects.toBe('invalid_json');
  });

  test('includes path in error on network failure', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await expect(apiFetch('/fail')).rejects.toThrow('/fail');
  });

  test('includes path and status in error on non-OK response', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    const response = new Response('error', { status: 500 });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(apiFetch('/error')).rejects.toThrow(/\/error.*500/);
  });
});

