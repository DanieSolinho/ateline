import { supabase } from "@/lib/supabase";

// Marca deste navegador quando é da equipe (ao abrir o painel), para não contar as visitas da loja
export const CHAVE_NAO_CONTAR = "ateline-nao-contar-visitas";

export function marcarNavegadorDaEquipe() {
  try {
    localStorage.setItem(CHAVE_NAO_CONTAR, "sim");
  } catch {
    // sem armazenamento: a visita da equipe pode entrar na conta, sem problema
  }
}

// Conta uma visualização do bolo: no máximo uma por bolo a cada visita ao site (aba aberta)
export function registrarVisualizacao(codigo: string) {
  try {
    if (localStorage.getItem(CHAVE_NAO_CONTAR) === "sim") return;
    const chave = `ateline-visto-${codigo}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");
  } catch {
    // armazenamento bloqueado: conta assim mesmo
  }
  void supabase.rpc("registrar_visualizacao", { codigo_do_bolo: codigo }).then(({ error }) => {
    if (error) console.warn("Visualização não registrada:", error.message);
  });
}
