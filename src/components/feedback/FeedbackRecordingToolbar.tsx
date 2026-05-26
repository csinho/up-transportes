import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { formatRecordingTime } from "@/lib/feedback-recorder";

type Props = {
  remainingSeconds: number;
  micEnabled: boolean;
  isPaused: boolean;
  onStop: () => void;
  onToggleMic: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onCancel: () => void;
};

export function FeedbackRecordingToolbar({
  remainingSeconds,
  micEnabled,
  isPaused,
  onStop,
  onToggleMic,
  onTogglePause,
  onRestart,
  onCancel,
}: Props) {
  return createPortal(
    <>
      <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-900/95 px-4 py-2.5 shadow-2xl border border-zinc-700">
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
          className={`font-mono text-sm font-semibold tabular-nums min-w-[3rem] text-center ${
            remainingSeconds <= 30 ? "text-red-400" : "text-red-300"
          }`}
        >
          {formatRecordingTime(remainingSeconds)}
        </span>

        <div className="h-6 w-px bg-zinc-600" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-white hover:bg-zinc-800 hover:text-white"
          onClick={onToggleMic}
          aria-label={micEnabled ? "Silenciar microfone" : "Ativar microfone"}
        >
          {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-white hover:bg-zinc-800 hover:text-white"
          onClick={onTogglePause}
          aria-label={isPaused ? "Retomar gravação" : "Pausar gravação"}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-white hover:bg-zinc-800 hover:text-white"
          onClick={onRestart}
          aria-label="Reiniciar gravação"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-white hover:bg-zinc-800 hover:text-white"
          onClick={onCancel}
          aria-label="Cancelar gravação"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </>,
    document.body,
  );
}

/** Preview da câmera durante gravação (picture-in-picture). */
export function FeedbackCameraPreview({ stream }: { stream: MediaStream | null }) {
  if (!stream) return null;

  return createPortal(
    <div className="fixed bottom-24 right-6 z-[100] w-36 h-28 rounded-lg overflow-hidden border-2 border-white shadow-2xl bg-black">
      <video
        ref={(el) => {
          if (el && el.srcObject !== stream) {
            el.srcObject = stream;
            void el.play().catch(() => {});
          }
        }}
        muted
        playsInline
        className="w-full h-full object-cover mirror"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>,
    document.body,
  );
}
