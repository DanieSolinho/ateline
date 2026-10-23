import { somenteDigitos } from "@/lib/validacao";

export type EnderecoDoCep = {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export function cepValido(cep: string): boolean {
  return somenteDigitos(cep).length === 8;
}

// "20911000" → "20911-000"
export function formatarCep(cep: string): string {
  const digitos = somenteDigitos(cep).slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

// Busca o endereço no ViaCEP (serviço gratuito, funciona direto do navegador).
// Devolve null se o CEP não existir ou se a busca falhar: aí a cliente preenche à mão.
export async function buscarCep(cep: string, buscar: typeof fetch = fetch): Promise<EnderecoDoCep | null> {
  if (!cepValido(cep)) return null;
  try {
    const resposta = await buscar(`https://viacep.com.br/ws/${somenteDigitos(cep)}/json/`);
    if (!resposta.ok) return null;
    const dados = await resposta.json();
    if (dados.erro) return null;
    return { rua: dados.logradouro ?? "", bairro: dados.bairro ?? "", cidade: dados.localidade ?? "", uf: dados.uf ?? "" };
  } catch {
    return null;
  }
}
