import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MarcadorViagemOverview } from "@/lib/rastreamento-overview";
import type { LatLng } from "@/lib/geo-cidades";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarDataHora } from "@/lib/viagem-progresso";

function divIcon(label: string, bg: string, selected: boolean) {
  const size = selected ? 36 : 30;
  const ring = selected ? "box-shadow:0 0 0 3px #2563eb;" : "";
  return L.divIcon({
    className: "leaflet-div-icon-custom",
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;border:2px solid #fff;${ring}">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ points, revision }: { points: LatLng[]; revision: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 11 });
  }, [map, revision, points]);
  return null;
}

type Props = {
  marcadores: MarcadorViagemOverview[];
  selecionadaId: string | null;
  onSelecionar: (viagemId: string) => void;
  className?: string;
};

export function RastreamentoOverviewMapInner({
  marcadores,
  selecionadaId,
  onSelecionar,
  className,
}: Props) {
  if (marcadores.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/40 rounded-lg border ${className ?? "h-[280px]"}`}
      >
        <p className="text-sm text-muted-foreground px-4 text-center">
          Nenhum veículo com posição GPS no momento. Posições aparecem quando o motorista usa o app
          em viagem ativa.
        </p>
      </div>
    );
  }

  const points = marcadores.map((m) => m.posicao);
  const centro = marcadores.find((m) => m.viagemId === selecionadaId)?.posicao ?? points[0];
  const revision = marcadores.map((m) => `${m.viagemId}:${m.registradoEm}`).join("|");

  return (
    <MapContainer
      center={centro}
      zoom={6}
      className={`z-0 rounded-lg border ${className ?? "h-[280px] w-full"}`}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} revision={revision} />

      {marcadores.map((m) => {
        const selected = m.viagemId === selecionadaId;
        const label = String(m.numeroViagem).slice(-2).padStart(2, "0");
        return (
          <Marker
            key={m.viagemId}
            position={m.posicao}
            icon={divIcon(label, selected ? "#2563eb" : "#64748b", selected)}
            eventHandlers={{ click: () => onSelecionar(m.viagemId) }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-2 text-sm">
                <p className="font-mono font-bold">#{String(m.numeroViagem).padStart(5, "0")}</p>
                <Badge variant="secondary" className="text-xs">{m.statusLabel}</Badge>
                <p className="text-xs text-muted-foreground">
                  {m.motorista ?? "—"} · {m.placa ?? "—"}
                </p>
                {m.velocidade != null && <p className="text-xs">{m.velocidade} km/h</p>}
                {m.registradoEm && (
                  <p className="text-xs text-muted-foreground">
                    Atualizado {formatarDataHora(m.registradoEm)}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8"
                  onClick={() => onSelecionar(m.viagemId)}
                >
                  Ver no mapa
                </Button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
