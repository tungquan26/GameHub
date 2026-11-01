import { Link, useSearchParams } from "react-router-dom";
import { useTourney } from "@/context/TourneyContext";
import { Button } from "@/components/ui/button";
import EmptyState from "./EmptyState";
import { isOwnTournament } from "@/lib/tournaments";

export default function TournamentEditorPage({ title, children }) {
  const { activeTournament, currentUser } = useTourney();
  const [params] = useSearchParams();
  const requestedId = params.get("id");
  const available = params.get("sample") !== "1" && activeTournament && (!requestedId || String(activeTournament.id) === requestedId);
  return <div>
    <h1 className="mb-7 text-2xl font-semibold tracking-tight uppercase sm:text-3xl">{title}</h1>
    {available && isOwnTournament(activeTournament, currentUser) ? children(activeTournament) : <EmptyState title={available ? "Giải đấu chỉ được xem" : requestedId ? "Không tìm thấy giải đấu được yêu cầu" : "Chưa chọn giải đấu"}
      description="Chọn giải đấu đang quản lý hoặc tạo giải mới để tiếp tục cấu hình.">
      <div className="flex flex-wrap justify-center gap-3"><Button asChild size="sm"><Link to="/create">Tạo giải đấu</Link></Button><Button asChild variant="outline" size="sm"><Link to="/events">Giải đấu của tôi</Link></Button></div>
    </EmptyState>}
  </div>;
}
