import dados from "@/data/bolos.json";
import type { Bolo } from "@/types/bolo";

// Por enquanto os dados vêm do JSON. Quando o Supabase entrar, só este arquivo muda.
const bolos = dados as Bolo[];

export async function getBolos(): Promise<Bolo[]> {
  return bolos;
}

export async function getBolo(codigo: string): Promise<Bolo | undefined> {
  return bolos.find((bolo) => bolo.codigo === codigo);
}

export async function getDestaques(): Promise<Bolo[]> {
  return bolos.filter((bolo) => bolo.destaque);
}