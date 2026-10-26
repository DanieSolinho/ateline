import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// undefined = ainda verificando · null = sem login · Session = logada
let sessaoAtual: Session | null | undefined = undefined;

function inscrever(avisar: () => void) {
  // O Supabase avisa quando a cliente entra, sai ou quando o login é renovado
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
    sessaoAtual = sessao;
    avisar();
  });
  return () => data.subscription.unsubscribe();
}

export function useSessao(): Session | null | undefined {
  return useSyncExternalStore(
    inscrever,
    () => sessaoAtual,
    () => undefined,
  );
}
