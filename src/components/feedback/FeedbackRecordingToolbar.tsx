import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Trash2,
  Video,
  VideoOff,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRecordingTime } from "@/lib/feedback-recorder";

type Props = {
  remainingSeconds: number;
  micEnabled: boolean;
  micAvailable: boolean;
  cameraEnabled: boolean;
  cameraAvailable: boolean;
  isPaused: boolean;
  onStop: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onTogglePause: () => void;
  onCancel: () => void;
};

export function FeedbackRecordingToolbar({
  remainingSeconds,
  micEnabled,
  micAvailable,
  cameraEnabled,
  cameraAvailable,
  isPaused,
  onStop,
  onToggleMic,
  onToggleCamera,
  onTogglePause,
  onCancel,
}: Props) {
  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-full bg-sidebar px-4 py-2.5 shadow-2xl border border-sidebar-border">
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="h-9 w-9 rounded-full shrink-0"
        onClick={onStop}
        aria-label="Parar gravação"
      >
        <Square className="h-4 w-4 fill-current" />
      </Button>

      <span
        className={cn(
          "font-mono text-sm font-semibold tabular-nums min-w-[3rem] text-center",
          remainingSeconds <= 30 ? "text-destructive" : "text-brand-orange",
        )}
      >
        {formatRecordingTime(remainingSeconds)}
      </span>

      <div className="h-6 w-px bg-sidebar-border" />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          "h-9 w-9 rounded-full text-sidebar-foreground hover:bg-white/10 hover:text-white",
          micEnabled && micAvailable && "text-brand-blue",
        )}
        onClick={onToggleMic}
        disabled={!micAvailable}
        aria-label={micEnabled ? "Silenciar microfone" : "Ativar microfone"}
      >
        {micEnabled && micAvailable ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          "h-9 w-9 rounded-full text-sidebar-foreground hover:bg-white/10 hover:text-white",
          cameraEnabled && cameraAvailable && "text-brand-blue",
        )}
        onClick={onToggleCamera}
        aria-label={cameraEnabled ? "Desativar câmera" : "Ativar câmera"}
      >
        {cameraEnabled && cameraAvailable ? (
          <Video className="h-4 w-4" />
        ) : (
          <VideoOff className="h-4 w-4" />
        )}
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-full text-sidebar-foreground hover:bg-white/10 hover:text-white"
        onClick={onTogglePause}
        aria-label={isPaused ? "Retomar gravação" : "Pausar gravação"}
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-full text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
        onClick={onCancel}
        aria-label="Cancelar gravação"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>,
    document.body,
  );
}

/** Preview da câmera durante gravação (picture-in-picture). */
export function FeedbackCameraPreview({ stream }: { stream: MediaStream | null }) {
  if (!stream) return null;

  return createPortal(
    <div className="fixed bottom-24 right-6 z-[200] w-36 h-28 rounded-lg overflow-hidden border-2 border-brand-blue shadow-2xl bg-black">
      <video
        ref={(el) => {
          if (el && el.srcObject !== stream) {
            el.srcObject = stream;
            void el.play().catch(() => {});
          }
        }}
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>,
    document.body,
  );
}
