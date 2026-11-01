import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { FormField, PasswordField } from "@/components/shared/FormField";
import { FormMessage } from "@/components/shared/AuthPanel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTourney } from "@/context/TourneyContext";

export default function AccountSettings({ profile }) {
  const { updateProfile, clearProfile } = useTourney();
  const navigate = useNavigate();
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(profile.email);
  const [emailError, setEmailError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [passwords, setPasswords] = useState({ old: "", next: "" });
  const [passwordError, setPasswordError] = useState("");
  function saveEmail(event) {
    event.preventDefault(); setEmailNotice(""); setEmailError("");
    const value = email.trim();
    if (!value || !value.includes("@")) { setEmailError("Vui lòng nhập địa chỉ email hợp lệ."); return; }
    updateProfile({ ...profile, email: value }); setEditingEmail(false);
    setEmailNotice("Đã cập nhật địa chỉ email liên hệ thành công!");
  }
  function savePassword(event) {
    event.preventDefault();
    if (!passwords.old.trim() || !passwords.next.trim()) return;
    if (passwords.next.trim().length < 6) { setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }
    setPasswordError("Chưa thể đổi mật khẩu tài khoản. Tính năng này chưa được máy chủ hỗ trợ.");
  }
  return <div className="space-y-6">
    <Card>
      <CardHeader><h2 className="text-base font-semibold">Email</h2></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-dp-read">Địa chỉ email không bao giờ hiển thị công khai. Ban tổ chức giải đấu có thể liên hệ qua email này khi bạn đăng ký thi đấu.</p>
        <p className="break-all font-mono text-sm">{profile.email || "Chưa cập nhật email"}</p>
        <FormMessage error={emailError} notice={emailNotice} />
        {editingEmail ? <form noValidate onSubmit={saveEmail} className="space-y-4">
          <FormField label="Email mới" type="email" placeholder="ban@example.com" autoComplete="email" required value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(""); }} />
          <div className="flex gap-3"><Button type="submit" size="sm">Lưu Email</Button><Button variant="ghost" size="sm" onClick={() => { setEditingEmail(false); setEmailError(""); }}>Hủy</Button></div>
        </form> : <Button size="sm" variant="outline" onClick={() => { setEmail(profile.email); setEditingEmail(true); setEmailNotice(""); }}>Đổi địa chỉ email</Button>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader><h2 className="text-base font-semibold">Mật khẩu</h2></CardHeader>
      <CardContent><form onSubmit={savePassword} className="space-y-5">
        <PasswordField label="Mật khẩu hiện tại" autoComplete="current-password" required value={passwords.old} onChange={(event) => { setPasswords((value) => ({ ...value, old: event.target.value })); setPasswordError(""); }} />
        <PasswordField label="Mật khẩu mới" autoComplete="new-password" required value={passwords.next} onChange={(event) => { setPasswords((value) => ({ ...value, next: event.target.value })); setPasswordError(""); }} />
        <FormMessage error={passwordError} />
        <Button type="submit" size="sm" disabled={!passwords.old.trim() || !passwords.next.trim()}>Lưu mật khẩu</Button>
      </form></CardContent>
    </Card>
    <Card>
      <CardHeader><h2 className="text-base font-semibold">Xóa tài khoản</h2></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-dp-read">Xóa hồ sơ khỏi trình duyệt này và quay về trang đăng nhập.</p>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="sm" className="border-red-400/30 text-red-400">Xóa tài khoản</Button></DialogTrigger>
          <DialogContent>
            <AlertTriangle className="mb-4 size-6 text-red-400" />
            <DialogTitle className="pr-6 text-xl font-semibold">Xóa hồ sơ trên thiết bị?</DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-6 text-dp-read">Hồ sơ đã lưu trên trình duyệt này sẽ bị xóa và bạn sẽ được chuyển về trang đăng nhập. Thao tác này không xóa tài khoản trên máy chủ.</DialogDescription>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <DialogClose asChild><Button variant="outline" size="sm">Hủy</Button></DialogClose>
              <Button size="sm" variant="destructive" onClick={() => { clearProfile(); navigate("/login", { replace: true, state: { deletedLocal: true } }); }}>Xóa hồ sơ trên thiết bị</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  </div>;
}
