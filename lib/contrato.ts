import { totalDoItem } from "@/lib/carrinho";
import { diaPorExtenso, horarioDaLoja } from "@/lib/calendario";
import { enderecoEmTexto } from "@/lib/endereco";
import { formatarPreco, formatarTelefone } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";
import { DESCONTO_VELA, MULTA_POR_DIA, PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import { URL_DO_SITE } from "@/lib/site";
import type { ItemAluguel } from "@/types/carrinho";
import type { Pedido } from "@/types/pedido";

// O contrato de locação do pedido, montado a partir do modelo da Ateline.
// Fica separado do PDF para poder ser testado (e reaproveitado num e-mail, no futuro).
export type BlocoDoContrato =
  | { tipo: "titulo"; texto: string } // "1. DO OBJETO DO CONTRATO"
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "item"; texto: string } // linha com recuo (cláusulas e listas)
  | { tipo: "destaque"; texto: string }; // em negrito

export type Contrato = {
  titulo: string;
  nomeDoArquivo: string;
  blocos: BlocoDoContrato[];
};

const LOJA = "Rua Cândido Benício, 2967, bloco P, loja G, Praça Seca, Rio de Janeiro";
const CNPJ = "28.809.419/0001-08";
const FUSO_DA_LOJA = "America/Sao_Paulo";

// "21987654321" → "529.982.247-25" (CPF com pontos)
function formatarCpf(digitos: string): string {
  return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

// Data e hora do aceite no horário do Rio, para o contrato não depender do fuso de quem abre
export function dataEHoraNoRio(isoComHora: string): { data: string; hora: string } {
  const quando = new Date(isoComHora);
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: FUSO_DA_LOJA }).format(quando);
  const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO_DA_LOJA }).format(
    quando,
  );
  return { data, hora };
}

// O endereço que a cliente informou no pedido (pedidos antigos têm o endereço da entrega num campo só)
export function enderecoDaCliente(cliente: Pedido["cliente"]): string {
  return enderecoEmTexto(cliente) ?? cliente.endereco ?? "não informado no pedido";
}

// Descrição de uma peça alugada: "Safari · 3 andares, com topo Coroa dourada e base dourada (Nome: Alice)"
export function descricaoDoItem(item: ItemAluguel): string {
  const extras = [item.topo && `topo ${item.topo.nome}`, item.base && item.base.nome.toLowerCase()].filter(Boolean);
  const comExtras = extras.length > 0 ? `, com ${extras.join(" e ")}` : "";
  const personalizacao = item.personalizacao ? ` (${item.personalizacao})` : "";
  return `${item.nome}${comExtras}${personalizacao}`;
}

function dia(iso: string) {
  return diaPorExtenso(iso); // "sexta-feira, 13/11"
}

