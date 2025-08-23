# API Helpers

## API_DOWNLOAD_ZIP

Use `API_DOWNLOAD_ZIP(slug, v)` to generate the download endpoint for a theory archive.

```ts
import { API_DOWNLOAD_ZIP } from '@/lib/endpoints';

fetch(API_DOWNLOAD_ZIP('demo', 'v1.0'));
// => fetch('/api/download/zip?slug=demo&v=v1.0')
```

The helper ensures consistent query parameters instead of manually assembling the URL.

