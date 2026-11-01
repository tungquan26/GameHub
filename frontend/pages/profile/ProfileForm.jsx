import { useEffect, useRef, useState } from "react";
import { Upload, User } from "lucide-react";
import SettingsCard from "@/components/shared/SettingsCard";
import { CheckboxField, FormField } from "@/components/shared/FormField";
import { FormMessage } from "@/components/shared/AuthPanel";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { COUNTRIES, formatDate } from "@/lib/profile";
import { useTourney } from "@/context/TourneyContext";

const EDITABLE = ["tagName", "bio", "displayPronouns", "pronouns", "country", "city", "zipCode", "phone", "displayCityMode", "avatarUrl"];
function snapshot(profile) { return Object.fromEntries(EDITABLE.map((key) => [key, profile[key]])); }

export default function ProfileForm({ profile }) {
  const { updateProfile } = useTourney();
  const [draft, setDraft] = useState(() => snapshot(profile));
  const [saved, setSaved] = useState(() => snapshot(profile));
  const [notice, setNotice] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const input = useRef(null);
  const reader = useRef(null);
  const source = JSON.stringify(snapshot(profile));
  useEffect(() => {
    const next = JSON.parse(source);
    setDraft(next); setSaved(next);
  }, [source]);
  useEffect(() => () => { reader.current?.abort(); }, []);

  function change(key, value) { setDraft((previous) => ({ ...previous, [key]: value })); setNotice(""); }
  function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    reader.current?.abort(); setUploading(false); setUploadError("");
    if (file.size > 4 * 1024 * 1024) { setUploadError("Ảnh đại diện không được vượt quá 4MB."); return; }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) { setUploadError("Vui lòng chọn ảnh PNG, JPEG, WebP hoặc GIF."); return; }
    const task = new FileReader(); reader.current = task; setUploading(true);
    task.onload = () => { if (reader.current === task) { change("avatarUrl", task.result); setUploading(false); } };
    task.onerror = () => { if (reader.current === task) { setUploadError("Không thể đọc ảnh. Vui lòng thử lại."); setUploading(false); } };
    task.readAsDataURL(file);
  }
  function save() {
    const tagName = draft.tagName.trim();
    if (!tagName) throw new Error("Tên hiển thị (GamerTag) không được để trống.");
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
    // Hai tên trường được giữ đồng nhất cho sidebar và dữ liệu cũ.
    updateProfile({ ...profile, ...next, gamerTag: tagName, tagName });
    setSaved(next); setDraft(next);
    setNotice("Đã cập nhật hồ sơ cá nhân thành công!");
  }
  return <SettingsCard title="Thông tin hồ sơ" subtitle="Thông tin công khai của bạn trong cộng đồng Tourney Pro."
    onSave={save} saveLabel="Cập nhật hồ sơ" isDirty={JSON.stringify(draft) !== JSON.stringify(saved)} isSaving={uploading}>
    <div className="flex flex-wrap items-center gap-5">
      <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dp-hairline-2 bg-dp-ground font-mono text-2xl">
        {draft.avatarUrl ? <img src={draft.avatarUrl} alt="Ảnh đại diện xem trước" className="size-full object-cover" /> : draft.tagName.trim().charAt(0).toUpperCase() || <User className="size-6" />}
      </span>
      <div className="space-y-2">
        <input ref={input} type="file" aria-label="Tải ảnh đại diện" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={upload} />
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}><Upload />Đổi ảnh đại diện</Button>
        {draft.avatarUrl && <Button size="sm" variant="ghost" className="ml-2 text-red-400" onClick={() => { reader.current?.abort(); reader.current = null; setUploading(false); change("avatarUrl", ""); }}>Xóa ảnh</Button>}
        <p className="text-[11px] text-dp-meta">PNG, JPEG, WebP hoặc GIF · Tối đa 4MB</p>
      </div>
    </div>
    <FormMessage error={uploadError} notice={notice} />
    <FormField label="Tên hiển thị (GamerTag)" required value={draft.tagName} onChange={(event) => change("tagName", event.target.value)} />
    <FormField label="Nhập tiểu sử ngắn hiển thị cùng tên của bạn" placeholder="VD: Tuyển thủ bán chuyên, yêu thích các giải đấu Esports..." value={draft.bio} onChange={(event) => change("bio", event.target.value)} />
    <CheckboxField checked={draft.displayPronouns} onChange={(event) => change("displayPronouns", event.target.checked)}>Hiển thị đại từ nhân xưng</CheckboxField>
    {draft.displayPronouns && <FormField label="Đại từ nhân xưng" placeholder="VD: Anh ấy, Cô ấy..." value={draft.pronouns} onChange={(event) => change("pronouns", event.target.value)} />}
    <div className="border-t border-dp-hairline pt-5">
      <h3 className="text-sm font-medium">Địa điểm và Thông tin liên hệ</h3>
      <p className="mt-2 text-xs leading-6 text-dp-read">Các giải đấu bạn đăng ký tham gia có thể yêu cầu một số thông tin liên hệ dưới đây.</p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Quốc gia" required>{(id) => <NativeSelect id={id} required value={draft.country} onChange={(event) => change("country", event.target.value)}>
        {!COUNTRIES.includes(draft.country) && <option value={draft.country}>{draft.country}</option>}
        {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
      </NativeSelect>}</FormField>
      <FormField label="Thành phố" hint="Không bắt buộc" value={draft.city} onChange={(event) => change("city", event.target.value)} />
      <FormField label="Mã bưu chính" hint="Không bắt buộc" value={draft.zipCode} onChange={(event) => change("zipCode", event.target.value)} />
      <FormField label="Số điện thoại" type="tel" hint="Không bắt buộc" value={draft.phone} onChange={(event) => change("phone", event.target.value)} />
    </div>
    <FormField label="Hiển thị địa điểm">{(id) => <NativeSelect id={id} value={draft.displayCityMode} onChange={(event) => change("displayCityMode", event.target.value)}>
      <option>Hiển thị thành phố</option><option>Ẩn thành phố</option>
    </NativeSelect>}</FormField>
    <div className="border-t border-dp-hairline pt-5"><h3 className="text-sm font-medium">Ngày sinh</h3><p className="mt-2 font-mono text-sm text-dp-read">{formatDate(profile.birthday) || "Chưa cập nhật ngày sinh"}</p></div>
  </SettingsCard>;
}
