import test from 'node:test';
import assert from 'node:assert';

const encoder = new TextEncoder();

test('collects streamed chunks into final output', async () => {
  const text = 'streaming works';
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'meta', total: text.length }) + '\n'));
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'chunk', data: text, sent: text.length }) + '\n'));
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
      controller.close();
    }
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let out = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const j = JSON.parse(line);
      if (j.type === 'chunk') out += j.data;
    }
  }
  assert.equal(out, text);
});
