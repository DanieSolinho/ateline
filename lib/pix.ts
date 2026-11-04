// Pix "copia e cola" (BR Code) direto na conta PJ da loja, sem intermediário e sem taxa.
// O código segue o padrão do Banco Central (EMV) e já leva o valor do sinal e o número do pedido.
// A confirmação continua manual: a loja vê o Pix no app do banco e confirma no painel.

// ⚠️ PREENCHA COM OS DADOS DA CONTA PJ DA LOJA (os mesmos que aparecem para quem recebe um Pix).
// Enquanto a chave estiver vazia, o site continua mandando a cliente pagar pelo WhatsApp.
export const PIX_DA_LOJA = {
  chave: "28809419000108", // CNPJ só com números (ex.: "28809419000108"), e-mail, telefone com +55 ou chave aleatória
  nome: "ATELINE ATELIE", // nome do recebedor (até 25 letras, sem acento)
  cidade: "RIO DE JANEIRO", // cidade da conta (até 15 letras, sem acento)
};

export function pixConfigurado(config = PIX_DA_LOJA): boolean {
  return config.chave.trim() !== "";
}

// Tira acentos e símbolos que o padrão não aceita: "Ateliê" → "ATELIE"
export function textoDoPix(texto: string, maximo: number): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximo);
}

// Cada campo do código: identificador (2 dígitos) + tamanho (2 dígitos) + valor
function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

// Dígito verificador do código (CRC16-CCITT, padrão do Banco Central)
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (const caractere of new TextEncoder().encode(texto)) {
    crc ^= caractere << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// A chave como o padrão espera: CNPJ/CPF só com números, telefone com +55, e-mail minúsculo
export function chaveDoPix(chave: string): string {
  const limpa = chave.trim();
  if (limpa.includes("@")) return limpa.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(limpa)) return limpa.toLowerCase();
  if (limpa.startsWith("+")) return `+${limpa.replace(/\D/g, "")}`;
  return limpa.replace(/\D/g, "");
}

// "ATL-1001" → "ATL1001" (o identificador só aceita letras e números, até 25)
export function identificadorDoPedido(numero: string): string {
  return numero.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
}

export type DadosDoPix = { valor: number; pedido: string };

// Monta o Pix copia e cola
export function pixCopiaECola({ valor, pedido }: DadosDoPix, config = PIX_DA_LOJA): string {
  const contaDoRecebedor =
    campo("00", "br.gov.bcb.pix") + campo("01", chaveDoPix(config.chave)) + campo("02", textoDoPix(`Sinal ${pedido}`, 30));
  const semVerificador =
    campo("00", "01") +
    campo("26", contaDoRecebedor) +
    campo("52", "0000") +
    campo("53", "986") + // real
    campo("54", valor.toFixed(2)) +
    campo("58", "BR") +
    campo("59", textoDoPix(config.nome, 25)) +
    campo("60", textoDoPix(config.cidade, 15)) +
    campo("62", campo("05", identificadorDoPedido(pedido))) +
    "6304";
  return semVerificador + crc16(semVerificador);
}
