# Qaadi Live

This repository hosts the core modules for the **Qaadi** workflow: secretary, judge, consultant and related utilities.

## Workflow Guide

For an overview of all stages from the secretary to the journalist, including required fields and visual indicators, see the [roles workflow](docs/roles-workflow.md).

Additional references:

- [QN21 criteria](docs/qn21-criteria.md) – detailed description of the twenty-one evaluation metrics.
- [Gate stack](docs/gate-stack.md) – explanation of the four gates and their requirements.

## Quick Start

```bash
npm install
npm test
```

## Testing

Jest discovers test files using the pattern `**/test/**/*.test.ts`. Place your
tests in a `test` directory and use the `.test.ts` suffix so they are executed
when running `npm test`.

The system evaluates scientific drafts using the QN-21 criteria and optional custom criteria.

**Mandatory fields** checked by the secretary gate:

- summary
- keywords
- tokens
- boundary
- post-analysis
- risks
- predictions
- testability

