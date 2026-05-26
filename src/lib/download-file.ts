/** Baixa arquivo via fetch + blob (evita abrir nova aba no PWA mobile). */
export async function downloadFileFromUrl(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Não foi possível baixar o arquivo.");
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename || "documento";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export function isDocumentoImagem(doc: { mime_type?: string; nome_arquivo?: string }): boolean {
  if (doc.mime_type?.startsWith("image/")) return true;
  const nome = (doc.nome_arquivo ?? "").toLowerCase();
  return /\.(png|jpe?g|webp|gif|heic|heif)$/.test(nome);
}
