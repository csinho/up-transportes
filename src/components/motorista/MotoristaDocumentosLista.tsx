import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DocumentoAnexo } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDocumentoUrl } from "@/hooks/use-documento-url";
import { downloadFileFromUrl, isDocumentoImagem } from "@/lib/download-file";

function DocumentoItem({
  doc,
  onPreview,
}: {
  doc: DocumentoAnexo;
  onPreview: () => void;
}) {
  const url = useDocumentoUrl(doc);
  const [baixando, setBaixando] = useState(false);
  const isImage = isDocumentoImagem(doc);

  const baixar = async () => {
    if (!url || baixando) return;
    setBaixando(true);
    try {
      await downloadFileFromUrl(url, doc.nome_arquivo);
      toast.success("Download iniciado.");
    } catch {
      toast.error("Não foi possível baixar o arquivo. Verifique sua conexão.");
    } finally {
      setBaixando(false);
    }
  };

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

      {isImage ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onPreview}
            disabled={!url}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => void baixar()}
            disabled={!url || baixando}
          >
            {baixando ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1" />
            )}
            Baixar
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => void baixar()}
          disabled={!url || baixando}
        >
          {baixando ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1" />
          )}
          Baixar documento
        </Button>
      )}
    </div>
  );
}

export function MotoristaDocumentosLista({ documentos }: { documentos: DocumentoAnexo[] }) {
  const [preview, setPreview] = useState<DocumentoAnexo | null>(null);
  const previewUrl = useDocumentoUrl(preview ?? { arquivo_url: "" });

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
          <DocumentoItem
            key={doc.id}
            doc={doc}
            onPreview={() => {
              if (isDocumentoImagem(doc)) setPreview(doc);
            }}
          />
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle>{preview?.tipo_documento}</DialogTitle>
          </DialogHeader>
          {preview && previewUrl && (
            <div className="w-full max-h-[70dvh] overflow-auto">
              <img
                src={previewUrl}
                alt={preview.nome_arquivo}
                className="max-w-full mx-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
