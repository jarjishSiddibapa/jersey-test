const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB
const MAX_RENDER_DIMENSION = 512;

export interface LogoProcessResult {
  dataUrl: string;
  error?: string;
}

export function validateLogoFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Please upload a PNG, JPG or WebP file.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File is too large. Maximum size is 1 MB.";
  }
  return null;
}

/**
 * Downscales and compresses an uploaded logo client-side so nothing
 * oversized ever lands in localStorage. Preserves aspect ratio and alpha.
 */
export async function processLogoFile(file: File): Promise<LogoProcessResult> {
  const validationError = validateLogoFile(file);
  if (validationError) return { dataUrl: "", error: validationError };

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_RENDER_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataUrl: "", error: "Could not process image." };
    ctx.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/webp", 0.85);
    return { dataUrl };
  } catch {
    return { dataUrl: "", error: "Could not read that image." };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
