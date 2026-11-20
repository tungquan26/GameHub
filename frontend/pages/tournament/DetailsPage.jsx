import { useState } from "react";
import SettingsCard from "@/components/shared/SettingsCard";
import TournamentEditorPage from "@/components/shared/TournamentEditorPage";
import ImageUploadField from "@/components/shared/ImageUploadField";
import VenueLocationPicker from "@/components/shared/VenueLocationPicker";
import MarkdownEditorBox from "@/components/shared/MarkdownEditorBox";
import { FormField } from "@/components/shared/FormField";
import FutureDateField from "@/components/shared/FutureDateField";
import { pastDateError } from "@/lib/dates";
import { homepageOverview, withHomepageOverview } from "@/lib/homepage";
import useCurrentDay from "@/hooks/useCurrentDay";
import { FormMessage } from "@/components/shared/AuthPanel";
import { NativeSelect } from "@/components/ui/input";
import { useTourney } from "@/context/TourneyContext";
import { cleanDetails, detailsError, detailsValues } from "@/lib/tournament-settings";
import useDraft from "@/hooks/useDraft";

function DetailsForm({ entry }) {
  const draft = useDraft(entry.id, detailsValues(entry));
  const { updateTournament } = useTourney();
  const [notice, setNotice] = useState("");
  const [locating, setLocating] = useState(false);
  const values = draft.value;
  useCurrentDay();
  const dateOptions = { original: detailsValues(entry) };
  const error = pastDateError(values, ["startDate", "endDate"], dateOptions) || detailsError(values);
  const complete = values.name.trim() && values.contact.trim() && values.startDate && values.endDate;
  function change(key, value) { draft.setValue((previous) => ({ ...previous, [key]: value })); setNotice(""); }
  async function save() { await updateTournament(entry.id, cleanDetails(values, dateOptions)); setNotice("Đã lưu thông tin chi tiết giải đấu thành công."); }
  return <SettingsCard title="Chi tiết giải đấu" subtitle="Tên, thời gian tổ chức và các thông tin cơ bản" noValidate
    isDirty={draft.isDirty} saveDisabled={!complete || Boolean(error) || locating} onSave={save}>
    <FormField label="Tên giải đấu" required placeholder="Nhập tên giải đấu" value={values.name} onChange={(event) => change("name", event.target.value)} />
    <div className="grid gap-5 sm:grid-cols-2">
      <FutureDateField label="Thời gian bắt đầu" className="font-mono" required value={values.startDate} onChange={(event) => change("startDate", event.target.value)} />
      <FutureDateField label="Thời gian kết thúc" className="font-mono" required aria-invalid={Boolean(error && error.includes("kết thúc"))} value={values.endDate} onChange={(event) => change("endDate", event.target.value)} />
    </div>
    <VenueLocationPicker value={{ address: values.venueAddress, lat: values.venueLat, lon: values.venueLon }}
      onBusyChange={setLocating} onChange={(venue) => { draft.setValue((previous) => ({ ...previous, venueAddress: venue.address, venueLat: venue.lat, venueLon: venue.lon })); setNotice(""); }} />
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Phương thức liên hệ" required>{(id) => <NativeSelect id={id} value={values.contactType} onChange={(event) => change("contactType", event.target.value)} required>
        <option value="EMAIL">Email</option><option value="DISCORD">Discord</option><option value="PHONE">Số điện thoại</option>
      </NativeSelect>}</FormField>
      <FormField label="Thông tin liên hệ" required placeholder={values.contactType === "EMAIL" ? "hello@btp.vn" : values.contactType === "PHONE" ? "0901234567" : "https://discord.gg/yourserver"} value={values.contact} onChange={(event) => change("contact", event.target.value)} />
    </div>
    <FormMessage error={error} notice={notice} />
  </SettingsCard>;
}
function ImagesForm({ entry }) {
  const draft = useDraft(entry.id, { profileImg: entry.profileImg || "", bannerImg: entry.bannerImg || "" });
  const { updateTournament } = useTourney();
  const [reading, setReading] = useState({ profile: false, banner: false });
  const [notice, setNotice] = useState("");
  function change(key, value) { draft.setValue((previous) => ({ ...previous, [key]: value })); setNotice(""); }
  return <SettingsCard title="Hình ảnh giải đấu" subtitle="Tải lên ảnh đại diện và ảnh bìa cho giải đấu." isDirty={draft.isDirty}
    saveDisabled={reading.profile || reading.banner} onSave={async () => { await updateTournament(entry.id, draft.value); setNotice("Đã lưu hình ảnh giải đấu thành công."); }}>
    <div className="grid items-start gap-6 sm:grid-cols-2">
      <ImageUploadField label="Ảnh đại diện giải đấu" value={draft.value.profileImg} onChange={(value) => change("profileImg", value)} onBusyChange={(busy) => setReading((previous) => ({ ...previous, profile: busy }))} />
      <ImageUploadField label="Ảnh bìa (Banner)" kind="banner" value={draft.value.bannerImg} onChange={(value) => change("bannerImg", value)} onBusyChange={(busy) => setReading((previous) => ({ ...previous, banner: busy }))} />
    </div>
    <FormMessage notice={notice} />
  </SettingsCard>;
}
function TournamentMarkdownForm({ entry, id, title, subtitle, initialValue, toPatch }) {
  const draft = useDraft(entry.id, initialValue);
  const { updateTournament } = useTourney();
  const [notice, setNotice] = useState("");
  async function save() {
    await updateTournament(entry.id, toPatch(draft.value));
    setNotice(`Đã lưu ${title.toLocaleLowerCase("vi")} thành công.`);
  }
  return <SettingsCard id={id} title={title} subtitle={subtitle} isDirty={draft.isDirty} onSave={save}>
    <MarkdownEditorBox label={title} value={draft.value} onChange={(value) => { draft.setValue(value); setNotice(""); }} />
    <FormMessage notice={notice} />
  </SettingsCard>;
}
function DetailsEditor({ entry }) {
  return <>
    <DetailsForm entry={entry} />
    <ImagesForm entry={entry} />
    <TournamentMarkdownForm entry={entry} id="overviewCard" title="Tổng quan giải đấu"
      subtitle="Nhập nội dung giới thiệu sẽ hiển thị trên trang chủ giải đấu."
      initialValue={homepageOverview(entry.homepageLayout)}
      toPatch={(value) => ({ homepageLayout: withHomepageOverview(entry.homepageLayout, value) })} />
    <TournamentMarkdownForm entry={entry} id="rulesCard" title="Điều lệ giải đấu"
      subtitle="Nhập quy định và thể lệ chung của giải đấu tại đây"
      initialValue={entry.rules || ""} toPatch={(rules) => ({ rules })} />
  </>;
}
export default function DetailsPage() {
  return <TournamentEditorPage title="Chi tiết giải đấu">{(entry) => <DetailsEditor key={entry.id} entry={entry} />}</TournamentEditorPage>;
}
