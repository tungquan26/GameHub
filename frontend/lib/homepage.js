export const COLUMN_LAYOUTS = [
  { value: "1col", label: "1 Cột (100%)", grid: "grid-cols-1" },
  { value: "2col-50-50", label: "2 Cột (50% / 50%)", grid: "md:grid-cols-2" },
  { value: "2col-66-33", label: "2 Cột (66% / 33%)", grid: "md:grid-cols-[2fr_1fr]" },
  { value: "2col-33-66", label: "2 Cột (33% / 66%)", grid: "md:grid-cols-[1fr_2fr]" },
];
export const WIDGET_META = {
  MARKDOWN: { label: "Văn bản / Markdown" }, IMAGE: { label: "Hình ảnh" },
  GAME_INFO: { label: "Thông tin bộ môn & Thể thức", path: "/tournament/game-info" },
  LOCATION: { label: "Địa điểm & Bản đồ", path: "/tournament/details" },
  CONTACT: { label: "Thông tin liên hệ", path: "/tournament/details" },
  RULES: { label: "Điều lệ", path: "/tournament/details", hash: "#rulesCard" },
};
const TITLES = { Overview: "Tổng quan", "Game Info": "Thông tin bộ môn", Location: "Địa điểm", "Contact Info": "Thông tin liên hệ", Rules: "Điều lệ", "Custom Text": "Nội dung tùy chỉnh", "New Section": "Khu vực mới" };
export const localizeTitle = (value) => TITLES[String(value || "").trim()] || String(value || "").trim();
export const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = (prefix) => prefix + "_" + crypto.randomUUID();
export function defaultHomepage() {
  return [
    { id: "sec_overview", title: "Tổng quan", layout: "1col", columns: [[{ id: "wid_overview", type: "MARKDOWN", title: "", content: "" }]] },
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
      .filter((widget) => widget && Object.hasOwn(WIDGET_META, widget.type)).map((widget, index) => {
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
export function newSection() { return { id: uid("sec"), title: "Khu vực mới", layout: "1col", columns: [[]] }; }
export function newWidget(type) {
  if (!Object.hasOwn(WIDGET_META, type)) throw new Error("Tiện ích không hợp lệ.");
  return { id: uid("wid"), type, title: type === "MARKDOWN" ? "Nội dung tùy chỉnh" : "", content: type === "MARKDOWN" ? "Nhập nội dung thông báo hoặc giới thiệu tại đây..." : "", imageUrl: "", caption: "", linkUrl: "" };
}
export function editHomepage(value, action) {
  const sections = clone(value);
  if (action.type === "reset") return defaultHomepage();
  if (action.type === "add-section") return [...sections, newSection()];
  const index = sections.findIndex((section) => section.id === action.sectionId);
  const section = sections[index];
  if (!section) return sections;
  if (action.type === "title") section.title = action.value;
  if (action.type === "layout") {
    if (!COLUMN_LAYOUTS.some((layout) => layout.value === action.value)) return sections;
    section.layout = action.value;
    section.columns = action.value === "1col" ? [section.columns.flat()] : [section.columns[0], section.columns.slice(1).flat()];
  }
  if (action.type === "remove-section") sections.splice(index, 1);
  if (action.type === "move-section") {
    const target = action.targetId ? sections.findIndex((entry) => entry.id === action.targetId) : index + action.direction;
    if (target >= 0 && target < sections.length) { sections.splice(index, 1); sections.splice(target, 0, section); }
  }
  if (action.type === "add-widget" && section.columns[action.column]) section.columns[action.column].push(action.widget);
  const column = section.columns.find((items) => items.some((widget) => widget.id === action.widgetId));
  const widgetIndex = column?.findIndex((widget) => widget.id === action.widgetId) ?? -1;
  if (widgetIndex < 0) return sections;
  if (action.type === "update-widget") column[widgetIndex] = { ...column[widgetIndex], ...action.patch, id: column[widgetIndex].id, type: column[widgetIndex].type };
  if (action.type === "remove-widget") column.splice(widgetIndex, 1);
  if (action.type === "move-widget") {
    if (action.targetSectionId) {
      const target = sections.find((entry) => entry.id === action.targetSectionId)?.columns[action.targetColumn];
      if (target) { const [widget] = column.splice(widgetIndex, 1); target.push(widget); }
    } else {
      const target = widgetIndex + action.direction;
      if (target >= 0 && target < column.length) [column[widgetIndex], column[target]] = [column[target], column[widgetIndex]];
    }
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
export function cleanImageWidget(values) {
  const imageUrl = String(values.imageUrl || "").trim();
  const linkUrl = String(values.linkUrl || "").trim();
  if (!imageUrl) throw new Error("Vui lòng tải ảnh lên hoặc nhập đường dẫn URL hình ảnh.");
  if (!safeWebUrl(imageUrl, { image: true })) throw new Error("Đường dẫn ảnh không hợp lệ. Vui lòng dùng URL HTTP hoặc HTTPS.");
  if (linkUrl && !safeWebUrl(linkUrl)) throw new Error("Liên kết khi nhấn vào ảnh phải là URL HTTP hoặc HTTPS hợp lệ.");
  return { title: values.title.trim(), imageUrl, caption: values.caption.trim(), linkUrl };
}
