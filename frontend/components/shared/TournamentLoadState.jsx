import { Button } from "@/components/ui/button";
import EmptyState from "./EmptyState";
import { TournamentViewSkeleton } from "./PageSkeleton";

export default function TournamentLoadState({ status, retry }) {
  if (status === "loading") return <TournamentViewSkeleton />;
  if (status === "error") return <EmptyState title="Chưa thể tải giải đấu" description="Kiểm tra kết nối và thử lại."><Button variant="outline" size="sm" onClick={retry}>Thử lại</Button></EmptyState>;
  return <EmptyState title="Không tìm thấy giải đấu" description="Giải đấu không tồn tại hoặc liên kết không còn hợp lệ. Bạn có thể chọn một giải khác từ trang Khám phá." />;
}
