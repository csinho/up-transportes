import type { Endereco } from "@/types";

/**
 * Formato padrão: CEP - logradouro, número - bairro - cidade/UF - país
 * Ex.: 41300-040 - Rua Colibri, 2 - Valéria - Salvador/BA - Brasil
 */
export function formatarEnderecoLinha(e: Endereco): string {
  const partes: string[] = [];

  const cep = e.cep?.replace(/\D/g, "");
  if (cep) {
    partes.push(cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : e.cep.trim());
  } else if (e.cep?.trim()) {
    partes.push(e.cep.trim());
  }

  const logradouro = e.logradouro?.trim();
  const numero = e.numero?.trim();
  const complemento = e.complemento?.trim();
  let ruaNum = "";
  if (logradouro && numero) ruaNum = `${logradouro}, ${numero}`;
  else if (logradouro) ruaNum = logradouro;
  else if (numero) ruaNum = numero;
  if (complemento) ruaNum = ruaNum ? `${ruaNum}, ${complemento}` : complemento;
  if (ruaNum) partes.push(ruaNum);

  if (e.bairro?.trim()) partes.push(e.bairro.trim());

  const cidadeUf = [e.cidade?.trim(), e.uf?.trim()].filter(Boolean).join("/");
  if (cidadeUf) partes.push(cidadeUf);

  const pais = e.pais?.trim() || "Brasil";
  partes.push(pais);

  return partes.length > 0 ? partes.join(" - ") : "—";
}

/** @deprecated Preferir formatarEnderecoLinha — mantém uma linha no mesmo padrão. */
export function formatarEnderecoBlocos(e: Endereco): string[] {
  return [formatarEnderecoLinha(e)];
}

export function enderecoMudou(a: Endereco, b: Endereco): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
