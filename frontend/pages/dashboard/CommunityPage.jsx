import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import TeamAccordionBar from "@/components/shared/TeamAccordionBar";
import TeamFormDialog from "@/components/shared/TeamFormDialog";
import EmptyState from "@/components/shared/EmptyState";
import { FormMessage } from "@/components/shared/AuthPanel";
import { GameSelect, SearchInput } from "@/components/shared/TournamentControls";
import { useTourney } from "@/context/TourneyContext";
import { isCaptain, isLegacyTeam, TEAM_GAMES } from "@/lib/teams";
import { lower } from "@/lib/tournaments";
import { getGame } from "@/lib/games";
import useRequireAuth from "@/hooks/useRequireAuth";
import { userKey } from "@/lib/identity";
import usePersonalActivity from "@/hooks/usePersonalActivity";

export default function CommunityPage() {
  const { teams, currentUser, initializeCommunity, performTeamAction } = useTourney();
  const { teams: mine } = usePersonalActivity({ loadTournaments: false });
  const { authenticated, requireAuth } = useRequireAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const keyword = params.get("q") || "";
  const game = getGame(params.get("game"))?.id || "";
  const status = ["RECRUITING", "MY_TEAM"].includes(params.get("teamStatus")) ? params.get("teamStatus") : "";
  function filter(key, value, replace = false) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace });
  }
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [viewedTeamId, setViewedTeamId] = useState(null);
  const lastTrigger = useRef(null);
  const createTrigger = useRef(null);
  const actor = currentUser;
  useEffect(() => { initializeCommunity(); }, [initializeCommunity]);
  const identity = userKey(currentUser);
  useEffect(() => { setDialog(null); setNotice(""); setError(""); setViewedTeamId(null); }, [identity]);
  useEffect(() => {
    if (!viewedTeamId) return;
    const element = [...document.querySelectorAll("[data-team-id]")].find((item) => item.dataset.teamId === viewedTeamId);
    element?.scrollIntoView?.({ block: "start" }); element?.focus({ preventScroll: true });
  }, [viewedTeamId]);
  useEffect(() => {
    if (!authenticated || teams === null) return;
    const intent = params.get("action");
    if (!["create-team", "edit-team", "join-team", "view-team"].includes(intent)) return;
    const team = teams.find((item) => String(item.id) === params.get("team"));
    if (intent === "create-team") {
      lastTrigger.current = createTrigger.current;
      setDialog({ team: null });
    } else if (!team) {
      setNotice("Đội tuyển bạn muốn xem không còn tồn tại.");
    } else if (intent === "edit-team" && isCaptain(team, currentUser)) {
      lastTrigger.current = createTrigger.current;
      setDialog({ team });
    } else {
      setNotice(`Bạn đang xem đội "${team.name}". Hãy chọn thao tác để tiếp tục.`);
      setViewedTeamId(String(team.id));
    }
    const next = new URLSearchParams(params);
    next.delete("action"); next.delete("team");
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace: true });
  }, [authenticated, teams, params, navigate, currentUser, location.pathname, location.hash]);
  const all = teams || [];
  const legacy = all.filter(isLegacyTeam);
  const filtered = all.filter((team) => !isLegacyTeam(team) && getGame(team.game) && (!lower(keyword) || lower(team.name).includes(lower(keyword)) || team.members.some((member) => lower(member).includes(lower(keyword))))
    && (!game || team.game === game) && (status === "RECRUITING" ? team.recruiting : status === "MY_TEAM" ? mine.some((entry) => entry.id === team.id) : true));
  function destination(action, team) {
    const search = new URLSearchParams(location.search);
    search.set("action", action);
    if (team != null) search.set("team", team); else search.delete("team");
    return { ...location, search: search.toString() };
  }
  function open(team, trigger) {
    if (!requireAuth(destination(team ? "edit-team" : "create-team", team?.id))) return;
    lastTrigger.current = trigger; setDialog({ team });
  }
  function changeTeam(action) {
    if (!requireAuth(destination(action.type === "join" ? "join-team" : "view-team", action.id))) return;
    setError(""); setNotice("");
    try {
      const team = all.find((item) => String(item.id) === String(action.id));
      performTeamAction(action);
      const messages = {
        join: `Đã gửi yêu cầu xin gia nhập đội "${team?.name}". Vui lòng chờ đội trưởng phê duyệt.`,
        cancel: `Đã hủy yêu cầu xin gia nhập đội "${team?.name}".`,
        accept: `Đã chấp thuận @${action.applicant} vào đội.`,
        reject: `Đã từ chối yêu cầu của @${action.applicant}.`,
        leave: `Bạn đã rời khỏi đội "${team?.name}".`,
        dissolve: `Đã giải tán đội tuyển "${team?.name}".`,
      };
      setNotice(messages[action.type] || "");
    } catch (cause) { setError(cause.message); }
  }
  const cards = (list, personal = false) => list.map((team) => <TeamAccordionBar key={team.id} team={team} actor={actor} onAction={changeTeam} onEdit={open} highlighted={String(team.id) === viewedTeamId && (personal || !mine.some((entry) => entry.id === team.id))} />);
  return <div>
    <header>
      <div className="dp-container py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight uppercase sm:text-4xl">Cộng đồng &amp; Đội tuyển</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-dp-read">Tạo đội tuyển của riêng bạn, chiêu mộ đồng đội và theo dõi tất cả các đội tuyển bạn đang tham gia tranh tài.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button ref={createTrigger} onClick={(event) => open(null, event.currentTarget)}><Plus />Tạo Team mới</Button>
          <Button asChild variant="outline"><a href="#discoverTeamsSection"><Search />Tìm đội tuyển</a></Button>
        </div>
      </div>
    </header>
    <div className="dp-container space-y-10 py-8">
      <div aria-live="polite"><FormMessage error={error} notice={notice} /></div>
      {authenticated && <section id="myTeamsSection" aria-labelledby="my-teams-title" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div><div className="flex items-center gap-3"><h2 id="my-teams-title" className="text-lg font-semibold">Đội tuyển của tôi</h2><span className="rounded-pill border border-dp-hairline-2 px-2.5 py-1 font-mono text-[10px] text-dp-read">{mine.length} đội</span></div>
            <p className="mt-2 text-xs leading-5 text-dp-meta">Danh sách các đội tuyển bạn đã tạo hoặc đang là thành viên chính thức</p></div>
          <Button size="sm" variant="outline" onClick={(event) => open(null, event.currentTarget)}><Plus />Tạo Team riêng</Button>
        </div>
        <div className="space-y-4">{mine.length ? cards(mine, true) : <EmptyState title="Bạn chưa thuộc đội tuyển nào" description="Hãy tạo ngay một Team của riêng bạn để làm Đội trưởng hoặc gia nhập các đội tuyển đang tuyển thành viên bên dưới.">
          <Button size="sm" onClick={(event) => open(null, event.currentTarget)}><Plus />Tạo Team đầu tiên của bạn</Button>
        </EmptyState>}</div>
      </section>}
      {legacy.length > 0 && <details className="dp-panel p-5"><summary className="cursor-pointer text-sm font-medium">Đội tuyển khác</summary><div className="mt-4 space-y-4">{cards(legacy)}</div></details>}
      <section id="discoverTeamsSection" aria-labelledby="discover-teams-title" className="scroll-mt-20">
        <h2 id="discover-teams-title" className="text-lg font-semibold">Khám phá Đội tuyển Cộng đồng</h2>
        <p className="mt-2 text-xs leading-5 text-dp-meta">Tìm kiếm và gia nhập các đội tuyển đang hoạt động trên hệ thống</p>
        <div className="my-5 flex flex-col gap-3 xl:flex-row">
          <SearchInput label="Tìm đội hoặc thành viên" placeholder="Tìm theo tên đội hoặc thành viên..." value={keyword} onChange={(value) => filter("q", value, true)} />
          <GameSelect games={TEAM_GAMES} value={game} onChange={(value) => filter("game", getGame(value)?.slug || "")} />
          <NativeSelect aria-label="Trạng thái đội" value={status} onChange={(event) => filter("teamStatus", event.target.value)} className="w-full sm:w-60">
            <option value="">Mọi trạng thái</option><option value="RECRUITING">Đang tuyển thành viên</option><option value="MY_TEAM">Team tôi đang tham gia</option>
          </NativeSelect>
        </div>
        <div className="space-y-4">{filtered.length ? cards(filtered) : <EmptyState title="Không tìm thấy đội tuyển phù hợp." />}</div>
      </section>
    </div>
    {authenticated && dialog && <TeamFormDialog team={dialog.team} onClose={() => setDialog(null)} restoreFocus={() => (lastTrigger.current?.isConnected ? lastTrigger.current : createTrigger.current)?.focus({ preventScroll: true })}
      onSave={(values) => {
        if (!requireAuth(destination(dialog.team ? "edit-team" : "create-team", dialog.team?.id))) return;
        performTeamAction({ type: dialog.team ? "edit" : "create", id: dialog.team?.id, values });
        setError(""); setNotice(dialog.team ? `Đã cập nhật đội tuyển "${values.name}".` : `Đã tạo đội tuyển "${values.name}" thành công!`);
      }} />}
  </div>;
}
