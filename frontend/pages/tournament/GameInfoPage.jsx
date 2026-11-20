import { useId, useState } from "react";
import SettingsCard from "@/components/shared/SettingsCard";
import TournamentEditorPage from "@/components/shared/TournamentEditorPage";
import { FormField } from "@/components/shared/FormField";
import { FormMessage } from "@/components/shared/AuthPanel";
import { NativeSelect } from "@/components/ui/input";
import { useTourney } from "@/context/TourneyContext";
import { BRACKET_FORMATS } from "@/constants/games";
import { cleanGame, gameValues } from "@/lib/tournament-settings";
import useDraft from "@/hooks/useDraft";
import { catalogGame, gameLabel } from "@/lib/games";

const LABELS = { SINGLE_ELIMINATION: "Loại trực tiếp", DOUBLE_ELIMINATION: "Nhánh thắng - Nhánh thua", ROUND_ROBIN: "Vòng tròn tính điểm", SWISS: "Thể thức Thụy Sĩ" };
function GameEditor({ entry }) {
  const draft = useDraft(entry.id, gameValues(entry));
  const { updateTournament, games, gameError } = useTourney();
  const selectedGame = catalogGame(games, draft.value.game);
  const [notice, setNotice] = useState("");
  const stageId = useId();
  function change(key, value) { draft.setValue((previous) => ({ ...previous, [key]: value })); setNotice(""); }
  return <SettingsCard title="THÔNG TIN GAME" subtitle="Chọn tựa game, giai đoạn thi đấu và thể thức nhánh đấu" noValidate
    isDirty={draft.isDirty} saveDisabled={!selectedGame} onSave={async () => { await updateTournament(entry.id, { gameInfo: cleanGame(draft.value, games) }); setNotice("Đã lưu thông tin game thành công."); }}>
    <FormField label="Tựa game" required>{(id) => <NativeSelect id={id} required value={selectedGame?.name || ""} onChange={(event) => change("game", event.target.value)}>
      <option value="" disabled>-- Chọn tựa game --</option>
      {games.map((game) => <option key={game.gameId} value={game.name}>{gameLabel(game.name)}</option>)}
    </NativeSelect>}</FormField>
    {gameError && <FormMessage error="Không thể tải danh mục game." />}
    {games.length > 0 && draft.value.game && !selectedGame && <p className="text-xs leading-6 text-dp-meta">Bộ môn cũ: {draft.value.game}. Hãy chọn một trong {games.length} game hiện được hỗ trợ.</p>}
    <fieldset className="border-y border-dp-hairline py-5"><legend className="mb-3 text-xs font-medium text-dp-read">Giai đoạn thi đấu</legend>
      <label htmlFor={stageId} className="flex items-center gap-3 text-sm"><input id={stageId} type="radio" name="stageType" value="SINGLE_STAGE" checked readOnly className="size-4 accent-dp-live" />Giải đấu 1 giai đoạn</label>
    </fieldset>
    <FormField label="Thể thức nhánh đấu" required>{(id) => <NativeSelect id={id} required value={draft.value.format} onChange={(event) => change("format", event.target.value)}>
      {BRACKET_FORMATS.map((format) => <option key={format.value} value={format.value}>{LABELS[format.value]}</option>)}
    </NativeSelect>}</FormField>
    <FormMessage notice={notice} />
  </SettingsCard>;
}
export default function GameInfoPage() {
  return <TournamentEditorPage title="Thông tin game">{(entry) => <GameEditor key={entry.id} entry={entry} />}</TournamentEditorPage>;
}
