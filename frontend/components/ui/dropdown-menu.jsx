import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuLabel = DropdownMenuPrimitive.Label;
export const DropdownMenuSeparator = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-dp-hairline", className)} {...props} />
);
export function DropdownMenuContent({ className, sideOffset = 12, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn("dp-panel z-60 min-w-56 p-1.5 shadow-2xl outline-none", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}
export function DropdownMenuItem({ className, ...props }) {
  return <DropdownMenuPrimitive.Item className={cn("flex cursor-pointer items-center gap-2.5 rounded-panel px-3 py-2.5 text-sm text-dp-read outline-none focus:bg-dp-bright/5 focus:text-dp-bright [&_svg]:size-4", className)} {...props} />;
}