export function montarContrato(pedido: Pedido): Contrato | null {
  const alugueis = pedido.itens.filter((item): item is ItemAluguel => item.tipo === "aluguel");
  if (alugueis.length === 0) return null; // compra não tem contrato de locação

  const { cliente } = pedido;
  const valorLocacao = alugueis.reduce((soma, item) => soma + totalDoItem(item), 0);
  const sinal = valorLocacao * PERCENTUAL_SINAL;
  const taxas = TAXA_SEGURANCA * alugueis.length;
  const naRetirada = valorLocacao - sinal + taxas;
  const aceite = dataEHoraNoRio(pedido.criadoEm);

  const blocos: BlocoDoContrato[] = [
    {
      tipo: "paragrafo",
      texto: `De um lado, ATELINE ATELIÊ, com sede na ${LOJA}, inscrita no CNPJ ${CNPJ}, por sua representante legal, doravante denominada LOCADORA.`,
    },
    {
      tipo: "paragrafo",
      texto: `E do outro, ${cliente.nome}, CPF ${formatarCpf(cliente.cpf)}, residente em ${enderecoDaCliente(cliente)}, contatos: WhatsApp ${formatarTelefone(cliente.whatsapp)} e e-mail ${cliente.email}, doravante denominada LOCATÁRIA.`,
    },
    {
      tipo: "paragrafo",
      texto:
        "As partes têm justo e contratado, na melhor forma de direito, o seguinte, que mutuamente outorgam e aceitam:",
    },

    { tipo: "titulo", texto: "1. DO OBJETO DO CONTRATO" },
    {
      tipo: "item",
      texto:
        "1.1. A LOCADORA, como legítima proprietária das peças, cede-as em locação à LOCATÁRIA, nos termos e prazos estabelecidos neste contrato.",
    },
    { tipo: "item", texto: "1.2. O objeto deste contrato é:" },
    ...alugueis.map((item) => ({
      tipo: "item" as const,
      texto: `• ${descricaoDoItem(item)}: ${formatarPreco(totalDoItem(item))}`,
    })),

    { tipo: "titulo", texto: "2. DA RETIRADA E DA DEVOLUÇÃO" },
    ...alugueis.flatMap((item) => {
      const periodo = calcularPeriodo(item.festa);
      const linhas: BlocoDoContrato[] = [
        { tipo: "destaque", texto: `${item.nome}, festa em ${dia(item.festa)}/${item.festa.slice(0, 4)}` },
        { tipo: "item", texto: `Retirada: ${dia(periodo.retirada)}, ${horarioDaLoja(periodo.retirada, "retirada")}.` },
        { tipo: "item", texto: `Devolução: ${dia(periodo.devolucao)}, ${horarioDaLoja(periodo.devolucao, "devolucao")}.` },
      ];
      return linhas;
    }),
    {
      tipo: "item",
      texto:
        "2.1. Horário da loja: terça a sexta, retirada a partir das 14h e devolução a partir das 10h; sábado, das 10h às 14h. Não funcionamos aos domingos e segundas. Não aceitamos aplicativos de entrega.",
    },
    {
      tipo: "item",
      texto:
        "2.2. A retirada e a devolução são feitas no endereço da LOCADORA e são obrigação única e exclusiva da LOCATÁRIA.",
    },

    { tipo: "titulo", texto: "3. DO VALOR E DO PAGAMENTO" },
    { tipo: "item", texto: `3.1. O valor da locação é de ${formatarPreco(valorLocacao)}.` },
    {
      tipo: "item",
      texto: `3.2. É cobrada a taxa de segurança de ${formatarPreco(TAXA_SEGURANCA)} por bolo, que não é devolvida em caso de: a) devolução fora do prazo estabelecido neste contrato; b) avarias como furos, cola e sujeira, entre outras. Se o bolo tiver vela acoplada e ela não voltar, são descontados ${formatarPreco(DESCONTO_VELA)} da taxa.`,
    },
    {
      tipo: "item",
      texto: `3.3. Sinal pago na reserva: ${formatarPreco(sinal)}. Restante da locação mais a taxa de segurança, até o dia da retirada ou nele: ${formatarPreco(naRetirada)}.`,
    },
    ...(cliente.chavePix
      ? [
          {
            tipo: "item" as const,
            texto: `3.4. A taxa de segurança, quando devida, é devolvida por Pix na chave ${cliente.chavePix}, depois que a peça é conferida.`,
          },
        ]
      : []),

    { tipo: "titulo", texto: "4. DAS OBRIGAÇÕES DA LOCADORA" },
    { tipo: "item", texto: "4.1. Entregar o objeto na data marcada, em bom estado de conservação e limpeza." },

    { tipo: "titulo", texto: "5. DAS OBRIGAÇÕES DA LOCATÁRIA" },
    {
      tipo: "item",
      texto:
        "5.1. Comparecer ao endereço da LOCADORA para a retirada. A LOCADORA não entra em contato para lembrar da retirada; se a peça não for retirada, o valor pago não é devolvido.",
    },
    { tipo: "item", texto: "5.2. Pagar o valor restante na data da retirada, sob pena de rescisão do contrato." },
    {
      tipo: "item",
      texto:
        "5.3. Devolver o objeto em bom estado de conservação e limpeza, correndo por sua conta as despesas necessárias para isso.",
    },
    {
      tipo: "item",
      texto:
        "5.4. Havendo dano ao material, será feito um orçamento do conserto, e o ressarcimento é responsabilidade exclusiva da LOCATÁRIA, conforme a cláusula 6.",
    },
    {
      tipo: "item",
      texto:
        "5.5. Não utilizar nenhum tipo de cola, água, tinta ou outro material nas peças, sob pena de pagar o valor da peça danificada.",
    },
    {
      tipo: "item",
      texto: `5.6. Havendo atraso na devolução, será cobrada multa de ${Math.round(MULTA_POR_DIA * 100)}% por dia sobre o valor total.`,
    },

    { tipo: "titulo", texto: "6. DO VALOR DAS PEÇAS, DO CANCELAMENTO E DO ADIAMENTO" },
    {
      tipo: "item",
      texto:
        "6.1. Em caso de perda, é cobrado da LOCATÁRIA o valor integral das peças, conforme a tabela de reposição da LOCADORA.",
    },
    {
      tipo: "item",
      texto: "6.2. Havendo cancelamento ou adiamento da locação, o valor de entrada não será restituído. A taxa de segurança, se já tiver sido paga, é devolvida integralmente em caso de cancelamento pela LOCATÁRIA.",
    },

    {
      tipo: "paragrafo",
      texto:
        "E, por estarem LOCADORA e LOCATÁRIA de pleno acordo com o disposto neste instrumento particular, ele é aceito eletronicamente pela LOCATÁRIA.",
    },
    {
      tipo: "destaque",
      texto: `Aceite eletrônico de ${cliente.nome} pelo site ${URL_DO_SITE} em ${aceite.data}, às ${aceite.hora} (horário de Brasília)${pedido.ipAceite ? `, IP ${pedido.ipAceite}` : ""}, no pedido ${pedido.numero}.`,
    },
    { tipo: "paragrafo", texto: `Rio de Janeiro, ${aceite.data}.` },
  ];

  return {
    titulo: "CONTRATO DE LOCAÇÃO",
    nomeDoArquivo: `Contrato-Ateline-${pedido.numero}.pdf`,
    blocos,
  };
}
