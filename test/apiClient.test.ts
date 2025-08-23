import apiClient, { apiFetch } from '@/lib/apiClient';

const ENV_KEY = 'NEXT_PUBLIC_QAADI_API_BASE';

describe('apiClient', () => {
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

    const result = await apiClient('/test', { raw: true });
    expect(result).toBe(response);
  });

  test('throws "invalid_json" for malformed JSON body', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    const response = new Response('not-json', { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(apiClient('/test')).rejects.toThrow('invalid_json');
  });

  test('throws "network_error" when fetch fails', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    const error = new Error('network down');
    global.fetch = jest.fn().mockRejectedValue(error);

    await expect(apiClient('/test')).rejects.toThrow(`network_error: ${error.message}`);
  });

  test('throws "network_error" when request times out', async () => {
    jest.useFakeTimers();
    process.env[ENV_KEY] = 'https://example.com';
    global.fetch = jest.fn().mockImplementation((_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
    );

    const promise = apiClient('/test', { timeout: 10 });
    jest.advanceTimersByTime(11);
    await expect(promise).rejects.toThrow('network_error: aborted');
    jest.useRealTimers();
  });

  test('rethrows errors other than SyntaxError from res.json()', async () => {
    process.env[ENV_KEY] = 'https://example.com';
    const error = new Error('oops');
    const response = {
      ok: true,
      json: jest.fn().mockRejectedValue(error),
    } as unknown as Response;
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(apiFetch('/test')).rejects.toBe(error);
  });
});

