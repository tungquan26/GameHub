import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTourney } from "@/context/TourneyContext";
import { resolvePublicTournament, tournamentAccess } from "@/lib/public-tournament";
import { tournamentApi } from "@/lib/api";

export default function useTournamentView() {
  const context = useTourney();
  const [params] = useSearchParams();
  const [now, setNow] = useState(() => new Date());
  const requestedId = params.get("id");
  const sample = params.get("sample") === "1";
  const [remote, setRemote] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  const resolved = resolvePublicTournament(context, params);
  const needsRequest = Boolean(requestedId && !sample && !resolved);
  useEffect(() => {
    if (!needsRequest) return;
    const controller = new AbortController();
    setRemote({ id: requestedId, status: "loading" });
    tournamentApi.get(requestedId, { signal: controller.signal }).then((entry) => {
      if (controller.signal.aborted) return;
      if (!entry || Array.isArray(entry) || String(entry.id ?? entry.tournamentId) !== requestedId) {
        setRemote({ id: requestedId, status: "not-found" }); return;
      }
      setRemote({ id: requestedId, status: "success", tournament: { ...entry, id: entry.id ?? entry.tournamentId } });
    }).catch((error) => {
      if (!controller.signal.aborted) setRemote({ id: requestedId, status: error.status === 404 ? "not-found" : "error" });
    });
    return () => controller.abort();
  }, [requestedId, needsRequest, attempt]);
  const result = needsRequest && remote?.id === requestedId ? remote : null;
  const tournament = resolved || result?.tournament || null;
  useEffect(() => {
    const boundaries = [tournament?.regSettings?.registrationStartDate, tournament?.regSettings?.registrationEndDate]
      .map((value) => Date.parse(value)).filter((value) => Number.isFinite(value) && value > now.getTime());
    if (!boundaries.length) return;
    const timer = setTimeout(() => setNow(new Date()), Math.min(2147483647, Math.max(1, Math.min(...boundaries) - Date.now())));
    return () => clearTimeout(timer);
  }, [tournament?.regSettings?.registrationStartDate, tournament?.regSettings?.registrationEndDate, now]);
  const access = tournament ? tournamentAccess(tournament, context.currentUser, context.registeredTournaments, now) : null;
  return { tournament, access, publicView: params.get("view") === "public", status: needsRequest ? result?.status || "loading" : tournament ? "success" : "not-found", retry: () => setAttempt((value) => value + 1) };
}
