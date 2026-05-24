import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Trash2, Upload, FileText } from "lucide-react";
import type { DocumentoAnexo } from "@/types";

interface Props {
  documentos: DocumentoAnexo[];
  onChange: (docs: DocumentoAnexo[]) => void;
  tiposSugeridos?: string[];
  /** Campos extras (numero/serie/chave) — usar para documentos fiscais de viagem */
  fiscal?: boolean;
}

export function DocumentUploader({ documentos, onChange, tiposSugeridos = [], fiscal = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("");
  const [dataValidade, setDataValidade] = useState("");
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("");
  const [chave, setChave] = useState("");
  const [preview, setPreview] = useState<DocumentoAnexo | null>(null);

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    const novo: DocumentoAnexo = {
      id: crypto.randomUUID(),
      tipo_documento: tipo || "Outro",
      nome_arquivo: file.name,
      arquivo_url: url,
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
  };

  const remover = (id: string) => onChange(documentos.filter((d) => d.id !== id));

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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {documentos.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Nenhum documento anexado.</p>
        )}
        {documentos.map((d) => (
          <div key={d.id} className="rounded-lg border p-3 space-y-2">
            <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
              {isImage(d) ? (
                <img src={d.arquivo_url} alt={d.nome_arquivo} className="object-cover w-full h-full" />
              ) : (
                <FileText className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="text-sm space-y-0.5">
              <p className="font-medium truncate" title={d.nome_arquivo}>
                {d.nome_arquivo}
              </p>
              <p className="text-xs text-muted-foreground">{d.tipo_documento}</p>
              {d.numero_documento && (
                <p className="text-xs text-muted-foreground">
                  Nº {d.numero_documento}
                  {d.serie ? ` · Série ${d.serie}` : ""}
                </p>
              )}
              {d.data_validade && (
                <p className="text-xs text-muted-foreground">Validade: {new Date(d.data_validade).toLocaleDateString("pt-BR")}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setPreview(d)} className="flex-1">
                <Eye className="h-3 w-3 mr-1" /> Ver
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={d.arquivo_url} download={d.nome_arquivo}>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => remover(d.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.nome_arquivo}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="w-full h-[70vh]">
              {isImage(preview) ? (
                <img src={preview.arquivo_url} alt={preview.nome_arquivo} className="max-h-full mx-auto" />
              ) : isPdf(preview) ? (
                <iframe src={preview.arquivo_url} className="w-full h-full" />
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
