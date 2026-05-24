import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViagemLocalizacao } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Navigation } from "lucide-react";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListPagination } from "@/components/list/ListPagination";
import { matchesAny } from "@/lib/list-utils";

export function ViagemLocalizacoesPanel({ localizacoes }: { localizacoes: ViagemLocalizacao[] }) {
  const list = useListControls({
    items: localizacoes,
    searchFn: (loc, q) =>
      matchesAny(
        [loc.latitude, loc.longitude, loc.velocidade_kmh, loc.registrado_em, format(new Date(loc.registrado_em), "dd/MM/yyyy HH:mm")],
        q,
      ),
  });

  const ultima = localizacoes[0];

  if (localizacoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhuma localização registrada. O histórico será preenchido pelo PWA do motorista.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {ultima && (
        <div className="rounded-lg border p-4 flex flex-wrap items-center gap-4 bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Última posição</p>
            <p className="text-xs text-muted-foreground font-mono">
              {ultima.latitude.toFixed(5)}, {ultima.longitude.toFixed(5)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(ultima.registrado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {ultima.velocidade_kmh != null && ` · ${ultima.velocidade_kmh} km/h`}
            </p>
          </div>
          <Badge variant="secondary">{localizacoes.length} pontos no histórico</Badge>
        </div>
      )}

      <ListToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Buscar coordenadas, data, velocidade…"
        totalItems={list.totalItems}
        page={list.page}
        pageSize={list.pageSize}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead>Velocidade</TableHead>
              <TableHead>Precisão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.totalItems === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum ponto encontrado.
                </TableCell>
              </TableRow>
            )}
            {list.paginated.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="text-sm">
                  {format(new Date(loc.registrado_em), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </span>
                </TableCell>
                <TableCell>{loc.velocidade_kmh != null ? `${loc.velocidade_kmh} km/h` : "—"}</TableCell>
                <TableCell>{loc.precisao_metros != null ? `${loc.precisao_metros} m` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
    </div>
  );
}
