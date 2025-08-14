# Health Endpoint Schema

The `/api/health` endpoint exposes diagnostic information about the running
service. The JSON response has the following structure:

```json
{
  "env": "OK",
  "policies": {
    "byok": true,
    "storage_public_read_capsules": true,
    "storage_public_read_theory_zips": true
  },
  "build": { "tag": "<build-tag>" },
  "storage": "<storage-state>",
  "kv": "<kv-state>",
  "capsule": {
    "latest": "<capsule-version>",
    "sha256": "<capsule-checksum>",
    "ts": "<capsule-timestamp>"
  }
}
```

Each field reflects environment and policy information useful for diagnostics.
