const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB
const MAX_RENDER_DIMENSION = 512;
// Guards against a maliciously-crafted huge-dimension image forcing the
// browser to decode/rasterize an enormous canvas before we get a chance
// to downscale it. SVG is deliberately NOT in ACCEPTED_TYPES: safely
// sanitizing arbitrary SVG (stripping <script>, event handler attributes,
// external references) needs a real sanitizer library or a server-side
// pass we don't have wired up yet, so it's rejected outright rather than
// half-sanitized client-side.
const MAX_SOURCE_DIMENSION = 6000;

export interface LogoProcessResult {
  dataUrl: string;
  error?: string;
}

// Magic-byte signatures for the three accepted formats. File.type is
// attacker-controlled (just a client-reported string) so it's checked
// alongside, never instead of, the actual bytes.
const SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"; WEBP marker follows at offset 8, checked separately below
];

async function sniffSignature(file: File): Promise<string | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    const matches = sig.bytes.every((byte, i) => header[offset + i] === byte);
    if (!matches) continue;
    if (sig.type === "image/webp") {
      const webpMarker = String.fromCharCode(...header.slice(8, 12));
      if (webpMarker !== "WEBP") continue;
    }
    return sig.type;
  }
  return null;
}

export async function validateLogoFile(file: File): Promise<string | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Please upload a PNG, JPG or WebP file.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File is too large. Maximum size is 1 MB.";
  }
  const sniffed = await sniffSignature(file);
  if (!sniffed) {
    return "That file doesn't look like a real PNG, JPG or WebP image.";
  }
  return null;
}

/**
 * Downscales and compresses an uploaded logo client-side so nothing
 * oversized ever lands in localStorage. Preserves aspect ratio and alpha.
 */
export async function processLogoFile(file: File): Promise<LogoProcessResult> {
  const validationError = await validateLogoFile(file);
  if (validationError) return { dataUrl: "", error: validationError };

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    if (image.width > MAX_SOURCE_DIMENSION || image.height > MAX_SOURCE_DIMENSION) {
      return { dataUrl: "", error: "Image dimensions are too large." };
    }
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
