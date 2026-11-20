import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthPanel, { FormMessage } from "@/components/shared/AuthPanel";
import { FormField, PasswordField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { profileFromLogin } from "@/lib/profile";
import { useTourney } from "@/context/TourneyContext";
import useAsyncAction from "@/hooks/useAsyncAction";
import { authPath, returnToFrom } from "@/lib/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const action = useAsyncAction();
  const { currentUser, setProfile } = useTourney();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const valid = form.username.trim() && form.password.trim();
  function change(key, value) { setForm((old) => ({ ...old, [key]: value })); action.setError(""); }
  function submit(event) {
    event.preventDefault();
    if (!valid) return;
    action.run(async () => {
      let user;
      try { user = await authApi.login({ username: form.username.trim(), password: form.password.trim() }); }
      catch (error) {
        if (error.status === 401) throw new Error("Tên người dùng hoặc mật khẩu không chính xác.");
        throw error;
      }
      await setProfile(profileFromLogin(user, currentUser));
      navigate(returnToFrom(location), { replace: true });
    });
  }
  return <AuthPanel title="Đăng nhập" subtitle="Chào mừng trở lại. Tiếp tục cuộc chơi của bạn.">
    <form onSubmit={submit} className="space-y-5" aria-busy={action.pending}>
      <FormField label="Tên người dùng" name="username" autoComplete="username" required value={form.username} onChange={(event) => change("username", event.target.value)} />
      <PasswordField name="password" autoComplete="current-password" required value={form.password} onChange={(event) => change("password", event.target.value)} />
      <FormMessage error={action.error} notice={state?.verified ? "Xác thực email thành công! Bạn có thể đăng nhập." : state?.deletedLocal ? "Hồ sơ trên thiết bị đã được xóa. Tài khoản máy chủ vẫn được giữ." : ""} />
      <Button type="submit" disabled={!valid || action.pending} className="w-full">
        {action.pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Đăng nhập
      </Button>
    </form>
    <div className="mt-7 flex justify-end text-[11px] font-medium tracking-wide">
      <Link to={authPath("/register", location)} className="text-dp-bright hover:text-dp-live">TẠO TÀI KHOẢN</Link>
    </div>
  </AuthPanel>;
}
