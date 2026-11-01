import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function FormField({ label, hint, children, id: providedId, ...props }) {
  const generatedId = useId();
  const id = providedId || generatedId;
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-dp-read">{label}{props.required && <span className="ml-1 text-dp-live">*</span>}</label>
    {children ? children(id) : <Input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />}
    {hint && <p id={`${id}-hint`} className="text-xs leading-5 text-dp-meta">{hint}</p>}
  </div>;
}

export function PasswordField({ label = "Mật khẩu", ...props }) {
  const [visible, setVisible] = useState(false);
  return <FormField label={label} required={props.required}>{(id) => <div className="relative">
    <Input id={id} type={visible ? "text" : "password"} className="pr-12" {...props} />
    <button type="button" aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`} aria-pressed={visible}
      onClick={() => setVisible((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-dp-meta hover:text-dp-bright">
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  </div>}</FormField>;
}

export function CheckboxField({ children, ...props }) {
  return <label className="flex items-start gap-2.5 text-xs leading-5 text-dp-read"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-dp-live" {...props} /><span>{children}</span></label>;
}
