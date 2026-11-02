import { diaPorExtenso, horarioDaLoja } from "@/lib/calendario";
import { somarDias } from "@/lib/encomenda";
import { formatarPreco } from "@/lib/formatar";

const LOJA_FECHADA = [0, 1]; // domingo e segunda
const ENDERECO = "Rua Cândido Benício, 2967, bloco P, loja G, Praça Seca";

// O próximo dia em que a loja abre, depois de hoje (no sábado, é a terça)
export function proximoDiaAberto(hoje: string): string {
  let dia = somarDias(hoje, 1);
  while (LOJA_FECHADA.includes(new Date(`${dia}T00:00:00Z`).getUTCDay())) dia = somarDias(dia, 1);
  return dia;
}

export function mensagemDeLembreteDeRetirada(nome: string, bolo: string, dia: string, aReceber: number | null): string {
  const primeiroNome = nome.trim().split(" ")[0];
  const valor = aReceber !== null ? ` Na retirada, o valor é ${formatarPreco(aReceber)} (restante + taxa de segurança).` : "";
  return (
    `Olá, ${primeiroNome}! Lembrete da Ateline: a retirada do bolo ${bolo} é ${diaPorExtenso(dia)}, ` +
    `${horarioDaLoja(dia, "retirada")}, na ${ENDERECO}.${valor} Até lá!`
  );
}

export function mensagemDeLembreteDeDevolucao(nome: string, bolo: string, dia: string): string {
  const primeiroNome = nome.trim().split(" ")[0];
  return (
    `Olá, ${primeiroNome}! Esperamos que a festa tenha sido linda! Lembrete da Ateline: a devolução do bolo ${bolo} é ` +
    `${diaPorExtenso(dia)}, ${horarioDaLoja(dia, "devolucao")}. Traga a peça limpa e sem cola, ` +
    `para receber a taxa de segurança de volta. Obrigada!`
  );
}
