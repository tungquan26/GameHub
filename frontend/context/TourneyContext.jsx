import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { tournamentApi } from "@/lib/api";
import { browserStorage, loadState, LOGIN_SESSION_KEY, mergeTournaments, parseState, profileData, readJson, STORE_KEY } from "@/lib/tourney-store";
import { applyTeamAction, renameTeamMember } from "@/lib/teams";
import { createInitialTeams } from "@/constants/fixtures";
import { isUserRegistration, makeTournament, resolveTournamentImage } from "@/lib/tournaments";
import { applyTournamentPatch, detailsValues, makeParticipant, normalizeParticipants } from "@/lib/tournament-settings";
import { registerForTournament, unregisterFromTournament, sameTournament, tournamentAccess, tournamentKey } from "@/lib/public-tournament";
import { validBracket } from "@/lib/bracket";
import { isOwnTournament } from "@/lib/tournaments";
import { userKey } from "@/lib/identity";

const TourneyContext = createContext(null);

function restoreLogin(state) {
  const identity = userKey(state.profile);
  const sessionIdentity = readJson(browserStorage("sessionStorage"), LOGIN_SESSION_KEY);
  return identity && (state.rememberLogin || sessionIdentity === identity)
    ? state : { ...state, profile: null, rememberLogin: false };
}

