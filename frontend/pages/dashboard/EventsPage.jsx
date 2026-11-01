import { useCallback, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/TournamentControls";
import { TournamentCardHorizontal } from "@/components/shared/TournamentCard";
import CirclePagination from "@/components/shared/CirclePagination";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import { useTourney } from "@/context/TourneyContext";
import { tournamentKey } from "@/lib/public-tournament";
import { isLegacyTournament, lower } from "@/lib/tournaments";
import TournamentArchive from "@/components/shared/TournamentArchive";
import usePersonalActivity from "@/hooks/usePersonalActivity";
import { TournamentListSkeleton } from "@/components/shared/PageSkeleton";

const ROLES = [{ value: "", label: "Tất cả giải đấu" }, { value: "Organizer", label: "Ban tổ chức" }, { value: "Player", label: "Tuyển thủ" }];
export default function EventsPage() {
  const { tournaments, registeredTournaments } = useTourney();
  const { events, stats, loading } = usePersonalActivity();
  const [params] = useSearchParams(); const location = useLocation(); const navigate = useNavigate();
  const keyword = params.get("q") || "";
  const role = ROLES.find((item) => item.value.toLowerCase() === lower(params.get("role")))?.value || "";
  const rawPage = Number(params.get("page") || 1);
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const legacy = [...tournaments.filter(isLegacyTournament), ...registeredTournaments.filter((item) => !item.registrantKey && item.registrantId == null)];
  const filtered = events.filter((item) => (!role || item.role === role) && (!lower(keyword) || lower([item.name, item.gameDisplay, item.location].join(" ")).includes(lower(keyword))));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5)); const page = Math.min(requestedPage, totalPages);
  const update = useCallback((patch, replace = false) => {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(patch)) { if (!value || key === "page" && value === 1) next.delete(key); else next.set(key, value); }
    if (Object.hasOwn(patch, "q") || Object.hasOwn(patch, "role")) next.delete("page");
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace, state: Object.hasOwn(patch, "page") && !replace ? { scrollTo: "events-list" } : null });
  }, [navigate, location.pathname, location.search, location.hash]);
  useEffect(() => { if (!loading && page !== requestedPage) update({ page }, true); }, [loading, page, requestedPage, update]);
  return <div className="dp-container py-9 sm:py-12">
    <PageHeader title="Giải đấu của tôi" description={`${stats.organized} giải tổ chức · ${stats.participating} giải tham gia`} />
    {loading && <p role="status" className="text-xs text-dp-read">Đang cập nhật danh sách giải đấu…</p>}
    <div className="mt-8 mb-5 flex flex-col justify-between gap-5 lg:flex-row">
      <div role="group" aria-label="Vai trò tham gia" className="flex flex-wrap gap-2">{ROLES.map((item) => <Button key={item.value} size="sm" variant={role === item.value ? "default" : "outline"} aria-pressed={role === item.value} onClick={() => update({ role: item.value })}>{item.label}</Button>)}</div>
      <div className="w-full lg:max-w-sm"><SearchInput value={keyword} onChange={(value) => update({ q: value }, true)} placeholder="Tìm tên giải đấu, bộ môn, địa điểm..." /></div>
    </div>
    <p className="mb-5 font-mono text-[10px] text-dp-meta">{filtered.length} GIẢI ĐẤU CỦA BẠN</p>
    <div id="events-list">{filtered.length ? <div className="space-y-4">{filtered.slice((page - 1) * 5, page * 5).map((item) => <TournamentCardHorizontal key={tournamentKey(item)} tournament={item} showRole showManage />)}</div> : loading ? <TournamentListSkeleton /> : <EmptyState title={events.length ? "Không tìm thấy giải đấu nào phù hợp." : "Bạn chưa có giải đấu nào"} description={events.length ? "Thử đổi từ khóa hoặc vai trò tham gia." : "Các giải bạn tổ chức hoặc đăng ký sẽ xuất hiện tại đây."} />}</div>
    <CirclePagination page={page} totalPages={totalPages} onChange={(value) => update({ page: value })} label="Phân trang giải đấu của tôi" />
    <TournamentArchive title="Giải đấu khác" items={legacy} />
  </div>;
}
