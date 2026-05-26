import { describe, expect, it } from "vitest";
import type { ViagemLocalizacao } from "@/types";
import {
  distanciaPercorridaGpsKm,
  distanciaTotalEfetivaKm,
  velocidadeMediaGps,
} from "@/lib/viagem-gps-metrics";
import { calcularProgressoViagem } from "@/lib/viagem-progresso";
import type { Viagem } from "@/types";

function loc(
  i: number,
  lat: number,
  lng: number,
  em: string,
  speed?: number,
): ViagemLocalizacao {
  return {
    id: `loc-${i}`,
    transportadora_id: "t1",
    viagem_id: "v1",
    motorista_id: "m1",
    latitude: lat,
    longitude: lng,
    velocidade_kmh: speed,
    registrado_em: em,
    created_at: em,
  };
}

describe("viagem-gps-metrics", () => {
  it("soma distância entre pontos consecutivos", () => {
    const locs = [
      loc(0, -12.97, -38.51, "2026-05-25T17:00:00.000Z"),
      loc(1, -12.96, -38.50, "2026-05-25T17:10:00.000Z"),
      loc(2, -12.95, -38.49, "2026-05-25T17:20:00.000Z"),
    ];
    expect(distanciaPercorridaGpsKm(locs)).toBeGreaterThan(0);
  });

  it("velocidade média a partir de distância e tempo", () => {
    const locs = [
      loc(0, -12.97, -38.51, "2026-05-25T17:00:00.000Z", 40),
      loc(1, -12.95, -38.49, "2026-05-25T18:00:00.000Z", 50),
    ];
    const v = velocidadeMediaGps(locs);
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(0);
  });

  it("distância total efetiva evita zero quando planejada é zero", () => {
    const locs = [
      loc(0, -12.97, -38.51, "2026-05-25T17:00:00.000Z"),
      loc(1, -12.95, -38.49, "2026-05-25T18:00:00.000Z"),
    ];
    expect(distanciaTotalEfetivaKm(0, locs)).toBeGreaterThan(0);
  });
});

describe("calcularProgressoViagem com GPS", () => {
  const viagemBase: Viagem = {
    id: "v1",
    transportadora_id: "t1",
    numero_viagem: 15,
    status: "finalizada",
    endereco_origem: {
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "Salvador",
      uf: "BA",
    },
    endereco_destino: {
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "Salvador",
      uf: "BA",
    },
    data_real_saida: "2026-05-25T17:00:00.000Z",
    data_real_chegada: "2026-05-25T19:00:00.000Z",
    created_at: "2026-05-25T10:00:00.000Z",
    updated_at: "2026-05-25T19:00:00.000Z",
  } as Viagem;

  it("viagem finalizada com mesma cidade ainda mostra km e velocidade do histórico", () => {
    const locs = [
      loc(0, -12.8615, -38.438, "2026-05-25T17:57:00.000Z", 18),
      loc(1, -12.8612, -38.4379, "2026-05-25T18:18:00.000Z", 0),
      loc(2, -12.984, -38.4728, "2026-05-25T18:54:00.000Z", 0),
    ];
    const p = calcularProgressoViagem(viagemBase, locs);
    expect(p.distanciaPercorridaKm).toBeGreaterThan(0);
    expect(p.distanciaTotalKm).toBeGreaterThan(0);
    expect(p.percentualConcluido).toBe(100);
    expect(p.velocidadeMediaKmh).not.toBeNull();
    expect(p.velocidadeMediaKmh!).toBeGreaterThan(0);
  });
});
