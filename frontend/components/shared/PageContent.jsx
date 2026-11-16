import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { pageViewKey } from "@/lib/page-navigation";
import PageSkeleton from "./PageSkeleton";

function ReadyContent({ children, viewKey }) {
  return <div data-page-ready={viewKey}>{children}</div>;
}
export default function PageContent({ page, children }) {
  const location = useLocation(); const viewKey = pageViewKey(location);
  return <div data-page-content={viewKey} tabIndex={-1} className="min-w-0 outline-none">
    <Suspense fallback={<PageSkeleton page={page} contained={page?.layout === "public" || page?.path === "/tournament/schedule" && new URLSearchParams(location.search).get("view") === "public"} />}><ReadyContent viewKey={viewKey}>{children}</ReadyContent></Suspense>
  </div>;
}