export function TourneyProvider({ children }) {
  // Đọc cache ở tab khách không được ghi ngược trạng thái đăng xuất sang tab đã đăng nhập.
  const externalState = useRef(null);
  const [state, setState] = useState(() => {
    const cached = loadState(browserStorage("localStorage"), browserStorage("sessionStorage"));
    const restored = restoreLogin(cached);
    if (cached.profile && !restored.profile) externalState.current = restored;
    return restored;
  });
  const stateRef = useRef(state);
  const commit = useCallback((update) => {
    const next = typeof update === "function" ? update(stateRef.current) : update;
    stateRef.current = next;
    setState(next);
  }, []);
  const [storageError, setStorageError] = useState("");
  const [apiStatus, setApiStatus] = useState("idle");
  const [apiError, setApiError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    try {
      const storage = browserStorage("localStorage");
      if (!storage) throw new Error("Storage unavailable");
      if (state !== externalState.current) storage.setItem(STORE_KEY, JSON.stringify(state));
      const session = browserStorage("sessionStorage");
      const identity = userKey(state.profile);
      if (identity) session?.setItem(LOGIN_SESSION_KEY, JSON.stringify(identity));
      else session?.removeItem(LOGIN_SESSION_KEY);
      session?.setItem("btp_registered_tournaments", JSON.stringify(state.registeredTournaments));
      const active = state.tournaments.find((entry) => String(entry.id) === String(state.activeTournamentId));
      if (state.teams !== null) {
        session?.setItem("btp_community_teams_v5", JSON.stringify(state.teams));
        if (!active) session?.setItem("btp_tournament_teams", JSON.stringify(state.teams.map(({ id, name, members }) => ({ id, name, members }))));
      }
      if (active) {
        session?.setItem("btp_tournament_teams", JSON.stringify(normalizeParticipants(active.tournamentTeams)));
      }
      setStorageError("");
    } catch {
      setStorageError("Không thể lưu dữ liệu trên thiết bị. Thay đổi hiện chỉ được giữ trong phiên đang mở.");
    }
  }, [state]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.storageArea !== browserStorage("localStorage") || event.key !== STORE_KEY) return;
      try {
        const next = parseState(JSON.parse(event.newValue));
        if (next) {
          const restored = restoreLogin(next);
          externalState.current = next.profile && !restored.profile ? restored : null;
          commit(restored);
        }
      } catch { /* Bỏ qua dữ liệu lỗi từ tab khác. */ }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [commit]);

  const updateProfile = useCallback((patch) => {
    commit((previous) => {
      const profile = profileData({ ...previous.profile, ...patch });
      const before = previous.profile?.gamerTag || previous.profile?.tagName || previous.profile?.username || "tungquan";
      const after = profile.gamerTag || profile.tagName || profile.username || before;
      return { ...previous, profile, teams: renameTeamMember(previous.teams, before, after, previous.profile) };
    });
  }, [commit]);

  const setProfile = useCallback((profile, { remember = false } = {}) => {
    commit((previous) => ({ ...previous, profile: profileData(profile), rememberLogin: remember === true }));
  }, [commit]);

  const setPublicTournament = useCallback((tournament) => {
    commit((previous) => ({ ...previous, publicTournament: tournament }));
  }, [commit]);

  const clearProfile = useCallback(() => {
    commit((previous) => ({ ...previous, profile: null, rememberLogin: false }));
    for (const [area, key] of [["sessionStorage", LOGIN_SESSION_KEY], ["sessionStorage", "btp_user_profile"], ["localStorage", "btp_profile_data_v1"]]) {
      try { browserStorage(area)?.removeItem(key); } catch { /* Xóa state trong bộ nhớ vẫn có hiệu lực. */ }
    }
  }, [commit]);

  const updateTournament = useCallback((id, patch) => {
    commit((previous) => {
      const current = previous.tournaments.find((item) => String(item.id) === String(id));
      if (!current) throw new Error("Không tìm thấy giải đấu cần cập nhật.");
      if (!isOwnTournament(current, previous.profile)) throw new Error("Chỉ chủ sở hữu giải đấu mới có thể cập nhật. Dữ liệu cũ chưa xác định chủ sở hữu chỉ được xem.");
      const updated = applyTournamentPatch(current, patch);
      const selectedId = previous.publicTournament?.storeId ?? previous.publicTournament?.id;
      const publicTournament = String(selectedId) === String(id) ? {
        ...previous.publicTournament, ...updated,
        game: updated.gameInfo?.game || updated.game || previous.publicTournament.game,
        gameDisplay: "",
        image: resolveTournamentImage(updated.bannerImg || updated.profileImg || updated.image, updated.gameInfo?.game || updated.game),
      } : previous.publicTournament;
      return { ...previous, publicTournament, tournaments: previous.tournaments.map((item) => item === current ? updated : item) };
    });
  }, [commit]);

  const addTournamentTeam = useCallback((id, values) => {
    const participant = makeParticipant(values);
    const current = stateRef.current.tournaments.find((item) => String(item.id) === String(id));
    if (!current) throw new Error("Không tìm thấy giải đấu cần cập nhật.");
    updateTournament(id, { tournamentTeams: [...normalizeParticipants(current.tournamentTeams), participant] });
    return participant;
  }, [updateTournament]);

  const registerTournament = useCallback((entry) => {
    commit((previous) => {
      const registeredTournaments = registerForTournament(previous.registeredTournaments, entry, previous.profile);
      if (registeredTournaments === previous.registeredTournaments) return previous;
      const registered = registeredTournaments[0];
      return { ...previous, registeredTournaments,
        publicTournament: sameTournament(previous.publicTournament, entry) ? { ...previous.publicTournament, attendees: registered.attendees } : previous.publicTournament,
        tournaments: previous.tournaments.map((item) => sameTournament(item, entry) ? { ...item, attendees: registered.attendees } : item),
      };
    });
  }, [commit]);

  const cancelTournamentRegistration = useCallback((entry) => {
    commit((previous) => {
      const stored = previous.tournaments.find((item) => sameTournament(item, entry))
        || (sameTournament(previous.publicTournament, entry) ? previous.publicTournament : null);
      const current = stored || entry;
      const remaining = unregisterFromTournament(previous.registeredTournaments, current, previous.profile);
      if (remaining === previous.registeredTournaments) return previous;
      const registration = previous.registeredTournaments.find((item) => sameTournament(item, entry) && isUserRegistration(item, previous.profile));
      const attendees = Math.max(0, Number(stored?.attendees ?? registration?.attendees ?? entry.attendees ?? 0) - 1);
      const update = (item) => sameTournament(item, entry) ? { ...item, attendees } : item;
      return { ...previous, registeredTournaments: remaining.map(update), tournaments: previous.tournaments.map(update),
        publicTournament: previous.publicTournament ? update(previous.publicTournament) : null };
    });
  }, [commit]);

  const saveTournamentBracket = useCallback((entry, bracket) => {
    commit((previous) => {
      if (!tournamentAccess(entry, previous.profile, previous.registeredTournaments).organizer) throw new Error("Chỉ ban tổ chức mới có thể cập nhật lịch thi đấu.");
      if (!validBracket(bracket)) throw new Error("Dữ liệu nhánh đấu không hợp lệ.");
      return { ...previous, brackets: { ...previous.brackets, [tournamentKey(entry)]: bracket } };
    });
  }, [commit]);

  const openTournamentManager = useCallback((entry) => {
    const previous = stateRef.current;
    if (!tournamentAccess(entry, previous.profile, previous.registeredTournaments).organizer) throw new Error("Chỉ ban tổ chức mới có thể quản lý giải đấu.");
    const existing = previous.tournaments.find((item) => sameTournament(item, entry));
    const id = existing?.id ?? entry.storeId ?? entry.id ?? "tourney_" + crypto.randomUUID();
    const details = { ...detailsValues(entry), id };
    const managed = existing || { ...entry, ...details, details, id, storeId: id, sample: false, source: "local", role: "Organizer", ownerKey: userKey(previous.profile), ownerId: previous.profile?.id ?? null,
      profileImg: entry.profileImg || entry.image || "", bannerImg: entry.bannerImg || entry.image || "", tournamentTeams: normalizeParticipants(entry.tournamentTeams) };
    commit({ ...previous, tournaments: existing ? previous.tournaments : [managed, ...previous.tournaments], activeTournamentId: id, publicTournament: managed });
    return managed;
  }, [commit]);

  const selectTournament = useCallback((id) => {
    commit((previous) => previous.tournaments.some((item) => String(item.id) === String(id))
      ? { ...previous, activeTournamentId: id } : previous);
  }, [commit]);

  const createTournament = useCallback((values) => {
    const entry = makeTournament(values, stateRef.current.profile);
    commit((previous) => ({ ...previous, tournaments: [entry, ...previous.tournaments], activeTournamentId: entry.id, publicTournament: null }));
    return entry;
  }, [commit]);

  const initializeCommunity = useCallback(() => {
    commit((previous) => {
      if (previous.teams !== null) return previous;
      return { ...previous, teams: createInitialTeams("tungquan").map((team) => ({ ...team, sample: true })) };
    });
  }, [commit]);

  const performTeamAction = useCallback((action) => {
    const profile = stateRef.current.profile;
    if (!userKey(profile)) throw new Error("Vui lòng đăng nhập để thao tác đội tuyển.");
    const resolved = action.type === "create" ? { ...action, id: "team_" + crypto.randomUUID() } : action;
    commit((previous) => ({ ...previous, teams: applyTeamAction(previous.teams || [], profile, resolved) }));
  }, [commit]);

  const refreshTournaments = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setApiStatus("loading");
    setApiError("");
    try {
      const remote = await tournamentApi.list();
      if (!Array.isArray(remote)) throw new Error("Danh sách giải đấu từ máy chủ không hợp lệ.");
      if (currentRequest === requestId.current) {
        commit((previous) => ({ ...previous, tournaments: mergeTournaments(previous.tournaments, remote.map((item) => ({ ...item, id: item.id ?? item.tournamentId }))) }));
        setApiStatus("success");
      }
      return remote;
    } catch (error) {
      if (currentRequest === requestId.current) {
        setApiStatus("error");
        setApiError(error.message || "Không thể kết nối máy chủ.");
      }
      throw error;
    }
  }, [commit]);

  const value = useMemo(() => ({
    currentUser: state.profile,
    tournaments: state.tournaments,
    activeTournament: state.tournaments.find((item) => String(item.id) === String(state.activeTournamentId)) || null,
    activeTournamentId: state.activeTournamentId,
    publicTournament: state.publicTournament,
    teams: state.teams,
    registeredTournaments: state.registeredTournaments,
    brackets: state.brackets,
    storageError, apiStatus, apiError,
    updateProfile, setProfile, setPublicTournament, clearProfile, updateTournament, selectTournament, refreshTournaments,
    createTournament, initializeCommunity, performTeamAction,
    addTournamentTeam, registerTournament, cancelTournamentRegistration, saveTournamentBracket, openTournamentManager,
  }), [state, storageError, apiStatus, apiError, updateProfile, setProfile, setPublicTournament, clearProfile, updateTournament, selectTournament, refreshTournaments, createTournament, initializeCommunity, performTeamAction, addTournamentTeam, registerTournament, cancelTournamentRegistration, saveTournamentBracket, openTournamentManager]);

  return <TourneyContext.Provider value={value}>{children}</TourneyContext.Provider>;
}

export function useTourney() {
  const context = useContext(TourneyContext);
  if (!context) throw new Error("useTourney phải được sử dụng bên trong TourneyProvider.");
  return context;
}
