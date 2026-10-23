import type { Periodo, Reserva } from "@/types/reserva";

// getUTCDay(): domingo = 0, segunda = 1 ... sábado = 6
const DIAS_FECHADOS = [0, 1];

// "2026-10-25" → Date (em UTC, para o fuso horário não mudar o dia)
function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

// Date → "2026-10-25"
function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setUTCDate(nova.getUTCDate() + dias);
  return nova;
}

function lojaAberta(data: Date): boolean {
  return !DIAS_FECHADOS.includes(data.getUTCDay());
}

export function calcularPeriodo(dataFesta: string): Periodo {
  const festa = paraData(dataFesta);

  let retirada = somarDias(festa, -1);
  while (!lojaAberta(retirada)) retirada = somarDias(retirada, -1);

  let devolucao = somarDias(festa, 1);
  while (!lojaAberta(devolucao)) devolucao = somarDias(devolucao, 1);

  return { retirada: paraIso(retirada), festa: dataFesta, devolucao: paraIso(devolucao) };
}

// Dois períodos se cruzam se um começa antes de o outro terminar
export function periodosSeSobrepoem(a: Periodo, b: Periodo): boolean {
  return a.retirada <= b.devolucao && b.retirada <= a.devolucao;
}

export function estaDisponivel(codigo: string, dataFesta: string, reservas: Reserva[]): boolean {
  const pedido = calcularPeriodo(dataFesta);
  return !reservas.some(
    (reserva) =>
      reserva.codigo === codigo && periodosSeSobrepoem(pedido, calcularPeriodo(reserva.festa)),
  );
}

// Para peças com várias unidades iguais (ex.: as bases douradas): a primeira livre na data, ou null
export function primeiraUnidadeLivre(codigos: string[], dataFesta: string, reservas: Reserva[]): string | null {
  return codigos.find((codigo) => estaDisponivel(codigo, dataFesta, reservas)) ?? null;
}

// Uma peça só pode ser vendida se não tiver nenhum aluguel marcado daqui para a frente
export function livreParaVenda(codigo: string, hoje: string, reservas: Reserva[]): boolean {
  return !reservas.some((reserva) => reserva.codigo === codigo && calcularPeriodo(reserva.festa).devolucao >= hoje);
}
