import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentEditorPage from "@/components/shared/TournamentEditorPage";
import TournamentHero from "@/components/shared/TournamentHero";
import HomepageBuilder from "@/components/shared/HomepageBuilder";
import { tournamentPath } from "@/lib/public-tournament";

export default function HomePage() {
  return <TournamentEditorPage title="Trang chủ giải đấu">{(entry) => <>
    <div className="mb-5 flex justify-end"><Button asChild size="sm" variant="outline"><Link to={tournamentPath("/tournament/view", entry)}><ExternalLink />Xem giải đấu công khai</Link></Button></div>
    <TournamentHero entry={entry} /><HomepageBuilder key={entry.id} entry={entry} />
  </>}</TournamentEditorPage>;
}
