import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMotoristaViagens } from "@/hooks/use-motorista-data";
import { MotoristaShell } from "@/components/motorista/MotoristaShell";
import { MotoristaViagemCard } from "@/components/motorista/MotoristaViagemCard";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { requireMotoristaSession } from "@/lib/motorista-auth-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageOpen } from "lucide-react";

export const Route = createFileRoute("/motorista/viagens/")({
  beforeLoad: requireMotoristaSession,
  head: () => ({ meta: [{ title: "Minhas viagens — App Motorista" }] }),
  component: Page,
});

function Page() {
  const { session } = useMotoristaSession();
  const { data: viagens = [] } = useMotoristaViagens();
  const [aba, setAba] = useState("ativas");

  const { ativas, concluidas, todas } = useMemo(() => {
    if (!session) return { ativas: [], concluidas: [], todas: [] };
    const minhas = viagens
      .filter((v) => v.motorista_id === session.motoristaId)
      .sort((a, b) => b.numero_viagem - a.numero_viagem);
    return {
      ativas: minhas.filter((v) => isViagemAtiva(v.status)),
      concluidas: minhas.filter((v) => v.status === "finalizada"),
      todas: minhas,
    };
  }, [viagens, session]);

  if (!session) {
    return (
      <MotoristaShell titulo="Minhas viagens" auth>
        <p className="text-sm text-muted-foreground text-center pt-8">Carregando…</p>
      </MotoristaShell>
    );
  }

  const lista = aba === "ativas" ? ativas : aba === "concluidas" ? concluidas : todas;

  return (
    <MotoristaShell titulo="Minhas viagens">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Histórico de viagens</h1>
          <p className="text-sm text-muted-foreground">
            Toque em uma viagem para ver detalhes e registrar status.
          </p>
        </div>

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ativas">Ativas ({ativas.length})</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas ({concluidas.length})</TabsTrigger>
            <TabsTrigger value="todas">Todas ({todas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={aba} className="mt-4 space-y-3">
            {lista.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
                <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="font-medium">Nenhuma viagem nesta aba</p>
              </div>
            ) : (
              lista.map((v) => <MotoristaViagemCard key={v.id} viagem={v} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MotoristaShell>
  );
}
