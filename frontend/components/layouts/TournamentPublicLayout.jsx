import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTourney } from "@/context/TourneyContext";
import useTournamentView from "@/hooks/useTournamentView";
import { publicSectionPath, tournamentPath } from "@/lib/public-tournament";
import { cn } from "@/lib/utils";
import TournamentHero from "@/components/shared/TournamentHero";
import useRequireAuth from "@/hooks/useRequireAuth";

const SECTIONS = [["overview", "Tổng quan"], ["teams", "Đội tuyển"], ["schedule", "Lịch đấu"], ["rules", "Thể lệ"]];

export default function TournamentPublicLayout() {
  const { registerTournament, cancelTournamentRegistration, openTournamentManager } = useTourney();
  const navigate = useNavigate();
  const location = useLocation();
  const { requireAuth } = useRequireAuth();
  const result = useTournamentView();
  const { tournament, access } = result;
  const params = new URLSearchParams(location.search);
  const section = location.pathname === "/tournament/schedule" ? "schedule" : ["teams", "rules"].includes(params.get("tab")) ? params.get("tab") : "overview";
  const [notice, setNotice] = useState("");
  const registrationButton = useRef(null);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => { if (cancelled) { registrationButton.current?.focus(); setCancelled(false); } }, [cancelled]);
  useEffect(() => { setNotice(""); }, [tournament?.id, tournament?.sample]);
  function manage() {
    try { const managed = openTournamentManager(tournament); navigate(tournamentPath("/tournament/details", managed)); }
    catch (cause) { setNotice(cause.message); }
  }
  function register() {
    const identity = tournamentPath(location.pathname, tournament);
    if (!params.has("id")) for (const [key, value] of new URLSearchParams(identity.search)) params.set(key, value);
    if (!requireAuth({ ...location, search: params.toString() })) return;
    try { registerTournament(tournament); setNotice(`Đã đăng ký tham gia giải đấu "${tournament.name}".`); }
    catch (cause) { setNotice(cause.message); }
  }
  function cancelRegistration() {
    try { cancelTournamentRegistration(tournament); setNotice(`Đã hủy đăng ký tham gia giải đấu "${tournament.name}".`); setCancelled(true); }
    catch (cause) { setNotice(cause.message); }
  }
  return <div className="dp-container py-6 sm:py-8">
    {tournament && <header role="region" aria-label="Thông tin giải đấu công khai">
      <TournamentHero entry={tournament} headingLevel={1} status={access.status} actions={<div className="space-y-2 sm:max-w-xs">
        {access.organizer ? <Button size="sm" className="w-full" onClick={manage}><Settings2 />Quản lý giải đấu</Button>
          : <><Button ref={registrationButton} size="sm" className="w-full" disabled={access.disabled} onClick={register}>{access.registeredPlayer && <Check />}{access.label}</Button>
            {access.canCancelRegistration && <Button size="sm" variant="outline" className="w-full" onClick={cancelRegistration}>Hủy đăng ký</Button>}</>}
      </div>} />
      {notice && <p role="status" className="mb-5 text-xs leading-6 text-dp-read">{notice}</p>}
      <nav aria-label="Nội dung giải đấu" className="mb-7 flex scroll-mt-[calc(var(--dp-header-height)+16px)] overflow-x-auto border-b border-dp-hairline">
        {SECTIONS.map(([key, label]) => <Link key={key} to={publicSectionPath(tournament, key)} aria-current={section === key ? "page" : undefined}
          className={cn("shrink-0 border-b-2 border-transparent px-4 py-3 text-xs font-medium whitespace-nowrap text-dp-read hover:text-dp-bright sm:px-6", section === key && "border-dp-live text-dp-bright")}>{label}</Link>)}
      </nav>
    </header>}
    <Outlet context={{ ...result, section }} />
  </div>;
}
