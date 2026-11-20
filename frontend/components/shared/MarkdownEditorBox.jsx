import { lazy, Suspense, useId, useState } from "react";
import { Eye, FileText, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

const HELP = [
  ["Tiêu đề", "# H1, ## H2, ### H3"], ["In đậm / In nghiêng", "**In đậm**, *In nghiêng*"],
  ["Mã lệnh", "`code`"], ["Danh sách", "- Mục 1 hoặc * Mục 1"],
  ["Bảng", "| Cột 1 | Cột 2 |\n|---|---|\n| Giá trị 1 | Giá trị 2 |"],
];
export default function MarkdownEditorBox({ value, onChange, label = "Điều lệ giải đấu" }) {
  const id = useId();
  const [preview, setPreview] = useState(false);
  const [help, setHelp] = useState(false);
  const field = label.toLocaleLowerCase("vi");
  return <div className="space-y-4">
    {preview ? <section aria-label={`Xem trước ${field}`} className="min-h-40 overflow-x-auto rounded-panel border border-dp-hairline-2 bg-dp-ground p-5"><Suspense fallback={<p role="status" className="text-xs text-dp-meta">Đang tải bản xem trước…</p>}><MarkdownRenderer value={value} emptyMessage={`Chưa cập nhật ${field}.`} /></Suspense></section>
      : <div><label htmlFor={id} className="sr-only">{label}</label><Textarea id={id} rows={7} value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Nhập ${field} (hỗ trợ định dạng Markdown)...`} className="font-mono text-xs leading-6" /></div>}
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" aria-pressed={preview} onClick={() => setPreview((current) => !current)}>{preview ? <FileText /> : <Eye />}{preview ? "Chỉnh sửa Markdown" : "Xem trước Markdown"}</Button>
      <Button size="sm" variant="ghost" aria-expanded={help} aria-controls={`${id}-help`} onClick={() => setHelp((current) => !current)}><HelpCircle />Hướng dẫn định dạng</Button>
    </div>
    {help && <section id={`${id}-help`} aria-label="Hướng dẫn định dạng Markdown" className="rounded-panel border border-dp-hairline-2 bg-dp-ground">
      <div className="flex items-center justify-between gap-3 border-b border-dp-hairline px-4 py-3"><h3 className="text-xs font-medium">Hướng dẫn định dạng Markdown</h3><Button size="icon" variant="ghost" className="size-7" aria-label="Đóng hướng dẫn" onClick={() => setHelp(false)}><X /></Button></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-dp-meta"><tr><th className="px-4 py-3 font-medium">Kiểu hiển thị</th><th className="px-4 py-3 font-medium">Cú pháp Markdown</th></tr></thead><tbody>
        {HELP.map(([style, syntax]) => <tr key={style} className="border-t border-dp-hairline"><td className="px-4 py-3 text-dp-read">{style}</td><td className="px-4 py-3"><code className="font-mono text-[10px] whitespace-pre-wrap">{syntax}</code></td></tr>)}
      </tbody></table></div>
    </section>}
  </div>;
}
