import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { FormField } from "./FormField";
import { FormMessage } from "./AuthPanel";
import { TEAM_GAMES, validateTeam } from "@/lib/teams";
import useAsyncAction from "@/hooks/useAsyncAction";
import { gameLabel, getGame } from "@/lib/games";

export default function TeamFormDialog({ team, onClose, onSave, restoreFocus }) {
  const [form, setForm] = useState(() => ({ name: team?.name || "", game: team?.game || "", recruiting: team?.recruiting ?? true, logo: team?.logo || "" }));
  const [uploading, setUploading] = useState(false);
  const input = useRef(null);
  const reader = useRef(null);
  const action = useAsyncAction();
  useEffect(() => () => { reader.current?.abort(); }, []);
  function change(key, value) { setForm((previous) => ({ ...previous, [key]: value })); action.setError(""); }
  function upload(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    reader.current?.abort(); setUploading(false); action.setError("");
    if (file.size > 4 * 1024 * 1024) { action.setError("Kích thước ảnh tối đa là 4MB."); return; }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) { action.setError("Vui lòng chọn ảnh PNG, JPEG, WebP hoặc GIF."); return; }
    const task = new FileReader(); reader.current = task; setUploading(true);
    task.onload = () => { if (reader.current === task) { change("logo", task.result); setUploading(false); } };
    task.onerror = () => { if (reader.current === task) { action.setError("Không thể đọc ảnh Logo."); setUploading(false); } };
    task.readAsDataURL(file);
  }
  function submit(event) {
    event.preventDefault();
    if (uploading) return;
    action.run(async () => { const values = validateTeam(form); await onSave(values); onClose(); });
  }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus?.(); }}>
      <DialogTitle className="pr-6 text-xl font-semibold">{team ? `Quản lý Đội Tuyển: ${team.name}` : "Tạo Đội Tuyển Mới"}</DialogTitle>
      <DialogDescription className="mt-2 text-xs leading-6 text-dp-read">Thiết lập hồ sơ đội tuyển và biểu tượng huy hiệu</DialogDescription>
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <FormField label="Tên Đội Tuyển" required placeholder="VD: BTP Gaming, T1 Vietnam..." value={form.name} onChange={(event) => change("name", event.target.value)} />
        <FormField label="Tựa Game Thi Đấu Chính" required>{(id) => <NativeSelect id={id} required value={getGame(form.game)?.id || ""} onChange={(event) => change("game", event.target.value)}>
          <option value="" disabled>-- Chọn tựa game --</option>
          {TEAM_GAMES.map((game) => <option key={game} value={game}>{gameLabel(game)}</option>)}
        </NativeSelect>}</FormField>
        {form.game && !getGame(form.game) && <p className="text-xs leading-6 text-dp-meta">Bộ môn cũ: {form.game}. Hãy chọn một trong {TEAM_GAMES.length} game hiện được hỗ trợ trước khi lưu.</p>}
        <FormField label="Trạng Thái Đội Hình">{(id) => <NativeSelect id={id} value={String(form.recruiting)} onChange={(event) => change("recruiting", event.target.value === "true")}>
          <option value="true">Đang mở tuyển thành viên</option><option value="false">Đã chốt đội hình</option>
        </NativeSelect>}</FormField>
        <div>
          <p className="mb-3 text-xs font-medium text-dp-read">Logo Đội Tuyển</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-panel border border-dp-hairline-2 bg-dp-ground font-mono text-sm">
              {form.logo ? <img src={form.logo} alt="Logo đội xem trước" className="size-full object-cover" /> : (form.name.trim().slice(0, 3) || "BTP").toUpperCase()}
            </span>
            <div className="space-y-2"><input type="file" ref={input} aria-label="Tải ảnh Logo đội" className="sr-only" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} />
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={uploading} onClick={() => input.current?.click()}><Upload />Tải ảnh Logo</Button>
                {form.logo && <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { reader.current?.abort(); reader.current = null; setUploading(false); change("logo", ""); }}>Xóa ảnh</Button>}</div>
              <p className="text-[10px] text-dp-meta">PNG/JPG tối đa 4MB</p>
            </div>
          </div>
        </div>
        <FormMessage error={action.error} />
        <div className="flex justify-end gap-3 border-t border-dp-hairline pt-5">
          <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
          <Button size="sm" type="submit" disabled={uploading || action.pending}>Lưu Đội Tuyển</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
