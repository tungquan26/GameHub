import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthPanel, { FormMessage } from "@/components/shared/AuthPanel";
import OTPInputGroup from "@/components/shared/OTPInputGroup";
import { CheckboxField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { maskEmail } from "@/lib/profile";
import useAsyncAction from "@/hooks/useAsyncAction";
import { authPath } from "@/lib/navigation";

export default function VerifyPage() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [rememberBrowser, setRememberBrowser] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const action = useAsyncAction();
  const navigate = useNavigate();
  const location = useLocation();
  const complete = digits.every((digit) => /^[0-9]$/.test(digit));

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);
  function requireEmail() {
    if (!email) throw new Error("Không tìm thấy email cần xác thực. Vui lòng đăng ký lại.");
  }
  function verify(event) {
    event.preventDefault();
    if (!complete) return;
    action.run(async () => {
      requireEmail();
      await authApi.verify({ email, code: digits.join(""), rememberBrowser });
      navigate(authPath("/login", location), { replace: true, state: { verified: true } });
    });
  }
  function resend() {
    if (remaining > 0) return;
    action.run(async () => {
      requireEmail();
      await authApi.resend(email);
      setRemaining(30);
      action.setNotice("Mã xác thực đã được gửi lại thành công!");
    });
  }
  return <AuthPanel title="Xác thực mã OTP" subtitle={<p>Nhập mã chúng tôi đã gửi đến<br /><span className="font-mono text-dp-bright">{maskEmail(email)}</span></p>}>
    <form onSubmit={verify} className="space-y-6" aria-busy={action.pending}>
      <OTPInputGroup value={digits} onChange={(value) => { setDigits(value); action.setError(""); }} disabled={action.pending} invalid={Boolean(action.error)} />
      <CheckboxField checked={rememberBrowser} onChange={(event) => setRememberBrowser(event.target.checked)}>Nhớ trình duyệt này trong 30 ngày</CheckboxField>
      <FormMessage error={action.error.replace(/^ERROR:\s*/, "")} notice={action.notice} />
      <Button type="submit" disabled={!complete || action.pending} className="w-full">{action.pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Xác thực</Button>
    </form>
    <div className="mt-7 space-y-4 text-center text-[11px] font-medium tracking-wide">
      <button type="button" onClick={resend} disabled={remaining > 0 || action.pending} className="font-mono text-dp-bright disabled:text-dp-meta">
        {remaining > 0 ? `GỬI LẠI MÃ (${remaining}S)` : "GỬI LẠI MÃ"}
      </button>
      {!email && <Link to={authPath("/register", location)} className="block text-dp-live">Đăng ký lại</Link>}
    </div>
  </AuthPanel>;
}
