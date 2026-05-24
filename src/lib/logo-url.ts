import { getDocumentoSignedUrl } from "@/lib/supabase/storage";

export function isHttpLogoUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Resolve logo_url — URL http(s) ou caminho no Storage. */
export async function resolveLogoUrl(logoUrl?: string): Promise<string | null> {
  const raw = logoUrl?.trim();
  if (!raw) return null;
  if (isHttpLogoUrl(raw)) return raw;
  try {
    return await getDocumentoSignedUrl(raw, 3600);
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}

/** Converte logo para data URL (evita CORS no QR Code). */
export async function logoToDataUrl(logoUrl?: string): Promise<string | null> {
  const resolved = await resolveLogoUrl(logoUrl);
  const src = resolved ?? `${window.location.origin}/icon.svg`;
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 128;
    canvas.height = img.naturalHeight || 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    try {
      const fallback = await loadImage(`${window.location.origin}/icon.svg`);
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(fallback, 0, 0, 128, 128);
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }
}
