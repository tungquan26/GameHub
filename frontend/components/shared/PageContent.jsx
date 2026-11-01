import { Suspense, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import useMediaQuery from "@/hooks/useMediaQuery";
import { pageViewKey } from "@/lib/page-navigation";
import PageSkeleton from "./PageSkeleton";

function ReadyContent({ children, viewKey }) {
  const ref = useRef(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  useLayoutEffect(() => {
    if (reduced) return;
    const element = ref.current;
    if (!element?.animate) return;
    const tokens = getComputedStyle(element);
    const animation = element.animate([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], {
      duration: parseFloat(tokens.getPropertyValue("--dp-page-slide-duration")) || 350,
      easing: tokens.getPropertyValue("--dp-page-slide-ease").trim() || "cubic-bezier(0.22, 1, 0.36, 1)",
    });
    return () => animation.cancel();
  }, [viewKey, reduced]);
  return <div ref={ref} data-page-ready={viewKey}>{children}</div>;
}
export default function PageContent({ page, children }) {
  const location = useLocation(); const viewKey = pageViewKey(location);
  return <div data-page-content={viewKey} tabIndex={-1} className="min-w-0 outline-none">
    <Suspense fallback={<PageSkeleton page={page} contained={page?.layout === "public" || page?.path === "/tournament/schedule" && new URLSearchParams(location.search).get("view") === "public"} />}><ReadyContent viewKey={viewKey}>{children}</ReadyContent></Suspense>
  </div>;
}
