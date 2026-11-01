export function matchLabel(match) {
  return match.status === "COMPLETED" && match.result ? "Đã kết thúc" : match.teamA && match.teamB ? "Sắp diễn ra" : match.roundNumber === 1 ? "Chờ xác định đội" : "Chờ kết quả vòng trước";
}
export function matchAction(match) { return match.result ? "Sửa kết quả" : match.teamA && match.teamB ? "Nhập kết quả" : "Đổi giờ đấu"; }
export default function MatchStatus({ match }) {
  return <span className={`inline-flex rounded-pill border border-dp-hairline-2 px-2.5 py-1 text-[10px] leading-4 ${match.result ? "text-dp-live" : "text-dp-read"}`}>{matchLabel(match)}</span>;
}
