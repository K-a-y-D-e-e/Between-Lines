/** Resize in the browser and re-encode (WebP where supported) before upload. */
export async function compressImage(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not available in this browser.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process the image."))), "image/webp", 0.85),
  );
}

export function extensionFor(blob: Blob): string {
  return blob.type === "image/png" ? "png" : "webp";
}
