import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMatchTime } from "@/lib/bracket";
import { cn } from "@/lib/utils";
import MatchStatus, { matchAction } from "./MatchStatus";

function TeamSlot({ team, score, winner, completed }) {
  const won = Boolean(team && winner && String(team.id) === String(winner.id));
  return <div className={cn("flex min-h-11 items-center justify-between gap-3 px-3 py-2", won && "bg-dp-live/5", completed && !won && "opacity-50")}>
    <span className={cn("min-w-0 break-words text-xs leading-5", won ? "font-medium text-dp-live" : team ? "text-dp-bright" : "text-dp-meta")}>{team?.name || "TBD"}</span>
    <span className="shrink-0 font-mono text-sm tabular-nums">{score}</span>
  </div>;
}
export default function BracketTree({ bracket, canEdit = false, onEdit }) {
  const firstRoundCount = bracket.rounds[0].matches.length;
  return <div role="region" aria-label="Sơ đồ nhánh đấu" tabIndex={0} className="overflow-x-auto rounded-panel border border-dp-hairline bg-dp-ground p-5 pb-8">
    <div className="flex w-max gap-8 lg:gap-12">{bracket.rounds.map((round, roundIndex) => <section key={round.roundId} aria-label={round.name} className="w-[268px] shrink-0">
      <div className="mb-5 flex items-center justify-between border-b border-dp-hairline pb-3"><h3 className="text-sm font-semibold">{round.name}</h3><span className="font-mono text-[10px] text-dp-meta">{round.matches.length} cặp trận</span></div>
      <div className="grid" style={{ gridTemplateRows: `repeat(${firstRoundCount}, 252px)` }}>{round.matches.map((match) => {
        const completed = match.status === "COMPLETED" && Boolean(match.result);
        const winner = completed ? match.result.winner : null;
        const hasBoth = match.teamA && match.teamB;
        return <div key={match.matchId} className="relative flex items-center" style={{ gridRow: `span ${2 ** roundIndex}` }}>
          {roundIndex > 0 && <span aria-hidden="true" className="absolute -left-8 w-8 border-t border-dp-hairline-2 lg:-left-12 lg:w-12" />}
          {roundIndex < bracket.rounds.length - 1 && <span aria-hidden="true" className="absolute top-1/2 left-full border-t border-dp-hairline-2" style={{ width: "16px" }} />}
          {roundIndex < bracket.rounds.length - 1 && match.matchOrder % 2 === 0 && <span aria-hidden="true" className="absolute top-1/2 left-[calc(100%_+_16px)] border-r border-dp-hairline-2" style={{ height: `${252 * 2 ** roundIndex}px` }} />}
          <article id={`match-${match.matchId}`} aria-label={`Trận #${match.matchNumber}`} className={cn("relative z-1 w-full scroll-mt-24 overflow-hidden rounded-panel border bg-dp-panel", completed ? "border-dp-hairline-2" : "border-dp-hairline")}>
            <div className="flex items-center justify-between gap-2 border-b border-dp-hairline px-3 py-2.5"><span className="font-mono text-[10px] text-dp-meta">Trận #{match.matchNumber}</span>{winner && <Trophy aria-label="Đã xác định đội thắng" className="size-3 text-dp-live" />}</div>
            <TeamSlot team={match.teamA} score={completed ? match.result.scoreA : hasBoth ? "0" : "–"} winner={winner} completed={completed} />
            <div className="border-t border-dp-hairline"><TeamSlot team={match.teamB} score={completed ? match.result.scoreB : hasBoth ? "0" : "–"} winner={winner} completed={completed} /></div>
            <p className="border-t border-dp-hairline px-3 py-2 font-mono text-[9px] text-dp-meta">{formatMatchTime(match.scheduledTime)}</p>
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t border-dp-hairline px-3 py-2"><MatchStatus match={match} />{canEdit && <Button size="sm" variant="ghost" className="h-7 px-1 text-[10px]" onClick={() => onEdit(match.matchId)}>{matchAction(match)}</Button>}</div>
          </article>
        </div>;
      })}</div>
    </section>)}</div>
  </div>;
}
