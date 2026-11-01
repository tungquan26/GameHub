export async function afterPageEnter(element) {
  const page = element.closest("[data-page-ready]");
  await Promise.allSettled((page?.getAnimations?.() || []).map((animation) => animation.finished));
}

export function motionDuration(element, token, fallback) {
  return parseFloat(getComputedStyle(element).getPropertyValue(token)) || fallback;
}

export function imageReady(image, signal) {
  if (!image || image.complete || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      image.removeEventListener("load", done); image.removeEventListener("error", done);
      signal.removeEventListener("abort", done); resolve();
    };
    image.addEventListener("load", done, { once: true }); image.addEventListener("error", done, { once: true });
    signal.addEventListener("abort", done, { once: true });
  });
}
