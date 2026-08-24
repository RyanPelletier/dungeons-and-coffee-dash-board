import type { Timestamp } from "firebase/firestore";

// Firestore returns serverTimestamp() writes as Timestamp objects (and
// briefly as null, before the pending write syncs). Normalize to millis so
// the rest of the app can just use plain numbers / `new Date(...)`.
export function tsToMillis(ts: Timestamp | number | null | undefined): number {
  if (ts == null) return Date.now();
  if (typeof ts === "number") return ts;
  return ts.toMillis();
}
