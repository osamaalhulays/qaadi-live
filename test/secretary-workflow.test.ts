import { test, jest } from '@jest/globals';
import assert from 'node:assert';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runSecretary, runResearchSecretary } from '@/lib/workers/index.ts';
import { runGates } from '@/lib/workflow/gates.ts';

// Build sample data using revised secretary fields
const sampleSecretary = {
  abstract: 'Project overview',
  keywords: ['analysis', 'physics'],
  nomenclature: ['c|m/s|speed of light', 'm|kg|mass'],
  symbols_units: ['c|m/s', 'm|kg'],
  boundary_conditions: ['t=0', 'x->∞'],
  core_equations: ['E=mc^2'],
  assumptions_scope: ['non-relativistic', 'closed system'],
  dimensional_analysis: 'dimensionless',
  limitations_risks: 'oversimplification',
  preliminary_references: ['Doe 2020'],
  version: '1.0',
  status: 'draft',
  parent_id: 'root',
  overflow_log: [],
};

const samplePlan = [
  { item: 'استكمال الاشتقاق', priority: 'P0', qn: 'QN-21-1' },
  { item: 'تحسين الواجهة', priority: 'P2', qn: 'QN-21-8' },
];

const pkg = JSON.stringify({ name: 'qaadi-live', version: '0.1.0' });

