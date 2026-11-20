import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { chatApi, chatError, CHAT_MESSAGE_LENGTH, CHAT_REFRESH_MS } from "@/lib/chat";
import { cn } from "@/lib/utils";

const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ConversationPanel({ conversation, userId, onBack, onSend }) {
  const { id, recipientUsername } = conversation;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const cursor = useRef(null);
  const session = useRef(null);
  const viewport = useRef(null);
  const scrollAdjustment = useRef(null);

  const addMessages = useCallback((incoming, direction) => {
    if (!incoming.length) return;
    const list = viewport.current;
    if (list && direction === "older") {
      scrollAdjustment.current = { offsetFromBottom: list.scrollHeight - list.scrollTop };
    } else if (list && (direction === "bottom" || list.scrollHeight - list.scrollTop - list.clientHeight < 64)) {
      scrollAdjustment.current = { offsetFromBottom: 0 };
    }

    setMessages((previous) => {
      const byId = new Map(previous.map((item) => [item.id, item]));
      for (const item of incoming) byId.set(item.id, item);
      return [...byId.values()].sort((first, second) => first.id - second.id);
    });
  }, []);

  useLayoutEffect(() => {
    if (viewport.current && scrollAdjustment.current) {
      viewport.current.scrollTop = viewport.current.scrollHeight - scrollAdjustment.current.offsetFromBottom;
    }
    scrollAdjustment.current = null;
  }, [messages]);

  useEffect(() => {
    const request = new AbortController();
    session.current = request;
    let fetching = false;
    let unavailable = false;

    async function refresh() {
      if (fetching || unavailable || request.signal.aborted) return;
      fetching = true;
      try {
        let hasNewer;
        do {
          const afterId = cursor.current;
          const initial = afterId === null;
          const page = await chatApi.history(id, initial ? {} : { afterId }, { signal: request.signal });
          if (request.signal.aborted) return;
          cursor.current = page.messages.at(-1)?.id ?? afterId ?? 0;
          addMessages(page.messages, initial ? "bottom" : "newer");
          if (initial) setHasOlder(page.hasMore);
          hasNewer = !initial && page.hasMore;
        } while (hasNewer);
        setHistoryError("");
      } catch (error) {
        if (request.signal.aborted) return;
        unavailable = error.status === 401 || error.status === 404;
        setHistoryError(chatError(error, "Chưa thể tải tin nhắn."));
      } finally {
        fetching = false;
        if (!request.signal.aborted) setLoading(false);
      }
    }

    refresh();
    const timer = window.setInterval(() => { if (!document.hidden) refresh(); }, CHAT_REFRESH_MS);
    return () => {
      request.abort();
      window.clearInterval(timer);
    };
  }, [addMessages, id]);

  async function loadOlder() {
    const signal = session.current?.signal;
    if (!signal || loadingOlder || !hasOlder) return;
    setLoadingOlder(true);
    setOlderError("");
    try {
      const page = await chatApi.history(id, { beforeId: messages[0].id }, { signal });
      if (signal.aborted) return;
      addMessages(page.messages, "older");
      setHasOlder(page.hasMore);
    } catch (error) {
      if (!signal.aborted) setOlderError(chatError(error, "Không thể tải tin nhắn cũ hơn. Hãy thử lại."));
    } finally {
      if (!signal.aborted) setLoadingOlder(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    const signal = session.current?.signal;
    const text = draft.trim();
    if (!signal || sending || !text) return;
    const submitted = draft;
    setSending(true);
    setSendError("");
    try {
      const message = await chatApi.send(id, text, { signal });
      if (signal.aborted) return;
      // Polling still starts from the last fetched ID so an incoming message cannot be skipped.
      addMessages([message], "bottom");
      setDraft((current) => current === submitted ? "" : current);
      onSend();
    } catch (error) {
      if (!signal.aborted) setSendError(chatError(error, "Không thể gửi tin nhắn. Hãy thử lại."));
    } finally {
      if (!signal.aborted) setSending(false);
    }
  }

  return <section aria-labelledby="chat-recipient" className="flex min-h-0 min-w-0 flex-col bg-dp-ground/40">
    <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-dp-hairline px-4 py-3 sm:px-5">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Về danh sách cuộc trò chuyện" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
      </Button>
      <h2 id="chat-recipient" className="min-w-0 font-semibold [overflow-wrap:anywhere]">@{recipientUsername}</h2>
    </header>

    <div ref={viewport} tabIndex={0} role="region" aria-label="Lịch sử tin nhắn" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 [overflow-anchor:none] sm:px-6">
      {hasOlder && <div className="mb-4 text-center">
        <Button size="sm" variant="outline" onClick={loadOlder} disabled={loadingOlder}>
          {loadingOlder ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
        </Button>
        {olderError && <p role="alert" className="mt-2 text-sm text-red-300">{olderError}</p>}
      </div>}
      {loading && <p role="status" className="text-center text-sm text-dp-meta">Đang tải tin nhắn…</p>}
      {historyError && <p role="alert" className="mb-3 text-center text-sm text-red-300">{historyError}</p>}
      {!loading && !historyError && messages.length === 0 && <p className="text-center text-sm text-dp-meta">Chưa có tin nhắn. Hãy gửi lời chào!</p>}
      {messages.length > 0 && <ol className="space-y-3">
        {messages.map((message) => {
          const mine = String(message.senderId) === String(userId);
          return <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-panel border px-3.5 py-2.5 md:max-w-[75%]", mine ? "border-dp-live/35 bg-dp-live/10" : "border-dp-hairline bg-dp-panel")}>
              <span className="sr-only">{mine ? "Bạn" : recipientUsername}</span>
              <p className="text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>
              <time dateTime={message.createdAt} className="mt-1 block text-right text-xs text-dp-meta">{dateTime.format(new Date(message.createdAt))}</time>
            </div>
          </li>;
        })}
      </ol>}
    </div>

    <form onSubmit={send} className="shrink-0 border-t border-dp-hairline p-3 sm:p-4" aria-busy={sending}>
      {sendError && <p role="alert" className="mb-2 text-sm text-red-300">{sendError}</p>}
      <div className="flex items-end gap-2 sm:gap-3">
        <Textarea aria-label="Nội dung tin nhắn" placeholder="Viết tin nhắn…" rows={2} maxLength={CHAT_MESSAGE_LENGTH}
          value={draft} onChange={(event) => { setDraft(event.target.value); setSendError(""); }}
          className="min-h-12 resize-none py-2.5" />
        <Button type="submit" disabled={sending || !draft.trim()}>
          <Send aria-hidden="true" />{sending ? "Đang gửi…" : "Gửi"}
        </Button>
      </div>
    </form>
  </section>;
}
