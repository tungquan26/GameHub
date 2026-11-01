import { Trophy } from "lucide-react";
import { gameForArtwork, getGame } from "@/lib/games";
import { resolveTournamentImage } from "@/lib/tournaments";
import { cn } from "@/lib/utils";
import ImageWithFallback from "./ImageWithFallback";

export default function GameArtwork({ game, alt, className, loading = "lazy" }) {
  const item = getGame(game);
  return <div className={cn("relative isolate overflow-hidden bg-dp-ground", className)}>
    {item ? <><img src={item.image} alt="" aria-hidden="true" draggable={false} loading={loading} className="absolute inset-0 size-full scale-110 object-cover opacity-25 blur-lg" />
      <img src={item.image} alt={alt ?? item.name} draggable={false} loading={loading} decoding="async" className="relative z-1 size-full object-cover" /></>
      : <span className="flex size-full items-center justify-center text-dp-meta"><Trophy aria-hidden="true" className="size-6" /></span>}
  </div>;
}
// Tách ảnh poster game khỏi ảnh banner tùy chỉnh để poster không bị cắt logo khi đặt ngang.
export function TournamentCover({ src, game, alt = "", className, loading = "lazy" }) {
  const source = resolveTournamentImage(src, game);
  const artwork = gameForArtwork(source);
  return artwork ? <GameArtwork game={artwork.id} alt={alt} className={className} loading={loading} />
    : <ImageWithFallback src={source} alt={alt} className={cn("object-cover", className)} loading={loading} />;
}
