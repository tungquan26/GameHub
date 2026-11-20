import { Search, X } from "lucide-react";
import { Input, NativeSelect } from "@/components/ui/input";
import { useTourney } from "@/context/TourneyContext";
import { gameLabel } from "@/lib/games";

export function SearchInput({ value, onChange, label = "Tìm kiếm giải đấu", placeholder = "Tìm kiếm giải đấu...", large = false }) {
  return <div className="relative min-w-0 flex-1">
    <Search aria-hidden="true" className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dp-meta" />
    <Input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)}
      className={`pr-11 pl-10 ${large ? "h-14 text-base" : ""}`} />
    {value && <button type="button" aria-label="Xóa từ khóa" onClick={() => onChange("")} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-dp-meta"><X className="size-4" /></button>}
  </div>;
}
export function GameSelect({ value, onChange, label = "Lọc tựa game" }) {
  const { games } = useTourney();
  return <NativeSelect aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full sm:w-60">
    <option value="">Tất cả tựa game</option>
    {games.map((game) => <option key={game.gameId} value={game.name}>{gameLabel(game.name)}</option>)}
  </NativeSelect>;
}
