import { useEffect, useRef, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import { chatApi, chatError, CHAT_REFRESH_MS } from "@/lib/chat";
import { cn } from "@/lib/utils";
import ConversationPanel from "./ConversationPanel";

export default function MessagesPage() {
  const { currentUser } = useTourney();
  const userId = currentUser?.id ?? currentUser?.userId;
  return userId != null && <Inbox key={userId} userId={userId} />;
}

function Inbox({ userId }) {
  const [conversations, setConversations] = useState(null);
  const [selected, setSelected] = useState(null);
  const [inboxError, setInboxError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [opening, setOpening] = useState(false);
  const [actionError, setActionError] = useState("");
  const searchRequest = useRef(null);
  const openRequest = useRef(null);

  useEffect(() => {
    const request = new AbortController();
    let fetching = false;
    let expired = false;

    async function refresh() {
      if (fetching || expired || request.signal.aborted) return;
      fetching = true;
      try {
        const items = await chatApi.list({ signal: request.signal });
        if (request.signal.aborted) return;
        setConversations(items);
        setInboxError("");
      } catch (error) {
        if (request.signal.aborted) return;
        expired = error.status === 401;
        setInboxError(chatError(error, "Chưa thể tải danh sách cuộc trò chuyện."));
      } finally {
        fetching = false;
      }
    }

    refresh();
    const timer = window.setInterval(() => { if (!document.hidden) refresh(); }, CHAT_REFRESH_MS);
    return () => {
      request.abort();
      window.clearInterval(timer);
    };
  }, [refreshVersion]);

  useEffect(() => () => {
    searchRequest.current?.abort();
    openRequest.current?.abort();
  }, []);

  function refreshInbox() {
    setRefreshVersion((version) => version + 1);
  }

  function changeQuery(event) {
    searchRequest.current?.abort();
    searchRequest.current = null;
    setSearching(false);
    setQuery(event.target.value);
    setResults(null);
    setActionError("");
  }

  async function search(event) {
    event.preventDefault();
    if (!query.trim() || searchRequest.current || openRequest.current) return;
    const request = new AbortController();
    searchRequest.current = request;
    setSearching(true);
    setResults(null);
    setActionError("");
    try {
      const accounts = await chatApi.search(query.trim(), { signal: request.signal });
      if (!request.signal.aborted) setResults(accounts);
    } catch (error) {
      if (!request.signal.aborted) setActionError(chatError(error, "Không thể tìm tài khoản. Hãy thử lại."));
    } finally {
      if (!request.signal.aborted) {
        searchRequest.current = null;
        setSearching(false);
      }
    }
  }

  async function openConversation(recipientId) {
    if (openRequest.current) return;
    const request = new AbortController();
    openRequest.current = request;
    setOpening(true);
    setActionError("");
    try {
      const item = await chatApi.open(recipientId, { signal: request.signal });
      if (request.signal.aborted) return;
      setConversations((previous) => previous?.some(({ id }) => id === item.id) ? previous : [item, ...(previous ?? [])]);
      setSelected(item);
      setQuery("");
      setResults(null);
      refreshInbox();
    } catch (error) {
      if (!request.signal.aborted) setActionError(chatError(error, "Không thể mở cuộc trò chuyện. Hãy thử lại."));
    } finally {
      if (!request.signal.aborted) {
        openRequest.current = null;
        setOpening(false);
      }
    }
  }

  const active = conversations?.find(({ id }) => id === selected?.id) ?? selected;

  return <div className="dp-container py-7 sm:py-10">
    <PageHeader title="Tin nhắn" />
    <div className="dp-panel grid h-[min(44rem,calc(100dvh-10rem))] min-h-[27rem] overflow-hidden md:grid-cols-[17rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className={cn("min-h-0 flex-col border-dp-hairline md:border-r", active ? "hidden md:flex" : "flex")} aria-label="Hộp thư">
        <div className="shrink-0 border-b border-dp-hairline p-4 sm:p-5">
          <form onSubmit={search} aria-busy={searching}>
            <label htmlFor="chat-search" className="mb-2 block text-sm font-semibold">Tìm tài khoản</label>
            <div className="flex items-center gap-2">
              <Input id="chat-search" type="search" value={query} onChange={changeQuery} maxLength={255}
                placeholder="Nhập username" autoComplete="off" disabled={opening} />
              <Button type="submit" variant="outline" size="icon" aria-label="Tìm kiếm" disabled={!query.trim() || searching || opening}>
                <Search aria-hidden="true" />
              </Button>
            </div>
          </form>
          {searching && <p role="status" className="mt-3 text-sm text-dp-meta">Đang tìm tài khoản…</p>}
          {actionError && <p role="alert" className="mt-3 text-sm text-red-300">{actionError}</p>}
          {results?.length === 0 && <p role="status" className="mt-3 text-sm text-dp-meta">Không tìm thấy tài khoản.</p>}
          {results?.length > 0 && <ul aria-label="Kết quả tìm tài khoản" className="mt-3 max-h-40 overflow-y-auto" aria-busy={opening}>
            {results.map((account) => <li key={account.id}>
              <button type="button" disabled={opening} onClick={() => openConversation(account.id)}
                className="w-full rounded-panel px-3 py-2 text-left text-sm [overflow-wrap:anywhere] hover:bg-dp-ground disabled:opacity-50">
                @{account.username}
              </button>
            </li>)}
          </ul>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <h2 className="mb-2 px-2 text-sm font-semibold">Cuộc trò chuyện</h2>
          {inboxError && <p role="alert" className="px-2 py-2 text-sm text-red-300">{inboxError}</p>}
          {!conversations && !inboxError && <p role="status" className="px-2 py-2 text-sm text-dp-meta">Đang tải…</p>}
          {conversations?.length === 0 && <p className="px-2 py-2 text-sm text-dp-meta">Bạn chưa có cuộc trò chuyện nào.</p>}
          {conversations?.length > 0 && <ul className="space-y-1">
            {conversations.map((item) => <li key={item.id}>
              <button type="button" aria-current={active?.id === item.id || undefined} disabled={opening} onClick={() => setSelected(item)}
                className={cn("w-full rounded-panel border border-transparent px-3 py-3 text-left text-sm [overflow-wrap:anywhere] hover:bg-dp-ground", active?.id === item.id && "border-dp-live/40 bg-dp-ground")}>
                @{item.recipientUsername}
              </button>
            </li>)}
          </ul>}
        </div>
      </aside>

      {active ? <ConversationPanel key={active.id} conversation={active} userId={userId} onBack={() => setSelected(null)} onSend={refreshInbox} />
        : <div className="hidden flex-col items-center justify-center gap-3 bg-dp-ground/40 px-6 text-center text-dp-read md:flex">
          <MessageSquare aria-hidden="true" className="size-7 text-dp-meta" />
          <p className="text-sm">Chọn một cuộc trò chuyện hoặc tìm tài khoản để nhắn tin.</p>
        </div>}
    </div>
  </div>;
}
