import { cn } from "@/lib/utils";

function Bar({ className }) { return <div className={cn("skeleton-block h-3 rounded bg-dp-hairline", className)} />; }
export function TournamentListSkeleton({ count = 5 }) {
  return <div role="status" aria-label="Đang tải danh sách giải đấu" data-navigation-pending className="space-y-4">
    <span className="sr-only">Đang tải danh sách giải đấu…</span>
    {Array.from({ length: count }, (_, index) => <div key={index} aria-hidden="true" className="dp-panel flex min-h-48 flex-wrap items-center gap-4 p-4 sm:min-h-40 sm:flex-nowrap sm:p-5"><Bar className="size-16 shrink-0 sm:size-20" /><div className="min-w-0 flex-1 space-y-4"><Bar className="h-4 w-3/4" /><Bar className="w-1/2" /><Bar className="w-2/3" /></div><Bar className="h-6 w-24" /></div>)}
  </div>;
}
export function TournamentViewSkeleton() {
  return <div role="status" aria-label="Đang tải thông tin giải đấu" data-navigation-pending className="space-y-7">
    <span className="sr-only">Đang tải thông tin giải đấu…</span>
    <div aria-hidden="true" className="dp-panel overflow-hidden"><Bar className="h-40 rounded-none sm:h-56" /><div className="space-y-5 p-6"><Bar className="h-7 w-2/3" /><Bar className="w-1/2" /><Bar className="w-3/5" /><Bar className="h-9 w-48" /></div></div>
    <div aria-hidden="true" className="flex gap-5 border-b border-dp-hairline py-4">{[0,1,2,3].map((key) => <Bar key={key} className="h-4 w-16" />)}</div>
    <div aria-hidden="true" className="dp-panel space-y-5 p-6"><Bar className="h-5 w-2/5" /><Bar /><Bar className="w-4/5" /><Bar className="w-3/5" /></div>
  </div>;
}
export default function PageSkeleton({ page, contained = false }) {
  const management = page?.layout === "tournament";
  return <div className={cn(!contained && !management && "dp-container py-9 sm:py-12")}>
    {contained ? <div role="status" aria-label="Đang tải nội dung giải đấu" data-navigation-pending className="space-y-7"><span className="sr-only">Đang tải nội dung giải đấu…</span><Bar className="h-7 w-48" /><div aria-hidden="true" className="dp-panel min-h-64 space-y-6 p-6"><Bar className="w-2/3" /><Bar /><Bar className="w-3/4" /></div></div> : <div role="status" aria-label={`Đang tải ${page?.title || "nội dung"}`} data-navigation-pending className="space-y-7">
      <span className="sr-only">Đang tải {page?.title || "nội dung"}…</span>
      <div aria-hidden="true" className="space-y-4 pb-3"><Bar className="w-36" /><Bar className="h-9 w-2/3 max-w-md" /><Bar className="w-1/2" /></div>
      {management ? [0,1].map((key) => <div key={key} aria-hidden="true" className="dp-panel min-h-64 space-y-6 p-6"><Bar className="h-5 w-1/3" /><Bar className="h-10" /><Bar className="h-10" /><Bar className="ml-auto h-8 w-32" /></div>) : <TournamentListSkeleton count={3} />}
    </div>}
  </div>;
}
