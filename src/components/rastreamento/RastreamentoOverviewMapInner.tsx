import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MarcadorViagemOverview } from "@/lib/rastreamento-overview";
import type { LatLng } from "@/lib/geo-cidades";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { Button } from "@/components/ui/button";
import { formatarDataHora } from "@/lib/viagem-progresso";

function truckMarkerIcon(selected: boolean) {
  const size = selected ? 40 : 34;
  const ring = selected ? "box-shadow:0 0 0 3px #1E5BFF;" : "box-shadow:0 2px 6px rgba(11,19,36,.2);";
  return L.divIcon({
    className: "leaflet-div-icon-custom",
    html: `<div style="background:#F97316;color:#fff;border-radius:8px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;${ring}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>`,
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
        return (
          <Marker
            key={m.viagemId}
            position={m.posicao}
            icon={truckMarkerIcon(selected)}
            eventHandlers={{ click: () => onSelecionar(m.viagemId) }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2 text-sm">
                <p className="font-mono font-bold text-brand-blue">#{String(m.numeroViagem).padStart(5, "0")}</p>
                <ViagemStatusBadge status={m.status} size="sm" />
                <p className="text-xs text-muted-foreground">
                  {m.motorista ?? "—"} · {m.placa ?? "—"}
                </p>
                {m.origem && m.destino && (
                  <p className="text-xs">{m.origem} → {m.destino}</p>
                )}
                {m.velocidade != null && <p className="text-xs">{m.velocidade} km/h</p>}
                {m.registradoEm && (
                  <p className="text-xs text-muted-foreground">
                    Atualizado {formatarDataHora(new Date(m.registradoEm))}
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
