# Head Orchestrator

The `head` worker manages up to ten concurrent secretary sessions. Each
session is isolated by `card_id` and stores its vectors under
`${VECTOR_DB}/qaadi_sec_<card_id>`. If `VECTOR_DB` is not set, it defaults to
`vector_db` within the current working directory.

## API usage

```
POST /api/generate?workflow=head
{
  "card_id": "abc123",
  "user": "alice",
  "nonce": "random"
}
```

The response returns the generated `session_id` (SHA256 of
`card_id + user + nonce`) and the vector storage path.

## CLI usage

In a Node.js script:

```ts
import { runHead } from '../src/lib/workers';

const session = await runHead({ card_id: 'abc123', user: 'alice', nonce: '1' });
console.log(session.session_id);
```

Remember to keep fewer than ten sessions active at once. Exceeding this
limit will throw an error.

