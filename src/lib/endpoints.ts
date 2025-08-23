export const API_HEALTH = '/api/health';
export const API_DOWNLOAD_ZIP = (slug: string, v: string) =>
  `/api/download/zip?slug=${encodeURIComponent(slug)}&v=${encodeURIComponent(v)}`;
