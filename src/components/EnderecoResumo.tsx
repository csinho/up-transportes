import type { Endereco } from "@/types";
import { formatarEnderecoLinha } from "@/lib/formatar-endereco";
import { cn } from "@/lib/utils";

type Props = {
  endereco: Endereco;
  className?: string;
};

export function EnderecoResumo({ endereco, className }: Props) {
  return (
    <p className={cn("not-italic text-sm text-muted-foreground", className)}>
      {formatarEnderecoLinha(endereco)}
    </p>
  );
}