test('runSecretary generates a complete secretary.md', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  await writeFile(path.join(dir, 'package.json'), pkg);
  try {
    const content = await runSecretary(sampleSecretary);
    const filePath = path.join(dir, 'paper', 'secretary.md');
    const fileContent = await readFile(filePath, 'utf8');
    assert.strictEqual(fileContent, content);
    const fingerprintMatch = fileContent.match(/^Fingerprint: qaadi-live\/0\.1\.0\/\d{4}-\d{2}-\d{2}\/([a-f0-9]{8})/m);
    assert.ok(fingerprintMatch, 'Fingerprint line missing or incorrect');
    const actualId = fingerprintMatch[1];
    assert.match(fileContent, /Ready%: 100/);
    assert.match(fileContent, new RegExp(`## Identity\\n${actualId}`));
    assert.match(fileContent, /## Abstract\nProject overview/);
    assert.match(
      fileContent,
      /## Keywords\n- analysis\n- physics/
    );
    assert.match(
      fileContent,
      /## Symbols & Units\n- c\|m\/s\n- m\|kg/
    );
    assert.match(
      fileContent,
      /## Nomenclature\n- c\|m\/s\|speed of light\n- m\|kg\|mass/
    );
    assert.match(
      fileContent,
      /## Assumptions & Scope\n- non-relativistic\n- closed system/
    );
    assert.match(
      fileContent,
      /## Core Equations\n- E=mc\^2/
    );
    assert.match(
      fileContent,
      /## Boundary Conditions\n- t=0\n- x->∞/
    );
    assert.match(fileContent, /## Dimensional Analysis\ndimensionless/);
    assert.match(
      fileContent,
      /## Limitations & Risks\noversimplification/
    );
    assert.match(fileContent, /## Preliminary References\n- Doe 2020/);
    assert.match(fileContent, /## Overflow Log\n- none/);
    assert.match(fileContent, /## Version\n1.0/);
    assert.match(fileContent, /## Status\ndraft/);
    assert.match(fileContent, /## Parent ID\nroot/);
  } finally {
    process.chdir(prev);
  }
});

test('runSecretary calculates readiness based on missing fields', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  await writeFile(path.join(dir, 'package.json'), pkg);
  try {
    const partial = { ...sampleSecretary, abstract: '' };
    const content = await runSecretary(partial);
    assert.match(content, /Ready%: 93/);
  } finally {
    process.chdir(prev);
  }
});

test('runGates requires identity among fields', () => {
  const report = {
    abstract: 's',
    keywords: ['k'],
    nomenclature: ['n'],
    symbols_units: ['s|u'],
    core_equations: ['e'],
    boundary_conditions: ['b'],
    assumptions_scope: ['a'],
    dimensional_analysis: 'd',
    limitations_risks: 'r',
    preliminary_references: ['p'],
    version: '1.0',
    status: 'draft',
    parent_id: 'root',
    overflow_log: [],
    identity: 'abcd1234',
  };
  const result = runGates({ secretary: { audit: report } });
  assert.strictEqual(result.ready_percent, 100);
  const missing = runGates({ secretary: { audit: { ...report, identity: '' } } });
  assert.strictEqual(missing.ready_percent, 93);
  assert.ok(missing.missing.includes('identity'));
});

test('runSecretary handles malformed nomenclature rows', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  await writeFile(path.join(dir, 'package.json'), pkg);
  try {
    const malformed = { ...sampleSecretary, nomenclature: ['bad row', 'm|kg|mass'] };
    const content = await runSecretary(malformed);
    assert.match(
      content,
      /## Nomenclature\n- bad row\n- m\|kg\|mass/
    );
    assert.match(content, /Ready%: 100/);
  } finally {
    process.chdir(prev);
  }
});

test('runSecretary outputs empty references section when none provided', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  await writeFile(path.join(dir, 'package.json'), pkg);
  try {
    const noRefs = { ...sampleSecretary, preliminary_references: [] };
    const content = await runSecretary(noRefs);
    assert.match(content, /Ready%: 93/);
    assert.match(content, /## Preliminary References\n\n## Overflow Log\n- none/);
  } finally {
    process.chdir(prev);
  }
});

test('runResearchSecretary writes plan files with QN-21 table', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const { name, content } = await runResearchSecretary('alpha', samplePlan);
    const filePath = path.join(dir, 'paper', `plan-${name}.md`);
    const fileContent = await readFile(filePath, 'utf8');
    assert.strictEqual(fileContent, content);
    assert.match(fileContent, /# Plan for alpha/);
    assert.match(
      fileContent,
      /\| Item \| Priority \| QN-21 Criterion \|\n\|------\|----------\|-----------------\|/
    );
    assert.match(
      fileContent,
      /\| استكمال الاشتقاق \| P0 \| \[QN-21-1\]\(https:\/\/example.com\/qn-21#1\) \|/
    );
    assert.match(
      fileContent,
      /\| تحسين الواجهة \| P2 \| \[QN-21-8\]\(https:\/\/example.com\/qn-21#8\) \|/
    );
  } finally {
    process.chdir(prev);
  }
});

test('runResearchSecretary outputs rows with priority and QN-21 links', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    const { content } = await runResearchSecretary('beta', samplePlan);
    const lines = content.trim().split('\n');
    const rowPattern = /^\| .+ \| P[012] \| \[QN-21-\d+\]\(https:\/\/example.com\/qn-21#\d+\) \|$/;
    for (const line of lines.slice(4)) {
      assert.match(line, rowPattern);
    }
  } finally {
    process.chdir(prev);
  }
});

test('runSecretary logs only when DEBUG_SECRETARY is true', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qaadi-'));
  const prev = process.cwd();
  process.chdir(dir);
  await writeFile(path.join(dir, 'package.json'), pkg);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  try {
    delete process.env.DEBUG_SECRETARY;
    await runSecretary(sampleSecretary);
    let secLogs = spy.mock.calls.filter(
      ([msg]) => typeof msg === 'string' && msg.startsWith('runSecretary:')
    );
    assert.strictEqual(secLogs.length, 0);

    spy.mockClear();
    process.env.DEBUG_SECRETARY = 'true';
    await runSecretary(sampleSecretary);
    secLogs = spy.mock.calls.filter(
      ([msg]) => typeof msg === 'string' && msg.startsWith('runSecretary:')
    );
    assert.strictEqual(secLogs.length, 1);
  } finally {
    spy.mockRestore();
    delete process.env.DEBUG_SECRETARY;
    process.chdir(prev);
  }
});
