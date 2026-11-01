import { useRef, useState } from "react";

export default function useAsyncAction() {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function run(action) {
    if (lock.current) return false;
    lock.current = true; setPending(true); setError(""); setNotice("");
    try { await action(); return true; }
    catch (cause) {
      setError(cause instanceof TypeError ? "Có lỗi xảy ra khi kết nối máy chủ." : cause.message || "Không thể thực hiện thao tác. Vui lòng thử lại.");
      return false;
    } finally { lock.current = false; setPending(false); }
  }
  return { pending, error, notice, setError, setNotice, run };
}
