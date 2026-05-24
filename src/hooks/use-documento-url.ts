import { useEffect, useState } from "react";
import { getDocumentoSignedUrl } from "@/lib/supabase/storage";

/** Resolve URL de exibição para documento no Storage ou URL legada. */
export function useDocumentoUrl(doc: { arquivo_url: string; storage_path?: string }) {
  const [url, setUrl] = useState(doc.arquivo_url);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (doc.storage_path) {
        try {
          const signed = await getDocumentoSignedUrl(doc.storage_path);
          if (!cancelled) setUrl(signed);
          return;
        } catch {
          if (!cancelled) setUrl(doc.arquivo_url);
          return;
        }
      }
      if (!cancelled) setUrl(doc.arquivo_url);
    })();

    return () => {
      cancelled = true;
    };
  }, [doc.arquivo_url, doc.storage_path]);

  return url;
}
