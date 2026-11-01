import { useCallback, useEffect, useRef, useState } from "react";
import useMediaQuery from "./useMediaQuery";

export default function useHeroSlides(count) {
  const [view, setView] = useState({ current: 0, outgoing: null, preload: count > 1 ? 1 : null });
  const current = useRef(view);
  const loaded = useRef(new Set());
  const failed = useRef(new Set());
  const waiting = useRef(false);
  const mounted = useRef(true);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const commit = useCallback((value) => { current.current = value; setView(value); }, []);
  const nextAvailable = useCallback((index, exclude = null) => {
    for (let offset = 1; offset < count; offset++) {
      const next = (index + offset) % count;
      if (next !== exclude && !failed.current.has(next)) return next;
    }
    return null;
  }, [count]);
  const advance = useCallback(() => {
    const previous = current.current;
    const next = previous.preload;
    if (!mounted.current || reducedRef.current || next === null || !loaded.current.has(next)) return;
    waiting.current = false;
    commit({ current: next, outgoing: failed.current.has(previous.current) ? null : previous.current, preload: nextAvailable(next) });
  }, [commit, nextAvailable]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; waiting.current = false; }; }, []);
  useEffect(() => {
    if (reduced) { waiting.current = false; return; }
    const timer = setTimeout(() => { waiting.current = true; advance(); }, 5000);
    return () => clearTimeout(timer);
  }, [view.current, reduced, advance]);
  useEffect(() => {
    if (view.outgoing === null) return;
    if (reduced) { commit({ ...current.current, outgoing: null }); return; }
    const timer = setTimeout(() => commit({ ...current.current, outgoing: null }), 500);
    return () => clearTimeout(timer);
  }, [view.outgoing, reduced, commit]);
  const onLoad = useCallback(async (index, image) => {
    try { await image.decode?.(); } catch { /* A loaded image remains a usable fallback if decode is unsupported. */ }
    if (!mounted.current) return;
    loaded.current.add(index);
    if (waiting.current && current.current.preload === index) advance();
  }, [advance]);
  const onError = useCallback((index) => {
    if (!mounted.current) return;
    failed.current.add(index); loaded.current.delete(index);
    const previous = current.current;
    if (previous.preload === index) commit({ ...previous, preload: nextAvailable(index, previous.current) });
    if (previous.current === index) waiting.current = true;
    if (waiting.current) advance();
  }, [commit, nextAvailable, advance]);
  return { ...view, onLoad, onError };
}
