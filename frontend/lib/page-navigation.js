export function pageViewKey(location) {
  const params = new URLSearchParams(location.search);
  const keys = location.pathname.startsWith("/tournament/") ? ["id", "sample", "view", "tab"]
    : location.pathname === "/profile" ? ["user"] : location.pathname === "/profile/settings" ? ["tab"] : [];
  return location.pathname + keys.map((key) => `|${key}=${params.get(key) || ""}`).join("");
}

export const locationUrl = (location) => location.pathname + location.search + location.hash;

export function hashId(hash) {
  try { return decodeURIComponent(hash.replace(/^#/, "")); } catch { return ""; }
}

export function focusDescriptor(element) {
  if (!(element instanceof HTMLElement) || element === document.body || element.closest("[role=dialog]")) return null;
  const tag = element.tagName.toLowerCase();
  return { tag, id: element.id, label: element.getAttribute("aria-label"), href: element.getAttribute("href"),
    name: element.getAttribute("name"), placeholder: element.getAttribute("placeholder"), text: ["a", "button", "summary"].includes(tag) ? element.textContent.trim() : "" };
}

export function findFocusTarget(descriptor) {
  if (!descriptor) return null;
  const visible = (element) => element && !element.closest("[hidden], [inert], [aria-hidden=true]") && !element.disabled;
  if (descriptor.id) {
    const target = document.getElementById(descriptor.id);
    if (visible(target) && target.tagName.toLowerCase() === descriptor.tag) return target;
  }
  return [...document.querySelectorAll("a, button, input, select, textarea, summary")].find((element) => visible(element) && element.tagName.toLowerCase() === descriptor.tag
    && (descriptor.label ? element.getAttribute("aria-label") === descriptor.label
      : descriptor.href ? element.getAttribute("href") === descriptor.href
        : descriptor.name ? element.getAttribute("name") === descriptor.name
          : descriptor.placeholder ? element.getAttribute("placeholder") === descriptor.placeholder
            : descriptor.text && element.textContent.trim() === descriptor.text)) || null;
}

export function focusWithoutScroll(element) {
  if (!element) return;
  if (!element.matches("a, button, input, select, textarea, summary, [tabindex]")) element.tabIndex = -1;
  element.focus({ preventScroll: true });
}
