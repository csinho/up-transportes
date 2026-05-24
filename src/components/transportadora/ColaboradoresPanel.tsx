import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MailPlus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useColaboradores,
  useConvidarColaborador,
  useAtualizarColaboradorRole,
  useRemoverColaborador,
  useUserTenantRole,
} from "@/hooks/use-colaboradores";
import { useAuthSession } from "@/hooks/use-auth-session";
import { COLABORADOR_INVITE_ROLES, COLABORADOR_ROLES, type Colaborador, type ColaboradorRole } from "@/lib/supabase/colaboradores";
import { RemoverColaboradorDialog } from "@/components/transportadora/RemoverColaboradorDialog";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { UUID } from "@/types";
import { toast } from "sonner";

type Props = {
  transportadoraId: UUID;
};

function roleLabel(role: ColaboradorRole) {
  return COLABORADOR_ROLES.find((r) => r.value === role)?.label ?? role;
}

export function ColaboradoresPanel({ transportadoraId }: Props) {
  const { user } = useAuthSession();
  const {
    data: colaboradores = [],
    isPending,
    isError,
    error,
    refetch,
  } = useColaboradores(transportadoraId);
  const { data: myRole } = useUserTenantRole(transportadoraId);
  const convidar = useConvidarColaborador(transportadoraId);
  const atualizar = useAtualizarColaboradorRole(transportadoraId);
  const remover = useRemoverColaborador(transportadoraId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ColaboradorRole>("operador");
  const [removerTarget, setRemoverTarget] = useState<Colaborador | null>(null);

  const isOwner = myRole === "owner";

  const enviarConvite = () => {
    if (!email.trim()) {
      toast.error("Informe o e-mail do colaborador.");
      return;
    }

    convidar.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (status) => {
          setEmail("");
          toast.success(
            status === "ativo"
              ? "Colaborador adicionado com acesso imediato."
              : "Convite registrado. Avise para acessar /login → Primeiro acesso com este e-mail e criar a senha.",
          );
        },
        onError: (err) => toast.error(traduzirErroSupabase(err)),
      },
    );
  };

  if (myRole && !isOwner) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Somente proprietários podem gerenciar colaboradores. Seu perfil:{" "}
        <strong>{roleLabel(myRole)}</strong>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Colaboradores
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Usuários com acesso ao ERP (proprietário ou operador). Para clientes que só acompanham uma
          viagem, gere o link na página da viagem — não é necessário convite aqui. Para quem ainda não
          tem conta, oriente: abra <strong>/login → Primeiro acesso</strong>, use o e-mail convidado e
          crie a senha desejada (mín. 6 caracteres). Quem já tem conta no Supabase usa a senha existente
          em <strong>Entrar</strong>.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
        <p className="text-sm font-medium">Adicionar colaborador</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="colab-email">E-mail</Label>
            <Input
              id="colab-email"
              type="email"
              placeholder="nome@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarConvite()}
            />
          </div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v as ColaboradorRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLABORADOR_INVITE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={enviarConvite} disabled={convidar.isPending} className="gap-2">
            {convidar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MailPlus className="h-4 w-4" />
            )}
            Convidar
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
          <p className="text-sm text-destructive">
            {traduzirErroSupabase(error)}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : colaboradores.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum colaborador cadastrado além de você.
        </p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.map((c) => {
                const isSelf = c.user_id === user?.id;
                return (
                  <TableRow key={c.registro_id}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                      {isSelf && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          Você
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.status === "ativo" && c.user_id ? (
                        <Select
                          value={c.role}
                          onValueChange={(v) =>
                            atualizar.mutate(
                              { userId: c.user_id!, role: v as ColaboradorRole },
                              {
                                onSuccess: () => toast.success("Perfil atualizado."),
                                onError: (err) => toast.error(traduzirErroSupabase(err)),
                              },
                            )
                          }
                          disabled={isSelf || atualizar.isPending}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLABORADOR_INVITE_ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{roleLabel(c.role)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ativo" ? "secondary" : "outline"}>
                        {c.status === "ativo" ? "Ativo" : "Convite pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Remover"
                          disabled={remover.isPending}
                          onClick={() => setRemoverTarget(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <RemoverColaboradorDialog
        open={removerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoverTarget(null);
        }}
        nome={removerTarget?.nome ?? ""}
        email={removerTarget?.email ?? ""}
        isPending={remover.isPending}
        onConfirm={() => {
          if (!removerTarget) return;
          remover.mutate(removerTarget.registro_id, {
            onSuccess: () => {
              toast.success("Colaborador removido.");
              setRemoverTarget(null);
            },
            onError: (err) => toast.error(traduzirErroSupabase(err)),
          });
        }}
      />
    </div>
  );
}
