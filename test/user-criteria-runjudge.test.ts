import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import { tmpdir } from "os";
import { readFile } from "fs/promises";
import { runJudge } from "../src/lib/runJudge";
import { evaluateQN21 } from "../src/lib/q21";

const sampleText = "This sentence mentions Foo only.";

const userCriteria = [
  { name: "foo", type: "internal", description: "contains foo", isActive: true },
  { name: "bar", type: "external", description: "contains bar", isActive: false },
];

test("runJudge writes user criteria without altering qn21 totals", async () => {
  const baseline = evaluateQN21(sampleText).reduce((s, c) => s + c.score, 0);
  const out = path.join(tmpdir(), `judge-${Date.now()}.json`);
  const report = await runJudge(sampleText, userCriteria, out);

  assert.strictEqual(report.score_total, baseline);
  assert.ok(report.criteria.length > 0);
  assert.strictEqual(report.user_criteria.length, 1);
  assert.strictEqual(report.user_criteria[0].name, "foo");
  assert.strictEqual(report.user_criteria[0].score, 1);
  assert.strictEqual(report.user_criteria[0].description, "contains foo");
  assert.ok(report.user_criteria[0].id > report.criteria.length);

  const file = JSON.parse(await readFile(out, "utf8"));
  assert.deepStrictEqual(file, report);
});
