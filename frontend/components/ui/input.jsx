import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return <input className={cn("dp-input h-11 w-full min-w-0 px-3 text-base placeholder:text-dp-meta disabled:opacity-50", className)} {...props} />;
}
export function Textarea({ className, ...props }) {
  return <textarea className={cn("dp-input min-h-24 w-full resize-y px-3 py-3 text-base placeholder:text-dp-meta", className)} {...props} />;
}
export function NativeSelect({ className, ...props }) {
  return <select className={cn("dp-input h-11 w-full min-w-0 px-3 text-base", className)} {...props} />;
}
