import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "dp-button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-semibold disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-dp-live text-dp-inverse",
        outline: "border border-dp-hairline-2 bg-dp-panel text-dp-bright",
        ghost: "text-dp-read",
        destructive: "bg-red-400 text-black hover:bg-red-300",
      },
      size: { default: "h-10 px-5", sm: "h-8 px-4 text-xs", icon: "size-10 p-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, asChild = false, type = "button", ...props }) {
  const Component = asChild ? Slot : "button";
  return <Component {...(!asChild && { type })} data-variant={variant || "default"} data-size={size || "default"} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
