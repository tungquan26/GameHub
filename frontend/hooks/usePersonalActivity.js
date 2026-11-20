import { useMemo } from "react";
import { useTourney } from "@/context/TourneyContext";
import { buildPersonalActivity } from "@/lib/personal-activity";
import { userKey } from "@/lib/identity";
import useTournamentData from "./useTournamentData";

export default function usePersonalActivity({ loadTournaments = true } = {}) {
  const { currentUser, tournaments, registeredTournaments, teams } = useTourney();
  const data = useTournamentData(loadTournaments && Boolean(userKey(currentUser)));
  const activity = useMemo(() => buildPersonalActivity({ tournaments, registeredTournaments, teams }, currentUser), [currentUser, tournaments, registeredTournaments, teams]);
  return { ...activity, ...data };
}
