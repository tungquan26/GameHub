import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;

export function DialogContent({ children, className, ...props }) {
  return <Primitive.Portal>
    <Primitive.Overlay className="fixed inset-0 z-50 bg-dp-ground/80" />
    <Primitive.Content className={cn("dp-panel fixed top-1/2 left-1/2 z-60 max-h-[calc(100dvh_-_32px)] w-[calc(100%_-_32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 shadow-2xl outline-none", className)} {...props}>
      {children}
      <Primitive.Close asChild><Button size="icon" variant="ghost" className="absolute top-2 right-2" aria-label="Đóng hộp thoại"><X /></Button></Primitive.Close>
    </Primitive.Content>
  </Primitive.Portal>;
}
