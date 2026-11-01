import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthPanel, { FormMessage } from "@/components/shared/AuthPanel";
import { FormField, PasswordField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import useAsyncAction from "@/hooks/useAsyncAction";
import { authPath } from "@/lib/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const action = useAsyncAction();
  const navigate = useNavigate();
  const location = useLocation();
  const mismatch = Boolean(form.confirmPassword.trim()) && form.password !== form.confirmPassword;
  const valid = Object.values(form).every((value) => value.trim()) && !mismatch;
  function change(key, value) { setForm((old) => ({ ...old, [key]: value })); action.setError(""); }
  function submit(event) {
    event.preventDefault();
    if (!valid) return;
    action.run(async () => {
      const email = form.email.trim();
      await authApi.register({ username: form.username.trim(), email, password: form.password.trim() });
      navigate(authPath("/verify", location, { email }));
    });
  }
  return <AuthPanel title="Tạo tài khoản" subtitle="Tham gia cộng đồng, tìm đối thủ và tổ chức giải đấu của riêng bạn.">
    <form onSubmit={submit} className="space-y-5" aria-busy={action.pending}>
      <FormField label="Tên người dùng" name="username" autoComplete="username" required value={form.username} onChange={(event) => change("username", event.target.value)} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => change("email", event.target.value)} />
      <PasswordField name="password" autoComplete="new-password" required value={form.password} onChange={(event) => change("password", event.target.value)} />
      <PasswordField label="Nhập lại mật khẩu" name="confirmPassword" autoComplete="new-password" required aria-invalid={mismatch} value={form.confirmPassword} onChange={(event) => change("confirmPassword", event.target.value)} />
      <FormMessage error={mismatch ? "Mật khẩu không khớp." : action.error} />
      {/(đã tồn tại|đã được sử dụng)/i.test(action.error) && form.email.trim() && <p className="text-xs leading-6 text-dp-read">Nếu đây là tài khoản bạn vừa đăng ký, hãy tiếp tục xác thực email. <Link className="text-dp-live underline" to={authPath("/verify", location, { email: form.email.trim() })}>Xác thực email</Link></p>}
      <Button type="submit" disabled={!valid || action.pending} className="w-full">{action.pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Tạo tài khoản</Button>
    </form>
    <Link to={authPath("/login", location)} className="mt-7 block text-center text-[11px] font-medium tracking-wide text-dp-read hover:text-dp-bright">ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP</Link>
  </AuthPanel>;
}
