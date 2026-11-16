import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/routes";

const EASE = "cubic-bezier(.77,0,.18,1)";
const COVER_MS = 420;
const LAYER_GAP_MS = 100;
const REVEAL_MS = 480;
const PAGE_MS = 550;
const PAGE_DELAY_MS = 60;
const PAGE_SHIFT = 6;
const OFFSCREEN = 101;

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function getMajorPageKey(location) {
  if (!location) return "";
  const { pathname, search } = location;

  if (pathname.startsWith("/tournament/")) {
    const params = new URLSearchParams(search);
    const id = params.get("id");
    const sample = params.get("sample");
    const name = params.get("name");
    const identity = id || (sample ? `sample:${name || ""}` : "space");
    return `/tournament/${identity}`;
  }

  return pathname;
}

function slide(element, from, to, duration, delay = 0) {
  if (!element?.animate) {
    return { finished: Promise.resolve(), cancel: () => {} };
  }
  return element.animate(
    [{ transform: `translateX(${from}%)` }, { transform: `translateX(${to}%)` }],
    { duration, delay, easing: EASE, fill: "both" }
  );
}

function settle(animations, onDone) {
  let cancelled = false;
  Promise.all(animations.map((a) => a.finished)).then(
    () => {
      if (!cancelled) onDone();
    },
    () => {}
  );
  return () => {
    cancelled = true;
    animations.forEach((a) => a.cancel());
  };
}

function getNavigationDirection(navigationType, fromPath, toPath) {
  if (navigationType === "POP") return -1;
  const fromIndex = PAGE_ROUTES.findIndex((item) => item.path === fromPath);
  const toIndex = PAGE_ROUTES.findIndex((item) => item.path === toPath);
  if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
    return toIndex > fromIndex ? 1 : -1;
  }
  return 1;
}

export default function PageTransition({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const activeKey = getMajorPageKey(location);

  const [view, setView] = useState(() => ({
    key: activeKey,
    node: children,
    displayLocation: location,
    phase: "idle",
    sweep: 1,
  }));

  const latest = useRef({ key: activeKey, node: children, location });
  const previousPath = useRef(location.pathname);
  const settledKey = useRef(activeKey);
  const pageRef = useRef(null);
  const cyanRef = useRef(null);
  const groundRef = useRef(null);

  if (view.phase === "idle" && activeKey !== view.key) {
    const direction = getNavigationDirection(navigationType, previousPath.current, location.pathname);
    previousPath.current = location.pathname;

    if (prefersReducedMotion()) {
      setView({
        key: activeKey,
        node: children,
        displayLocation: location,
        phase: "idle",
        sweep: 1,
      });
    } else {
      setView((current) => ({
        ...current,
        phase: "cover",
        sweep: direction,
      }));
    }
  }

  useLayoutEffect(() => {
    latest.current = { key: activeKey, node: children, location };
    previousPath.current = location.pathname;
  });

  useLayoutEffect(() => {
    if (settledKey.current === view.key) return;
    settledKey.current = view.key;
  }, [view.key]);

  useLayoutEffect(() => {
    if (view.phase !== "cover") return undefined;
    const start = -OFFSCREEN * view.sweep;
    return settle(
      [
        slide(cyanRef.current, start, 0, COVER_MS),
        slide(groundRef.current, start, 0, COVER_MS, LAYER_GAP_MS),
      ],
      () => {
        setView((current) => ({
          ...current,
          key: latest.current.key,
          node: latest.current.node,
          displayLocation: latest.current.location,
          phase: "reveal",
        }));
      }
    );
  }, [view.phase, view.sweep]);

  useLayoutEffect(() => {
    if (view.phase !== "reveal") return undefined;
    const end = OFFSCREEN * view.sweep;
    return settle(
      [
        slide(groundRef.current, 0, end, REVEAL_MS),
        slide(cyanRef.current, 0, end, REVEAL_MS, LAYER_GAP_MS),
        slide(pageRef.current, PAGE_SHIFT * view.sweep, 0, PAGE_MS, PAGE_DELAY_MS),
      ],
      () => setView((current) => ({ ...current, phase: "idle" }))
    );
  }, [view.phase, view.sweep]);

  const effectiveLocation = view.phase === "cover" ? view.displayLocation : location;

  const renderedContent =
    typeof children === "function"
      ? children(effectiveLocation)
      : activeKey === view.key
      ? children
      : view.node;

  return (
    <div
      className="pt-container"
      data-phase={view.phase}
      aria-busy={view.phase !== "idle"}
    >
      <div
        className="pt-content"
        key={view.key}
        ref={pageRef}
        {...(view.phase === "cover" ? { "data-navigation-pending": "true" } : {})}
      >
        {renderedContent}
      </div>
      <div className="pt-wipe" aria-hidden="true">
        <span className="pt-wipe-layer pt-wipe-cyan" ref={cyanRef} />
        <span className="pt-wipe-layer pt-wipe-ground" ref={groundRef} />
      </div>
    </div>
  );
}
