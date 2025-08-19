# Head Orchestrator

The `head` worker manages up to ten concurrent secretary sessions by default.
You can override this limit by setting the `HEAD_MAX_SESSIONS` environment
variable. Each session is isolated by `card_id` and stores its vectors under
`/vector_db/qaadi_sec_<card_id>`.

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

Remember to keep fewer than the configured maximum (default ten) sessions active
at once. Exceeding this limit will throw an error.

