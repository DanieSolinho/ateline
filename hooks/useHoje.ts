import { useSyncExternalStore } from "react";
import { hojeIso } from "@/lib/calendario";

// "Hoje" só existe no navegador. No servidor devolve null e o componente espera.
const naoMuda = () => () => {};
const hojeNoServidor = () => null;

export function useHoje(): string | null {
  return useSyncExternalStore(naoMuda, hojeIso, hojeNoServidor);
}
