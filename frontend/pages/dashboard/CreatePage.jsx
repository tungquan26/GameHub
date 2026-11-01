import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { FormField } from "@/components/shared/FormField";
import FutureDateField from "@/components/shared/FutureDateField";
import { pastDateError } from "@/lib/dates";
import useCurrentDay from "@/hooks/useCurrentDay";
import { FormMessage } from "@/components/shared/AuthPanel";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { useTourney } from "@/context/TourneyContext";
import useAsyncAction from "@/hooks/useAsyncAction";

const PLACEHOLDERS = { EMAIL: "hello@start.gg", DISCORD: "https://discord.gg/yourserver", PHONE: "0901234567" };
export default function CreatePage() {
  const [form, setForm] = useState({ name: "", contactType: "EMAIL", contact: "", startDate: "", endDate: "" });
  const { createTournament } = useTourney();
  const action = useAsyncAction();
  const navigate = useNavigate();
  useCurrentDay();
  const dateError = pastDateError(form, ["startDate", "endDate"]) || (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate) ? "Ngày kết thúc phải diễn ra sau ngày bắt đầu." : "");
  const valid = form.name.trim() && form.contact.trim() && form.startDate && form.endDate && !dateError;
  function change(key, value) { setForm((previous) => ({ ...previous, [key]: value })); action.setError(""); }
  function submit(event) {
    event.preventDefault();
    if (!valid) return;
    action.run(async () => { createTournament(form); navigate("/tournament/details"); });
  }
  return <div className="dp-container py-9 sm:py-12">
    <PageHeader title="Tạo giải đấu" breadcrumbs={[{ to: "/", label: "Trang chủ" }, { label: "Tạo giải đấu" }]} />
    <div className="max-w-3xl"><Card>
      <CardHeader><h2 className="text-base font-semibold">Thông tin cơ bản</h2></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-6" aria-busy={action.pending}>
        <FormField label="Tên giải đấu" placeholder="Nhập tên giải đấu của bạn..." required value={form.name} onChange={(event) => change("name", event.target.value)} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Phương thức liên hệ" required>{(id) => <NativeSelect id={id} value={form.contactType} required onChange={(event) => change("contactType", event.target.value)}>
            <option value="EMAIL">Email</option><option value="DISCORD">Discord</option><option value="PHONE">Số điện thoại</option>
          </NativeSelect>}</FormField>
          <FormField label="Thông tin liên hệ" placeholder={PLACEHOLDERS[form.contactType]} required value={form.contact} onChange={(event) => change("contact", event.target.value)} />
          <FutureDateField label="Ngày bắt đầu" className="font-mono" required value={form.startDate} onChange={(event) => change("startDate", event.target.value)} />
          <FutureDateField label="Ngày kết thúc" className="font-mono" required aria-invalid={Boolean(dateError)} value={form.endDate} onChange={(event) => change("endDate", event.target.value)} />
        </div>
        <FormMessage error={dateError || action.error} />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dp-hairline pt-5">
          <Button type="submit" disabled={!valid || action.pending}>{action.pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}Tạo giải đấu</Button>
        </div>
      </form></CardContent>
    </Card></div>
  </div>;
}
