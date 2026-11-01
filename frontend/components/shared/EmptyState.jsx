import { Search } from "lucide-react";

export default function EmptyState({ title = "Không tìm thấy giải đấu nào phù hợp.", description, children }) {
  return <div className="dp-panel px-6 py-14 text-center">
    <Search aria-hidden="true" className="mx-auto mb-4 size-7 text-dp-meta" />
    <h3 className="text-sm font-medium">{title}</h3>
    {description && <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-dp-read">{description}</p>}
    {children && <div className="mt-5">{children}</div>}
  </div>;
}
