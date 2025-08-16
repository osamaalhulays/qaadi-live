# Qaadi Live

This repository hosts the core modules for the **Qaadi** workflow: secretary, judge, consultant and related utilities.

## Quick Start

```bash
npm install
npm test
```

## Testing

Jest discovers test files using the pattern `**/test/**/*.test.ts`. Place your
tests in a `test` directory and use the `.test.ts` suffix so they are executed
when running `npm test`.

The system evaluates scientific drafts using the QN-21 criteria and optional custom criteria. The secretary gate checks ensure required fields (summary, keywords, tokens, boundary, post-analysis, risks, predictions and testability) are present before running the judge.

