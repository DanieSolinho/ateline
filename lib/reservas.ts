import dados from "@/data/reservas.json";
import type { Reserva } from "@/types/reserva";

const reservas = dados as Reserva[];

export async function getReservas(): Promise<Reserva[]> {
  return reservas;
}