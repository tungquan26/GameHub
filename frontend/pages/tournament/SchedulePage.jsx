import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import BracketTree from "@/components/shared/BracketTree";
import MatchEditorDialog from "@/components/shared/MatchEditorDialog";
import MatchStatus, { matchAction } from "@/components/shared/MatchStatus";
import EmptyState from "@/components/shared/EmptyState";
import TournamentLoadState from "@/components/shared/TournamentLoadState";
import { useTourney } from "@/context/TourneyContext";
import { allMatches, bracketStats, findMatch, formatMatchTime, generateBracket, updateBracketMatch, validBracket } from "@/lib/bracket";
import { tournamentAccess, tournamentKey, tournamentPath } from "@/lib/public-tournament";

function Schedule({ entry, publicView = false }) {
  const { brackets, currentUser, registeredTournaments, saveTournamentBracket } = useTourney();
  const canEdit = !publicView && tournamentAccess(entry, currentUser, registeredTournaments).organizer;
  const key = tournamentKey(entry); const stored = brackets[key];
  const initial = useMemo(() => !validBracket(stored) && canEdit ? generateBracket(entry) : null, [entry, canEdit, stored]);
  const bracket = validBracket(stored) ? stored : initial;
  const [editingId, setEditingId] = useState(null); const [notice, setNotice] = useState("");
  const returnFocus = useRef(null);
  const stats = bracketStats(bracket);
  useEffect(() => { if (canEdit && !validBracket(stored)) saveTournamentBracket(entry, initial); }, [canEdit, stored, entry, initial, saveTournamentBracket]);
  function open(id) { returnFocus.current = document.activeElement; setEditingId(id); }
  function regenerate(size, shuffle) {
    if (!canEdit) return;
    try { saveTournamentBracket(entry, generateBracket(entry, size, shuffle)); setEditingId(null); setNotice(shuffle ? `Đã tạo và bốc thăm nhánh đấu ${size} đội kèm lịch thi đấu mới!` : `Đã chuyển sang nhánh đấu ${size} đội.`); }
    catch (cause) { setNotice(cause.message); }
  }
  function save(values, timeOnly) {
    if (!canEdit) throw new Error("Chỉ ban tổ chức mới có thể cập nhật lịch thi đấu.");
    const updated = updateBracketMatch(bracket, editingId, values, timeOnly);
    saveTournamentBracket(entry, updated); setEditingId(null);
    const match = findMatch(updated, editingId);
    setNotice(timeOnly ? `Đã cập nhật lịch thi đấu cho Trận #${match.matchNumber}.` : `Đã lưu kết quả: ${match.teamA.name} (${match.result.scoreA} - ${match.result.scoreB}) ${match.teamB.name}. Đội "${match.result.winner.name}" đi tiếp!`);
  }
  if (!bracket) return <EmptyState title="Lịch thi đấu chưa được công bố" description="Ban tổ chức chưa lưu lịch thi đấu cho giải này. Hãy quay lại sau để theo dõi các cặp trận." />;
  return <div className="space-y-7">
    {!publicView && <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl leading-8 font-semibold break-words">{entry.name}</h2><p className="mt-2 text-xs text-dp-read">{canEdit ? "Người quản lý giải đấu" : "Chỉ xem lịch đã công bố"}</p></div><Button asChild size="sm" variant="outline"><Link to={tournamentPath("/tournament/view", entry)}>Thông tin giải đấu</Link></Button></div>}
    {publicView && <p className="text-xs leading-6 text-dp-read">Lịch đã công bố · Chỉ xem</p>}
    <div className="dp-panel space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-dp-read">Loại trực tiếp · Quy mô: <span className="font-mono">{bracket.bracketSize}</span> đội</span><p className="font-mono text-[11px] leading-6">Tiến độ: {stats.completed}/{stats.total} trận đã hoàn thành</p></div><div role="progressbar" aria-label="Tiến độ thi đấu" aria-valuemin={0} aria-valuemax={stats.total} aria-valuenow={stats.completed} className="h-1.5 overflow-hidden rounded-pill bg-dp-hairline"><div className="h-full rounded-pill bg-dp-live" style={{ width: `${stats.completed / stats.total * 100}%` }} /></div></div>
    {canEdit && <div className="flex flex-wrap gap-3"><NativeSelect aria-label="Quy mô nhánh đấu" value={bracket.bracketSize} onChange={(event) => regenerate(Number(event.target.value), false)} className="w-full sm:w-48"><option value={4}>Nhánh 4 đội</option><option value={8}>Nhánh 8 đội</option></NativeSelect><Button variant="outline" onClick={() => regenerate(bracket.bracketSize, true)}><RotateCcw />Bốc thăm lại nhánh đấu</Button></div>}
    {notice && <p role="status" className="text-xs leading-7 text-dp-live">{notice}</p>}
    {stats.champion && <div role="status" className="flex items-center gap-5 rounded-panel border border-dp-live/40 bg-dp-live/5 p-6"><Trophy aria-hidden="true" className="size-9 shrink-0 text-dp-live" /><div><p className="mb-2 font-mono text-[10px] tracking-widest text-dp-live">NHÀ VÔ ĐỊCH</p><h2 className="text-xl font-semibold break-words">{stats.champion.name}</h2></div></div>}
    <div><h2 className="mb-3 text-lg font-semibold">Sơ đồ nhánh đấu</h2><p className="mb-4 text-xs leading-7 text-dp-read">{canEdit ? 'Bấm "Nhập kết quả" trên từng cặp trận để điền tỉ số hoặc đổi giờ thi đấu. Đội thắng sẽ tự động vào vòng tiếp theo.' : "Theo dõi sơ đồ nhánh đấu, thời gian thi đấu các cặp trận và kết quả từng vòng."}</p>
      <BracketTree bracket={bracket} canEdit={canEdit} onEdit={open} />
    </div>
    <Card><CardHeader><h2 className="text-lg font-semibold">Lịch thi đấu chi tiết</h2></CardHeader><CardContent className="p-0"><div role="region" aria-label="Bảng lịch thi đấu" tabIndex={0} className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
      <thead className="border-b border-dp-hairline text-dp-meta"><tr>{["Trận", "Vòng đấu", "Thời gian", "Cặp đấu / Tỉ số", "Trạng thái", ...(canEdit ? ["Thao tác"] : [])].map((label) => <th key={label} scope="col" className="px-5 py-4 font-medium">{label}</th>)}</tr></thead>
      <tbody>{allMatches(bracket).map((match) => <tr key={match.matchId} className="border-b border-dp-hairline last:border-0"><td className="px-5 py-5 font-mono">#{match.matchNumber}</td><td className="px-5 py-5">{match.roundName}</td><td className="px-5 py-5 font-mono text-[10px] whitespace-nowrap text-dp-read">{formatMatchTime(match.scheduledTime)}</td><td className="min-w-56 px-5 py-5"><div className="space-y-2"><p className="leading-6 break-words">{match.teamA?.name || "TBD"}</p><p className="font-mono text-[10px] text-dp-live">{match.result ? `${match.result.scoreA} – ${match.result.scoreB}` : "VS"}</p><p className="leading-6 break-words">{match.teamB?.name || "TBD"}</p></div></td><td className="px-5 py-5"><MatchStatus match={match} /></td>{canEdit && <td className="px-5 py-5"><Button size="sm" variant="ghost" onClick={() => open(match.matchId)}>{matchAction(match)}</Button></td>}</tr>)}</tbody>
    </table></div></CardContent></Card>
    <MatchEditorDialog match={canEdit ? findMatch(bracket, editingId) : null} bracketId={bracket.bracketId} onSave={save} onClose={() => setEditingId(null)} returnFocus={returnFocus} />
  </div>;
}
export default function SchedulePage() {
  const context = useTourney(); const [params] = useSearchParams();
  const publicResult = useOutletContext();
  const requestedId = params.get("id");
  const publicView = params.get("view") === "public";
  const entry = publicView ? publicResult?.tournament
    : params.get("sample") !== "1" && context.activeTournament && (!requestedId || String(context.activeTournament.id) === requestedId) ? context.activeTournament : null;
  const Heading = publicView && entry ? "h2" : "h1";
  return <div><Heading className="mb-7 text-2xl font-semibold tracking-tight sm:text-3xl">Lịch thi đấu</Heading>{entry ? <Schedule key={`${tournamentKey(entry)}:${publicView}`} entry={entry} publicView={publicView} /> : publicView ? <TournamentLoadState {...publicResult} /> : <EmptyState title="Không tìm thấy giải đấu" description="Chọn giải đấu đang quản lý hoặc mở lịch từ trang thông tin giải đấu." />}</div>;
}
