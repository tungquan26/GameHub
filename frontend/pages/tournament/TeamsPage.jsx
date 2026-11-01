import { useState } from "react";
import { Plus, Users } from "lucide-react";
import SettingsCard from "@/components/shared/SettingsCard";
import TournamentEditorPage from "@/components/shared/TournamentEditorPage";
import EmptyState from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/TournamentControls";
import { FormField } from "@/components/shared/FormField";
import { FormMessage } from "@/components/shared/AuthPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTourney } from "@/context/TourneyContext";
import { normalizeParticipants } from "@/lib/tournament-settings";
import { lower } from "@/lib/tournaments";
import useAsyncAction from "@/hooks/useAsyncAction";
import { useUnsavedChanges } from "@/components/shared/UnsavedChangesProvider";

function TeamsEditor({ entry }) {
  const { addTournamentTeam } = useTourney();
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", members: "" });
  const [notice, setNotice] = useState("");
  const action = useAsyncAction();
  useUnsavedChanges(open && (Boolean(form.name || form.members) || action.pending));
  const teams = normalizeParticipants(entry.tournamentTeams);
  const filtered = teams.filter((team) => !lower(keyword) || lower(team.name).includes(lower(keyword)) || lower(team.members.join(" / ")).includes(lower(keyword)));
  function openDialog(next) {
    if (next) { setForm({ name: "", members: "" }); action.setError(""); }
    setOpen(next);
  }
  function submit(event) {
    event.preventDefault(); event.stopPropagation();
    action.run(async () => {
      const team = addTournamentTeam(entry.id, form);
      setNotice(`Đã thêm đội "${team.name}" vào danh sách.`); setOpen(false);
    });
  }
  return <SettingsCard title="Danh sách đội tuyển" subtitle="Tìm kiếm và quản lý các đội tuyển trong giải đấu.">
    <div className="flex flex-col gap-3 sm:flex-row">
      <SearchInput label="Tìm đội tuyển hoặc thành viên" placeholder="Tìm kiếm đội tuyển hoặc thành viên..." value={keyword} onChange={setKeyword} />
      <Dialog open={open} onOpenChange={openDialog}>
        <DialogTrigger asChild><Button><Plus />Thêm đội tuyển</Button></DialogTrigger>
        <DialogContent>
          <DialogTitle className="pr-6 text-xl font-semibold">Thêm đội tuyển</DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-6 text-dp-read">Nhập tên các thành viên, cách nhau bởi dấu "/" hoặc dấu phẩy.</DialogDescription>
          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <FormField label="Tên đội tuyển" required placeholder="VD: T1 / Gen.G" value={form.name} onChange={(event) => { setForm((previous) => ({ ...previous, name: event.target.value })); action.setError(""); }} />
            <FormField label="Danh sách thành viên" required placeholder="Faker / Oner / Chovy (phân cách bằng dấu / hoặc dấu phẩy)" value={form.members} onChange={(event) => { setForm((previous) => ({ ...previous, members: event.target.value })); action.setError(""); }} />
            <FormMessage error={action.error} />
            <div className="flex justify-end gap-3 border-t border-dp-hairline pt-5">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" size="sm" disabled={action.pending}>Lưu đội tuyển</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    <FormMessage notice={notice} />
    {filtered.length ? <div className="overflow-hidden rounded-panel border border-dp-hairline">
      <table className="w-full table-fixed text-left text-sm" aria-label="Đội tuyển trong giải">
        <thead className="bg-dp-ground text-xs text-dp-meta"><tr><th scope="col" className="w-2/5 px-3 py-4 font-medium sm:px-5">Đội tuyển</th><th scope="col" className="px-3 py-4 font-medium sm:px-5">Thành viên</th></tr></thead>
        <tbody>{filtered.map((team) => <tr key={team.id} className="border-t border-dp-hairline">
          <td className="px-3 py-4 align-top sm:px-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-panel border border-dp-hairline-2 bg-dp-ground font-mono text-xs">{(team.name.trim().charAt(0) || "T").toUpperCase()}</span>
            <span className="min-w-0 break-words text-xs font-medium sm:text-sm">{team.name}</span>
          </div></td>
          <td className="px-3 py-4 align-top sm:px-5"><div className="flex items-start gap-2"><Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-dp-meta" /><span className="min-w-0 break-words text-xs leading-6 text-dp-read">{team.members.join(" / ")}</span></div></td>
        </tr>)}</tbody>
      </table>
    </div> : <EmptyState title={teams.length ? "Không tìm thấy đội tuyển phù hợp." : "Chưa có đội tuyển nào"} />}
  </SettingsCard>;
}
export default function TeamsPage() {
  return <TournamentEditorPage title="Đội tuyển">{(entry) => <TeamsEditor key={entry.id} entry={entry} />}</TournamentEditorPage>;
}
