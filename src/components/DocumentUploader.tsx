import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Download, Trash2, Upload, FileText, Loader2 } from "lucide-react";
import type { DocumentoAnexo } from "@/types";
import { generateUuid } from "@/lib/uuid";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListPagination } from "@/components/list/ListPagination";
import { matchesAny } from "@/lib/list-utils";
import { uploadDocumento, removeDocumento, type UploadDocumentoInput } from "@/lib/supabase/storage";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { useDocumentoUrl } from "@/hooks/use-documento-url";
import { TIPOS_DOCUMENTO_VIAGEM } from "@/lib/tipos-documento-viagem";
import { toast } from "sonner";

type UploadContext = Omit<UploadDocumentoInput, "file">;

interface Props {
  documentos: DocumentoAnexo[];
  onChange: (docs: DocumentoAnexo[]) => void;
  tiposSugeridos?: string[];
  /** @deprecated use variant="cadastro" */
  fiscal?: boolean;
  variant?: "viagem" | "cadastro";
  uploadContext?: UploadContext;
}

function DocumentoCard({
  doc,
  onPreview,
  onRemove,
  tituloPrincipal,
}: {
  doc: DocumentoAnexo;
  onPreview: () => void;
  onRemove: () => void;
  tituloPrincipal?: boolean;
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
        {tituloPrincipal ? (
          <>
            <p className="font-medium truncate" title={doc.tipo_documento}>
              {doc.tipo_documento}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={doc.nome_arquivo}>
              {doc.nome_arquivo}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium truncate" title={doc.nome_arquivo}>
              {doc.nome_arquivo}
            </p>
            <p className="text-xs text-muted-foreground">{doc.tipo_documento}</p>
          </>
        )}
        {!tituloPrincipal && doc.numero_documento && (
          <p className="text-xs text-muted-foreground">
            Nº {doc.numero_documento}
            {doc.serie ? ` · Série ${doc.serie}` : ""}
          </p>
        )}
        {!tituloPrincipal && doc.data_validade && (
          <p className="text-xs text-muted-foreground">
            Validade: {new Date(doc.data_validade).toLocaleDateString("pt-BR")}
          </p>
        )}
        {tituloPrincipal && (
          <p className="text-xs text-muted-foreground">
            {new Date(doc.data_upload).toLocaleDateString("pt-BR")}
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

export function DocumentUploader({
  documentos,
  onChange,
  tiposSugeridos = [],
  fiscal = false,
  variant,
  uploadContext,
}: Props) {
  const modo = variant ?? (fiscal ? "cadastro" : "cadastro");
  const isViagem = modo === "viagem";
  const tiposLista = isViagem ? [...TIPOS_DOCUMENTO_VIAGEM] : tiposSugeridos;

  const inputRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("");
  const [arquivoPendente, setArquivoPendente] = useState<File | null>(null);
  const [dataValidade, setDataValidade] = useState("");
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("");
  const [chave, setChave] = useState("");
  const [preview, setPreview] = useState<DocumentoAnexo | null>(null);
  const [enviando, setEnviando] = useState(false);
  const previewUrl = useDocumentoUrl(preview ?? { arquivo_url: "" });

  const list = useListControls({
    items: documentos,
    searchFn: (d, q) =>
      matchesAny(
        [d.nome_arquivo, d.tipo_documento, d.numero_documento, d.serie, d.chave_acesso],
        q,
      ),
  });

  const limparFormulario = () => {
    setTipo("");
    setArquivoPendente(null);
    setDataValidade("");
    setNumero("");
    setSerie("");
    setChave("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const enviarDocumento = async (file: File) => {
    if (!uploadContext?.entidadeId) {
      toast.error("Salve o cadastro antes de anexar documentos.");
      return;
    }

    setEnviando(true);
    try {
      const { path } = await uploadDocumento({ ...uploadContext, file });
      const novo: DocumentoAnexo = {
        id: generateUuid(),
        tipo_documento: tipo || "Outro",
        nome_arquivo: file.name,
        arquivo_url: "",
        storage_path: path,
        mime_type: file.type,
        data_upload: new Date().toISOString(),
        ...(isViagem
          ? {}
          : {
              data_validade: dataValidade || undefined,
              numero_documento: numero || undefined,
              serie: serie || undefined,
              chave_acesso: chave || undefined,
            }),
      };
      onChange([...documentos, novo]);
      limparFormulario();
      toast.success("Documento enviado");
    } catch (err) {
      toast.error(traduzirErroSupabase(err));
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarViagem = () => {
    if (!tipo) return toast.error("Selecione o tipo do documento");
    if (!arquivoPendente) return toast.error("Selecione um arquivo");
    void enviarDocumento(arquivoPendente);
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
        {isViagem ? (
          <>
            <div className="space-y-2">
              <Label>Tipo do documento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo…" />
                </SelectTrigger>
                <SelectContent>
                  {tiposLista.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                disabled={enviando || !uploadContext?.entidadeId}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setArquivoPendente(f ?? null);
                }}
              />
              {arquivoPendente && (
                <p className="text-xs text-muted-foreground">Selecionado: {arquivoPendente.name}</p>
              )}
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={enviando || !uploadContext?.entidadeId || !tipo || !arquivoPendente}
              onClick={handleEnviarViagem}
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar documento
                </>
              )}
            </Button>
          </>
        ) : (
          <>
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
                  {tiposLista.map((t) => (
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
                  if (f) void enviarDocumento(f);
                }}
              />
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </>
        )}
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
          <DocumentoCard
            key={d.id}
            doc={d}
            tituloPrincipal={isViagem}
            onPreview={() => setPreview(d)}
            onRemove={() => remover(d)}
          />
        ))}
      </div>

      <ListPagination page={list.page} pageCount={list.pageCount} onPageChange={list.setPage} />

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isViagem ? preview?.tipo_documento : preview?.nome_arquivo}</DialogTitle>
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
