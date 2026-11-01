import { DASHBOARD_SAMPLES, SEARCH_SAMPLES, EVENT_SAMPLES } from "./fixtures";

// Các ID cũ là alias của cùng một fixture, không phải các đời giải mới.
export const SAMPLE_ALIASES = { 201: 1, 203: 3, 204: 7 };
const catalog = new Map();
for (const entry of [...DASHBOARD_SAMPLES, ...SEARCH_SAMPLES, ...EVENT_SAMPLES]) {
  const id = SAMPLE_ALIASES[entry.id] ?? entry.id;
  if (!catalog.has(String(id))) catalog.set(String(id), { ...entry, id, sample: true, role: null });
}
export const TOURNAMENT_SAMPLES = [...catalog.values()];
export function findSample(id) {
  return catalog.get(String(SAMPLE_ALIASES[id] ?? id)) || null;
}
