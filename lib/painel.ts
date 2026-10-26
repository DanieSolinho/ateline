import { totalDoItem } from "@/lib/carrinho";
import { somarDias } from "@/lib/encomenda";
import { supabase } from "@/lib/supabase";
import { DESCONTO_VELA, MULTA_POR_DIA, PERCENTUAL_SINAL } from "@/lib/regras";
import type { ItemAluguel, ItemCarrinho } from "@/types/carrinho";
import type { StatusDoPedido } from "@/types/pedido";

// ---------------------------------------------------------------------
// Dados que vêm do banco (função agenda_do_dia)
// ---------------------------------------------------------------------
export type PedidoDaAgenda = {
  id: string;
  numero: string;
  status: StatusDoPedido;
  nome: string | null;
  whatsapp: string | null;
  chavePix: string | null;
  itens: ItemCarrinho[];
};

export type ReservaDaAgenda = {
  id: number;
  codigo: string;
  festa: string;
  retirada: string;
  devolucao: string;
  origem: "whatsapp" | "site";
  retiradoEm: string | null;
  devolvidoEm: string | null;
  taxaDevolvida: number | null;
  pedido: PedidoDaAgenda | null;
};

// Um "cartão" da agenda: as peças de um mesmo aluguel (bolo + topo + base) saem e voltam juntas
export type GrupoDaAgenda = {
  chave: string;
  ids: number[];
  codigos: string[];
  festa: string;
  retirada: string;
  devolucao: string;
  retirado: boolean;
  devolvido: boolean;
  pedido: PedidoDaAgenda | null;
  item: ItemAluguel | null; // o item do carrinho, quando veio do site
};

export function agruparReservas(reservas: ReservaDaAgenda[]): GrupoDaAgenda[] {
  const grupos = new Map<string, GrupoDaAgenda>();
  for (const reserva of reservas) {
    // Do site: agrupa pelo pedido + data. Do WhatsApp: cada peça é um cartão.
    const chave = reserva.pedido ? `${reserva.pedido.id}@${reserva.festa}` : `r${reserva.id}`;
    const existente = grupos.get(chave);
    if (existente) {
      existente.ids.push(reserva.id);
      existente.codigos.push(reserva.codigo);
      existente.retirado &&= reserva.retiradoEm !== null;
      existente.devolvido &&= reserva.devolvidoEm !== null;
      continue;
    }
    const item =
      reserva.pedido?.itens.find(
        (i): i is ItemAluguel => i.tipo === "aluguel" && i.festa === reserva.festa,
      ) ?? null;
    grupos.set(chave, {
      chave,
      ids: [reserva.id],
      codigos: [reserva.codigo],
      festa: reserva.festa,
      retirada: reserva.retirada,
      devolucao: reserva.devolucao,
      retirado: reserva.retiradoEm !== null,
      devolvido: reserva.devolvidoEm !== null,
      pedido: reserva.pedido,
      item,
    });
  }
  return [...grupos.values()];
}

// Separa a agenda do dia em três listas
export function separarAgenda(grupos: GrupoDaAgenda[], dia: string) {
  return {
    saem: grupos.filter((g) => g.retirada === dia),
    voltam: grupos.filter((g) => g.devolucao === dia),
    atrasados: grupos.filter((g) => g.devolucao < dia && g.retirado && !g.devolvido),
  };
}

// Quanto receber na retirada: os 50% que faltam da locação + a taxa de segurança
export function receberNaRetirada(item: ItemAluguel, taxa: number): number {
  return totalDoItem(item) * (1 - PERCENTUAL_SINAL) + taxa;
}

// Dias entre a data combinada de devolução e o dia em que a peça voltou
export function diasDeAtraso(devolucao: string, hoje: string): number {
  let dias = 0;
  while (somarDias(devolucao, dias) < hoje) dias++;
  return dias;
}

// ---------------------------------------------------------------------
// A conta da taxa de segurança, pelas regras do contrato:
// - avaria (furo, cola, sujeira): a taxa não é devolvida
// - atraso: multa de 30% por dia sobre o valor da locação, descontada da taxa
// - vela acoplada que não volta: desconto de R$ 10
// ---------------------------------------------------------------------
export type Devolucao = {
  taxa: number;
  valorLocacao: number;
  diasAtraso: number;
  semAvarias: boolean;
  temVela: boolean;
  velaDevolvida: boolean;
};

export function calcularDevolucao(d: Devolucao) {
  const multa = Math.round(d.valorLocacao * MULTA_POR_DIA * d.diasAtraso * 100) / 100;
  const descontoVela = d.temVela && !d.velaDevolvida ? DESCONTO_VELA : 0;
  if (!d.semAvarias) {
    return { multa, descontoVela, devolver: 0, faltaCobrar: 0, motivo: "avaria" as const };
  }
  const saldo = d.taxa - multa - descontoVela;
  return {
    multa,
    descontoVela,
    devolver: Math.max(0, saldo),
    faltaCobrar: Math.max(0, -saldo), // quando a multa passa do valor da taxa
    motivo: null,
  };
}

// ---------------------------------------------------------------------
// Chamadas ao banco
// ---------------------------------------------------------------------
export async function souDaEquipe(): Promise<boolean> {
  const { data, error } = await supabase.rpc("e_da_equipe");
  return !error && data === true;
}

export async function buscarAgenda(dia: string): Promise<ReservaDaAgenda[] | null> {
  const { data, error } = await supabase.rpc("agenda_do_dia", { dia });
  if (error) {
    console.warn("Não deu para buscar a agenda:", error.message);
    return null;
  }
  return data as ReservaDaAgenda[];
}

export type PedidoAguardando = {
  numero: string;
  criado_em: string;
  guardado_ate: string | null;
  pago_agora: number;
  cliente: { nome?: string; whatsapp?: string };
  itens: ItemCarrinho[];
};

export async function buscarAguardandoSinal(): Promise<PedidoAguardando[] | null> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("numero, criado_em, guardado_ate, pago_agora, cliente, itens")
    .eq("status", "aguardando_pagamento")
    .order("criado_em");
  if (error) return null;
  return data as PedidoAguardando[];
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes("PECA_RESERVADA")) {
    return "Não deu para confirmar: o prazo venceu e outra cliente já reservou uma das peças nessa data.";
  }
  if (mensagem.includes("SO_EQUIPE")) return "Só a equipe da loja pode fazer isso.";
  return "Não deu certo agora. Tente de novo.";
}

// Devolvem null se deu certo, ou a mensagem de erro
export async function mudarStatus(numero: string, status: "pago" | "cancelado"): Promise<string | null> {
  const { error } = await supabase.rpc("mudar_status_do_pedido", { numero_do_pedido: numero, novo_status: status });
  return error ? traduzirErro(error.message) : null;
}

export async function registrarRetirada(ids: number[]): Promise<string | null> {
  const { error } = await supabase.rpc("registrar_retirada", { ids });
  return error ? traduzirErro(error.message) : null;
}

export async function registrarDevolucao(ids: number[], valor: number): Promise<string | null> {
  const { error } = await supabase.rpc("registrar_devolucao", { ids, valor_devolvido: valor });
  return error ? traduzirErro(error.message) : null;
}
