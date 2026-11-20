import { SlidersHorizontal } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { canonicalGame, gameLabel } from "@/lib/games";
import { DATE_FILTERS, EMPTY_FILTERS, STATUS_FILTERS } from "@/lib/tournaments";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormField } from "./FormField";

export default function TournamentFilters({ value, onChange }) {
  const { games, gameError } = useTourney();
  const count = [value.statuses, value.games, value.dateRanges].filter((group) => group.length > 0).length;
  const invalidDates = value.dateRanges.includes("custom") && value.from && value.to && value.from > value.to;
  function toggle(group, item) { onChange({ ...value, [group]: value[group].includes(item) ? value[group].filter((entry) => entry !== item) : [...value[group], item] }); }
  return <Popover>
    <PopoverTrigger asChild><Button variant="outline" size="sm"><SlidersHorizontal />{count ? `Bộ lọc (${count})` : "Bộ lọc"}</Button></PopoverTrigger>
    <PopoverContent aria-label="Bộ lọc giải đấu">
      <div className="max-h-[min(65vh,560px)] min-h-0 space-y-5 overflow-y-auto p-5">
        <fieldset className="space-y-3"><legend className="mb-4 font-mono text-[11px] tracking-wide text-dp-meta">TRẠNG THÁI GIẢI ĐẤU</legend>
          {STATUS_FILTERS.map((option) => <CheckboxField key={option.value} checked={value.statuses.includes(option.value)} onChange={() => toggle("statuses", option.value)}>{option.label}</CheckboxField>)}
        </fieldset>
        <fieldset className="space-y-3 border-t border-dp-hairline pt-5"><legend className="mb-4 font-mono text-[11px] tracking-wide text-dp-meta">TỰA GAME</legend>
          <div className="max-h-44 space-y-3 overflow-y-auto pr-2">
            {gameError && <p role="alert" className="text-xs text-red-400">Không thể tải danh mục game.</p>}
            {games.map((game) => {
              const name = canonicalGame(game.name);
              return <CheckboxField key={game.gameId} checked={value.games.includes(name)} onChange={() => toggle("games", name)}>{gameLabel(game.name)}</CheckboxField>;
            })}
          </div>
        </fieldset>
        <fieldset className="space-y-3 border-t border-dp-hairline pt-5"><legend className="mb-4 font-mono text-[11px] tracking-wide text-dp-meta">NGÀY BẮT ĐẦU</legend>
          {DATE_FILTERS.map((option) => <CheckboxField key={option.value} checked={value.dateRanges.includes(option.value)} onChange={() => toggle("dateRanges", option.value)}>{option.label}</CheckboxField>)}
          {value.dateRanges.includes("custom") && <div className="grid grid-cols-2 gap-3 pt-2">
            <FormField label="Từ ngày" type="date" className="font-mono text-xs" value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} />
            <FormField label="Đến ngày" type="date" className="font-mono text-xs" value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} />
          </div>}
          {invalidDates && <p role="alert" className="text-xs text-red-400">Đến ngày phải bằng hoặc sau Từ ngày.</p>}
        </fieldset>
      </div>
      <div className="flex shrink-0 justify-between border-t border-dp-hairline p-4">
        <Button size="sm" variant="ghost" onClick={() => onChange({ ...EMPTY_FILTERS })}>Xóa</Button>
        <PopoverClose asChild><Button size="sm" disabled={Boolean(invalidDates)}>Áp dụng</Button></PopoverClose>
      </div>
    </PopoverContent>
  </Popover>;
}
