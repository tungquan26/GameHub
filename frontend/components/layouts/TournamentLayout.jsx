import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Calendar, ClipboardCheck, ExternalLink, FileText, Gamepad2, LayoutDashboard, Trophy, Users } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/input";
import { tournamentPath } from "@/lib/public-tournament";
import { TournamentCover } from "@/components/shared/GameArtwork";
import { isOwnTournament } from "@/lib/tournaments";

const NAV_ITEMS = [
  { to: "/tournament/home", label: "Trang chủ", icon: LayoutDashboard },
  { to: "/tournament/details", label: "Chi tiết giải đấu", icon: FileText },
  { to: "/tournament/registration-settings", label: "Cài đặt đăng ký", icon: ClipboardCheck },
  { to: "/tournament/teams", label: "Đội tuyển", icon: Users },
  { to: "/tournament/game-info", label: "Thông tin game", icon: Gamepad2 },
  { to: "/tournament/schedule", label: "Lịch thi đấu", icon: Calendar },
];

export default function TournamentLayout() {
  const context = useTourney();
  const { activeTournament: managedTournament, tournaments, selectTournament } = context;
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const requestedId = new URLSearchParams(search).get("id");
  const owned = tournaments.filter((entry) => isOwnTournament(entry, context.currentUser));
  const activeTournament = new URLSearchParams(search).get("sample") === "1" ? null : requestedId ? tournaments.find((entry) => String(entry.id) === requestedId) : managedTournament;
  const readOnly = !activeTournament || !isOwnTournament(activeTournament, context.currentUser);
  useEffect(() => {
    if (new URLSearchParams(search).get("sample") !== "1" && requestedId && String(managedTournament?.id) !== requestedId && owned.some((entry) => String(entry.id) === requestedId)) selectTournament(requestedId);
  }, [requestedId, managedTournament?.id, owned, selectTournament, search]);
  const name = activeTournament?.name || activeTournament?.details?.name || new URLSearchParams(search).get("name") || "Giải đấu chưa đặt tên";
  const title = NAV_ITEMS.find((item) => item.to === pathname)?.label;

  return (
    <div className="flex min-h-[calc(100dvh-var(--dp-header-height))] flex-col lg:flex-row">
      <aside aria-label="Quản lý giải đấu" className="flex shrink-0 flex-col border-b border-dp-hairline bg-dp-panel lg:sticky lg:top-[var(--dp-header-height)] lg:h-[calc(100dvh-var(--dp-header-height))] lg:w-[260px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="border-b border-dp-hairline p-5">
          <div className="mb-4 hidden h-24 items-center justify-center overflow-hidden rounded-panel border border-dp-hairline bg-dp-ground lg:flex">
            {activeTournament?.bannerImg
              ? <TournamentCover src={activeTournament.bannerImg} game={activeTournament.gameInfo?.game || activeTournament.game} alt="" className="size-full" />
              : <Trophy aria-hidden="true" className="size-7 text-dp-hairline-2" />}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-panel border border-dp-hairline-2 bg-dp-ground font-mono text-lg">
              {activeTournament?.profileImg ? <TournamentCover src={activeTournament.profileImg} game={activeTournament.gameInfo?.game || activeTournament.game} alt="" className="size-full" /> : name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 title={name} className="truncate text-sm font-semibold">{name}</h2>
            </div>
          </div>
          {owned.length > 0 && !readOnly && <NativeSelect aria-label="Giải đấu đang quản lý" className="mt-4 h-9 text-xs" value={owned.some((entry) => entry.id === activeTournament?.id) ? activeTournament.id : ""} onChange={(event) => {
            const id = event.target.value;
            const params = new URLSearchParams(search); params.set("id", id);
            navigate({ pathname, search: params.toString() });
          }}>
            <option value="" disabled>Chọn giải đấu</option>
            {owned.map((entry) => <option key={entry.id} value={entry.id}>{entry.name || entry.details?.name || "Giải đấu chưa đặt tên"}</option>)}
          </NativeSelect>}
        </div>
        <nav aria-label="Cài đặt giải đấu" className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={activeTournament && new URLSearchParams(search).get("sample") !== "1" ? tournamentPath(to, activeTournament) : { pathname: to, search }} className={({ isActive }) => cn(
              "flex shrink-0 items-center gap-3 rounded-panel border border-transparent px-3 py-3 text-xs whitespace-nowrap text-dp-read transition-colors hover:bg-dp-ground hover:text-dp-bright",
              isActive && "border-dp-hairline-2 bg-dp-ground text-dp-bright",
            )}>
              {({ isActive }) => <><Icon aria-hidden="true" className={cn("size-4 shrink-0", isActive && "text-dp-live")} />{label}</>}
            </NavLink>
          ))}
        </nav>
        <Link to={activeTournament && new URLSearchParams(search).get("sample") !== "1" ? tournamentPath("/tournament/view", activeTournament) : { pathname: "/tournament/view", search }} className="m-4 flex items-center justify-between rounded-pill border border-dp-hairline-2 px-4 py-2.5 text-xs text-dp-read hover:text-dp-bright">Xem giải đấu công khai<ExternalLink aria-hidden="true" className="size-3.5" /></Link>
      </aside>
      <div className="min-w-0 flex-1">
        {pathname !== "/tournament/home" && (
          <header className="flex h-14 items-center border-b border-dp-hairline bg-dp-panel/60 px-6 lg:px-10">
            <p className="font-mono text-xs tracking-wider uppercase">{title}</p>
          </header>
        )}
        <div className="dp-container py-8 lg:py-10"><Outlet /></div>
      </div>
    </div>
  );
}
