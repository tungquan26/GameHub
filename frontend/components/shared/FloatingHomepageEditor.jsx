import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingHomepageEditor({ sections, editing, preview, onPreview, dirty, onEdit, onAdd, onReset, onCancel, onSave }) {
  const [collapsed, setCollapsed] = useState(false);
  const count = sections.reduce((total, section) => total + section.columns.flat().length, 0);
  return <aside aria-label="Trình chỉnh sửa trang chủ" className="dp-panel fixed right-4 bottom-4 z-30 w-80 max-w-[calc(100vw_-_32px)] shadow-2xl sm:right-6 sm:bottom-6">
    <div className="flex items-center justify-between gap-3 p-4"><div><h2 className="text-sm font-semibold">{editing ? "Đang chỉnh sửa trang chủ" : "Trang chủ"}</h2><p className="mt-1 font-mono text-[10px] text-dp-meta">{sections.length} khu vực · {count} tiện ích</p></div>
      <Button size="icon" variant="ghost" className="size-8" aria-label={collapsed ? "Mở rộng trình chỉnh sửa" : "Thu gọn trình chỉnh sửa"} aria-expanded={!collapsed} aria-controls="homepage-editor-actions" onClick={() => setCollapsed((current) => !current)}>{collapsed ? <ChevronUp /> : <ChevronDown />}</Button></div>
    {!collapsed && <div id="homepage-editor-actions" className="space-y-3 border-t border-dp-hairline p-4">
      {editing ? <><Button size="sm" variant="outline" className="w-full" aria-pressed={preview} onClick={onPreview}>{preview ? "Tiếp tục chỉnh sửa bố cục" : "Xem trước bản nháp"}</Button><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onAdd}><Plus />Thêm khu vực</Button><Button size="sm" variant="ghost" onClick={onReset}><RotateCcw />Khôi phục mặc định</Button></div><div className="flex justify-end gap-2 border-t border-dp-hairline pt-3"><Button size="sm" variant="ghost" onClick={onCancel}>Hủy</Button><Button size="sm" disabled={!dirty} onClick={onSave}>Lưu</Button></div></>
        : <Button size="sm" className="w-full" onClick={() => { setCollapsed(false); onEdit(); }}>Chỉnh sửa trang</Button>}
    </div>}
  </aside>;
}
