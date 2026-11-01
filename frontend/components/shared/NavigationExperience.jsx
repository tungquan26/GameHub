import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { findFocusTarget, focusDescriptor, focusWithoutScroll, hashId, locationUrl, pageViewKey } from "@/lib/page-navigation";

const HistoryViewContext = createContext(null);
const STORAGE_KEY = "btp_navigation_v1";
function loadHistory() {
  try {
    const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return new Map(Array.isArray(data) ? data.filter(([key, value]) => typeof key === "string" && typeof value?.url === "string" && Number.isFinite(value.y) && Number.isFinite(value.x)).slice(-60) : []);
  } catch { return new Map(); }
}

export default function NavigationExperience({ children }) {
  const location = useLocation(); const navigationType = useNavigationType();
  const history = useRef(null); if (!history.current) history.current = loadHistory();
  // Keep the pre-mount snapshot separate from entries created by child UI.
  // StrictMode repeats mount effects before the first restoration completes.
  const initialSnapshot = useRef(history.current.get(location.key));
  const hasNavigated = useRef(false);
  const current = useRef(location); const previous = useRef(null);
  const restoring = useRef(false);
  const context = useMemo(() => ({
    read: (name, initial) => history.current.get(location.key)?.ui?.[name] ?? initial,
    write: (name, value) => {
      const entry = history.current.get(location.key) || { url: locationUrl(location), x: window.scrollX, y: window.scrollY };
      entry.ui = { ...entry.ui, [name]: value }; history.current.set(location.key, entry);
    },
  }), [location]);

  useLayoutEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    function record(event) {
      if (restoring.current) return;
      const entry = history.current.get(current.current.key) || { ui: {} };
      entry.url = locationUrl(current.current); entry.x = window.scrollX; entry.y = window.scrollY;
      entry.regions = [...document.querySelectorAll("main [role=region][tabindex='0']")].map((element) => ({ label: element.getAttribute("aria-label"), x: element.scrollLeft, y: element.scrollTop }));
      if (event?.type === "focusin") entry.focus = focusDescriptor(event.target);
      history.current.set(current.current.key, entry);
    }
    function persist() {
      record();
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...history.current].slice(-60))); } catch { /* Navigation still works without browser storage. */ }
    }
    window.addEventListener("scroll", record, { passive: true });
    document.addEventListener("scroll", record, true);
    document.addEventListener("focusin", record);
    window.addEventListener("pagehide", persist);
    return () => {
      persist(); window.history.scrollRestoration = original;
      window.removeEventListener("scroll", record); document.removeEventListener("scroll", record, true); document.removeEventListener("focusin", record); window.removeEventListener("pagehide", persist);
    };
  }, []);

  useLayoutEffect(() => {
    const before = previous.current;
    const sameView = before && pageViewKey(before) === pageViewKey(location);
    if (before && before.key !== location.key) hasNavigated.current = true;
    const saved = hasNavigated.current ? history.current.get(location.key) : initialSnapshot.current;
    const snapshot = saved?.url === locationUrl(location) ? { ...saved } : null;
    current.current = location; previous.current = location;
    if (!saved) history.current.set(location.key, { url: locationUrl(location), x: window.scrollX, y: window.scrollY, ui: sameView ? history.current.get(before.key)?.ui : {} });
    while (history.current.size > 60) history.current.delete(history.current.keys().next().value);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...history.current])); } catch { /* Optional restoration storage. */ }
    // Typing, filters and pagination update their URL without moving focus or
    // replaying a page transition. POP still restores that history entry.
    if (sameView && navigationType !== "POP" && before.hash === location.hash && !location.state?.scrollTo) return;

    const restore = navigationType === "POP" && snapshot;
    const anchor = typeof location.state?.scrollTo === "string" ? location.state.scrollTo : hashId(location.hash);
    let frame, timeout, observer, stopped = false;
    restoring.current = true;
    function stop() {
      stopped = true; restoring.current = false;
      cancelAnimationFrame(frame); clearTimeout(timeout); observer?.disconnect();
      for (const type of ["wheel", "touchstart", "pointerdown", "keydown", "focusin"]) window.removeEventListener(type, interrupt);
    }
    function interrupt() { stop(); }
    function apply(final = false) {
      if (stopped) return;
      const content = document.querySelector("[data-page-content]");
      if (!content || content.querySelector("[data-navigation-pending]") || document.querySelector("[data-layout-pending]")) { if (final) stop(); return; }
      const target = anchor && document.getElementById(anchor);
      if (!restore && anchor && !target && !final) return;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (restore && snapshot.y > maxY + 1 && !final) return;
      if (restore) window.scrollTo({ left: snapshot.x, top: snapshot.y, behavior: "instant" });
      else if (target) target.scrollIntoView?.({ block: "start", inline: "nearest", behavior: "instant" });
      else if (!sameView || !before) window.scrollTo({ left: 0, top: 0, behavior: "instant" });
      if (restore && Array.isArray(snapshot.regions)) {
        [...document.querySelectorAll("main [role=region][tabindex='0']")].forEach((element, index) => {
          const region = snapshot.regions[index];
          if (region?.label === element.getAttribute("aria-label")) { element.scrollLeft = region.x; element.scrollTop = region.y; }
        });
      }
      const active = document.activeElement;
      if (!active?.closest("[role=dialog]")) {
        const restoredFocus = restore && findFocusTarget(snapshot.focus);
        // Preserve intentional autofocus (OTP, resumed team dialogs).
        if (restoredFocus) focusWithoutScroll(restoredFocus);
        else if (!(content.contains(active) && active.matches("input, select, textarea"))) focusWithoutScroll(target || content.querySelector("h1, h2") || document.querySelector("main h1") || content);
      }
      stop();
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => apply()); }
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-navigation-pending", "data-layout-pending", "hidden"] });
    for (const type of ["wheel", "touchstart", "pointerdown", "keydown", "focusin"]) window.addEventListener(type, interrupt, { passive: true });
    timeout = setTimeout(() => apply(true), 5000);
    schedule();
    return stop;
  }, [location, navigationType]);

  return <HistoryViewContext.Provider value={context}>{children}</HistoryViewContext.Provider>;
}

// UI that has no shareable URL (expanded archives, profile list page) follows
// the history entry, so returning to the list restores its rendered height.
export function useHistoryViewState(name, initial) {
  const context = useContext(HistoryViewContext);
  const [value, setValue] = useState(() => context?.read(name, initial) ?? initial);
  useLayoutEffect(() => { context?.write(name, value); }, [context, name, value]);
  return [value, setValue];
}
