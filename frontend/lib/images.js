export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function imageWarning(kind, width, height) {
  if (kind === "content") return "";
  const [minWidth, minHeight, maxWidth, maxHeight] = kind === "banner" ? [1600, 800, 4800, 2400] : [280, 280, 4800, 4800];
  return width < minWidth || height < minHeight || width > maxWidth || height > maxHeight
    ? `Kích thước ảnh (${width}x${height}) nằm ngoài khoảng khuyến nghị ${minWidth}x${minHeight} - ${maxWidth}x${maxHeight}.` : "";
}
export function readImageFile(file, signal) {
  if (file.size > MAX_IMAGE_BYTES) return Promise.reject(new Error("Dung lượng ảnh vượt quá giới hạn tối đa 4MB."));
  if (!IMAGE_TYPES.includes(file.type)) return Promise.reject(new Error("Vui lòng chọn ảnh PNG, JPEG, WebP hoặc GIF."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const image = new Image();
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true; signal?.removeEventListener("abort", abort);
      image.onload = image.onerror = null;
      if (error) reject(error); else resolve(result);
    };
    const abort = () => { if (reader.readyState === 1) reader.abort(); finish(new DOMException("Đã hủy đọc ảnh.", "AbortError")); };
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    reader.onerror = () => finish(new Error("Không thể đọc ảnh. Vui lòng chọn ảnh hợp lệ."));
    reader.onabort = () => finish(new DOMException("Đã hủy đọc ảnh.", "AbortError"));
    reader.onload = () => {
      image.onload = () => finish(null, { dataUrl: reader.result, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      image.onerror = () => finish(new Error("Không thể đọc ảnh. Vui lòng chọn ảnh hợp lệ."));
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
