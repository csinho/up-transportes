import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";
import type { DadosMapaViagem } from "@/lib/rastreamento-mapa";
import type { LatLng } from "@/lib/geo-cidades";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { formatarDataHora, formatarDuracao } from "@/lib/viagem-progresso";
import { formatVelocidadeKmh } from "@/lib/viagem-gps-metrics";
import { Button } from "@/components/ui/button";

export type MapaPontoDestaque = {
  lat: number;
  lng: number;
  label?: string;
  tipo?: "localizacao" | "ocorrencia";
};

export type OcorrenciaMapa = {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
};

function divIcon(label: string, bg: string, size = 32) {
  return L.divIcon({
    className: "leaflet-div-icon-custom",
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function circleIcon(bg: string, size = 32) {
  return L.divIcon({
    className: "leaflet-div-icon-custom",
    html: `<div style="background:${bg};border-radius:50%;width:${size}px;height:${size}px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const iconOrigem = circleIcon("#22C55E");
const iconDestino = circleIcon("#EF4444");
const iconOcorrencia = divIcon("!", "#DC2626", 28);
const iconDestaque = divIcon("•", "#2563EB", 36);

function truckIcon() {
  return L.divIcon({
    className: "leaflet-div-icon-custom",
    html: `<div style="background:#F97316;color:#fff;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(11,19,36,.25)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function FitBounds({ points, tripId, revision }: { points: LatLng[]; tripId: string; revision: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 12 });
  }, [map, tripId, revision, points]);
  return null;
}

function MapFocusController({ point }: { point?: MapaPontoDestaque | null }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo([point.lat, point.lng], 16, { duration: 0.75 });
  }, [map, point?.lat, point?.lng, point?.label, point?.tipo]);
  return null;
}

function PopupConteudo({ dados }: { dados: DadosMapaViagem }) {
  const v = dados.viagem;
  return (
    <div className="min-w-[200px] space-y-2 text-sm">
      <p className="font-mono font-bold">#{String(v.numero_viagem).padStart(5, "0")}</p>
      <ViagemStatusBadge status={v.status} size="sm" />
      <p className="text-muted-foreground text-xs">
        {dados.clienteOrigem?.nome ?? v.endereco_origem.cidade} →{" "}
        {dados.clienteDestino?.nome ?? v.endereco_destino.cidade}
      </p>
      <p className="text-xs"><strong>Motorista:</strong> {dados.motorista?.nome ?? "—"}</p>
      <p className="text-xs"><strong>Veículo:</strong> {dados.veiculo?.placa ?? "—"}</p>
      {dados.ultimaVelocidade != null && (
        <p className="text-xs text-muted-foreground">{formatVelocidadeKmh(dados.ultimaVelocidade)}</p>
      )}
      {dados.progresso.emAndamento && (
        <p className="text-xs">
          <strong>{dados.progresso.percentualConcluido.toFixed(1)}%</strong> concluído · restam{" "}
          {formatarDuracao(dados.progresso.tempoRestanteMinutos)} · ETA {formatarDataHora(dados.progresso.previsaoChegada)}
        </p>
      )}
      <Button size="sm" variant="outline" className="w-full h-8" asChild>
        <Link to="/viagens/$id" params={{ id: v.id }}>Ver viagem</Link>
      </Button>
    </div>
  );
}

export type ViagemRastreamentoMapInnerProps = {
  dados: DadosMapaViagem | null;
  className?: string;
  focusedPoint?: MapaPontoDestaque | null;
  ocorrencias?: OcorrenciaMapa[];
};

export function ViagemRastreamentoMapInner({
  dados,
  className,
  focusedPoint,
  ocorrencias = [],
}: ViagemRastreamentoMapInnerProps) {
  if (!dados) {
    return (
      <div className={`flex items-center justify-center bg-muted/40 rounded-lg border ${className ?? "h-[480px]"}`}>
        <p className="text-sm text-muted-foreground">Selecione uma viagem para rastrear no mapa.</p>
      </div>
    );
  }

  const { origem, destino, rotaPlanejada, rota, posicaoAtual } = dados;
  const linhaPercorrida = rota.length >= 2 ? rota : [];
  const linhaPlanejada = rotaPlanejada.length >= 2 ? rotaPlanejada : [origem, destino];
  const boundsPoints: LatLng[] = [origem, destino, ...linhaPlanejada, ...linhaPercorrida];
  if (posicaoAtual) boundsPoints.push(posicaoAtual);
  ocorrencias.forEach((oc) => boundsPoints.push([oc.lat, oc.lng]));
  if (focusedPoint) boundsPoints.push([focusedPoint.lat, focusedPoint.lng]);
  const revision = `${rota.length}:${posicaoAtual?.join(",") ?? ""}:${focusedPoint?.lat ?? ""}`;

  const centro: LatLng = focusedPoint
    ? [focusedPoint.lat, focusedPoint.lng]
    : posicaoAtual ?? origem;

  return (
    <MapContainer
      key={dados.viagem.id}
      center={centro}
      zoom={6}
      className={`z-0 rounded-lg border ${className ?? "h-[480px] w-full"}`}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!focusedPoint && (
        <FitBounds points={boundsPoints} tripId={dados.viagem.id} revision={revision} />
      )}
      <MapFocusController point={focusedPoint} />

      <Marker position={origem} icon={iconOrigem}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">Origem</p>
            <p>{dados.clienteOrigem?.nome ?? dados.viagem.endereco_origem.cidade}</p>
            <p className="text-xs text-muted-foreground">{dados.viagem.endereco_origem.uf}</p>
          </div>
        </Popup>
      </Marker>

      <Marker position={destino} icon={iconDestino}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">Destino</p>
            <p>{dados.clienteDestino?.nome ?? dados.viagem.endereco_destino.cidade}</p>
            <p className="text-xs text-muted-foreground">{dados.viagem.endereco_destino.uf}</p>
          </div>
        </Popup>
      </Marker>

      {ocorrencias.map((oc) => (
        <Marker key={oc.id} position={[oc.lat, oc.lng]} icon={iconOcorrencia}>
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-semibold">Ocorrência</p>
              <p>{oc.titulo}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <Polyline
        positions={linhaPlanejada}
        pathOptions={{ color: "#94a3b8", weight: 3, opacity: 0.7, dashArray: "8 8" }}
      />

      {linhaPercorrida.length >= 2 && (
        <Polyline positions={linhaPercorrida} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }} />
      )}

      {focusedPoint && (
        <Marker position={[focusedPoint.lat, focusedPoint.lng]} icon={iconDestaque}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">
                {focusedPoint.tipo === "ocorrencia" ? "Ocorrência" : "Ponto GPS"}
              </p>
              {focusedPoint.label && <p>{focusedPoint.label}</p>}
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {focusedPoint.lat.toFixed(5)}, {focusedPoint.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {posicaoAtual && !focusedPoint && (
        <Marker
          key={`${posicaoAtual[0]}-${posicaoAtual[1]}`}
          position={posicaoAtual}
          icon={truckIcon()}
        >
          <Popup>
            <PopupConteudo dados={dados} />
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
