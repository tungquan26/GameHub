import { useLayoutEffect, useRef } from "react";
import useMediaQuery from "./useMediaQuery";
import { motionDuration } from "@/lib/motion";

export default function useNavIndicator(pathname, mobile) {
  const root = useRef(null);
  const previous = useRef(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  useLayoutEffect(() => {
    const nav = root.current;
    if (!nav || mobile) return;
    const marker = nav.querySelector("[data-nav-indicator]");
    let animation;
    function measure(animate = false) {
      const link = nav.querySelector("a[aria-current='page']");
      const bounds = nav.getBoundingClientRect();
      if (!link || !bounds.width) { animation?.cancel(); marker.style.opacity = "0"; previous.current = null; return; }
      const rect = link.getBoundingClientRect();
      const next = { x: rect.left - bounds.left, width: rect.width };
      if (!animate && previous.current?.x === next.x && previous.current?.width === next.width) return;
      animation?.cancel();
      marker.style.width = `${next.width}px`; marker.style.transform = `translateX(${next.x}px)`; marker.style.opacity = "1";
      if (animate && !reduced && previous.current && marker.animate) animation = marker.animate([
        { transform: `translateX(${previous.current.x}px)`, width: `${previous.current.width}px` },
        { transform: `translateX(${next.x}px)`, width: `${next.width}px` },
      ], { duration: motionDuration(nav, "--dp-motion-duration", 180), easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      previous.current = next;
    }
    measure(true);
    const resize = () => measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(nav); nav.querySelectorAll("a").forEach((link) => observer?.observe(link));
    window.addEventListener("resize", resize);
    return () => { animation?.cancel(); observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [pathname, mobile, reduced]);
  return root;
}
