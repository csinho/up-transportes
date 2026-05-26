import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DocumentoAnexo } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDocumentoUrl } from "@/hooks/use-documento-url";
import { Download, Eye, FileText } from "lucide-react";

function DocumentoItem({
  doc,
  onPreview,
}: {
  doc: DocumentoAnexo;
  onPreview: () => void;
}) {
  const url = useDocumentoUrl(doc);
  const isImage = (doc.mime_type ?? "").startsWith("image/");

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {isImage && url ? (
            <img src={url} alt="" className="object-cover w-full h-full" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{doc.tipo_documento}</p>
          <p className="text-xs text-muted-foreground truncate" title={doc.nome_arquivo}>
            {doc.nome_arquivo}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(doc.data_upload), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onPreview} disabled={!url}>
          <Eye className="h-3.5 w-3.5 mr-1" />
          Ver
        </Button>
        <Button size="sm" variant="outline" className="flex-1" asChild disabled={!url}>
          <a href={url || "#"} download={doc.nome_arquivo} target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5 mr-1" />
            Baixar
          </a>
        </Button>
      </div>
    </div>
  );
}

export function MotoristaDocumentosLista({ documentos }: { documentos: DocumentoAnexo[] }) {
  const [preview, setPreview] = useState<DocumentoAnexo | null>(null);
  const previewUrl = useDocumentoUrl(preview ?? { arquivo_url: "" });
  const isImage = (d: DocumentoAnexo) => (d.mime_type ?? "").startsWith("image/");
  const isPdf = (d: DocumentoAnexo) => (d.mime_type ?? "").includes("pdf");

  const ordenados = [...documentos].sort(
    (a, b) => new Date(b.data_upload).getTime() - new Date(a.data_upload).getTime(),
  );

  if (ordenados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhum documento anexado a esta viagem ainda.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {ordenados.map((doc) => (
          <DocumentoItem key={doc.id} doc={doc} onPreview={() => setPreview(doc)} />
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle>{preview?.tipo_documento}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="w-full max-h-[70dvh] overflow-auto">
              {isImage(preview) && previewUrl ? (
                <img src={previewUrl} alt={preview.nome_arquivo} className="max-w-full mx-auto rounded-lg" />
              ) : isPdf(preview) && previewUrl ? (
                <iframe src={previewUrl} className="w-full h-[60dvh] rounded-lg border" title={preview.nome_arquivo} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Pré-visualização indisponível. Use Baixar para abrir o arquivo.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
