import { useOutletContext } from "react-router-dom";
import { Users } from "lucide-react";
import TournamentHomepage from "@/components/shared/TournamentHomepage";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import TournamentLoadState from "@/components/shared/TournamentLoadState";
import TournamentStandings from "@/components/shared/TournamentStandings";
import EmptyState from "@/components/shared/EmptyState";
import { normalizeParticipants } from "@/lib/tournament-settings";

export default function PublicViewPage() {
  const { tournament, section, status, retry } = useOutletContext();
  if (!tournament) return <><h1 className="mb-7 text-2xl font-semibold uppercase">Xem giải đấu công khai</h1><TournamentLoadState status={status} retry={retry} /></>;
  if (section === "standings") return <TournamentStandings key={tournament.id} tournamentId={tournament.id} />;
  if (section === "teams") {
    const teams = normalizeParticipants(tournament.tournamentTeams);
    return <section aria-labelledby="public-teams-title"><h2 id="public-teams-title" className="mb-5 text-xl font-semibold">Đội tuyển <span className="ml-2 font-mono text-sm text-dp-meta">{teams.length}</span></h2>
      {teams.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team) => <article key={team.id} className="dp-panel min-w-0 p-5"><div className="mb-3 flex items-start gap-3"><Users aria-hidden="true" className="mt-1 size-4 shrink-0 text-dp-live" /><h3 className="font-semibold break-words">{team.name}</h3></div>{team.members.length ? <ul className="space-y-2 text-xs leading-6 text-dp-read">{team.members.map((member, index) => <li key={index} className="break-words">{member}</li>)}</ul> : <p className="text-xs text-dp-meta">Chưa cập nhật thành viên.</p>}</article>)}</div>
        : <EmptyState title="Chưa có đội tuyển" description="Danh sách đội tuyển sẽ xuất hiện khi ban tổ chức cập nhật." />}
    </section>;
  }
  if (section === "rules") return <section aria-labelledby="public-rules-title"><h2 id="public-rules-title" className="mb-5 text-xl font-semibold">Thể lệ giải đấu</h2>{tournament.rules?.trim() ? <div className="dp-panel p-5 sm:p-7"><MarkdownRenderer value={tournament.rules} /></div> : <EmptyState title="Chưa có thể lệ" description="Ban tổ chức chưa công bố thể lệ giải đấu." />}</section>;
  return <section aria-labelledby="public-overview-title"><h2 id="public-overview-title" className="mb-5 text-xl font-semibold">Tổng quan</h2><TournamentHomepage key={tournament.id} entry={tournament} /></section>;
}
