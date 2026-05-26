import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type CountdownDelay,
  type MediaDeviceOption,
  type RecorderSetup,
  requestCameraAccess,
  requestMicrophoneAccess,
} from "@/lib/feedback-recorder";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (setup: RecorderSetup) => void;
  loading?: boolean;
};

const COUNTDOWN_OPTIONS: { value: CountdownDelay; label: string }[] = [
  { value: 0, label: "Iniciar imediatamente" },
  { value: 3, label: "3 segundos" },
  { value: 5, label: "5 segundos" },
  { value: 10, label: "10 segundos" },
];

export function FeedbackRecorderSetupDialog({
  open,
  onOpenChange,
  onStart,
  loading,
}: Props) {
  const [countdownDelay, setCountdownDelay] = useState<CountdownDelay>(3);
  const [useMic, setUseMic] = useState(true);
  const [useCamera, setUseCamera] = useState(false);
  const [micDeviceId, setMicDeviceId] = useState("");
  const [cameraDeviceId, setCameraDeviceId] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [loadingMic, setLoadingMic] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const loadMicrophones = useCallback(async () => {
    setLoadingMic(true);
    try {
      const mics = await requestMicrophoneAccess();
      setMicrophones(mics);
      setMicDeviceId((prev) => (mics.some((m) => m.deviceId === prev) ? prev : mics[0]!.deviceId));
    } catch (err) {
      setMicrophones([]);
      setMicDeviceId("");
      toast.error(
        err instanceof Error ? err.message : "Permissão de microfone negada ou indisponível.",
      );
      setUseMic(false);
    } finally {
      setLoadingMic(false);
    }
  }, []);

  const loadCameras = useCallback(async () => {
    setLoadingCamera(true);
    try {
      const cams = await requestCameraAccess();
      setCameras(cams);
      setCameraDeviceId((prev) =>
        cams.some((c) => c.deviceId === prev) ? prev : cams[0]!.deviceId,
      );
    } catch (err) {
      setCameras([]);
      setCameraDeviceId("");
      toast.error(
        err instanceof Error ? err.message : "Permissão de câmera negada ou indisponível.",
      );
      setUseCamera(false);
    } finally {
      setLoadingCamera(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setCountdownDelay(3);
      setUseMic(true);
      setUseCamera(false);
      setMicDeviceId("");
      setCameraDeviceId("");
      setMicrophones([]);
      setCameras([]);
      return;
    }

    void loadMicrophones();
  }, [open, loadMicrophones]);

  const handleMicToggle = (enabled: boolean) => {
    setUseMic(enabled);
    if (enabled && microphones.length === 0) {
      void loadMicrophones();
    }
  };

  const handleCameraToggle = (enabled: boolean) => {
    setUseCamera(enabled);
    if (enabled && cameras.length === 0) {
      void loadCameras();
    }
  };

  const handleStart = () => {
    if (useMic && !micDeviceId && microphones.length === 0) {
      toast.error("Selecione um microfone ou desative o áudio.");
      return;
    }
    if (useCamera && !cameraDeviceId && cameras.length === 0) {
      toast.error("Selecione uma câmera ou desative o vídeo.");
      return;
    }

    onStart({
      useMic,
      micDeviceId: micDeviceId || microphones[0]?.deviceId || "",
      useCamera,
      cameraDeviceId: cameraDeviceId || cameras[0]?.deviceId || "",
      countdownDelay,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preparar gravação</DialogTitle>
          <DialogDescription>
            Escolha câmera, microfone e o tempo para iniciar. O navegador pedirá permissão ao
            habilitar microfone ou câmera.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          Tempo máximo de gravação: <strong className="text-foreground">3 minutos</strong>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Contagem para iniciar
            </Label>
            <Select
              value={String(countdownDelay)}
              onValueChange={(v) => setCountdownDelay(Number(v) as CountdownDelay)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTDOWN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Microfone
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Usar microfone</span>
                <Switch
                  checked={useMic}
                  onCheckedChange={handleMicToggle}
                  disabled={loadingMic}
                />
              </div>
            </div>
            {useMic && (
              <>
                {loadingMic ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aguardando permissão do microfone…
                  </div>
                ) : microphones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum microfone disponível. Habilite o toggle para solicitar permissão.
                  </p>
                ) : (
                  <Select value={micDeviceId} onValueChange={setMicDeviceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o microfone" />
                    </SelectTrigger>
                    <SelectContent>
                      {microphones.map((m) => (
                        <SelectItem key={m.deviceId} value={m.deviceId}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Câmera
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Usar câmera</span>
                <Switch
                  checked={useCamera}
                  onCheckedChange={handleCameraToggle}
                  disabled={loadingCamera}
                />
              </div>
            </div>
            {useCamera && (
              <>
                {loadingCamera ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aguardando permissão da câmera…
                  </div>
                ) : cameras.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma câmera disponível. Habilite o toggle para solicitar permissão.
                  </p>
                ) : (
                  <Select value={cameraDeviceId} onValueChange={setCameraDeviceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a câmera" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((c) => (
                        <SelectItem key={c.deviceId} value={c.deviceId}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            onClick={handleStart}
            disabled={loading || loadingMic || loadingCamera}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Aguardando permissões…
              </>
            ) : (
              "Iniciar gravação"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
