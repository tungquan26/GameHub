import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CirclePagination({ page, totalPages, onChange, label = "Phân trang" }) {
  if (totalPages <= 1) return null;
  const visible = [...new Set([1, page - 1, page, page + 1, totalPages].filter((value) => value >= 1 && value <= totalPages))].sort((a, b) => a - b);
  return <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-2 border-t border-dp-hairline p-4">
    <Button variant="ghost" size="icon" aria-label="Trang trước" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft /></Button>
    {visible.map((value, index) => <span key={value} className="flex items-center gap-2">
      {index > 0 && value > visible[index - 1] + 1 && <span aria-hidden="true" className="text-dp-meta">…</span>}
      <Button variant={value === page ? "default" : "outline"} size="icon" aria-label={`Trang ${value}`} aria-current={value === page ? "page" : undefined} className="size-8 font-mono text-xs" onClick={() => onChange(value)}>{value}</Button>
    </span>)}
    <Button variant="ghost" size="icon" aria-label="Trang tiếp theo" disabled={page === totalPages} onClick={() => onChange(page + 1)}><ChevronRight /></Button>
  </nav>;
}
