import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { tournamentApi } from "@/lib/api";
import EmptyState from "./EmptyState";

const statuses = ["PENDING", "FINAL", "UNAVAILABLE"];
const honours = { 1: "Vô địch", 2: "Á quân" };

function StandingsTable({ rows }) {
  return <div role="region" aria-label="Bảng xếp hạng đội" tabIndex={0}
    className="dp-panel min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-dp-live">
    <table aria-labelledby="public-standings-title" className="w-full min-w-[36rem] text-sm">
      <thead className="bg-dp-ground text-xs text-dp-meta">
        <tr>
          <th scope="col" className="px-4 py-4 text-center font-medium">Hạng</th>
          <th scope="col" className="px-4 py-4 text-left font-medium">Đội</th>
          <th scope="col" className="px-4 py-4 text-left font-medium whitespace-nowrap">Vòng đạt được</th>
          <th scope="col" className="px-4 py-4 text-center font-medium">Trận</th>
          <th scope="col" className="px-4 py-4 text-center font-medium">Thắng</th>
          <th scope="col" className="px-4 py-4 text-center font-medium">Thua</th>
        </tr>
      </thead>
      <tbody>{rows.map((row) => <tr key={row.teamId} className="border-t border-dp-hairline">
        <td className="px-4 py-3 text-center font-mono tabular-nums">{row.rank}</td>
        <th scope="row" className="max-w-64 px-4 py-3 text-left font-medium break-words">
          {row.teamName}
          {honours[row.rank] && <span className="mt-1 block text-xs text-dp-live">{honours[row.rank]}</span>}
        </th>
        <td className="px-4 py-3 whitespace-nowrap text-dp-read">{row.roundReached}</td>
        <td className="px-4 py-3 text-center font-mono tabular-nums">{row.matchesPlayed}</td>
        <td className="px-4 py-3 text-center font-mono tabular-nums">{row.wins}</td>
        <td className="px-4 py-3 text-center font-mono tabular-nums">{row.losses}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export default function TournamentStandings({ tournamentId }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: "LOADING" });

  useEffect(() => {
    const controller = new AbortController();
    tournamentApi.standings(tournamentId, { signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return;
      if (!statuses.includes(response?.status) || !Array.isArray(response.rows)) {
        setResult({ status: "ERROR" });
        return;
      }
      setResult(response);
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ status: "ERROR" });
    });
    return () => controller.abort();
  }, [tournamentId, attempt]);

  function retry() {
    setResult({ status: "LOADING" });
    setAttempt((value) => value + 1);
  }

  return <section aria-labelledby="public-standings-title" className="min-w-0">
    <h2 id="public-standings-title" className="mb-5 text-xl font-semibold">Xếp hạng đội</h2>
    {result.status === "LOADING" && <p role="status" className="dp-panel p-5 text-sm text-dp-read">Đang tải bảng xếp hạng…</p>}
    {result.status === "ERROR" && <EmptyState title="Chưa thể tải bảng xếp hạng" description="Kiểm tra kết nối và thử lại.">
      <Button variant="outline" size="sm" onClick={retry}>Thử lại</Button>
    </EmptyState>}
    {result.status === "PENDING" && <EmptyState title="Chờ công bố bảng xếp hạng"
      description="Bảng xếp hạng sẽ xuất hiện khi tất cả các trận có kết quả." />}
    {result.status === "UNAVAILABLE" && <EmptyState title="Giải đấu này chưa có bảng xếp hạng công khai" />}
    {result.status === "FINAL" && <StandingsTable rows={result.rows} />}
  </section>;
}
