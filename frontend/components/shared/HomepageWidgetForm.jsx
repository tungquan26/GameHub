import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { FormMessage } from "./AuthPanel";
import ImageUploadField from "./ImageUploadField";
import MarkdownEditorBox from "./MarkdownEditorBox";
import { cleanImageWidget, safeWebUrl } from "@/lib/homepage";
import { useUnsavedChanges } from "./UnsavedChangesProvider";

export default function HomepageWidgetForm({ widget, onApply, onCancel }) {
  const [values, setValues] = useState({ title: widget.title || "", content: widget.content || "", imageUrl: widget.imageUrl || "", caption: widget.caption || "", linkUrl: widget.linkUrl || "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useUnsavedChanges(busy || Object.entries(values).some(([key, value]) => value !== (widget[key] || "")));
  function change(key, value) { setValues((previous) => ({ ...previous, [key]: value })); setError(""); }
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    try { onApply(widget.type === "IMAGE" ? cleanImageWidget(values) : { title: values.title.trim(), content: values.content }); }
    catch (cause) { setError(cause.message); }
  }
  return <form onSubmit={submit} noValidate className="mt-5 space-y-5">
    <FormField label="Tiêu đề tiện ích (Không bắt buộc)" placeholder={widget.type === "IMAGE" ? "VD: Poster giải đấu, Nhà tài trợ, Giải thưởng..." : "VD: Tổng quan, Lịch trình, Cơ cấu giải thưởng..."} value={values.title} onChange={(event) => change("title", event.target.value)} />
    {widget.type === "MARKDOWN" ? <MarkdownEditorBox label="Nội dung (Hỗ trợ Markdown)" value={values.content} onChange={(value) => change("content", value)} />
      : <><ImageUploadField label="Nguồn hình ảnh" kind="content" value={safeWebUrl(values.imageUrl, { image: true })} onChange={(value) => change("imageUrl", value)} onBusyChange={setBusy} />
        <FormField label="Hoặc URL hình ảnh" type="url" placeholder="https://example.com/banner.png" value={values.imageUrl.startsWith("data:") ? "" : values.imageUrl} onChange={(event) => change("imageUrl", event.target.value)} />
        <FormField label="Chú thích ảnh (Không bắt buộc)" placeholder="Mô tả ngắn bên dưới hình ảnh..." value={values.caption} onChange={(event) => change("caption", event.target.value)} />
        <FormField label="Liên kết khi nhấn vào ảnh (Không bắt buộc)" type="url" placeholder="https://..." value={values.linkUrl} onChange={(event) => change("linkUrl", event.target.value)} /></>}
    <FormMessage error={error} />
    <div className="sticky -bottom-6 -mx-6 flex flex-wrap justify-end gap-3 border-t border-dp-hairline bg-dp-panel px-6 py-4"><Button size="sm" variant="outline" onClick={onCancel}>Hủy</Button><Button size="sm" type="submit" disabled={busy}>Áp dụng</Button></div>
  </form>;
}
