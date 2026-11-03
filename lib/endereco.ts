import { cepValido, formatarCep } from "@/lib/cep";

// Endereço da cliente: vai no contrato de locação, na entrega do aluguel e no envio da compra
export type Endereco = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export const CAMPOS_DO_ENDERECO = ["cep", "rua", "numero", "complemento", "bairro", "cidade", "uf"] as const;
export type CampoDoEndereco = (typeof CAMPOS_DO_ENDERECO)[number];

// Confere o endereço e devolve os erros por campo (vazio = tudo certo). O complemento é opcional.
export function errosDoEndereco(dados: Partial<Record<CampoDoEndereco, string | undefined>>): Partial<
  Record<CampoDoEndereco, string>
> {
  const erros: Partial<Record<CampoDoEndereco, string>> = {};
  if (!cepValido(dados.cep ?? "")) erros.cep = "CEP inválido. São 8 números.";
  if (!dados.rua?.trim()) erros.rua = "Escreva a rua.";
  if (!dados.numero?.trim()) erros.numero = "Escreva o número (ou S/N).";
  if (!dados.bairro?.trim()) erros.bairro = "Escreva o bairro.";
  if (!dados.cidade?.trim()) erros.cidade = "Escreva a cidade.";
  if (!/^[A-Za-z]{2}$/.test(dados.uf ?? "")) erros.uf = "Estado com 2 letras, ex.: RJ.";
  return erros;
}

// A cliente começou a preencher o endereço? (em "Meus dados" ele é opcional, mas se começar, tem que terminar)
export function temAlgumCampo(dados: Partial<Record<CampoDoEndereco, string | undefined>>): boolean {
  return CAMPOS_DO_ENDERECO.some((campo) => (dados[campo] ?? "").trim() !== "");
}

// "Rua B, 5, apto 2, Centro, Rio de Janeiro/RJ, CEP 20000-000"
export function enderecoEmTexto(dados: Partial<Record<CampoDoEndereco, string | undefined>>): string | null {
  if (!dados.rua) return null;
  const partes = [
    `${dados.rua}, ${dados.numero || "s/n"}`,
    dados.complemento,
    dados.bairro,
    dados.cidade && dados.uf ? `${dados.cidade}/${dados.uf.toUpperCase()}` : dados.cidade,
    dados.cep ? `CEP ${formatarCep(dados.cep)}` : null,
  ];
  return partes.filter(Boolean).join(", ");
}
