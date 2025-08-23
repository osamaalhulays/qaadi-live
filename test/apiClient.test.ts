import { apiFetch } from '../src/lib/apiClient';
import { jest } from '@jest/globals';

describe('apiFetch', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    if (realFetch) {
      global.fetch = realFetch;
    }
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  test('prepends base URL and returns JSON on success', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://example.com';
    const mockJson = { ok: true };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJson),
    });
    // @ts-ignore
    global.fetch = fetchMock;
    const data = await apiFetch('/test');
    expect(fetchMock).toHaveBeenCalledWith('http://example.com/test', {});
    expect(data).toEqual(mockJson);
  });

  test('throws error when response not ok', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://example.com';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad',
      json: jest.fn().mockResolvedValue({ error: 'fail' }),
    });
    // @ts-ignore
    global.fetch = fetchMock;
    await expect(apiFetch('/bad')).rejects.toThrow('fail');
  });
});
