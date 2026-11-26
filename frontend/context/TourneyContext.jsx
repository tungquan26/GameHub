import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { gameApi, request, tournamentApi } from "@/lib/api";
import { tournamentKey } from "@/lib/public-tournament";
import { userCodeFor } from "@/lib/profile";

const TourneyContext = createContext(null);
const sessionKey = "gamehub_session_user";
const path = id => "/api/website/tournaments/" + encodeURIComponent(id);
const displayProfile = p => ({ ...p, tagName: p.tagName || p.username, userCode: userCodeFor(p.username) });

export function TourneyProvider({ children }) {
  const [currentUser, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [games, setGames] = useState([]);
  const [gameError, setGameError] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState(null);
  const [activeTournamentId, select] = useState(() => sessionStorage.getItem("gamehub_active"));
  const [publicTournament, setPublicTournament] = useState(null);
  const [apiStatus, setApiStatus] = useState("idle");
  const [apiError, setApiError] = useState("");
  const generation = useRef(0);
  const selectTournament = useCallback(id => {
    sessionStorage.setItem("gamehub_active", String(id));
    select(id);
  }, []);
  const refreshTournaments = useCallback(async () => {
    const current = ++generation.current;
    setApiStatus("loading");
    try {
      const result = await tournamentApi.list();
      if (current === generation.current) {
        setTournaments(result); setApiError(""); setApiStatus("success");
      }
      return result;
    } catch (error) {
      if (current === generation.current) { setApiError(error.message); setApiStatus("error"); }
      throw error;
    }
  }, []);
  const initializeCommunity = useCallback(async () => {
    try { setTeams(await request("/api/website/teams")); }
    catch (error) { setApiError(error.message); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    gameApi.list({ signal: controller.signal }).then((rows) => {
      if (!Array.isArray(rows)) throw new Error("Danh mục game trả về không hợp lệ.");
      if (!controller.signal.aborted) setGames(rows);
    }).catch((error) => {
      if (!controller.signal.aborted) setGameError(error.message);
    });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let active = true;
    async function restore() {
      const id = sessionStorage.getItem(sessionKey);
      localStorage.removeItem(sessionKey);
      if (id) {
        try {
          const p = await request("/api/website/profile");
          if (active && String(p.id) === id) setUser(displayProfile(p));
        } catch (error) { if (active && error.status !== 401) setApiError(error.message); }
      }
      if (active) { setReady(true); refreshTournaments().catch(() => {}); initializeCommunity(); }
    }
    restore();
    return () => { active = false; };
  }, [refreshTournaments, initializeCommunity]);
  const setProfile = async (login) => {
    const p = await request("/api/website/profile");
    if (String(p.id) !== String(login.id)) throw new Error("Phiên đăng nhập đã thay đổi.");
    sessionStorage.setItem(sessionKey,String(p.id));
    setUser(displayProfile(p));
    await Promise.all([refreshTournaments(),initializeCommunity()]);
  };
  const clearProfile = useCallback(async () => {
    await request("/api/users/logout",{method:"POST"});
    sessionStorage.removeItem(sessionKey); localStorage.removeItem(sessionKey);
    setUser(null); setPublicTournament(null); setTeams(null);
    await Promise.all([refreshTournaments(),initializeCommunity()]);
  }, [refreshTournaments,initializeCommunity]);
  const updateProfile = async patch => {
    const p = await request("/api/website/profile",{method:"PATCH",body:patch});
    setUser(displayProfile(p)); await initializeCommunity();
  };
  function upsert(entry) {
    ++generation.current;
    setApiStatus("success");
    setTournaments(items => [entry,...items.filter(t => t.id !== entry.id)]);
    setPublicTournament(old => old && old.id === entry.id ? entry : old);
    return entry;
  }
  async function createTournament(values) {
    const t = upsert(await request("/api/website/tournaments",{method:"POST",body:values}));
    selectTournament(t.id); return t;
  }
  async function updateTournament(id,patch) {
    return upsert(await request(path(id),{method:"PATCH",body:patch}));
  }
  async function revokeTournamentTeam(id, entrantId) {
    return upsert(await request(path(id) + "/participants/" + entrantId, { method: "DELETE" }));
  }
  async function register(entry, teamId) {
    return upsert(await request(path(entry.id) + "/registration", { method: "PUT", body: { teamId } }));
  }
  async function cancelRegistration(entry, teamId) {
    return upsert(await request(path(entry.id) + "/registration?" + new URLSearchParams({ teamId }), { method: "DELETE" }));
  }
  const pendingInitialBrackets = useRef(new Map());
  const saveTournamentBracket = useCallback(async (entry,bracket) => {
    const query = entry.bracket ? "?previousId="+entry.bracket.bracketId+"&previousRevision="+entry.bracket.revision : "";
    if (!entry.bracket && pendingInitialBrackets.current.has(entry.id)) return pendingInitialBrackets.current.get(entry.id);
    const write = request(path(entry.id)+"/bracket"+query,{method:"PUT",body:bracket});
    if (!entry.bracket) pendingInitialBrackets.current.set(entry.id,write);
    let saved;
    try { saved = await write; }
    finally { if (!entry.bracket) pendingInitialBrackets.current.delete(entry.id); }
    setTournaments(items => items.map(t => t.id===entry.id ? {...t,bracket:saved} : t));
    return saved;
  }, []);
  const brackets = useMemo(() => Object.fromEntries(tournaments.filter(t=>t.bracket).map(t=>[tournamentKey(t),t.bracket])),[tournaments]);
  const value = {
    currentUser,games,gameError,tournaments,teams,activeTournamentId,publicTournament,brackets,apiStatus,apiError,storageError:"",
    activeTournament:tournaments.find(t=>String(t.id)===String(activeTournamentId)),
    registeredTournaments:tournaments.filter(t=>currentUser && t.registrantId===currentUser.id),
    refreshTournaments,initializeCommunity,updateProfile,setProfile,clearProfile,selectTournament,setPublicTournament,
    createTournament,updateTournament,revokeTournamentTeam,saveTournamentBracket,
    registerTournament: register, cancelTournamentRegistration: cancelRegistration,
    openTournamentManager:entry=>{ selectTournament(entry.id); return entry; },
    performTeamAction:async action=>setTeams(await request("/api/website/teams",{method:"POST",body:action})),
  };
  return <TourneyContext.Provider value={value}>{ready ? children : null}</TourneyContext.Provider>;
}

export function useTourney() {
  const context = useContext(TourneyContext);
  if (!context) throw new Error("Thiếu TourneyProvider.");
  return context;
}
