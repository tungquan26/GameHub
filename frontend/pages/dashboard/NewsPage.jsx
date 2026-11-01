import { Link, useLocation } from "react-router-dom";
import { Bell, CalendarClock, Check, LoaderCircle, RefreshCw } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import useNotifications from "@/hooks/useNotifications";
import { loginPath } from "@/lib/navigation";
import { notificationDate, notificationTime } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const description = "Theo dõi cập nhật lịch thi đấu và những lời nhắc trước trận dành cho bạn.";
function NewsFeed({ userId }) {
  const { items, loading, refreshing, error, reading, readErrors, refresh, markAsRead } = useNotifications(userId);
  const unread = items.filter((item) => !item.read).length;
  return <>
    <PageHeader title="Tin tức" description={description} actions={<Button variant="outline" size="sm" disabled={refreshing} onClick={refresh}>
      <RefreshCw aria-hidden="true" className={cn(refreshing && "animate-spin")} />Làm mới
    </Button>} />
    {loading ? <div role="status" aria-label="Đang tải thông báo" data-navigation-pending className="space-y-4">
      <span className="sr-only">Đang tải thông báo…</span>
      {[0, 1, 2].map((key) => <div key={key} aria-hidden="true" className="dp-panel space-y-5 p-6"><div className="skeleton-block h-5 w-2/3 rounded bg-dp-hairline" /><div className="skeleton-block h-20 rounded bg-dp-hairline" /></div>)}
    </div> : <>
      {error && <p role="alert" className="mb-5 text-sm leading-6 text-red-400">{error}</p>}
      {items.length ? <section aria-labelledby="schedule-news-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="schedule-news-title" className="text-lg font-semibold">Thông báo lịch thi đấu</h2>
          <p role="status" className="text-xs text-dp-meta">{items.length} thông báo · {unread} chưa đọc</p>
        </div>
        <div className="space-y-4">{items.map((item) => <article key={item.id} aria-label={item.title} tabIndex={-1} className={cn("dp-panel p-5 sm:p-6", !item.read && "border-dp-live/35")}>
          <div className="flex items-start gap-3 sm:gap-4">
            <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-dp-ground", item.read ? "text-dp-meta" : "text-dp-live")}><CalendarClock aria-hidden="true" className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words text-base leading-6 font-semibold">{item.title}</h3>
                <span className={cn("shrink-0 text-[11px] leading-6", item.read ? "text-dp-meta" : "text-dp-live")}>{item.read ? "Đã đọc" : "Chưa đọc"}</span></div>
              <time dateTime={notificationDate(item.createdAt)?.toISOString()} className="mt-2 block text-xs text-dp-meta">{notificationTime(item.createdAt)}</time>
              <p className="mt-4 text-sm leading-7 whitespace-pre-line break-words text-dp-read">{item.message}</p>
              {!item.read && <Button variant="ghost" size="sm" className="mt-4" disabled={reading.includes(item.id)} aria-label={`Đánh dấu đã đọc: ${item.title}`} onClick={async (event) => {
                const article = event.currentTarget.closest("article");
                if (await markAsRead(item.id) && article?.isConnected) article.focus({ preventScroll: true });
              }}>
                {reading.includes(item.id) ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}Đánh dấu đã đọc
              </Button>}
              {readErrors[item.id] && <p role="alert" className="mt-3 text-xs leading-6 text-red-400">{readErrors[item.id]}</p>}
            </div>
          </div>
        </article>)}</div>
      </section> : !error && <div className="dp-panel px-6 py-14 text-center"><Bell aria-hidden="true" className="mx-auto mb-4 size-7 text-dp-meta" /><h2 className="text-base font-semibold">Bạn chưa có thông báo lịch thi đấu</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-dp-read">Thông báo cập nhật lịch và nhắc trước trận sẽ xuất hiện tại đây khi có lịch dành cho đội của bạn.</p></div>}
    </>}
  </>;
}

export default function NewsPage() {
  const { currentUser } = useTourney();
  const location = useLocation();
  const userId = currentUser?.id ?? currentUser?.userId;
  const available = userId != null && /^\d+$/.test(String(userId)) && Number(userId) > 0;
  return <div className="dp-container py-9 sm:py-12">
    {available ? <NewsFeed key={String(userId)} userId={String(userId)} /> : <>
      <PageHeader title="Tin tức" description={description} />
      <EmptyState title={currentUser ? "Đăng nhập lại để xem tin tức" : "Đăng nhập để xem tin tức"} description="Xem thông báo cập nhật lịch thi đấu và nhắc lịch dành cho tài khoản của bạn.">
        <Button asChild><Link to={loginPath(location)}>Đăng nhập</Link></Button>
      </EmptyState>
    </>}
  </div>;
}
