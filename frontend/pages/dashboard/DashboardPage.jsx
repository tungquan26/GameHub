import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, ClipboardCheck, Plus, Search, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentCardGrid } from "@/components/shared/TournamentCard";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import usePersonalActivity from "@/hooks/usePersonalActivity";
import { personalEventsPath } from "@/lib/personal-activity";
import { tournamentKey } from "@/lib/public-tournament";
import { formatMatchTime } from "@/lib/bracket";
import { TournamentGridSkeleton } from "@/components/shared/PageSkeleton";

export default function DashboardPage() {
  const { stats, teams, events, active, tasks, upcoming, loading } = usePersonalActivity();
  const newUser = !loading && !events.length && !teams.length;
  return <div className="dp-container py-9 sm:py-12">
    <PageHeader title="Tổng quan của tôi" description="Theo dõi giải đấu, đội tuyển và những việc cần làm tiếp theo." actions={<>
      <Button asChild><Link to="/create"><Plus />Tạo giải đấu</Link></Button>
      <Button asChild variant="outline"><Link to="/search"><Search />Tìm giải đấu</Link></Button>
    </>} />
    {loading && <p role="status" className="mb-5 text-xs text-dp-read">Đang cập nhật danh sách giải đấu…</p>}
    <section aria-label="Thống kê cá nhân" className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
      {[{ label: "Giải tổ chức", count: stats.organized, icon: Trophy, to: personalEventsPath("Organizer") }, { label: "Giải tham gia", count: stats.participating, icon: CalendarDays, to: personalEventsPath("Player") }, { label: "Đội của tôi", count: stats.teams, icon: Users, to: "/community#myTeamsSection" }].map(({ label, count, icon: Icon, to }) => <Link key={label} to={to} aria-label={`${label}: ${count}`} className="dp-panel dp-interactive-card flex min-w-0 items-center justify-between gap-3 p-3 sm:p-5">
        <div className="min-w-0"><p className="text-[10px] leading-5 text-dp-read sm:text-xs">{label}</p><p className="mt-3 font-mono text-2xl font-semibold tabular-nums sm:text-3xl">{count}</p></div><Icon aria-hidden="true" className="hidden size-6 shrink-0 text-dp-live sm:block" />
      </Link>)}
    </section>
    {newUser && <section aria-labelledby="personal-start" className="mb-8 rounded-panel border border-dp-live/25 bg-dp-live/5 p-5 sm:p-6">
      <h2 id="personal-start" className="text-lg font-semibold">Bắt đầu hành trình của bạn</h2>
      <p className="mt-2 text-sm leading-6 text-dp-read">Chọn bước đầu tiên để tham gia thi đấu hoặc tổ chức giải.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ label: "Tìm giải để tham gia", to: "/search", icon: Search }, { label: "Tạo đội tuyển đầu tiên", to: "/community?action=create-team", icon: Users }, { label: "Tổ chức giải đầu tiên", to: "/create", icon: Trophy }].map(({ label, to, icon: Icon }) => <Link key={label} to={to} className="dp-interactive-card flex items-center gap-3 rounded-panel border border-dp-hairline-2 bg-dp-panel px-4 py-4 text-xs font-medium"><Icon aria-hidden="true" className="size-4 shrink-0 text-dp-live" />{label}<ArrowUpRight aria-hidden="true" className="ml-auto size-3.5 shrink-0" /></Link>)}</div>
    </section>}
    <div className="mb-9 grid gap-5 lg:grid-cols-2">
      <section aria-labelledby="personal-tasks" className="dp-panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 id="personal-tasks" className="flex items-center gap-2 text-lg font-semibold"><ClipboardCheck aria-hidden="true" className="size-5 text-dp-live" />Cần bạn xử lý</h2><span className="font-mono text-xs text-dp-meta">{tasks.length} việc</span></div>
        {tasks.length ? <ul className="divide-y divide-dp-hairline">{tasks.slice(0, 5).map((task) => <li key={task.key}><Link to={task.to} className="flex items-center justify-between gap-4 py-4 text-sm hover:text-dp-live"><span className="min-w-0"><strong className="block font-medium">{task.title}</strong><span className="mt-1 block break-words text-xs leading-6 text-dp-read">{task.description}</span></span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-dp-meta" /></Link></li>)}</ul> : <p className="py-5 text-sm leading-7 text-dp-read">Chưa có công việc cần xử lý. Các mục cần hoàn thiện trong giải và yêu cầu vào đội sẽ xuất hiện tại đây.</p>}
        {tasks.length > 5 && <p className="mt-3 text-xs leading-6 text-dp-meta">Hiển thị 5/{tasks.length} việc. Mở Giải đấu của tôi hoặc Đội của tôi để xem đầy đủ.</p>}
      </section>
      <section aria-labelledby="personal-matches" className="dp-panel p-5 sm:p-6">
        <h2 id="personal-matches" className="mb-5 flex items-center gap-2 text-lg font-semibold"><CalendarDays aria-hidden="true" className="size-5 text-dp-live" />Trận sắp tới</h2>
        {upcoming.length ? <ul className="divide-y divide-dp-hairline">{upcoming.slice(0, 3).map(({ key, tournament, match, to }) => <li key={key}><Link to={to} className="block py-4 hover:text-dp-live"><p className="font-mono text-[11px] text-dp-live">{formatMatchTime(match.scheduledTime)}</p><p className="mt-2 break-words text-sm font-medium">{match.teamA.name} <span className="text-dp-meta">vs</span> {match.teamB.name}</p><p className="mt-2 break-words text-xs leading-6 text-dp-read">{tournament.name} · Trận #{match.matchNumber}</p></Link></li>)}</ul> : <p className="py-5 text-sm leading-7 text-dp-read">Chưa có trận sắp tới xác định được tài khoản hoặc đội của bạn trong lịch đã lưu.</p>}
        {upcoming.length > 3 && <p className="mt-3 text-xs leading-6 text-dp-meta">Hiển thị 3/{upcoming.length} trận. Mở lịch giải để xem đầy đủ.</p>}
      </section>
    </div>
    <section aria-labelledby="personal-active">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 id="personal-active" className="text-xl font-semibold">Giải đang hoạt động</h2><Link to="/events" className="flex items-center gap-2 text-xs text-dp-live hover:text-dp-bright">Xem tất cả giải của tôi<ArrowUpRight aria-hidden="true" className="size-3.5" /></Link></div>
      {active.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{active.slice(0, 3).map((item) => <TournamentCardGrid key={tournamentKey(item)} tournament={item} showManage />)}</div> : loading ? <TournamentGridSkeleton /> : <EmptyState title="Bạn chưa có giải đang hoạt động" description="Tìm giải để tham gia hoặc tạo giải đấu mới. Các giải đã kết thúc vẫn nằm trong Giải đấu của tôi." />}
    </section>
  </div>;
}
