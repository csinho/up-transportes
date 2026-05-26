import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRecordingTime } from "@/lib/feedback-recorder";

export type LocalFeedbackAttachment = {
  id: string;
  file: File;
  objectUrl: string;
  tipo: "arquivo" | "gravacao";
  duracaoSegundos?: number;
};

type Props = {
  attachments: LocalFeedbackAttachment[];
  onRemove: (id: string) => void;
};

export function FeedbackAttachmentList({ attachments, onRemove }: Props) {
  const [removeId, setRemoveId] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const gravacoes = attachments.filter((a) => a.tipo === "gravacao").length;

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {gravacoes > 0 && (
            <Badge variant="secondary">
              {gravacoes} vídeo{gravacoes !== 1 ? "s" : ""} criado{gravacoes !== 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="outline">
            {attachments.length} anexo{attachments.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {attachments.map((a) => {
            const isVideo =
              a.file.type.startsWith("video/") || a.tipo === "gravacao";
            return (
              <div
                key={a.id}
                className="relative rounded-lg border border-border overflow-hidden bg-muted/30"
              >
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full shadow"
                  onClick={() => setRemoveId(a.id)}
                  aria-label="Remover anexo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                {isVideo ? (
                  <video
                    src={a.objectUrl}
                    controls
                    className="w-full max-h-48 bg-black object-contain"
                  />
                ) : (
                  <img
                    src={a.objectUrl}
                    alt={a.file.name}
                    className="w-full max-h-48 object-contain bg-muted"
                  />
                )}

                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                  {a.file.name}
                  {a.duracaoSegundos != null && (
                    <span className="ml-1">({formatRecordingTime(a.duracaoSegundos)})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este arquivo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeId) onRemove(removeId);
                setRemoveId(null);
              }}
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function createLocalAttachment(
  file: File,
  tipo: "arquivo" | "gravacao",
  duracaoSegundos?: number,
): LocalFeedbackAttachment {
  return {
    id: crypto.randomUUID(),
    file,
    objectUrl: URL.createObjectURL(file),
    tipo,
    duracaoSegundos,
  };
}

export function revokeAttachments(attachments: LocalFeedbackAttachment[]) {
  attachments.forEach((a) => URL.revokeObjectURL(a.objectUrl));
}
