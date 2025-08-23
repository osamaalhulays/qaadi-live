/** @jest-environment jsdom */
import { jest, test, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  default: jest.fn(),
}));
import apiClient from '@/lib/apiClient';

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.innerHTML = '';
  document.body.appendChild(container);
  (apiClient as jest.Mock).mockReset();
});

test('doGenerate surfaces API errors', async () => {
  (apiClient as jest.Mock).mockImplementation((url: string) => {
    if (url === '/api/generate') return Promise.reject(new Error('fail'));
    if (url === '/snapshots/manifest.json') return Promise.resolve([]);
    if (url === '/paper/judge.json') return Promise.resolve(null);
    if (url === '/api/criteria') return Promise.resolve([]);
    if (url.startsWith('/api/selftest')) return Promise.resolve({ ratio:0, deviations:[] });
    return Promise.resolve({});
  });
  const { default: Editor } = await import('@/components/Editor');
  const root = createRoot(container);
  await act(async () => {
    root.render(<Editor />);
  });

  const keyInput = container.querySelector('input[placeholder="...sk"]') as HTMLInputElement;
  const targetSelect = container.querySelector('select[title="قالب الإخراج"]') as HTMLSelectElement;
  const langSelect = container.querySelector('select[title="لغة المستند"]') as HTMLSelectElement;
  const textArea = container.querySelector('textarea[title="النص المراد معالجته"]') as HTMLTextAreaElement;

  await act(async () => {
    keyInput.value = 'sk-test';
    keyInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetSelect.value = 'revtex';
    targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
    langSelect.value = 'en';
    langSelect.dispatchEvent(new Event('change', { bubbles: true }));
    textArea.value = 'hi';
    textArea.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const generateButton = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Generate') as HTMLButtonElement;
  await act(async () => {
    generateButton.click();
  });

  expect(container.textContent).toContain('ERROR: fail');
});

test('addCustomCriterion surfaces errors', async () => {
  (apiClient as jest.Mock).mockImplementation((url: string, opts: any = {}) => {
    if (url === '/api/criteria' && opts.method === 'POST') {
      return Promise.reject(new Error('nope'));
    }
    if (url === '/api/criteria') return Promise.resolve([]);
    if (url === '/snapshots/manifest.json') return Promise.resolve([]);
    if (url === '/paper/judge.json') return Promise.resolve(null);
    if (url.startsWith('/api/selftest')) return Promise.resolve({ ratio:0, deviations:[] });
    return Promise.resolve({});
  });
  const { default: Editor } = await import('@/components/Editor');
  const root = createRoot(container);
  await act(async () => {
    root.render(<Editor />);
  });

  const idInput = container.querySelector('input[placeholder="ID"]') as HTMLInputElement;
  const descInput = container.querySelector('input[placeholder="Description"]') as HTMLInputElement;
  const weightInput = container.querySelector('input[placeholder="Weight"]') as HTMLInputElement;
  const keywordsInput = container.querySelector('input[placeholder="keywords,comma"]') as HTMLInputElement;

  await act(async () => {
    idInput.value = 'c1';
    idInput.dispatchEvent(new Event('input', { bubbles: true }));
    descInput.value = 'desc';
    descInput.dispatchEvent(new Event('input', { bubbles: true }));
    weightInput.value = '1';
    weightInput.dispatchEvent(new Event('input', { bubbles: true }));
    keywordsInput.value = 'k';
    keywordsInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const addBtn = container.querySelector('div.add-crit button') as HTMLButtonElement;
  await act(async () => {
    addBtn.click();
  });

  expect(container.textContent).toContain('Add criterion error: nope');
});
