import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Trash2, Upload, FileText, Loader2 } from "lucide-react";
import type { DocumentoAnexo } from "@/types";
import { generateUuid } from "@/lib/uuid";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListPagination } from "@/components/list/ListPagination";
import { matchesAny } from "@/lib/list-utils";
import {
  uploadDocumento,
  removeDocumento,
  getDocumentoSignedUrl,
  type UploadDocumentoInput,
} from "@/lib/supabase/storage";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { useDocumentoUrl } from "@/hooks/use-documento-url";
import { toast } from "sonner";

type UploadContext = Omit<UploadDocumentoInput, "file">;

interface Props {
  documentos: DocumentoAnexo[];
  onChange: (docs: DocumentoAnexo[]) => void;
  tiposSugeridos?: string[];
  fiscal?: boolean;
  uploadContext?: UploadContext;
}

function DocumentoCard({
  doc,
  onPreview,
  onRemove,
}: {
  doc: DocumentoAnexo;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const url = useDocumentoUrl(doc);
  const isImage = (d: DocumentoAnexo) => (d.mime_type ?? "").startsWith("image/");

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
        {isImage(doc) && url ? (
          <img src={url} alt={doc.nome_arquivo} className="object-cover w-full h-full" />
        ) : (
          <FileText className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div className="text-sm space-y-0.5">
        <p className="font-medium truncate" title={doc.nome_arquivo}>
          {doc.nome_arquivo}
        </p>
        <p className="text-xs text-muted-foreground">{doc.tipo_documento}</p>
        {doc.numero_documento && (
          <p className="text-xs text-muted-foreground">
            Nº {doc.numero_documento}
            {doc.serie ? ` · Série ${doc.serie}` : ""}
          </p>
        )}
        {doc.data_validade && (
          <p className="text-xs text-muted-foreground">
            Validade: {new Date(doc.data_validade).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={onPreview} className="flex-1" disabled={!url}>
          <Eye className="h-3 w-3 mr-1" /> Ver
        </Button>
        <Button size="sm" variant="outline" asChild disabled={!url}>
          <a href={url || "#"} download={doc.nome_arquivo}>
            <Download className="h-3 w-3" />
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={onRemove}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function DocumentUploader({ documentos, onChange, tiposSugeridos = [], fiscal = false, uploadContext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("");
  const [dataValidade, setDataValidade] = useState("");
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("");
  const [chave, setChave] = useState("");
  const [preview, setPreview] = useState<DocumentoAnexo | null>(null);
  const [enviando, setEnviando] = useState(false);
  const previewUrl = useDocumentoUrl(preview ?? { arquivo_url: "" });

  const list = useListControls({
    items: documentos,
    searchFn: (d, q) => matchesAny([d.nome_arquivo, d.tipo_documento, d.numero_documento, d.serie, d.chave_acesso], q),
  });

  const handleFile = async (file: File) => {
    if (!uploadContext?.entidadeId) {
      toast.error("Salve o cadastro antes de anexar documentos.");
      return;
    }

    setEnviando(true);
    try {
      const { path } = await uploadDocumento({ ...uploadContext, file });
      const signedUrl = await getDocumentoSignedUrl(path);
      const novo: DocumentoAnexo = {
        id: generateUuid(),
        tipo_documento: tipo || "Outro",
        nome_arquivo: file.name,
        arquivo_url: signedUrl,
        storage_path: path,
        mime_type: file.type,
        data_upload: new Date().toISOString(),
        data_validade: dataValidade || undefined,
        numero_documento: numero || undefined,
        serie: serie || undefined,
        chave_acesso: chave || undefined,
      };
      onChange([...documentos, novo]);
      setTipo("");
      setDataValidade("");
      setNumero("");
      setSerie("");
      setChave("");
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Documento enviado");
    } catch (err) {
      toast.error(traduzirErroSupabase(err));
    } finally {
      setEnviando(false);
    }
  };

  const remover = (doc: DocumentoAnexo) => {
    void (async () => {
      if (doc.storage_path) {
        try {
          await removeDocumento(doc.storage_path);
        } catch (err) {
          toast.error(traduzirErroSupabase(err));
          return;
        }
      }
      onChange(documentos.filter((d) => d.id !== doc.id));
      toast.success("Documento removido");
    })();
  };

  const isImage = (d: DocumentoAnexo) => (d.mime_type ?? "").startsWith("image/");
  const isPdf = (d: DocumentoAnexo) => (d.mime_type ?? "").includes("pdf");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Tipo do documento</Label>
            <Input
              list="tipos-doc"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex: CRLV, CNH, NF-e..."
            />
            <datalist id="tipos-doc">
              {tiposSugeridos.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Data de validade</Label>
            <Input type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} />
          </div>
          {fiscal ? (
            <>
              <div>
                <Label>Número</Label>
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div>
                <Label>Série</Label>
                <Input value={serie} onChange={(e) => setSerie(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Chave de acesso</Label>
                <Input value={chave} onChange={(e) => setChave(e.target.value)} />
              </div>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            disabled={enviando || !uploadContext?.entidadeId}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {!uploadContext?.entidadeId && (
          <p className="text-xs text-muted-foreground">Salve o registro para habilitar o upload.</p>
        )}
      </div>

      <ListToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Buscar documento…"
        totalItems={list.totalItems}
        page={list.page}
        pageSize={list.pageSize}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {list.totalItems === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Nenhum documento anexado.</p>
        )}
        {list.paginated.map((d) => (
          <DocumentoCard key={d.id} doc={d} onPreview={() => setPreview(d)} onRemove={() => remover(d)} />
        ))}
      </div>

      <ListPagination page={list.page} pageCount={list.pageCount} onPageChange={list.setPage} />

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.nome_arquivo}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="w-full h-[70vh]">
              {isImage(preview) && previewUrl ? (
                <img src={previewUrl} alt={preview.nome_arquivo} className="max-h-full mx-auto" />
              ) : isPdf(preview) && previewUrl ? (
                <iframe src={previewUrl} className="w-full h-full" title={preview.nome_arquivo} />
              ) : (
                <p className="text-sm text-muted-foreground">Pré-visualização não disponível. Baixe o arquivo.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
