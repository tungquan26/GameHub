import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "./FormField";
import FutureDateField from "./FutureDateField";
import { FormMessage } from "./AuthPanel";
import { useUnsavedChanges } from "./UnsavedChangesProvider";

function MatchForm({ match, onSave, onCancel }) {
  const [values, setValues] = useState({ scheduledTime: match.scheduledTime || "", scoreA: match.result?.scoreA ?? 0, scoreB: match.result?.scoreB ?? 0 });
  const [error, setError] = useState("");
  useUnsavedChanges(values.scheduledTime !== (match.scheduledTime || "") || String(values.scoreA) !== String(match.result?.scoreA ?? 0) || String(values.scoreB) !== String(match.result?.scoreB ?? 0));
  const ready = Boolean(match.teamA && match.teamB);
  function change(key, value) { setValues((previous) => ({ ...previous, [key]: value })); setError(""); }
  async function save(timeOnly) { try { await onSave(values, timeOnly); } catch (cause) { setError(cause.message); } }
  return <form className="mt-6 space-y-5" noValidate onSubmit={(event) => { event.preventDefault(); if (ready) save(false); }}>
    <FutureDateField label="Thời gian thi đấu" className="font-mono" value={values.scheduledTime} onChange={(event) => change("scheduledTime", event.target.value)} />
    <div className="grid grid-cols-2 gap-4"><FormField label={match.teamA?.name || "Đội A (TBD)"} type="number" min="0" step="1" className="font-mono" disabled={!ready} value={values.scoreA} onChange={(event) => change("scoreA", event.target.value)} /><FormField label={match.teamB?.name || "Đội B (TBD)"} type="number" min="0" step="1" className="font-mono" disabled={!ready} value={values.scoreB} onChange={(event) => change("scoreB", event.target.value)} /></div>
    {!ready && <p className="text-xs leading-6 text-dp-meta">{match.roundNumber === 1 ? "Chưa xác định đủ hai đội." : "Chờ kết quả vòng trước để xác định hai đội."} Bạn vẫn có thể đổi giờ đấu.</p>}
    <FormMessage error={error} />
    <div className="flex flex-wrap justify-end gap-2 border-t border-dp-hairline pt-5"><Button size="sm" variant="ghost" onClick={onCancel}>Hủy</Button><Button size="sm" variant="outline" onClick={() => save(true)}>Chỉ lưu giờ đấu</Button>{ready && <Button size="sm" type="submit">Lưu kết quả</Button>}</div>
  </form>;
}
export default function MatchEditorDialog({ match, bracketId, onSave, onClose, returnFocus }) {
  return <Dialog open={Boolean(match)} onOpenChange={(open) => { if (!open) onClose(); }}>
    {match && <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); (returnFocus?.current?.isConnected ? returnFocus.current : document.querySelector("[data-page-content]"))?.focus({ preventScroll: true }); }}>
      <DialogTitle className="pr-6 text-xl leading-8 font-semibold">Cập nhật Trận #{match.matchNumber} ({match.roundName})</DialogTitle>
      <DialogDescription className="mt-2 text-xs leading-6 text-dp-read">{match.teamA?.name || "TBD"} vs {match.teamB?.name || "TBD"}</DialogDescription>
      <MatchForm key={`${bracketId}:${match.matchId}:${match.teamA?.id}:${match.teamB?.id}`} match={match} onSave={onSave} onCancel={onClose} />
    </DialogContent>}
  </Dialog>;
}
