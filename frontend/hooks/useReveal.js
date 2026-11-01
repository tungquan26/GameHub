import { useEffect, useRef } from "react";
import useMediaQuery from "./useMediaQuery";
import { afterPageEnter, imageReady, motionDuration } from "@/lib/motion";

export default function useReveal({ enabled = true, mode = "section", targetRef } = {}) {
  const ownRoot = useRef(null);
  const root = targetRef || ownRoot;
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 767px)");
  const completed = useRef(false);
  useEffect(() => {
    const element = root.current;
    if (!enabled || !element || reduced || completed.current || !element.animate || typeof IntersectionObserver === "undefined") return;
    const controller = new AbortController();
    const animations = new Set();
    let started = false;
    const targets = new Set();
    function collect() {
      if (mode !== "posters") return [...element.querySelectorAll("[data-reveal]")];
      const bounds = element.getBoundingClientRect();
      return [...element.querySelectorAll(".game-carousel-card")].filter((item) => {
        const rect = item.getBoundingClientRect();
        return rect.width > 0 && rect.right > bounds.left + 1 && rect.left < bounds.right - 1;
      });
    }
    function show() {
      targets.forEach((target) => target.removeAttribute("data-motion-pending"));
    }
    function finish() {
      completed.current = true;
      observer.disconnect();
      show(); animations.forEach((animation) => animation.cancel()); animations.clear();
      element.dataset.motionState = "complete";
      controller.abort();
    }
    const focus = (event) => {
      // Route restoration focuses the hero heading automatically; it must not cancel the scene.
      if (mode === "hero" && event.target.matches("h1")) return;
      finish();
    };
    element.addEventListener("focusin", focus);
    collect().forEach((target) => { targets.add(target); target.dataset.motionPending = "true"; });
    element.dataset.motionState = "pending";
    async function start() {
      if (started) return;
      started = true;
      observer.disconnect();
      await afterPageEnter(element);
      if (controller.signal.aborted || completed.current) return;
      const visible = collect();
      show();
      element.dataset.motionState = "running";
      try {
        await Promise.all(visible.map(async (target, index) => {
          targets.add(target);
          const focused = document.activeElement;
          const navigationHeading = mode === "hero" && focused?.matches("h1");
          if (!navigationHeading && focused && focused !== document.body && (target.contains(focused) || focused.contains(target))) return;
          const art = target.dataset.revealKind === "hero-art";
          if (art) {
            target.dataset.motionPending = "true";
            await imageReady(target.querySelector("img[data-current='true']"), controller.signal);
          }
          if (controller.signal.aborted || completed.current) return;
          const duration = art && !mobile ? motionDuration(element, "--dp-hero-duration", 650)
            : mobile ? 350 : motionDuration(element, "--dp-reveal-duration", 450);
          const frames = art && !mobile
            ? [{ opacity: 0, transform: "scale(1.04)", clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }, { opacity: 1, transform: "scale(1)", clipPath: "polygon(0 0, 112% 0, 100% 100%, 0 100%)" }]
            : [{ opacity: 0, translate: `0 ${mobile ? 12 : mode === "hero" ? 24 : 20}px` }, { opacity: 1, translate: "0 0" }];
          const delay = Number(target.dataset.revealDelay ?? index * 60);
          const animation = target.animate(frames, { duration, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
          animations.add(animation); target.removeAttribute("data-motion-pending");
          await Promise.resolve(animation.finished).catch(() => {});
          animations.delete(animation); animation.cancel();
        }));
      } catch { /* Keep all content visible if the browser cannot play an entrance. */ }
      finally {
        if (!controller.signal.aborted) finish();
      }
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.15)) start();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => {
      controller.abort(); observer.disconnect(); element.removeEventListener("focusin", focus);
      show(); animations.forEach((animation) => animation.cancel());
      delete element.dataset.motionState;
    };
  }, [enabled, mode, reduced, mobile, root]);
  return root;
}
