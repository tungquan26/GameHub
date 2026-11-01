import { useState } from "react";
import SettingsCard from "@/components/shared/SettingsCard";
import TournamentEditorPage from "@/components/shared/TournamentEditorPage";
import { FormField } from "@/components/shared/FormField";
import FutureDateField from "@/components/shared/FutureDateField";
import { pastDateError } from "@/lib/dates";
import useCurrentDay from "@/hooks/useCurrentDay";
import { FormMessage } from "@/components/shared/AuthPanel";
import { useTourney } from "@/context/TourneyContext";
import { cleanRegistration, registrationError, registrationValues } from "@/lib/tournament-settings";
import useDraft from "@/hooks/useDraft";

function RegistrationEditor({ entry }) {
  const draft = useDraft(entry.id, registrationValues(entry));
  const { updateTournament } = useTourney();
  const [notice, setNotice] = useState("");
  const values = draft.value;
  const original = registrationValues(entry);
  const dirty = JSON.stringify({ ...values, maxTeamSize: String(values.maxTeamSize) }) !== JSON.stringify({ ...original, maxTeamSize: String(original.maxTeamSize) });
  useCurrentDay();
  const dateOptions = { original };
  const error = pastDateError(values, ["registrationStartDate", "registrationEndDate"], dateOptions) || registrationError(values);
  const complete = values.registrationStartDate && values.registrationEndDate && String(values.maxTeamSize).trim() !== "";
  function change(key, value) { draft.setValue((previous) => ({ ...previous, [key]: value })); setNotice(""); }
  return <SettingsCard title="Cài đặt đăng ký" subtitle="Thời hạn đăng ký, lệ phí và giới hạn số lượng đội tuyển" noValidate
    isDirty={dirty} saveDisabled={!complete || Boolean(error)} onSave={() => { updateTournament(entry.id, { regSettings: cleanRegistration(values, dateOptions) }); setNotice("Đã lưu cài đặt đăng ký thành công."); }}>
    <p className="text-sm leading-6 text-dp-read">Thiết lập khoảng thời gian cho phép các đội tuyển đăng ký tham gia giải đấu này.</p>
    <div className="grid gap-5 sm:grid-cols-2">
      <FutureDateField label="Thời gian mở đăng ký" className="font-mono" required value={values.registrationStartDate} onChange={(event) => change("registrationStartDate", event.target.value)} />
      <FutureDateField label="Thời gian đóng đăng ký" className="font-mono" required value={values.registrationEndDate} onChange={(event) => change("registrationEndDate", event.target.value)} />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-dp-hairline py-5">
      <p className="text-sm font-medium">Lệ phí đăng ký <span className="text-dp-live">*</span></p><span className="rounded-pill border border-dp-live/30 px-3 py-1 font-mono text-xs text-dp-live">Miễn phí</span>
    </div>
    <h3 className="text-sm font-medium">Số lượng thành viên &amp; Đội tuyển</h3>
    <div className="grid gap-5 lg:grid-cols-3">
      <FormField label="Số thành viên tối thiểu mỗi đội" type="number" className="font-mono" value={4} disabled readOnly />
      <FormField label="Số thành viên tối đa mỗi đội" type="number" className="font-mono" min={4} max={20} step={1} required value={values.maxTeamSize} onChange={(event) => change("maxTeamSize", event.target.value)} hint="— bao gồm dự bị, huấn luyện viên,..." />
      <FormField label="Số đội tối đa của giải" type="number" className="font-mono" value={16} disabled readOnly hint="— cố định 16 đội theo sơ đồ nhánh đấu." />
    </div>
    <FormMessage error={error} notice={notice} />
  </SettingsCard>;
}
export default function RegistrationPage() {
  return <TournamentEditorPage title="Cài đặt đăng ký">{(entry) => <RegistrationEditor key={entry.id} entry={entry} />}</TournamentEditorPage>;
}
