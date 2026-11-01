import { Link } from "react-router-dom";
import { ArrowUpRight, Trophy } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import CirclePagination from "./CirclePagination";
import { dateRange } from "@/lib/profile";
import { gameImage } from "@/lib/games";
import { TournamentCover } from "./GameArtwork";
import { useTourney } from "@/context/TourneyContext";
import { tournamentKey, tournamentPath } from "@/lib/public-tournament";
import { personalEventsPath } from "@/lib/personal-activity";
import { useHistoryViewState } from "./NavigationExperience";
import { TournamentListSkeleton } from "./PageSkeleton";

export default function ProfileTournamentList({ title, items, own, organized = false, loading = false }) {
  const [page, setPage] = useHistoryViewState(`profile-list:${title}`, 1);
  const { selectTournament, setPublicTournament } = useTourney();
  const totalPages = Math.max(1, Math.ceil(items.length / 3));
  const currentPage = Math.min(page, totalPages);
  return <Card>
    <CardHeader>
      <h2 className="font-mono text-xs tracking-wide">{title}</h2>
      {own && <Link to={personalEventsPath(organized ? "Organizer" : "Player")} className="flex items-center gap-1 text-xs text-dp-read hover:text-dp-bright">Xem tất cả<ArrowUpRight className="size-3" /></Link>}
    </CardHeader>
    {items.length ? <div className="divide-y divide-dp-hairline">
      {items.slice((currentPage - 1) * 3, currentPage * 3).map((item, index) => {
        const name = item.name || item.details?.name || "Giải đấu chưa đặt tên";
        const gameName = item.gameInfo?.game || item.game?.name || item.game;
        const image = item.profileImg || gameImage(gameName) || (item.image?.startsWith("data:") ? item.image : "");
        return <Link key={tournamentKey(item)} to={tournamentPath(organized ? "/tournament/home" : "/tournament/view", item)}
          onClick={() => { if (organized) selectTournament(item.id); else setPublicTournament(item); }}
          className="flex items-center gap-4 p-5 transition-colors hover:bg-dp-bright/3">
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-panel border border-dp-hairline bg-dp-ground">
            {image ? <TournamentCover src={image} game={gameName} alt="" className="size-full" /> : <Trophy className="size-5 text-dp-meta" />}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] leading-5 text-dp-meta">{dateRange(item.startDate || item.details?.startDate, item.endDate || item.details?.endDate)}</p>
            <h3 className="mt-0.5 truncate text-sm font-medium">{name}</h3>
            <p className="mt-1 truncate text-xs text-dp-read">{item.venueAddress || item.details?.venueAddress || item.location || "Chưa cập nhật địa điểm"}</p>
          </div>
        </Link>;
      })}
    </div> : loading ? <TournamentListSkeleton count={3} /> : <div className="px-5 py-12 text-center">
      <Trophy aria-hidden="true" className="mx-auto mb-4 size-6 text-dp-hairline-2" />
      <p className="text-sm text-dp-read">{organized ? (own ? "Bạn chưa tổ chức giải đấu nào." : "Người dùng này chưa tổ chức giải đấu nào.") : "Chưa có giải đấu tham gia"}</p>
      {!organized && own && <Link to="/search" className="mt-3 inline-block text-xs text-dp-live">Tìm giải đấu</Link>}
    </div>}
    <CirclePagination page={currentPage} totalPages={totalPages} onChange={setPage} label={`Phân trang ${title.toLowerCase()}`} />
  </Card>;
}
