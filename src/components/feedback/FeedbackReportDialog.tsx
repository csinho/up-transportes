import { CheckCircle2, CloudUpload, Loader2, Scan } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createLocalAttachment,
  FeedbackAttachmentList,
  revokeAttachments,
  type LocalFeedbackAttachment,
} from "@/components/feedback/FeedbackAttachmentList";
import { FeedbackCountdownOverlay } from "@/components/feedback/FeedbackCountdownOverlay";
import { FeedbackRecorderSetupDialog } from "@/components/feedback/FeedbackRecorderSetupDialog";
import {
  FeedbackCameraPreview,
  FeedbackRecordingToolbar,
} from "@/components/feedback/FeedbackRecordingToolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveTenantId } from "@/data/store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useEnviarFeedbackReport } from "@/hooks/use-feedback-report";
import {
  FEEDBACK_MAX_RECORDING_SECONDS,
  FeedbackScreenRecorder,
  type RecorderSetup,
  recordingResultToFile,
} from "@/lib/feedback-recorder";
import {
  FEEDBACK_MAX_ANEXOS,
  FEEDBACK_MAX_FILE_BYTES,
} from "@/lib/supabase/storage";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { FEEDBACK_IMPACTO_LABELS, type FeedbackImpacto } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ACCEPT_FILES = "image/png,image/jpeg,image/jpg,video/mp4,video/webm";

