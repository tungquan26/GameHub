import { TournamentCardHorizontal } from "./TournamentCard";
import { normalizeTournament, uniqueTournaments } from "@/lib/tournaments";
import { useHistoryViewState } from "./NavigationExperience";

export default function TournamentArchive({ title, description, items }) {
  const [open, setOpen] = useHistoryViewState(`archive:${title}`, false);
  if (!items.length) return null;
  return <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mt-8 rounded-panel border border-dp-hairline bg-dp-panel p-5">
    <summary className="cursor-pointer text-sm font-medium">{title}</summary>
    {description && <p className="mt-3 text-xs leading-6 text-dp-meta">{description}</p>}
    {open && <div className="mt-5 space-y-4">{uniqueTournaments(items).map((entry, index) => <TournamentCardHorizontal key={`${entry.sample ? "sample" : "tournament"}:${entry.id ?? index}`} tournament={normalizeTournament(entry)} />)}</div>}
  </details>;
}
