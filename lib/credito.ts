import { supabase } from "@/lib/supabase";

export type Credito = {
  saldo: number;
  venceEm: string | null; // quando vence a parte do crédito que vence primeiro
};

export const SEM_CREDITO: Credito = { saldo: 0, venceEm: null };

// Quanto do crédito entra neste pedido: no máximo o valor do sinal
export function creditoNoPedido(pagarAgora: number, saldo: number): number {
  return Math.max(0, Math.min(pagarAgora, saldo));
}

// O saldo da cliente logada (o banco soma só os créditos dela que ainda valem)
export async function buscarMeuCredito(): Promise<Credito | null> {
  const { data, error } = await supabase.rpc("meu_credito");
  if (error) {
    console.warn("Não deu para buscar o crédito:", error.message);
    return null;
  }
  const resposta = data as { saldo: number | string; venceEm: string | null };
  return { saldo: Number(resposta.saldo), venceEm: resposta.venceEm };
}
