import type { Endereco } from "@/types";
import { onlyDigits } from "./masks";

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export async function fetchViaCep(cep: string): Promise<Partial<Endereco> | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;
    return {
      cep: d,
      logradouro: data.logradouro || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
      codigo_ibge: data.ibge || "",
      pais: "Brasil",
    };
  } catch {
    return null;
  }
}
