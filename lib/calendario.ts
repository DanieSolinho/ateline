// Data de hoje no formato "2026-10-25", no fuso de quem está usando o site
export function hojeIso(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Monta os dias de um mês para o calendário (mes: 0 = janeiro … 11 = dezembro).
// Começa com espaços vazios (null) até o dia da semana do dia 1, com domingo primeiro.
export function diasDoMes(ano: number, mes: number): (string | null)[] {
  const diaDaSemanaDoDia1 = new Date(Date.UTC(ano, mes, 1)).getUTCDay();
  const totalDeDias = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

  const dias: (string | null)[] = Array(diaDaSemanaDoDia1).fill(null);
  for (let dia = 1; dia <= totalDeDias; dia++) {
    dias.push(`${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
  }
  return dias;
}

// (2026, 9) → "outubro de 2026"
export function nomeDoMes(ano: number, mes: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(ano, mes, 1)),
  );
}

// "2026-10-24" → "sábado, 24/10"
export function diaPorExtenso(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

// Horário da loja: sábado das 10h às 14h; terça a sexta, retirada a partir das 14h e devolução a partir das 10h
export function horarioDaLoja(iso: string, momento: "retirada" | "devolucao"): string {
  const ehSabado = new Date(`${iso}T00:00:00Z`).getUTCDay() === 6;
  if (ehSabado) return "das 10h às 14h";
  return momento === "retirada" ? "a partir das 14h" : "a partir das 10h";
}

// "sexta-feira, 30/10" → "Sexta-feira, 30/10"
export function primeiraMaiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}