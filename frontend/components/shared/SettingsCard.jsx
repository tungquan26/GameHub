import { useId, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "./UnsavedChangesProvider";

export default function SettingsCard({
  title, subtitle, children, onSave, isDirty = false, isSaving = false, saveDisabled = false,
  saveLabel = "Lưu thay đổi", headerRight = null, className, noValidate = false, id,
}) {
  const titleId = useId();
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = isSaving || pending;
  useUnsavedChanges(isDirty || busy);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isDirty || busy || saveDisabled || saving.current || !onSave) return;
    saving.current = true;
    setPending(true);
    setError("");
    try { await onSave(); }
    catch (cause) { setError(cause?.message || "Không thể lưu thay đổi. Vui lòng thử lại."); }
    finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <Card id={id} aria-labelledby={titleId} className={cn("mb-6", className)}>
      <form onSubmit={handleSubmit} aria-busy={busy} noValidate={noValidate}>
        <CardHeader>
          <div>
            <h2 id={titleId} className="text-base font-semibold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-dp-read">{subtitle}</p>}
          </div>
          {headerRight}
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
        {onSave && (
          <CardFooter className="items-center gap-4">
            {error && <p role="alert" className="mr-auto text-sm text-red-400">{error}</p>}
            <Button type="submit" size="sm" disabled={!isDirty || busy || saveDisabled}>
              {busy && <LoaderCircle aria-hidden="true" className="animate-spin" />}
              {busy ? "Đang lưu…" : saveLabel}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
