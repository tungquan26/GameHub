import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <section className={cn("dp-panel overflow-hidden", className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-dp-hairline px-6 py-5", className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}
export function CardFooter({ className, ...props }) {
  return <div className={cn("flex justify-end border-t border-dp-hairline bg-dp-ground/60 px-6 py-4", className)} {...props} />;
}
