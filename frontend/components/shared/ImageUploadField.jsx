import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imageWarning, readImageFile } from "@/lib/images";
import { cn } from "@/lib/utils";

export default function ImageUploadField({ label, value, onChange, kind = "profile", onBusyChange }) {
  const id = useId();
  const fileInput = useRef(null);
  const active = useRef(null);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  useEffect(() => () => { generation.current++; active.current?.abort(); }, []);
  function reportBusy(next) { setBusy(next); onBusyChange?.(next); }
  async function choose(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    const request = ++generation.current;
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setError(""); setWarning(""); reportBusy(true);
    try {
      const image = await readImageFile(file, controller.signal);
      if (request !== generation.current) return;
      onChange(image.dataUrl);
      setWarning(imageWarning(kind, image.width, image.height));
    } catch (cause) {
      if (request === generation.current && cause.name !== "AbortError") setError(cause.message);
    } finally { if (request === generation.current) reportBusy(false); }
  }
  function remove() {
    generation.current++; active.current?.abort(); reportBusy(false);
    setError(""); setWarning(""); onChange("");
  }
  return <fieldset className="min-w-0 space-y-3">
    <legend className="mb-3 text-sm font-medium">{label}</legend>
    <input id={id} ref={fileInput} type="file" className="sr-only" aria-label={`Tải ${label.toLowerCase()}`} accept="image/png,image/jpeg,image/webp,image/gif" onChange={choose} />
    <div className={cn("flex min-h-40 items-center justify-center overflow-hidden rounded-panel border border-dashed border-dp-hairline-2 bg-dp-ground", kind === "banner" ? "aspect-[2/1]" : "aspect-square max-h-64")}>
      {value ? <img src={value} alt={`Xem trước ${label.toLowerCase()}`} className={cn("size-full", kind === "banner" ? "object-cover" : "object-contain")} /> : <ImagePlus aria-hidden="true" className="size-7 text-dp-meta" />}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? <LoaderCircle className="animate-spin" /> : <Upload />}{busy ? "Đang đọc ảnh…" : "Tải ảnh lên"}</Button>
      {value && <Button variant="ghost" size="sm" className="text-red-400" onClick={remove}><Trash2 />Xóa ảnh</Button>}
    </div>
    <p className="text-xs leading-6 text-dp-meta">{kind === "content" ? "PNG, JPG, WEBP hoặc GIF." : kind === "banner" ? "Khuyến nghị ảnh ngang kích thước từ 1600x800 đến 4800x2400." : "Khuyến nghị ảnh vuông kích thước từ 280x280 đến 4800x4800."} Dung lượng tối đa: 4MB.</p>
    {error && <p role="alert" className="text-xs leading-6 text-red-400">{error}</p>}
    {warning && <p role="status" className="text-xs leading-6 text-dp-read">{warning}</p>}
  </fieldset>;
}
