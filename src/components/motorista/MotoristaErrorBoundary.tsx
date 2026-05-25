import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class MotoristaErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 text-center max-w-lg mx-auto">
          <h1 className="text-lg font-semibold">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            {typeof navigator !== "undefined" && !navigator.onLine
              ? "Sem internet — feche e abra o app de novo. Se persistir, abra o dashboard com internet uma vez."
              : "Recarregue a página. Se estiver offline, use dados já salvos no aparelho."}
          </p>
          <p className="text-xs text-muted-foreground break-all">{this.state.error.message}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
