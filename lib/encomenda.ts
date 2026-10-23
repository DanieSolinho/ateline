import { z } from "zod";
import { formatarPreco } from "@/lib/formatar";
import { ANTECEDENCIA_BOLO_NOVO_DIAS, ANTECEDENCIA_REFAZER_DIAS } from "@/lib/regras";
import { somenteDigitos, telefoneValido } from "@/lib/validacao";
import type { Cupom } from "@/types/catalogo";

// Soma dias a uma data "AAAA-MM-DD" (em UTC, como o resto do site)
export function somarDias(iso: string, dias: number): string {
  const data = new Date(`${iso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

// Primeira data de festa possível: refazer um bolo do acervo ou fazer um bolo novo
export function antecedenciaEmDias(refazer: boolean): number {
  return refazer ? ANTECEDENCIA_REFAZER_DIAS : ANTECEDENCIA_BOLO_NOVO_DIAS;
}

export function dataMinimaDaFesta(hoje: string, refazer: boolean): string {
  return somarDias(hoje, antecedenciaEmDias(refazer));
}

// O cupom vale se o código bater (sem ligar para maiúsculas e espaços)
export function cupomValido(digitado: string, cupom: Cupom | null): boolean {
  return cupom !== null && digitado.trim().toUpperCase() === cupom.codigo;
}

export function precoComCupom(preco: number, digitado: string, cupom: Cupom | null) {
  if (!cupomValido(digitado, cupom)) return { preco, desconto: 0 };
  const desconto = Math.round(preco * cupom!.desconto * 100) / 100;
  return { preco: preco - desconto, desconto };
}

// O bolo do acervo que a cliente quer igual (null = bolo novo)
export type BoloParaRefazer = {
  codigo: string;
  nome: string;
  andares: number;
  decoracao: string | null;
  preco: number; // preço de encomenda nova dessa opção
};

// As regras do formulário. A data mínima depende de "hoje" e de ser refazer ou bolo novo.
export function criarEsquemaEncomenda(hoje: string, refazer: BoloParaRefazer | null) {
  const minima = dataMinimaDaFesta(hoje, refazer !== null);
  const dias = antecedenciaEmDias(refazer !== null);
  return z
    .object({
      finalidade: z.enum(["alugar", "comprar"], { error: "Escolha alugar ou comprar." }),
      festa: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Escolha a data da festa." })
        .refine((data) => data >= minima, {
          error: `Precisamos de ${dias} dias para fazer o bolo. Escolha uma data a partir de ${minima.split("-").reverse().join("/")}.`,
        }),
      tema: refazer ? z.string().trim() : z.string().trim().min(2, { error: "Conte o tema da festa." }),
      cores: z.string().trim(),
      andares: z.string(),
      observacoes: z.string().trim(),
      nome: z.string().trim().min(3, { error: "Escreva seu nome." }),
      whatsapp: z.string().refine(telefoneValido, { error: "Coloque o WhatsApp com DDD." }),
      cupom: z.string().trim(),
    })
    .transform((dados) => ({ ...dados, whatsapp: somenteDigitos(dados.whatsapp) }));
}

export type DadosEncomenda = z.output<ReturnType<typeof criarEsquemaEncomenda>>;
export type CampoEncomenda = keyof z.input<ReturnType<typeof criarEsquemaEncomenda>>;

// O texto que vai pronto para o WhatsApp da loja
export function mensagemDeEncomenda(
  dados: DadosEncomenda,
  refazer: BoloParaRefazer | null,
  cupom: Cupom | null,
): string {
  const linhas: string[] = [];
  const data = dados.festa.split("-").reverse().join("/");

  if (refazer) {
    linhas.push(`Olá! Quero encomendar um bolo igual ao ${refazer.nome} (${refazer.codigo}), pelo site.`);
    linhas.push(`Tamanho: ${refazer.andares} andares${refazer.decoracao ? ` · ${refazer.decoracao}` : ""}`);
    const { preco, desconto } = precoComCupom(refazer.preco, dados.cupom, cupom);
    if (desconto > 0) {
      linhas.push(`Cupom ${cupom!.codigo}: ${formatarPreco(refazer.preco)} − ${formatarPreco(desconto)} = ${formatarPreco(preco)}`);
    } else {
      linhas.push(`Valor de referência: ${formatarPreco(refazer.preco)}`);
    }
  } else {
    linhas.push("Olá! Quero pedir um orçamento de bolo novo, pelo site.");
    if (dados.tema) linhas.push(`Tema: ${dados.tema}`);
    linhas.push(`Andares: ${dados.andares}`);
  }

  linhas.push(`O bolo é para: ${dados.finalidade === "alugar" ? "alugar (primeira locação)" : "comprar"}`);
  linhas.push(`Data da festa: ${data}`);
  if (dados.cores) linhas.push(`Cores: ${dados.cores}`);
  if (dados.observacoes) linhas.push(`Detalhes: ${dados.observacoes}`);
  linhas.push(`Nome: ${dados.nome}`);
  linhas.push(`WhatsApp: ${dados.whatsapp}`);
  linhas.push("");
  linhas.push("Vou mandar as fotos de referência aqui na conversa.");

  return linhas.join("\n");
}
