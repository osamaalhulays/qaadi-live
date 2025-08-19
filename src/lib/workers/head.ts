import { mkdir, rm } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SESSIONS = Number(process.env.HEAD_MAX_SESSIONS) || 10;

interface SessionInfo {
  session_id: string;
  vectorPath: string;
}

const sessions = new Map<string, SessionInfo>();

function sha256(data: string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function runHead(opts: {
  card_id: string;
  user: string;
  nonce: string;
}): Promise<SessionInfo> {
  const { card_id, user, nonce } = opts;
  if (!card_id) throw new Error("missing_card_id");
  if (!user) throw new Error("missing_user");
  if (!nonce) throw new Error("missing_nonce");
  if (!sessions.has(card_id) && sessions.size >= MAX_SESSIONS) {
    throw new Error("too_many_sessions");
  }

  const vectorPath = path.join("/vector_db", `qaadi_sec_${card_id}`);
  await mkdir(vectorPath, { recursive: true });
  const session_id = sha256(card_id + user + nonce);
  const info = { session_id, vectorPath };
  sessions.set(card_id, info);
  return info;
}

export async function cleanupHead(card_id: string) {
  const info = sessions.get(card_id);
  if (info) {
    await rm(info.vectorPath, { recursive: true, force: true });
  }
}

export async function endHead(card_id: string) {
  await cleanupHead(card_id);
  sessions.delete(card_id);
}

export function resetHead() {
  sessions.clear();
}

export function activeHeadSessions() {
  return Array.from(sessions.keys());
}

export async function exportHead<T>(
  card_ids: string | string[],
  exporter: () => Promise<T>,
): Promise<T> {
  const ids = Array.isArray(card_ids) ? card_ids : [card_ids];
  try {
    return await exporter();
  } finally {
    for (const id of ids) {
      await endHead(id);
    }
  }
}

