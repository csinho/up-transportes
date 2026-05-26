import { createPortal } from "react-dom";

type Props = {
  value: number | null;
};

export function FeedbackCountdownOverlay({ value }: Props) {
  if (value == null || value <= 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-blue text-white shadow-2xl animate-in zoom-in-50 duration-300">
        <span className="text-6xl font-bold tabular-nums">{value}</span>
      </div>
    </div>,
    document.body,
  );
}
