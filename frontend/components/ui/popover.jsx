import * as Primitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export function PopoverContent({ className, align = "start", sideOffset = 10, ...props }) {
  return <Primitive.Portal><Primitive.Content align={align} sideOffset={sideOffset} collisionPadding={16}
    className={cn("dp-panel z-50 flex max-h-[min(var(--radix-popover-content-available-height),calc(100dvh_-_32px))] w-[min(360px,calc(100vw_-_32px))] flex-col overflow-hidden shadow-2xl outline-none", className)} {...props} /></Primitive.Portal>;
}
