export function parseVietnamDateTime(value) {
  if (!value) return NaN;
  const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value);
  return Date.parse(local ? `${value}+07:00` : value);
}

export function currentDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type) => parts.find((value) => value.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function pastDateError(values, fields, { original = {}, now = new Date() } = {}) {
  const today = currentDay(now);
  return fields.some((field) => values[field] && values[field] !== original[field] && /^\d{4}-\d{2}-\d{2}/.test(values[field]) && values[field].slice(0, 10) < today)
    ? "Vui lòng chọn ngày từ hôm nay trở đi." : "";
}
