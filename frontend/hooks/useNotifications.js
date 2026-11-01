import { useCallback, useEffect, useRef, useState } from "react";
import { notificationApi } from "@/lib/api";
import { normalizeNotifications } from "@/lib/notifications";

export default function useNotifications(userId) {
  const [state, setState] = useState({
    items: [],
    loading: true,
    refreshing: false,
    error: "",
    reading: [],
    readErrors: {},
  });
  const alive = useRef(false);
  const request = useRef(null);
  const writes = useRef(new Map());
  const acknowledged = useRef(new Set());
  const refresh = useCallback(async () => {
    if (!alive.current || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState((previous) => ({ ...previous, refreshing: true, error: "" }));
    try {
      const data = normalizeNotifications(
        await notificationApi.list(userId, { signal: controller.signal }),
      );
      if (alive.current && !controller.signal.aborted)
        setState((previous) => ({
          ...previous,
          items: data.map((item) =>
            acknowledged.current.has(item.id) ? { ...item, read: true } : item,
          ),
          error: "",
        }));
    } catch (error) {
      if (alive.current && !controller.signal.aborted)
        setState((previous) => ({
          ...previous,
          error: "Chưa thể tải thông báo. Vui lòng thử lại.",
        }));
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (alive.current)
          setState((previous) => ({
            ...previous,
            loading: false,
            refreshing: false,
          }));
      }
    }
  }, [userId]);
  useEffect(() => {
    alive.current = true;
    refresh();
    const update = () => {
      if (!document.hidden) refresh();
    };
    const timer = setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      alive.current = false;
      request.current?.abort();
      request.current = null;
      writes.current.forEach((controller) => controller.abort());
      writes.current.clear();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [refresh]);
  async function markAsRead(id) {
    if (
      !alive.current ||
      writes.current.has(id) ||
      acknowledged.current.has(id)
    )
      return;
    const controller = new AbortController();
    writes.current.set(id, controller);
    setState((previous) => ({
      ...previous,
      reading: [...previous.reading, id],
      readErrors: { ...previous.readErrors, [id]: "" },
    }));
    try {
      await notificationApi.markAsRead(id, { signal: controller.signal });
      if (alive.current && !controller.signal.aborted) {
        acknowledged.current.add(id);
        setState((previous) => ({
          ...previous,
          items: previous.items.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        }));
        return true;
      }
    } catch (error) {
      if (alive.current && !controller.signal.aborted)
        setState((previous) => ({
          ...previous,
          readErrors: {
            ...previous.readErrors,
            [id]: "Không thể đánh dấu đã đọc. Hãy thử lại.",
          },
        }));
    } finally {
      if (writes.current.get(id) === controller) {
        writes.current.delete(id);
        if (alive.current)
          setState((previous) => ({
            ...previous,
            reading: previous.reading.filter((value) => value !== id),
          }));
      }
    }
    return false;
  }
  return { ...state, refresh, markAsRead };
}
