import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, MapPin, Star, Users } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { cn } from "@/lib/utils";
import { TournamentCover } from "./GameArtwork";
import { tournamentPath } from "@/lib/public-tournament";
import { registrationStatus, REGISTRATION_STATUS_LABELS } from "@/lib/tournaments";

function TournamentStatus({ tournament }) {
  const status = registrationStatus(tournament);
  const active = status === "OPEN_REGISTRATION" || status === "IN_PROGRESS";
  const label = status === "OPEN_REGISTRATION" && tournament.registrationState === "closing"
    ? "Sắp đóng đăng ký" : REGISTRATION_STATUS_LABELS[status];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-pill border border-dp-hairline-2 bg-dp-panel px-2.5 py-1 text-[10px] whitespace-nowrap", active ? "text-dp-bright" : "text-dp-meta")}>
    <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-dp-live" : "bg-dp-meta")} />{label}
  </span>;
}
function Metadata({ icon: Icon, children, mono = false }) {
  return <p className={cn("flex items-start gap-2 text-xs leading-5 text-dp-read", mono && "font-mono text-[10px]")}>
    <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-dp-meta" /><span className="min-w-0 break-words">{children}</span>
  </p>;
}

function TournamentCard({ tournament, variant = "grid", showRole = false, showManage = false, reveal = false }) {
  const { selectTournament, setPublicTournament } = useTourney();
  const horizontal = variant === "horizontal";
  function choose() {
    selectTournament(tournament.storeId || tournament.id);
    setPublicTournament(tournament);
  }
  return <article data-reveal={reveal || undefined} className="dp-panel dp-interactive-card flex h-full flex-col">
    <Link to={tournamentPath("/tournament/view", tournament)} onClick={choose} aria-label={`Xem giải đấu ${tournament.name}`}
      className={cn("flex min-w-0 flex-1 rounded-panel", horizontal ? "flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5" : "flex-col")}>
      <div className={cn("relative shrink-0 overflow-hidden bg-dp-ground", horizontal ? "size-16 rounded-panel sm:size-20" : "aspect-[16/9] w-full rounded-t-panel")}>
        <TournamentCover src={tournament.image} game={tournament.game} alt="" className="size-full" />
        {!horizontal && <span className="absolute top-3 left-3"><TournamentStatus tournament={tournament} /></span>}
      </div>
      <div className={cn("min-w-0 flex-1", !horizontal && "flex flex-col gap-4 p-5")}>
        <div>
          <h3 className="line-clamp-2 text-sm leading-6 font-semibold">{tournament.name}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-dp-meta">{tournament.gameDisplay}</p>
        </div>
        <div className={cn("space-y-2", horizontal && "mt-3")}>
          <Metadata icon={Calendar} mono>{tournament.dateText}</Metadata>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Metadata icon={MapPin}>{tournament.location}</Metadata>
          </div>
        </div>
      </div>
      {horizontal && <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:max-w-48 sm:flex-col sm:items-end">
        <TournamentStatus tournament={tournament} />
        {showRole && tournament.role && <span className="flex items-center gap-1.5 text-xs text-dp-read">
          {tournament.role === "Organizer" ? <Star className="size-3.5 text-dp-live" /> : <Users className="size-3.5" />}
          {tournament.role === "Organizer" ? "Ban tổ chức" : "Tuyển thủ"}
        </span>}
        <span className="flex items-center gap-1 text-[10px] text-dp-meta">Xem giải đấu<ArrowUpRight className="size-3" /></span>
      </div>}
    </Link>
    {showManage && tournament.role === "Organizer" && <div className="flex justify-end border-t border-dp-hairline px-5 py-3">
      <Link to={tournamentPath("/tournament/details", tournament)} onClick={choose} aria-label={`Quản lý giải đấu ${tournament.name}`} className="inline-flex items-center gap-2 text-xs font-medium text-dp-live hover:text-dp-bright">Quản lý giải đấu<ArrowUpRight aria-hidden="true" className="size-3.5" /></Link>
    </div>}
  </article>;
}
export const TournamentCardGrid = (props) => <TournamentCard {...props} variant="grid" />;
export const TournamentCardHorizontal = (props) => <TournamentCard {...props} variant="horizontal" />;
