import { request } from "@/lib/api";

export const CHAT_REFRESH_MS = 3000;
export const CHAT_MESSAGE_LENGTH = 2000;

export function chatError(error, fallback) {
  return error.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : fallback;
}

const conversationsPath = "/api/chat/conversations";
const messagesPath = (id) => `${conversationsPath}/${encodeURIComponent(id)}/messages`;

export const chatApi = {
  search: (username, options) => request(`/api/chat/users?${new URLSearchParams({ username })}`, options),
  list: (options) => request(conversationsPath, options),
  open: (recipientId, options) => request(conversationsPath, { ...options, method: "POST", body: { recipientId } }),
  history: (id, cursor, options) => {
    const search = new URLSearchParams(cursor).toString();
    return request(messagesPath(id) + (search ? `?${search}` : ""), options);
  },
  send: (id, content, options) => request(messagesPath(id), { ...options, method: "POST", body: { content } }),
};
