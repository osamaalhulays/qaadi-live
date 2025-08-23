export const SECRETARY_CARDS = '/secretary/cards';
export const SECRETARY_CARD = (id: string | number) => `${SECRETARY_CARDS}/${id}`;

export const ARCHIVIST_RETRIEVE = (id: string | number) => `/archivist/retrieve/${id}`;
export const JUDGE_EVALUATE_LIVE = '/judge/evaluate/live';

export const API_SECRETARY = '/api/secretary';
export const API_SELFTEST = '/api/selftest';
export const API_INQUIRY = '/api/inquiry';
export const API_GENERATE = '/api/generate';
export const API_EXPORT = '/api/export';
export const API_CRITERIA = '/api/criteria';
export const API_DOWNLOAD_ZIP = '/api/download/zip';
export const API_TEMPLATES = '/api/templates';

export const SNAPSHOTS_MANIFEST = '/snapshots/manifest.json';
export const PAPER_JUDGE = '/paper/judge.json';
