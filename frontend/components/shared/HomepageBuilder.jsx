import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeftRight, ArrowUp, FileText, Gamepad2, GripVertical, Image, Mail, MapPin, Plus, ScrollText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { COLUMN_LAYOUTS, WIDGET_META, editHomepage, newWidget, normalizeHomepage } from "@/lib/homepage";
import { tournamentPath } from "@/lib/public-tournament";
import { cn } from "@/lib/utils";
import { useTourney } from "@/context/TourneyContext";
import useDraft from "@/hooks/useDraft";
import { useUnsavedChanges } from "./UnsavedChangesProvider";
import HomepageWidget from "./HomepageWidget";
import HomepageWidgetForm from "./HomepageWidgetForm";
import FloatingHomepageEditor from "./FloatingHomepageEditor";
import EmptyState from "./EmptyState";

const ICONS = { MARKDOWN: FileText, IMAGE: Image, GAME_INFO: Gamepad2, LOCATION: MapPin, CONTACT: Mail, RULES: ScrollText };
function Tool({ label, icon: Icon, ...props }) { return <Button size="icon" variant="ghost" className="size-8" title={label} aria-label={label} {...props}><Icon /></Button>; }
function ReorderTools({ label, index, count, onMove }) {
  return <><Tool label={`Di chuyển ${label} lên`} icon={ArrowUp} disabled={index === 0} onClick={() => onMove(-1)} /><Tool label={`Di chuyển ${label} xuống`} icon={ArrowDown} disabled={index === count - 1} onClick={() => onMove(1)} /></>;
}
export default function HomepageBuilder({ entry, readOnly = false }) {
  const { updateTournament } = useTourney();
  const draft = useDraft(entry.id, normalizeHomepage(entry.homepageLayout));
  const [editing, setEditing] = useState(false); const [modal, setModal] = useState(null); const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  useUnsavedChanges(!readOnly && draft.isDirty);
  const drag = useRef(null); const returnFocus = useRef(null); const container = useRef(null);
  const activeEditing = editing && !preview && !readOnly;
  const sections = editing && !readOnly ? draft.value : normalizeHomepage(entry.homepageLayout);
  function dispatch(action) { draft.setValue((previous) => editHomepage(previous, action)); setNotice(""); }
  function openModal(event, value) { returnFocus.current = event.currentTarget; setModal(value); }
  function startDrag(event, value) { drag.current = value; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", value.widgetId || value.sectionId); }
  function drop(event, sectionId, column) {
    if (!drag.current || !activeEditing) return;
    event.preventDefault(); event.stopPropagation();
    const origin = drag.current; drag.current = null;
    if (origin.widgetId && column != null) dispatch({ type: "move-widget", ...origin, targetSectionId: sectionId, targetColumn: column });
    else if (!origin.widgetId) dispatch({ type: "move-section", sectionId: origin.sectionId, targetId: sectionId });
  }
  function addWidget(type) {
    const widget = newWidget(type);
    dispatch({ type: "add-widget", sectionId: modal.sectionId, column: modal.column, widget });
    setModal(["MARKDOWN", "IMAGE"].includes(type) ? { ...modal, type, widget, widgetId: widget.id } : null);
  }
  function save() {
    try { updateTournament(entry.id, { homepageLayout: draft.value }); setEditing(false); setNotice("Đã lưu bố cục trang chủ thành công."); }
    catch (cause) { setNotice(cause.message); }
  }
  return <div ref={container} tabIndex={-1} className={cn("outline-none", !readOnly && "pb-64 sm:pb-56")}>
    {notice && <p role="status" className="mb-6 text-xs leading-6 text-dp-live">{notice}</p>}
    {sections.length ? <div className="space-y-9">{sections.map((section, index) => <section key={section.id} aria-label={`Khu vực ${index + 1}${section.title ? ": " + section.title : ""}`}
      onDragOver={activeEditing ? (event) => { if (drag.current) event.preventDefault(); } : undefined} onDrop={activeEditing ? (event) => drop(event, section.id) : undefined}
      className={cn("min-w-0", activeEditing && "rounded-panel border border-dp-hairline-2 p-3 sm:p-4")}>
      {activeEditing ? <div className="mb-5 space-y-3 border-b border-dp-hairline pb-4">
        <div className="flex items-center gap-2"><Tool label={`Kéo khu vực ${index + 1}`} icon={GripVertical} draggable onDragStart={(event) => startDrag(event, { sectionId: section.id })} onDragEnd={() => { drag.current = null; }} />
          <Input aria-label={`Tiêu đề khu vực ${index + 1}`} value={section.title} onChange={(event) => dispatch({ type: "title", sectionId: section.id, value: event.target.value })} placeholder="Tiêu đề khu vực (không bắt buộc)..." className="min-w-0 flex-1" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2"><NativeSelect aria-label={`Bố cục khu vực ${index + 1}`} value={section.layout} className="h-9 w-full text-xs sm:w-auto" onChange={(event) => dispatch({ type: "layout", sectionId: section.id, value: event.target.value })}>
          {COLUMN_LAYOUTS.map((layout) => <option key={layout.value} value={layout.value}>{layout.label}</option>)}</NativeSelect>
          <div className="flex items-center"><span className="mr-2 font-mono text-[10px] text-dp-meta">Khu vực {index + 1}</span><ReorderTools label="khu vực" index={index} count={sections.length} onMove={(direction) => dispatch({ type: "move-section", sectionId: section.id, direction })} /><Tool label="Xóa khu vực" icon={Trash2} onClick={() => dispatch({ type: "remove-section", sectionId: section.id })} /></div>
        </div>
      </div> : section.title && <h2 className="mb-4 text-lg font-semibold break-words">{section.title}</h2>}
      <div className={cn("grid min-w-0 gap-6", COLUMN_LAYOUTS.find((layout) => layout.value === section.layout)?.grid)}>
        {section.columns.map((column, columnIndex) => <div key={columnIndex} className="min-w-0 space-y-5" aria-label={activeEditing ? `Cột ${columnIndex + 1} khu vực ${index + 1}` : undefined}
          onDragOver={activeEditing ? (event) => { if (drag.current?.widgetId) event.preventDefault(); } : undefined} onDrop={activeEditing ? (event) => drop(event, section.id, columnIndex) : undefined}>
          {column.map((widget, widgetIndex) => <div key={widget.id} className="min-w-0 space-y-3">
            {activeEditing && <div className="flex flex-wrap items-center justify-between gap-2 rounded-panel border border-dp-hairline bg-dp-ground p-2">
              <div className="flex min-w-0 items-center gap-1"><Tool label="Kéo tiện ích" icon={GripVertical} draggable onDragStart={(event) => startDrag(event, { sectionId: section.id, widgetId: widget.id })} onDragEnd={() => { drag.current = null; }} /><span className="text-[10px] text-dp-meta">{WIDGET_META[widget.type].label}</span></div>
              <div className="flex flex-wrap items-center gap-1">
                {["MARKDOWN", "IMAGE"].includes(widget.type) ? <Button size="sm" variant="ghost" onClick={(event) => openModal(event, { type: widget.type, sectionId: section.id, widgetId: widget.id, widget })}>{widget.type === "IMAGE" ? "Sửa hình ảnh" : "Sửa nội dung"}</Button>
                  : <Button asChild size="sm" variant="ghost"><Link to={tournamentPath(WIDGET_META[widget.type].path, entry, { hash: WIDGET_META[widget.type].hash })}>Thiết lập</Link></Button>}
                {section.columns.length === 2 && <Tool label="Chuyển sang cột bên cạnh" icon={ArrowLeftRight} onClick={() => dispatch({ type: "move-widget", sectionId: section.id, widgetId: widget.id, targetSectionId: section.id, targetColumn: 1 - columnIndex })} />}
                <ReorderTools label="tiện ích" index={widgetIndex} count={column.length} onMove={(direction) => dispatch({ type: "move-widget", sectionId: section.id, widgetId: widget.id, direction })} />
                <Tool label="Xóa tiện ích" icon={Trash2} onClick={() => dispatch({ type: "remove-widget", sectionId: section.id, widgetId: widget.id })} />
              </div>
            </div>}
            <HomepageWidget widget={widget} entry={entry} />
          </div>)}
          {activeEditing && <Button size="sm" variant="outline" className="w-full border-dashed" onClick={(event) => openModal(event, { type: "picker", sectionId: section.id, column: columnIndex })}><Plus />Thêm tiện ích</Button>}
        </div>)}
      </div>
    </section>)}</div> : <EmptyState title="Chưa có khu vực nội dung" description={readOnly ? "Ban tổ chức chưa cập nhật nội dung trang chủ." : "Chọn Chỉnh sửa trang để thêm khu vực và tiện ích."} />}
    {activeEditing && <Button variant="outline" className="mt-8 w-full border-dashed" onClick={() => dispatch({ type: "add-section" })}><Plus />Thêm khu vực mới</Button>}
    {!readOnly && <FloatingHomepageEditor sections={sections} editing={editing} preview={preview} onPreview={() => setPreview((current) => !current)} dirty={draft.isDirty} onEdit={() => { draft.setValue(normalizeHomepage(entry.homepageLayout)); setEditing(true); setPreview(false); setNotice(""); }} onAdd={() => { setPreview(false); dispatch({ type: "add-section" }); }} onReset={() => dispatch({ type: "reset" })}
      onCancel={() => { draft.setValue(normalizeHomepage(entry.homepageLayout)); setEditing(false); setNotice("Đã hủy các thay đổi."); }} onSave={save} />}
    <Dialog open={Boolean(modal)} onOpenChange={(open) => { if (!open) setModal(null); }}>
      {modal && <DialogContent className="max-w-2xl" onCloseAutoFocus={(event) => { event.preventDefault(); (returnFocus.current?.isConnected ? returnFocus.current : container.current)?.focus(); }}>
        <DialogTitle className="pr-7 text-xl font-semibold">{modal.type === "picker" ? "Thêm tiện ích" : modal.type === "IMAGE" ? "Chỉnh sửa tiện ích Hình ảnh" : "Chỉnh sửa tiện ích Văn bản / Markdown"}</DialogTitle>
        <DialogDescription className="mt-2 text-xs leading-6 text-dp-read">{modal.type === "picker" ? "Chọn tiện ích muốn thêm vào cột này" : modal.type === "IMAGE" ? "Tải ảnh từ thiết bị của bạn hoặc dán đường dẫn URL hình ảnh" : "Tùy chỉnh tiêu đề và nội dung Markdown"}</DialogDescription>
        {modal.type === "picker" ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{Object.entries(WIDGET_META).map(([type, meta]) => { const Icon = ICONS[type]; return <button key={type} type="button" onClick={() => addWidget(type)} className="flex min-h-20 items-center gap-4 rounded-panel border border-dp-hairline-2 px-4 py-5 text-left text-xs leading-6 hover:border-dp-read"><Icon aria-hidden="true" className="size-5 shrink-0 text-dp-live" /><span>{meta.label}</span></button>; })}</div>
          : <HomepageWidgetForm key={modal.widgetId} widget={modal.widget} onCancel={() => setModal(null)} onApply={(patch) => { dispatch({ type: "update-widget", sectionId: modal.sectionId, widgetId: modal.widgetId, patch }); setModal(null); }} />}
      </DialogContent>}
    </Dialog>
  </div>;
}
