export const COLUMN_LAYOUTS = [
  { value: "1col", grid: "grid-cols-1" },
  { value: "2col-50-50", grid: "md:grid-cols-2" },
  { value: "2col-66-33", grid: "md:grid-cols-[2fr_1fr]" },
  { value: "2col-33-66", grid: "md:grid-cols-[1fr_2fr]" },
];
const WIDGET_TYPES = new Set(["MARKDOWN", "IMAGE", "GAME_INFO", "LOCATION", "CONTACT", "RULES"]);
const TITLES = { Overview: "Tổng quan", "Game Info": "Thông tin bộ môn", Location: "Địa điểm", "Contact Info": "Thông tin liên hệ", Rules: "Điều lệ", "Custom Text": "Nội dung tùy chỉnh", "New Section": "Khu vực mới" };
export const localizeTitle = (value) => TITLES[String(value || "").trim()] || String(value || "").trim();
export const clone = (value) => JSON.parse(JSON.stringify(value));
const newOverviewWidget = (content = "") => ({ id: "wid_overview", type: "MARKDOWN", title: "", content });
export function defaultHomepage() {
  return [
    { id: "sec_overview", title: "Tổng quan", layout: "1col", columns: [[newOverviewWidget()]] },
    { id: "sec_game", title: "Thông tin bộ môn", layout: "1col", columns: [[{ id: "wid_game", type: "GAME_INFO", title: "" }]] },
    { id: "sec_loc_contact", title: "", layout: "1col", columns: [[{ id: "wid_location", type: "LOCATION", title: "Địa điểm" }, { id: "wid_contact", type: "CONTACT", title: "Thông tin liên hệ" }]] },
    { id: "sec_rules", title: "Điều lệ", layout: "1col", columns: [[{ id: "wid_rules", type: "RULES", title: "" }]] },
  ];
}
export function normalizeHomepage(value) {
  if (!Array.isArray(value)) return defaultHomepage();
  const sectionIds = new Set(); const widgetIds = new Set();
  return value.filter((section) => section && typeof section === "object").map((section, sectionIndex) => {
    let id = String(section.id || "section-" + sectionIndex);
    while (sectionIds.has(id)) id += "-copy";
    sectionIds.add(id);
    const layout = COLUMN_LAYOUTS.some((item) => item.value === section.layout) ? section.layout : "1col";
    const columns = (Array.isArray(section.columns) ? section.columns : [[]]).map((column) => (Array.isArray(column) ? column : [])
      .filter((widget) => widget && WIDGET_TYPES.has(widget.type)).map((widget, index) => {
        let widgetId = String(widget.id || `${id}-widget-${index}`);
        while (widgetIds.has(widgetId)) widgetId += "-copy";
        widgetIds.add(widgetId);
        const text = Object.fromEntries(["content", "imageUrl", "caption", "linkUrl"].map((key) => [key, typeof widget[key] === "string" ? widget[key] : ""]));
        return { ...widget, ...text, id: widgetId, title: localizeTitle(widget.title) };
      }));
    const normalized = layout === "1col" ? [columns.flat()] : [columns[0] || [], columns.slice(1).flat()];
    return { ...section, id, title: localizeTitle(section.title), layout, columns: normalized };
  });
}
function overviewSection(sections) {
  return sections.find((section) => section.id === "sec_overview");
}
function overviewWidget(sections) {
  return sections.flatMap((section) => section.columns.flat())
    .find((widget) => widget.type === "MARKDOWN" && widget.id === "wid_overview")
    ?? overviewSection(sections)?.columns.flat().find((widget) => widget.type === "MARKDOWN");
}
export function homepageOverview(layout) {
  return overviewWidget(normalizeHomepage(layout))?.content ?? "";
}
export function withHomepageOverview(layout, content) {
  const sections = normalizeHomepage(layout);
  const widget = overviewWidget(sections);
  if (widget) {
    widget.content = content;
  } else {
    const section = overviewSection(sections);
    const overview = newOverviewWidget(content);
    if (section) section.columns[0].unshift(overview);
    else sections.unshift({ id: "sec_overview", title: "Tổng quan", layout: "1col", columns: [[overview]] });
  }
  return sections;
}
export function safeWebUrl(value, { image = false } = {}) {
  const text = String(value || "").trim();
  if (image && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(text)) return text;
  if (image && /^\/(?!\/)/.test(text) && !/[\u0000-\u0020\\]/.test(text)) return text;
  try { const url = new URL(text); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
