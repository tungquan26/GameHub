import { COLUMN_LAYOUTS, normalizeHomepage } from "@/lib/homepage";
import { cn } from "@/lib/utils";
import EmptyState from "./EmptyState";
import HomepageWidget from "./HomepageWidget";

export default function TournamentHomepage({ entry }) {
  const sections = normalizeHomepage(entry.homepageLayout);
  if (!sections.length) return <EmptyState title="Chưa có khu vực nội dung" description="Ban tổ chức chưa cập nhật nội dung trang chủ." />;

  return <div className="space-y-9">
    {sections.map((section) => <section key={section.id} aria-label={section.title || "Khu vực nội dung"} className="min-w-0">
      {section.title && <h2 className="mb-4 text-lg font-semibold break-words">{section.title}</h2>}
      <div className={cn("grid min-w-0 gap-6", COLUMN_LAYOUTS.find((layout) => layout.value === section.layout)?.grid)}>
        {section.columns.map((column, index) => <div key={index} className="min-w-0 space-y-5">
          {column.map((widget) => <HomepageWidget key={widget.id} widget={widget} entry={entry} />)}
        </div>)}
      </div>
    </section>)}
  </div>;
}
