import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/input";
import { useTourney } from "@/context/TourneyContext";
import useTournamentView from "@/hooks/useTournamentView";
import { PUBLIC_VIEW_TABS, publicSectionPath, tournamentPath } from "@/lib/public-tournament";
import { cn } from "@/lib/utils";
import { canonicalGame } from "@/lib/games";
import { isCaptain } from "@/lib/teams";
import { MAX_TOURNAMENT_TEAMS } from "@/lib/tournament-settings";
import TournamentHero from "@/components/shared/TournamentHero";
import useRequireAuth from "@/hooks/useRequireAuth";

const SECTIONS = [["overview", "Tổng quan"], ["teams", "Đội tuyển"], ["schedule", "Lịch đấu"], ["standings", "Xếp hạng"], ["rules", "Thể lệ"]];

export default function TournamentPublicLayout() {
  const { currentUser, teams, initializeCommunity, registerTournament, cancelTournamentRegistration, openTournamentManager } = useTourney();
  const navigate = useNavigate();
  const location = useLocation();
  const { requireAuth } = useRequireAuth();
  const result = useTournamentView();
  const { tournament, access } = result;
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  const section = location.pathname === "/tournament/schedule" ? "schedule" : PUBLIC_VIEW_TABS.includes(tab) ? tab : "overview";
  const [notice, setNotice] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [pending, setPending] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const registrationButton = useRef(null);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => { if (cancelled) { registrationButton.current?.focus(); setCancelled(false); } }, [cancelled]);
  useEffect(() => { setNotice(""); setChooserOpen(false); setRegistrationError(""); }, [tournament?.id]);
  const usedSlots = tournament?.teamCount ?? tournament?.tournamentTeams?.length ?? 0;
  const maxTeams = tournament?.maxTeams ?? MAX_TOURNAMENT_TEAMS;
  const full = usedSlots >= maxTeams;
  const registrationOpen = access?.status === "OPEN_REGISTRATION" && !access?.organizer;
  const registrations = tournament?.myTeamRegistrations || [];
  const registeredIds = new Set(registrations.map((row) => row.teamId));
  const game = canonicalGame(tournament?.game);
  const minimum = tournament?.teamMinPlayers ?? 1;
  const maximum = Math.min(tournament?.teamMaxPlayers ?? 20, tournament?.regSettings?.maxTeamSize ?? 20);
  const validRosterConfig = Boolean(game) && maximum >= minimum;
  const captainedTeams = (teams || []).filter((team) => isCaptain(team, currentUser));
  const canChooseTeam = !currentUser || teams == null || captainedTeams.some((team) => !registeredIds.has(team.id));
  const requiredSize = minimum === maximum ? String(minimum) : `${minimum} đến ${maximum}`;
  const choices = captainedTeams.filter((team) => !registeredIds.has(team.id))
    .map((team) => ({ ...team, problem: !game || canonicalGame(team.game) !== game ? "Không cùng bộ môn"
      : team.members.length < minimum || team.members.length > maximum ? `Cần ${requiredSize} thành viên` : "" }));
  const selected = choices.find((team) => String(team.id) === selectedTeamId && !team.problem);
  const memberRegistered = Boolean(tournament?.tournamentTeams?.some((team) => team.viewerMember));
  function manage() {
    try { const managed = openTournamentManager(tournament); navigate(tournamentPath("/tournament/details", managed)); }
    catch (cause) { setNotice(cause.message); }
  }
  function openRegistration() {
    const identity = tournamentPath(location.pathname, tournament);
    if (!params.has("id")) for (const [key, value] of new URLSearchParams(identity.search)) params.set(key, value);
    if (!requireAuth({ ...location, search: params.toString() })) return;
    setSelectedTeamId(String(choices.find((team) => !team.problem)?.id ?? ""));
    setRegistrationError("");
    setChooserOpen(true);
    if (teams == null) initializeCommunity();
  }
  async function register(event) {
    event.preventDefault();
    if (pending || !selected || !registrationOpen || full) return;
    setPending(true);
    setRegistrationError("");
    try {
      await registerTournament(tournament, selected.id);
      setChooserOpen(false);
      setNotice(`Đã đăng ký đội "${selected.name}".`);
    } catch (cause) { setRegistrationError(cause.message); }
    finally { setPending(false); }
  }
  async function cancelRegistration(row) {
    if (pending) return;
    setPending(true);
    try { await cancelTournamentRegistration(tournament, row.teamId); setNotice(`Đã hủy đăng ký đội "${row.name}".`); setCancelled(true); }
    catch (cause) { setNotice(cause.message); }
    finally { setPending(false); }
  }
  return <div className="dp-container py-6 sm:py-8">
    {tournament && <header role="region" aria-label="Thông tin giải đấu công khai">
      <TournamentHero entry={tournament} headingLevel={1} status={access.status} actions={<div className="space-y-2 sm:max-w-xs">
        <p className="text-xs text-dp-read">Đã dùng {usedSlots}/{maxTeams} suất thi đấu.</p>
        {access.organizer ? <Button size="sm" className="w-full" onClick={manage}><Settings2 />Quản lý giải đấu</Button>
          : <>
            {memberRegistered && <p className="flex items-center gap-2 text-xs text-dp-live"><Check className="size-4" />Đội của bạn đã đăng ký</p>}
            {registrationOpen ? <Button ref={registrationButton} size="sm" className="w-full" disabled={full || !validRosterConfig || !canChooseTeam || pending} onClick={openRegistration}>
              {full ? "Giải đấu đã đủ đội" : !game ? "Chưa chọn bộ môn" : !validRosterConfig ? "Chưa có quân số hợp lệ"
                : canChooseTeam ? "Đăng ký đội tham gia" : captainedTeams.length ? "Các đội của bạn đã đăng ký" : "Chỉ đội trưởng được đăng ký"}
            </Button> : <Button size="sm" className="w-full" disabled>{access.label}</Button>}
            {registrationOpen && registrations.map((row) => <Button key={row.teamId} size="sm" variant="outline" className="w-full" disabled={pending}
              onClick={() => cancelRegistration(row)}>Hủy đăng ký {row.name}</Button>)}
          </>}
      </div>} />
      <Dialog open={chooserOpen} onOpenChange={(open) => { if (!pending) setChooserOpen(open); }}>
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">Đăng ký đội tham gia</DialogTitle>
          <DialogDescription className="text-sm text-dp-read">Chỉ đội trưởng có thể đăng ký đội có quân số hợp lệ.</DialogDescription>
          {choices.length ? <form className="mt-4 space-y-4" onSubmit={register}>
            <NativeSelect aria-label="Đội tuyển đăng ký" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
              <option value="">Chọn đội tuyển</option>
              {choices.map((team) => <option key={team.id} value={team.id} disabled={Boolean(team.problem)}>
                {team.name}{team.problem ? ` — ${team.problem}` : ` (${team.members.length} thành viên)`}
              </option>)}
            </NativeSelect>
            {registrationError && <p role="alert" className="text-sm text-red-400">{registrationError}</p>}
            <Button type="submit" disabled={!selected || full || !registrationOpen || pending}>{pending ? "Đang đăng ký…" : "Xác nhận đăng ký"}</Button>
          </form> : <p className="mt-4 text-sm text-dp-read">{teams == null ? "Đang tải danh sách đội…" : "Bạn chưa có đội do mình làm đội trưởng để đăng ký."}</p>}
        </DialogContent>
      </Dialog>
      {notice && <p role="status" className="mb-5 text-xs leading-6 text-dp-read">{notice}</p>}
      <nav aria-label="Nội dung giải đấu" className="mb-7 flex scroll-mt-[calc(var(--dp-header-height)+16px)] overflow-x-auto border-b border-dp-hairline">
        {SECTIONS.map(([key, label]) => <Link key={key} to={publicSectionPath(tournament, key)} aria-current={section === key ? "page" : undefined}
          className={cn("shrink-0 border-b-2 border-transparent px-4 py-3 text-xs font-medium whitespace-nowrap text-dp-read hover:text-dp-bright sm:px-6", section === key && "border-dp-live text-dp-bright")}>{label}</Link>)}
      </nav>
    </header>}
    <Outlet context={{ ...result, section }} />
  </div>;
}
