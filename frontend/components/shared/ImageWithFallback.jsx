import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveGameArtwork } from "@/lib/games";

export default function ImageWithFallback({ src, alt = "", className, ...props }) {
  const [failed, setFailed] = useState(null);
  const source = resolveGameArtwork(src);
  return source && failed !== src ? <img src={source} alt={alt} className={className} onError={() => setFailed(src)} {...props} />
    : <span role={alt ? "img" : undefined} aria-label={alt || undefined} className={cn("flex items-center justify-center bg-dp-ground text-dp-meta", className)}><ImageOff aria-hidden="true" className="size-6" /></span>;
}
