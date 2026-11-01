import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/TournamentControls";
import TournamentFilters from "@/components/shared/TournamentFilters";
import { TournamentCardHorizontal } from "@/components/shared/TournamentCard";
import CirclePagination from "@/components/shared/CirclePagination";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import { EMPTY_FILTERS, filterTournaments } from "@/lib/tournaments";
import { readTournamentSearch, writeTournamentSearch } from "@/lib/tournament-search";
import useTournamentCatalog from "@/hooks/useTournamentCatalog";
import { TournamentListSkeleton } from "@/components/shared/PageSkeleton";

export default function SearchPage() {
  const { catalog, apiStatus, now } = useTournamentCatalog();
  const [params] = useSearchParams();
  const location = useLocation(); const navigate = useNavigate();
  const search = useMemo(() => readTournamentSearch(params), [params]);
  const { keyword, filters } = search;
  const filtered = useMemo(() => filterTournaments(catalog, keyword, filters, now), [catalog, keyword, filters, now]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const page = Math.min(search.page, totalPages);
  const active = Boolean(keyword || filters.statuses.length || filters.games.length || filters.dateRanges.length);
  const update = useCallback((next, options) => {
    navigate({ pathname: location.pathname, search: writeTournamentSearch(next, new URLSearchParams(location.search)).toString(), hash: location.hash }, options);
  }, [navigate, location.pathname, location.search, location.hash]);
  useEffect(() => {
    if (["success", "error"].includes(apiStatus) && page !== search.page) update({ ...search, page }, { replace: true });
  }, [apiStatus, page, search, update]);

  return <div className="dp-container py-9 sm:py-12">
    <PageHeader title="Tìm kiếm giải đấu" />
    <SearchInput large value={keyword} onChange={(value) => update({ ...search, keyword: value, page: 1 }, { replace: true })} />
    <div className="my-5 flex flex-wrap items-center gap-3">
      <TournamentFilters value={filters} onChange={(value) => update({ ...search, filters: value, page: 1 })} />
      {active && <Button variant="ghost" size="sm" onClick={() => update({ keyword: "", filters: EMPTY_FILTERS, page: 1 })}>Đặt lại bộ lọc</Button>}
      <p aria-live="polite" className="ml-auto font-mono text-[10px] text-dp-meta">{filtered.length} KẾT QUẢ</p>
    </div>
    <div id="results" className="scroll-mt-24">
      {filtered.length ? <div className="space-y-4">{filtered.slice((page - 1) * 5, page * 5).map((item) => <TournamentCardHorizontal key={(item.sample ? "sample:" : "local:") + item.id} tournament={item} />)}</div>
        : ["idle", "loading"].includes(apiStatus) ? <TournamentListSkeleton />
          : <EmptyState title="Không tìm thấy giải đấu nào" description="Thử thay đổi từ khóa tìm kiếm hoặc các tùy chọn bộ lọc." />}
    </div>
    <CirclePagination page={page} totalPages={totalPages} onChange={(value) => update({ ...search, page: value }, { state: { scrollTo: "results" } })} label="Phân trang giải đấu" />
  </div>;
}
