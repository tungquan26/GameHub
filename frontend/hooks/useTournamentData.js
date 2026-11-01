import { useEffect, useRef } from "react";
import { useTourney } from "@/context/TourneyContext";

// Dùng cùng trạng thái tải để các trang không tự tải lại danh sách khi chuyển trang.
export default function useTournamentData(enabled = true) {
  const { refreshTournaments, apiStatus } = useTourney();
  const attempted = useRef(false);
  useEffect(() => {
    if (!enabled || attempted.current || apiStatus !== "idle") return;
    attempted.current = true;
    refreshTournaments().catch(() => {});
  }, [enabled, refreshTournaments, apiStatus]);
  return { apiStatus, refreshTournaments, loading: enabled && ["idle", "loading"].includes(apiStatus) };
}
