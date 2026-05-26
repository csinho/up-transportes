export const FEEDBACK_MAX_RECORDING_SECONDS = 180;

export type CountdownDelay = 0 | 3 | 5 | 10;

export type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

export type RecorderSetup = {
  useMic: boolean;
  micDeviceId: string;
  useCamera: boolean;
  cameraDeviceId: string;
  countdownDelay: CountdownDelay;
};

export type RecordingResult = {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  fileName: string;
};

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "video/webm";
}

function extFromMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

async function enumerateMediaDevicesAsync(): Promise<{
  microphones: MediaDeviceOption[];
  cameras: MediaDeviceOption[];
}> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return { microphones: [], cameras: [] };
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  const microphones = devices
    .filter((d) => d.kind === "audioinput" && d.deviceId)
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Microfone ${i + 1}`,
    }));

  const cameras = devices
    .filter((d) => d.kind === "videoinput" && d.deviceId)
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Câmera ${i + 1}`,
    }));

  return { microphones, cameras };
}

/** Lista dispositivos já visíveis (sem pedir permissão). */
export async function listMediaDevices(): Promise<{
  microphones: MediaDeviceOption[];
  cameras: MediaDeviceOption[];
}> {
  return enumerateMediaDevicesAsync();
}

/** Pede permissão de microfone e retorna a lista atualizada. */
export async function requestMicrophoneAccess(): Promise<MediaDeviceOption[]> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Seu navegador não suporta captura de áudio.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());

  const { microphones } = await enumerateMediaDevicesAsync();
  if (microphones.length === 0) {
    throw new Error("Nenhum microfone encontrado neste dispositivo.");
  }
  return microphones;
}

/** Pede permissão de câmera e retorna a lista atualizada. */
export async function requestCameraAccess(): Promise<MediaDeviceOption[]> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Seu navegador não suporta captura de vídeo.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getTracks().forEach((t) => t.stop());

  const { cameras } = await enumerateMediaDevicesAsync();
  if (cameras.length === 0) {
    throw new Error("Nenhuma câmera encontrada neste dispositivo.");
  }
  return cameras;
}

export class FeedbackScreenRecorder {
  private screenStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType = "video/webm";
  private startedAt = 0;
  private elapsedBeforePause = 0;
  private pauseStartedAt = 0;
  private isPaused = false;

  get cameraPreviewStream(): MediaStream | null {
    return this.cameraStream;
  }

  async prepareStreams(setup: RecorderSetup): Promise<void> {
    this.cleanup();

    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "monitor" } as MediaTrackConstraints,
      audio: true,
    });

    this.combinedStream = new MediaStream();
    this.screenStream.getVideoTracks().forEach((t) => this.combinedStream!.addTrack(t));

    const screenAudio = this.screenStream.getAudioTracks();
    if (setup.useMic) {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: setup.micDeviceId ? { deviceId: { exact: setup.micDeviceId } } : true,
      });
      this.micStream.getAudioTracks().forEach((t) => this.combinedStream!.addTrack(t));
    } else {
      screenAudio.forEach((t) => this.combinedStream!.addTrack(t));
    }

    if (setup.useCamera) {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: setup.cameraDeviceId ? { deviceId: { exact: setup.cameraDeviceId } } : true,
        audio: false,
      });
    }

    this.screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
      void this.stop();
    });
  }

  startRecording(): void {
    if (!this.combinedStream) throw new Error("Streams não preparados");

    this.chunks = [];
    this.mimeType = pickMimeType();
    this.recorder = new MediaRecorder(this.combinedStream, { mimeType: this.mimeType });
    this.startedAt = Date.now();
    this.elapsedBeforePause = 0;
    this.isPaused = false;

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.recorder.start(1000);
  }

  pauseRecording(): void {
    if (!this.recorder || this.recorder.state !== "recording") return;
    this.recorder.pause();
    this.isPaused = true;
    this.pauseStartedAt = Date.now();
  }

  resumeRecording(): void {
    if (!this.recorder || this.recorder.state !== "paused") return;
    this.recorder.resume();
    if (this.isPaused) {
      this.elapsedBeforePause += Date.now() - this.pauseStartedAt;
      this.isPaused = false;
    }
  }

  toggleMic(enabled: boolean): void {
    this.micStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  getElapsedSeconds(): number {
    if (!this.startedAt) return 0;
    const now = this.isPaused ? this.pauseStartedAt : Date.now();
    return Math.floor((this.elapsedBeforePause + (now - this.startedAt)) / 1000);
  }

  getRemainingSeconds(): number {
    return Math.max(0, FEEDBACK_MAX_RECORDING_SECONDS - this.getElapsedSeconds());
  }

  isRecording(): boolean {
    return this.recorder?.state === "recording";
  }

  isPausedState(): boolean {
    return this.recorder?.state === "paused";
  }

  async stop(): Promise<RecordingResult | null> {
    if (!this.recorder || this.recorder.state === "inactive") {
      this.cleanup();
      return null;
    }

    const durationSeconds = this.getElapsedSeconds();

    return new Promise((resolve) => {
      this.recorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        const ext = extFromMime(this.mimeType);
        const result: RecordingResult = {
          blob,
          mimeType: this.mimeType,
          durationSeconds,
          fileName: `gravacao-tela-${Date.now()}.${ext}`,
        };
        this.cleanup();
        resolve(result);
      };
      this.recorder!.stop();
    });
  }

  cancel(): void {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.onstop = null;
      this.recorder.stop();
    }
    this.cleanup();
  }

  cleanup(): void {
    [this.screenStream, this.micStream, this.cameraStream, this.combinedStream].forEach((s) => {
      s?.getTracks().forEach((t) => t.stop());
    });
    this.screenStream = null;
    this.micStream = null;
    this.cameraStream = null;
    this.combinedStream = null;
    this.recorder = null;
    this.chunks = [];
    this.startedAt = 0;
    this.elapsedBeforePause = 0;
    this.isPaused = false;
  }
}

export function formatRecordingTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function recordingResultToFile(result: RecordingResult): File {
  return new File([result.blob], result.fileName, { type: result.mimeType });
}
