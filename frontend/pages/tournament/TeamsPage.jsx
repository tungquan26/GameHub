import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import SettingsCard from "@/components/shared/SettingsCard";
import TournamentEditorPage from "@/components/shared/TournamentEditorPage";
import EmptyState from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/TournamentControls";
import { FormMessage } from "@/components/shared/AuthPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTourney } from "@/context/TourneyContext";
import { allMatches } from "@/lib/bracket";
import { MAX_TOURNAMENT_TEAMS, normalizeParticipants } from "@/lib/tournament-settings";
import { lower, registrationStatus } from "@/lib/tournaments";
import useAsyncAction from "@/hooks/useAsyncAction";

function TeamsEditor({ entry }) {
  const { revokeTournamentTeam } = useTourney();
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const action = useAsyncAction();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const status = registrationStatus(entry, now);
  const lockedReason = { IN_PROGRESS: "Giải đang diễn ra.", COMPLETED: "Giải đã kết thúc.", CANCELLED: "Giải đã hủy." }[status];
  const drawnTeams = new Set(allMatches(entry.bracket).flatMap(match => [match.teamA?.id, match.teamB?.id]));
  const reason = (team) => lockedReason || (drawnTeams.has(team.id) ? "Đội đã được xếp vào nhánh đấu." : "");
  const teams = normalizeParticipants(entry.tournamentTeams);
  const usedSlots = entry.teamCount ?? teams.length;
  const maxTeams = entry.maxTeams ?? MAX_TOURNAMENT_TEAMS;
  const filtered = teams.filter((team) => !lower(keyword) || lower(team.name).includes(lower(keyword)) || lower(team.members.join(" / ")).includes(lower(keyword)));
  function confirmRemoval() {
    action.run(async () => {
      await revokeTournamentTeam(entry.id, selected.id);
      action.setNotice(`Đã thu hồi suất thi đấu của đội ${selected.name}.`);
      setSelected(null);
    });
  }
  return <SettingsCard title="Danh sách đội tuyển" subtitle={`Đã dùng ${usedSlots}/${maxTeams} suất thi đấu.`}>
    <SearchInput label="Tìm đội tuyển hoặc thành viên" placeholder="Tìm kiếm đội tuyển hoặc thành viên..." value={keyword} onChange={setKeyword} />
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !action.pending) setSelected(null); }}>
      {selected && <DialogContent>
        <DialogTitle className="pr-6 text-xl font-semibold">Thu hồi suất thi đấu?</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-dp-read">Đội {selected.name} sẽ mất suất thi đấu tại giải {entry.name}.</DialogDescription>
        <FormMessage error={action.error || reason(selected)} />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" disabled={action.pending} onClick={() => setSelected(null)}>Hủy</Button>
          <Button variant="destructive" size="sm" disabled={action.pending || Boolean(reason(selected))} onClick={confirmRemoval}>Xác nhận thu hồi</Button>
        </div>
      </DialogContent>}
    </Dialog>
    <FormMessage notice={action.notice} />
    {filtered.length ? <div className="overflow-hidden rounded-panel border border-dp-hairline">
      <table className="w-full table-fixed text-left text-sm" aria-label="Đội tuyển trong giải">
        <thead className="bg-dp-ground text-xs text-dp-meta"><tr><th scope="col" className="w-2/5 px-3 py-4 font-medium sm:px-5">Đội tuyển</th><th scope="col" className="px-3 py-4 font-medium sm:px-5">Thành viên</th><th scope="col" className="px-3 py-4 font-medium">Suất thi đấu</th></tr></thead>
        <tbody>{filtered.map((team) => <tr key={team.id} className="border-t border-dp-hairline">
          <td className="px-3 py-4 align-top sm:px-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-panel border border-dp-hairline-2 bg-dp-ground font-mono text-xs">{(team.name.trim().charAt(0) || "T").toUpperCase()}</span>
            <span className="min-w-0 break-words text-xs font-medium sm:text-sm">{team.name}</span>
          </div></td>
          <td className="px-3 py-4 align-top sm:px-5"><div className="flex items-start gap-2"><Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-dp-meta" /><span className="min-w-0 break-words text-xs leading-6 text-dp-read">{team.members.join(" / ")}</span></div>
            {team.bracketEligible === false && <p className="mt-1 text-xs text-dp-meta">Đã đăng ký {team.members.length}/{entry.teamMinPlayers} người để được xếp nhánh.</p>}
          </td>
          <td className="px-2 py-4 align-top">
            <Button size="sm" variant="outline" className="px-2" aria-label={`Thu hồi suất của đội ${team.name}`} disabled={Boolean(reason(team))}
              onClick={() => { action.setError(""); action.setNotice(""); setSelected(team); }}>Thu hồi suất</Button>
            {reason(team) && <p className="mt-1 text-xs text-dp-meta">{reason(team)}</p>}
          </td>
        </tr>)}</tbody>
      </table>
    </div> : <EmptyState title={teams.length ? "Không tìm thấy đội tuyển phù hợp." : "Chưa có đội tuyển nào"} />}
  </SettingsCard>;
}
export default function TeamsPage() {
  return <TournamentEditorPage title="Đội tuyển">{(entry) => <TeamsEditor key={entry.id} entry={entry} />}</TournamentEditorPage>;
}
