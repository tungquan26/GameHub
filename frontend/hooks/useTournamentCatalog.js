import { useEffect, useMemo, useState } from "react";
import { useTourney } from "@/context/TourneyContext";
import { buildCatalog } from "@/lib/tournaments";
import useTournamentData from "./useTournamentData";

export default function useTournamentCatalog() {
  const { tournaments, currentUser } = useTourney();
  const { refreshTournaments, apiStatus } = useTournamentData();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const catalog = useMemo(() => buildCatalog(tournaments, currentUser), [tournaments, currentUser]);
  return { catalog, apiStatus, refreshTournaments, now };
}
