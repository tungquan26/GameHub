import { useEffect, useMemo, useState } from "react";
import { useTourney } from "@/context/TourneyContext";
import { buildPersonalActivity } from "@/lib/personal-activity";
import { userKey } from "@/lib/identity";
import useTournamentData from "./useTournamentData";

export default function usePersonalActivity({ loadTournaments = true } = {}) {
  const { currentUser, tournaments, registeredTournaments, teams, brackets, publicTournament } = useTourney();
  const [now, setNow] = useState(() => new Date());
  const data = useTournamentData(loadTournaments && Boolean(userKey(currentUser)));
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const activity = useMemo(() => ({ ...buildPersonalActivity({ tournaments, registeredTournaments, teams, brackets, publicTournament }, currentUser, now), now }), [currentUser, tournaments, registeredTournaments, teams, brackets, publicTournament, now]);
  return { ...activity, ...data };
}