export function FeedbackReportDialog({ open, onOpenChange }: Props) {
  const tenantId = useActiveTenantId();
  const { user } = useAuthSession();
  const enviar = useEnviarFeedbackReport();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [impacto, setImpacto] = useState<FeedbackImpacto | "">("");
  const [attachments, setAttachments] = useState<LocalFeedbackAttachment[]>([]);
  const [enviado, setEnviado] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(FEEDBACK_MAX_RECORDING_SECONDS);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [preparingRecording, setPreparingRecording] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const recorderRef = useRef<FeedbackScreenRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = (next: boolean) => {
    if (!next) {
      if (recording) {
        recorderRef.current?.cancel();
        stopTimer();
        setRecording(false);
        setCameraStream(null);
      }
      setAttachments((prev) => {
        revokeAttachments(prev);
        return [];
      });
      setTitulo("");
      setDescricao("");
      setImpacto("");
      setEnviado(false);
    }
    onOpenChange(next);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = FEEDBACK_MAX_ANEXOS - attachments.length;
    if (room <= 0) {
      toast.error(`Máximo de ${FEEDBACK_MAX_ANEXOS} anexos por feedback.`);
      return;
    }

    for (const file of list.slice(0, room)) {
      if (file.size > FEEDBACK_MAX_FILE_BYTES) {
        toast.error(`"${file.name}" excede 100 MB.`);
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      setAttachments((prev) => [
        ...prev,
        createLocalAttachment(file, isVideo ? "gravacao" : "arquivo"),
      ]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const finishRecording = async () => {
    stopTimer();
    const recorder = recorderRef.current;
    if (!recorder) return;

    const result = await recorder.stop();
    setRecording(false);
    setCameraStream(null);
    recorderRef.current = null;

    if (result && result.blob.size > 0) {
      const file = recordingResultToFile(result);
      if (attachments.length >= FEEDBACK_MAX_ANEXOS) {
        toast.error(`Máximo de ${FEEDBACK_MAX_ANEXOS} anexos por feedback.`);
        return;
      }
      setAttachments((prev) => [
        ...prev,
        createLocalAttachment(file, "gravacao", result.durationSeconds),
      ]);
      toast.success("Gravação adicionada ao feedback.");
    }
  };

  const startRecordingFlow = async (setup: RecorderSetup) => {
    setPreparingRecording(true);
    try {
      const recorder = new FeedbackScreenRecorder();
      await recorder.prepareStreams(setup);
      recorderRef.current = recorder;
      setSetupOpen(false);
      setMicEnabled(setup.useMic);

      if (setup.useCamera && recorder.cameraPreviewStream) {
        setCameraStream(recorder.cameraPreviewStream);
      }

      const runCountdown = (n: number) => {
        if (n <= 0) {
          setCountdown(null);
          recorder.startRecording();
          setRecording(true);
          setRemainingSeconds(FEEDBACK_MAX_RECORDING_SECONDS);
          setIsPaused(false);

          timerRef.current = setInterval(() => {
            const rec = recorderRef.current;
            if (!rec) return;
            const remaining = rec.getRemainingSeconds();
            setRemainingSeconds(remaining);
            setIsPaused(rec.isPausedState());
            if (remaining <= 0) {
              void finishRecording();
            }
          }, 500);
          return;
        }
        setCountdown(n);
        setTimeout(() => runCountdown(n - 1), 1000);
      };

      if (setup.countdownDelay === 0) {
        runCountdown(0);
      } else {
        runCountdown(setup.countdownDelay);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a gravação. Verifique as permissões do navegador.",
      );
      recorderRef.current?.cancel();
      recorderRef.current = null;
      setCameraStream(null);
    } finally {
      setPreparingRecording(false);
    }
  };

  const handleSubmit = () => {
    if (!tenantId) {
      toast.error("Transportadora não carregada.");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Informe um título.");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Descreva o problema ou sugestão.");
      return;
    }
    if (!impacto) {
      toast.error("Selecione o impacto.");
      return;
    }

    enviar.mutate(
      {
        transportadoraId: tenantId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        impacto,
        userEmail: user?.email ?? undefined,
        userNome: (user?.user_metadata?.nome as string | undefined) ?? undefined,
        paginaUrl: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        anexos: attachments.map((a) => ({
          file: a.file,
          tipo: a.tipo,
          duracaoSegundos: a.duracaoSegundos,
        })),
      },
      {
        onSuccess: () => {
          setEnviado(true);
          toast.success("Feedback enviado com sucesso!", {
            description:
              "Recebemos sua mensagem. Obrigado por nos ajudar a melhorar o sistema.",
          });
        },
        onError: (err) => toast.error(traduzirErroSupabase(err)),
      },
    );
  };

  useEffect(() => {
    return () => {
      stopTimer();
      recorderRef.current?.cancel();
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {enviado ? (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">Feedback enviado</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <CheckCircle2 className="h-14 w-14 text-brand-blue" />
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Obrigado pelo feedback!</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Recebemos sua mensagem e vamos analisar em breve. Se for um bug, nossa
                    equipe trabalhará na correção o mais rápido possível.
                  </p>
                </div>
                <Button type="button" onClick={() => handleClose(false)} className="mt-2">
                  Fechar
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Enviar feedback</DialogTitle>
                <DialogDescription>
                  Nos ajude a melhorar o sistema — reporte um problema técnico ou envie
                  sugestões.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-titulo">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fb-titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex.: Erro ao salvar viagem na aba Documentos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-descricao">
                    Descrição <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="fb-descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    placeholder='Descreva o que aconteceu e o que você esperava. Ex.: "Cliquei em Salvar e nada aconteceu; deveria aparecer confirmação."'
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Impacto <span className="text-destructive">*</span>
                  </Label>
                  <Select value={impacto} onValueChange={(v) => setImpacto(v as FeedbackImpacto)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FEEDBACK_IMPACTO_LABELS) as FeedbackImpacto[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {FEEDBACK_IMPACTO_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FeedbackAttachmentList attachments={attachments} onRemove={removeAttachment} />

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={() => setSetupOpen(true)}
                    disabled={attachments.length >= FEEDBACK_MAX_ANEXOS || recording}
                  >
                    <Scan className="h-4 w-4" />
                    {attachments.some((a) => a.tipo === "gravacao")
                      ? "Gravar outro vídeo"
                      : "Gravar tela agora"}
                  </Button>

                  <div className="relative flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_FILES}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-brand-blue/50 hover:bg-muted/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                    }}
                    disabled={attachments.length >= FEEDBACK_MAX_ANEXOS}
                  >
                    <CloudUpload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clique para fazer upload ou arraste aqui</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPEG, JPG, MP4 ou WebM (máx. 100 MB)
                    </p>
                  </button>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Fechar
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={enviar.isPending}>
                  {enviar.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando…
                    </>
                  ) : (
                    "Enviar feedback"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <FeedbackRecorderSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onStart={startRecordingFlow}
        loading={preparingRecording}
      />

      <FeedbackCountdownOverlay value={countdown} />

      {recording && (
        <>
          <FeedbackRecordingToolbar
            remainingSeconds={remainingSeconds}
            micEnabled={micEnabled}
            isPaused={isPaused}
            onStop={() => void finishRecording()}
            onToggleMic={() => {
              const next = !micEnabled;
              setMicEnabled(next);
              recorderRef.current?.toggleMic(next);
            }}
            onTogglePause={() => {
              const rec = recorderRef.current;
              if (!rec) return;
              if (rec.isPausedState()) {
                rec.resumeRecording();
                setIsPaused(false);
              } else {
                rec.pauseRecording();
                setIsPaused(true);
              }
            }}
            onRestart={() => {
              recorderRef.current?.cancel();
              stopTimer();
              setRecording(false);
              setCameraStream(null);
              recorderRef.current = null;
              setSetupOpen(true);
            }}
            onCancel={() => {
              recorderRef.current?.cancel();
              stopTimer();
              setRecording(false);
              setCameraStream(null);
              recorderRef.current = null;
              toast.info("Gravação cancelada.");
            }}
          />
          <FeedbackCameraPreview stream={cameraStream} />
        </>
      )}
    </>
  );
}
